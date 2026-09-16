import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import { PROVIDERS, callWithFallback, callGemini, callOpenAICompatible } from './lib/providers.js';
import { tokenize, memorySearch, memoryAdd, validateMemoryRelevance, makeBigrams, stemID } from './lib/memory.js';
import { classifyQuestion, generateRedirectMessage } from './lib/classifier.js';
import {
    feedbackInit, addFeedback, trackEvent, getStats,
    getFeedbackList, getBadExamples, getGoodExamples,
    clearFeedback, clearAnalytics
} from './lib/feedback.js';
import {
    learningInit, recordUnansweredQuestion, getLearningQueue,
    getQueueStats, resolveQuestion, deleteQuestion,
    clearResolved as clearLearningResolved, clearAll as clearLearningAll
} from './lib/learning.js';
import {
    summarizerInit, generateKnowledgeSummary, generateDailyInsight,
    getSummaries, getLatestSummary
} from './lib/summarizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip');

const app = express();
app.set('trust proxy', 1);

// ============================================================
// VALIDASI ENV
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET tidak ada atau terlalu pendek');
    process.exit(1);
}

const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY_HEX || ENCRYPTION_KEY_HEX.length !== 64) {
    console.error('FATAL: ENCRYPTION_KEY harus 64 karakter hex');
    process.exit(1);
}
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

let ADMIN_PASSWORD_HASH;
if (process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD_HASH.startsWith('$2')) {
    ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
} else if (process.env.ADMIN_PASSWORD) {
    ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
} else {
    console.warn('[SECURITY] Tidak ada password di .env. Pakai default admin123');
    ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);
}

// ============================================================
// ENKRIPSI
// ============================================================
function encryptData(plainText) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptData(cipherText) {
    try {
        const parts = cipherText.split(':');
        if (parts.length !== 3) throw new Error('Format cipher tidak valid');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = Buffer.from(parts[2], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (e) {
        console.error('[ENCRYPT] Gagal decrypt:', e.message);
        return null;
    }
}

function isEncryptedFormat(content) {
    return /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(content.trim());
}

function encryptBuffer(buffer) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const magic = Buffer.from('SIVTBK01');
    return Buffer.concat([magic, iv, authTag, encrypted]);
}

// ============================================================
// BERSIHKAN FORMAT MARKDOWN DARI AI
// ============================================================
function cleanAIText(text) {
    if (!text) return '';
    let clean = text;
    clean = clean.replace(/\*\*(.+?)\*\*/g, '$1');
    clean = clean.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1');
    clean = clean.replace(/^#{1,6}\s+/gm, '');
    clean = clean.replace(/`([^`]+)`/g, '$1');
    clean = clean.replace(/^\s*[-*]\s+/gm, '• ');
    clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
    clean = clean.replace(/\n{3,}/g, '\n\n');
    clean = clean.replace(/[ \t]+$/gm, '');
    return clean.trim();
}

// ============================================================
// PATH
// ============================================================
const PATHS = {
    dataDir: path.join(__dirname, 'data'),
    config: path.join(__dirname, 'data', 'config.json'),
    providers: path.join(__dirname, 'data', 'providers.json.enc'),
    keys: path.join(__dirname, 'data', 'keys.json.enc'),
    unanswered: path.join(__dirname, 'data', 'unanswered.json'),
    knowledge: path.join(__dirname, 'knowledge'),
    memoryFile: path.join(__dirname, 'memory', 'memory.md'),
    sessionsDir: path.join(__dirname, 'memory', 'sessions'),
    backupsDir: path.join(__dirname, 'data', 'backups'),
    logsDir: path.join(__dirname, 'logs'),
    uploadsDir: path.join(__dirname, 'public', 'uploads'),
    tmp: path.join(__dirname, 'tmp')
};

Object.values(PATHS).forEach(p => {
    const dir = p.includes('.') ? path.dirname(p) : p;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============================================================
// INIT MODULES
// ============================================================
feedbackInit();
learningInit();
summarizerInit();

// ============================================================
// NOTIFIKASI
// ============================================================
const NOTIF_FILE = path.join(PATHS.logsDir, 'notifications.json');
let notifications = [];

function notifInit() {
    if (fs.existsSync(NOTIF_FILE)) {
        try { notifications = JSON.parse(fs.readFileSync(NOTIF_FILE, 'utf-8')); } catch { notifications = []; }
    }
}
function notifSave() {
    fs.writeFileSync(NOTIF_FILE, JSON.stringify(notifications.slice(-100), null, 2), 'utf-8');
}
function notifAdd(type, title, message, level = 'warning') {
    const notif = {
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        type, title, message, level,
        timestamp: new Date().toISOString(),
        read: false
    };
    notifications.push(notif);
    if (notifications.length > 100) notifications = notifications.slice(-100);
    notifSave();
    console.log(`[NOTIF] ${level.toUpperCase()}: ${title}`);
}
const notifThrottle = {};
function notifAddThrottled(key, type, title, message, level = 'warning', cooldownMs = 5 * 60 * 1000) {
    const now = Date.now();
    if (notifThrottle[key] && (now - notifThrottle[key]) < cooldownMs) return;
    notifThrottle[key] = now;
    notifAdd(type, title, message, level);
}
notifInit();

// ============================================================
// UNANSWERED QUESTIONS
// ============================================================
let unansweredQuestions = [];

function unansweredInit() {
    if (fs.existsSync(PATHS.unanswered)) {
        try { unansweredQuestions = JSON.parse(fs.readFileSync(PATHS.unanswered, 'utf-8')); } catch { unansweredQuestions = []; }
    }
}

function unansweredSave() {
    fs.writeFileSync(PATHS.unanswered, JSON.stringify(unansweredQuestions.slice(-500), null, 2), 'utf-8');
}

function unansweredAdd(question, sessionId) {
    const qNorm = question.toLowerCase().trim();
    const recent = unansweredQuestions.find(u =>
        u.question.toLowerCase().trim() === qNorm &&
        (Date.now() - new Date(u.lastAsked).getTime()) < 24 * 60 * 60 * 1000
    );

    if (recent) {
        recent.count = (recent.count || 1) + 1;
        recent.lastAsked = new Date().toISOString();
        unansweredSave();
        return recent;
    }

    const item = {
        id: 'uq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        question: question.trim(),
        sessionId: sessionId || 'unknown',
        count: 1,
        firstAsked: new Date().toISOString(),
        lastAsked: new Date().toISOString(),
        resolved: false
    };
    unansweredQuestions.push(item);
    unansweredSave();
    return item;
}

unansweredInit();

// ============================================================
// SESSION STORE
// ============================================================
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_SESSION_MESSAGES = 30;
let sessions = {};
let saveTimers = {};

function sessionInit() {
    if (fs.existsSync(PATHS.sessionsDir)) {
        const files = fs.readdirSync(PATHS.sessionsDir).filter(f => f.endsWith('.json'));
        for (const file of files) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(PATHS.sessionsDir, file), 'utf-8'));
                if (data.id && data.messages) {
                    if (Date.now() - data.lastActivity > SESSION_TTL_MS) {
                        fs.unlinkSync(path.join(PATHS.sessionsDir, file));
                        continue;
                    }
                    sessions[data.id] = data;
                }
            } catch (e) {}
        }
        console.log(`[SESSION] ${Object.keys(sessions).length} sesi dimuat.`);
    }
}

function sessionSaveDebounced(sessionId) {
    if (saveTimers[sessionId]) clearTimeout(saveTimers[sessionId]);
    saveTimers[sessionId] = setTimeout(() => {
        if (!sessions[sessionId]) return;
        try {
            fs.writeFileSync(
                path.join(PATHS.sessionsDir, `${sessionId}.json`),
                JSON.stringify(sessions[sessionId]), 'utf-8'
            );
        } catch (_) {}
        delete saveTimers[sessionId];
    }, 1500);
}

function sessionGetOrCreate(sessionId) {
    if (!sessionId) {
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    }
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            id: sessionId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            messages: []
        };
        console.log(`[SESSION] Baru: ${sessionId}`);
    }
    sessions[sessionId].lastActivity = Date.now();
    return sessions[sessionId];
}

function sessionAddMessage(sessionId, role, text) {
    const session = sessions[sessionId];
    if (!session) return;
    session.messages.push({ role, text: text.slice(0, 3000), ts: Date.now() });
    if (session.messages.length > MAX_SESSION_MESSAGES) {
        session.messages = session.messages.slice(-MAX_SESSION_MESSAGES);
    }
    sessionSaveDebounced(sessionId);
}

function sessionCleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const id of Object.keys(sessions)) {
        if (now - sessions[id].lastActivity > SESSION_TTL_MS) {
            delete sessions[id];
            try {
                const f = path.join(PATHS.sessionsDir, `${id}.json`);
                if (fs.existsSync(f)) fs.unlinkSync(f);
            } catch (_) {}
            cleaned++;
        }
    }
    if (cleaned > 0) console.log(`[SESSION] Cleanup: ${cleaned} dihapus.`);
}
setInterval(sessionCleanup, 30 * 60 * 1000);

process.on('SIGINT', () => {
    console.log('\n[SERVER] Menyimpan sesi...');
    for (const id of Object.keys(sessions)) {
        if (saveTimers[id]) clearTimeout(saveTimers[id]);
        try {
            fs.writeFileSync(
                path.join(PATHS.sessionsDir, `${id}.json`),
                JSON.stringify(sessions[id]), 'utf-8'
            );
        } catch (_) {}
    }
    process.exit(0);
});

// ============================================================
// PROVIDERS CONFIG
// ============================================================
let PROVIDERS_CONFIG = loadProviders();

function loadProviders() {
    if (!fs.existsSync(PATHS.providers)) return [];
    try {
        const raw = fs.readFileSync(PATHS.providers, 'utf-8').trim();
        if (!isEncryptedFormat(raw)) return [];
        const plain = decryptData(raw);
        if (!plain) return [];
        const parsed = JSON.parse(plain);
        return parsed.map(p => ({
            ...p,
            enabled: p.enabled !== false,
            models: Array.isArray(p.models) && p.models.length > 0
                ? p.models
                : (PROVIDERS[p.name]?.models || [])
        }));
    } catch (e) {
        console.error('[PROVIDERS] Gagal load:', e.message);
        return [];
    }
}

function saveProviders() {
    try {
        fs.writeFileSync(PATHS.providers, encryptData(JSON.stringify(PROVIDERS_CONFIG)), 'utf-8');
    } catch (e) {
        console.error('[PROVIDERS] Gagal simpan:', e.message);
    }
}

// ============================================================
// MEMORY
// ============================================================
let memoryItems = [];

function memoryInit() {
    if (!fs.existsSync(PATHS.memoryFile)) {
        const header = `# Memori SIVT AI\n\nTotal memori: 0\nTerakhir diperbarui: ${new Date().toISOString()}\n\n---\n\n`;
        fs.writeFileSync(PATHS.memoryFile, header, 'utf-8');
    }
    memoryLoad();
}

function memoryLoad() {
    memoryItems = [];
    if (!fs.existsSync(PATHS.memoryFile)) return;
    const content = fs.readFileSync(PATHS.memoryFile, 'utf-8');
    const blocks = content.split(/^## /m).slice(1);
    for (const block of blocks) {
        try {
            const lines = block.split('\n');
            const headerMatch = lines[0].match(/\[(.+?)\]\s*(.+)/);
            if (!headerMatch) continue;

            const getField = (name) => {
                const idx = lines.findIndex(l => l.startsWith(`**${name}:**`));
                if (idx === -1) return '';
                let value = lines[idx].replace(`**${name}:**`, '').trim();
                for (let i = idx + 1; i < lines.length; i++) {
                    if (lines[i].startsWith('**') || lines[i].startsWith('## ')) break;
                    if (lines[i].trim() === '') break;
                    value += '\n' + lines[i];
                }
                return value.trim();
            };

            memoryItems.push({
                timestamp: headerMatch[1],
                title: headerMatch[2].trim(),
                question: getField('Pertanyaan'),
                variants: getField('Variasi').split(',').map(s => s.trim()).filter(Boolean),
                answer: getField('Jawaban'),
                hit: parseInt(getField('Hit')) || 0,
                keywords: getField('Kata kunci').split(',').map(s => s.trim()).filter(Boolean)
            });
        } catch (e) {}
    }
    console.log(`[MEMORY] ${memoryItems.length} memori dimuat.`);
}

function memorySave() {
    const lines = [
        '# Memori SIVT AI', '',
        `Total memori: ${memoryItems.length}`,
        `Terakhir diperbarui: ${new Date().toISOString()}`,
        '', '---', ''
    ];
    for (const m of memoryItems) {
        lines.push(`## [${m.timestamp}] ${m.title}`);
        lines.push(`**Pertanyaan:** ${m.question}`);
        lines.push(`**Variasi:** ${(m.variants || []).join(', ')}`);
        lines.push(`**Jawaban:** ${m.answer}`);
        lines.push(`**Hit:** ${m.hit}`);
        lines.push(`**Kata kunci:** ${(m.keywords || []).join(', ')}`);
        lines.push('');
    }
    fs.writeFileSync(PATHS.memoryFile, lines.join('\n'), 'utf-8');
}

// ============================================================
// KNOWLEDGE — RAG
// ============================================================
let knowledgeChunks = [];
let availableTopics = [];

function buildChunkIndex() {
    for (const chunk of knowledgeChunks) {
        const rawWords = tokenize(chunk.text);
        const stems = rawWords.map(stemID);
        const kkMatch = chunk.text.match(/Kata kunci\s*:\s*(.+)/i);
        const keywordText = kkMatch ? kkMatch[1] : '';
        const keywordWords = tokenize(keywordText);
        chunk._index = {
            words: new Set(rawWords),
            stems: new Set(stems),
            bigrams: new Set(makeBigrams(rawWords)),
            keywordWords: new Set(keywordWords),
            keywordBigrams: new Set(makeBigrams(keywordWords))
        };
    }
}

function detectTitle(block) {
    let m = block.match(/^\[(.+?)\]/);
    if (m) return m[1].trim();
    m = block.match(/^#{1,6}\s+(.+)$/m);
    if (m) {
        const t = m[1].trim();
        if (/^BAGIAN\s+\d+/i.test(t)) return null;
        return t;
    }
    return null;
}

function extractTopics() {
    availableTopics = [];
    const seen = new Set();
    for (const chunk of knowledgeChunks) {
        const title = detectTitle(chunk.text);
        if (!title) continue;
        if (title.length < 5 || title.length > 100) continue;
        if (seen.has(title.toLowerCase())) continue;
        seen.add(title.toLowerCase());
        availableTopics.push({ title, source: chunk.source });
    }
    console.log(`[TOPICS] ${availableTopics.length} topik terdeteksi.`);
}

function loadKnowledge() {
    knowledgeChunks = [];
    if (!fs.existsSync(PATHS.knowledge)) return;
    const files = fs.readdirSync(PATHS.knowledge)
        .filter(f => !f.startsWith('~$'))
        .filter(f => /\.(md|txt)$/i.test(f));

    for (const file of files) {
        try {
            const text = fs.readFileSync(path.join(PATHS.knowledge, file), 'utf-8');
            const hasHeadings = /^#{1,6}\s+/m.test(text);
            let blocks = [];
            if (hasHeadings) {
                const parts = text.split(/^(?=#{2,6}\s+)/m);
                for (const part of parts) {
                    const trimmed = part.trim();
                    if (trimmed.length < 20) continue;
                    if (/^#{1,6}\s+BAGIAN\s+\d+/i.test(trimmed)) continue;
                    blocks.push(trimmed);
                }
            }
            if (blocks.length === 0) {
                blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 20);
            }
            for (const block of blocks) {
                knowledgeChunks.push({
                    source: file,
                    text: block,
                    keywords: block.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
                });
            }
        } catch (err) {
            console.error(`[KNOWLEDGE] Gagal baca ${file}: ${err.message}`);
        }
    }
    buildChunkIndex();
    extractTopics();
    console.log(`[KNOWLEDGE] Total ${knowledgeChunks.length} chunk siap.`);
}

function searchKnowledge(question, topK = 6) {
    if (knowledgeChunks.length === 0) return { chunks: [], confidence: 0 };
    if (!knowledgeChunks[0]._index) buildChunkIndex();

    const qWords = tokenize(question);
    if (qWords.length === 0) return { chunks: [], confidence: 0 };

    const qStems = qWords.map(stemID);
    const qBigrams = makeBigrams(qWords);

    const scored = knowledgeChunks.map((chunk) => {
        const idx = chunk._index;
        let score = 0;
        for (const w of qWords) if (idx.words.has(w)) score += 3;
        for (const s of qStems) if (idx.stems.has(s)) score += 2;
        for (const bg of qBigrams) if (idx.bigrams.has(bg)) score += 6;
        for (const w of qWords) if (idx.keywordWords.has(w)) score += 4;
        for (const bg of qBigrams) if (idx.keywordBigrams.has(bg)) score += 8;

        const title = detectTitle(chunk.text);
        if (title) {
            const titleWords = tokenize(title);
            for (const w of qWords) if (titleWords.includes(w)) score += 5;
        }
        return { chunk, score };
    });

    const filtered = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, topK);
    const chunks = filtered.map(s => s.chunk);
    const topScore = filtered.length > 0 ? filtered[0].score : 0;

    let confidence = 0;
    if (topScore >= 15) confidence = 100;
    else if (topScore >= 8) confidence = 70;
    else if (topScore >= 4) confidence = 40;

    return { chunks, confidence };
}

function getSuggestedTopics(limit = 8, query = '') {
    if (!query) {
        return [...availableTopics].sort(() => Math.random() - 0.5).slice(0, limit);
    }
    const qWords = tokenize(query);
    const scored = availableTopics.map(t => {
        const titleWords = tokenize(t.title);
        let score = 0;
        for (const w of qWords) if (titleWords.includes(w)) score += 1;
        return { topic: t, score };
    });
    const relevant = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    if (relevant.length >= 3) return relevant.slice(0, limit).map(s => s.topic);
    return [...availableTopics].sort(() => Math.random() - 0.5).slice(0, limit);
}

// ============================================================
// CONFIG
// ============================================================
const DEFAULT_CONFIG = {
    aiName: 'SIVT AI',
    tagline: 'Sistem Informasi Virtual TEGALREJO',
    logoUrl: '',
    logoSize: 'medium',
    theme: {
        primary: '#0d47a1',
        primaryDark: '#0a3a8a',
        primaryLight: '#1565c0',
        sidebarStart: '#0a3a8a',
        sidebarEnd: '#0d47a1',
        accent: '#ec4899'
    },
    welcomeMessage: 'Halo! Saya SIVTY AI, asisten virtual Kemantren Tegalrejo Yogyakarta.\nTanya apa saja tentang layanan administrasi, persyaratan, jadwal, dan info lainnya. Saya siap bantu 24 jam!',
    systemInstruction: `Kamu adalah SIVT AI, asisten virtual resmi Kemantren Tegalrejo, Yogyakarta.

ATURAN WAJIB - JANGAN DILANGGAR:
1. Kamu HANYA boleh menjawab berdasarkan "KONTEKS" yang diberikan.
2. Jika jawaban TIDAK ADA di konteks, WAJIB jawab persis: "Wah, info itu belum ada di buku catatan SIVT nih. Coba hubungi petugas langsung ya via WA 0812-3456-7890 atau telepon (0274) 123456."
3. DILARANG MENGARANG jawaban, syarat, biaya, atau info apapun.
4. DILARANG menjawab pertanyaan di luar topik Kemantren Tegalrejo.
5. DILARANG pakai tanda bintang ** atau * atau ## atau backtick.
6. Untuk list, gunakan bullet "•" atau angka "1. 2. 3."
7. Jawab SINGKAT, PADAT, langsung ke inti.
8. JAWAB LENGKAP sesuai konteks. Jangan memotong jawaban.

Info umum:
- Alamat: Jl. Tegalrejo No.1, Yogyakarta
- Jam: Senin-Jumat 08.00-15.00, Sabtu 08.00-12.00
- Telepon: (0274) 123456
- Semua layanan GRATIS`,
    memoryEnabled: true,
    memoryMinScore: 60,
    memorySaveThreshold: 40,
    conversationHistoryEnabled: true,
    conversationHistorySize: 10,
    rateLimitPerSession: 20,
    strictMode: true
};

function loadConfig() {
    if (!fs.existsSync(PATHS.config)) {
        fs.writeFileSync(PATHS.config, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
        return { ...DEFAULT_CONFIG };
    }
    try {
        const saved = JSON.parse(fs.readFileSync(PATHS.config, 'utf-8'));
        return {
            ...DEFAULT_CONFIG,
            ...saved,
            theme: { ...DEFAULT_CONFIG.theme, ...(saved.theme || {}) }
        };
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}
function saveConfig() {
    fs.writeFileSync(PATHS.config, JSON.stringify(CONFIG, null, 2), 'utf-8');
}
let CONFIG = loadConfig();

// ============================================================
// BACKUP
// ============================================================
function createZip(sourceDir, destZip) {
    return new Promise((resolve, reject) => {
        try {
            const zip = new AdmZip();
            zip.addLocalFolder(sourceDir);
            zip.writeZip(destZip);
            resolve();
        } catch (e) { reject(e); }
    });
}

async function runBackup() {
    try {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const tmpDir = path.join(PATHS.tmp, `backup_${stamp}`);
        fs.mkdirSync(tmpDir, { recursive: true });

        const files = [
            { src: PATHS.config, name: 'config.json' },
            { src: PATHS.providers, name: 'providers.json.enc' },
            { src: PATHS.memoryFile, name: 'memory.md' },
            { src: PATHS.unanswered, name: 'unanswered.json' },
            { src: path.join(PATHS.dataDir, 'feedback.json'), name: 'feedback.json' },
            { src: path.join(PATHS.dataDir, 'learning-queue.json'), name: 'learning-queue.json' },
            { src: path.join(PATHS.dataDir, 'analytics.json'), name: 'analytics.json' }
        ];
        for (const f of files) {
            if (fs.existsSync(f.src)) fs.copyFileSync(f.src, path.join(tmpDir, f.name));
        }

        const kdir = path.join(tmpDir, 'knowledge');
        fs.mkdirSync(kdir, { recursive: true });
        if (fs.existsSync(PATHS.knowledge)) {
            fs.readdirSync(PATHS.knowledge).forEach(f => {
                if (!f.startsWith('~$')) {
                    fs.copyFileSync(path.join(PATHS.knowledge, f), path.join(kdir, f));
                }
            });
        }

        const tmpZip = path.join(PATHS.tmp, `backup_${stamp}.zip`);
        await createZip(tmpDir, tmpZip);

        const zipBuffer = fs.readFileSync(tmpZip);
        const encrypted = encryptBuffer(zipBuffer);

        const finalName = `backup-${stamp}.zip.enc`;
        fs.writeFileSync(path.join(PATHS.backupsDir, finalName), encrypted);

        fs.rmSync(tmpDir, { recursive: true, force: true });
        fs.unlinkSync(tmpZip);

        console.log(`[BACKUP] Dibuat: ${finalName}`);

        const keepDays = 30;
        const cutoff = Date.now() - keepDays * 86400000;
        fs.readdirSync(PATHS.backupsDir).forEach(f => {
            const p = path.join(PATHS.backupsDir, f);
            try {
                const s = fs.statSync(p);
                if (s.isFile() && f.endsWith('.zip.enc') && s.mtimeMs < cutoff) {
                    fs.unlinkSync(p);
                }
            } catch (_) {}
        });
    } catch (e) {
        console.error('[BACKUP] Gagal:', e.message);
    }
}

cron.schedule('0 2 * * *', () => {
    console.log('[CRON] Backup otomatis...');
    runBackup();
});

cron.schedule('0 23 * * *', () => {
    console.log('[CRON] Generate daily insight...');
    try {
        generateDailyInsight(
            getFeedbackList(500),
            getLearningQueue('all'),
            unansweredQuestions
        );
    } catch (e) {
        console.error('[CRON] Gagal generate insight:', e.message);
    }
});

// ============================================================
// MIDDLEWARE
// ============================================================
app.use((req, res, next) => {
    const blocked = ['.env', 'keys.json', 'config.json', 'package.json', 'package-lock.json'];
    const p = req.path.toLowerCase();
    if (blocked.some(f => p.includes(f))) return res.status(404).end();
    if (p.startsWith('/knowledge/') || p.startsWith('/memory/') || p.startsWith('/data/') ||
        p.startsWith('/tmp/') || p.startsWith('/node_modules/') || p.startsWith('/lib/')) {
        return res.status(404).end();
    }
    next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, max: 500,
    standardHeaders: true, legacyHeaders: false
}));

const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: CONFIG.rateLimitPerSession || 20,
    keyGenerator: (req, res) => {
        if (req.body?.sessionId) return 'sess_' + req.body.sessionId;
        return ipKeyGenerator(req, res);
    },
    standardHeaders: true, legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false }
});
app.use('/api/chat', chatLimiter);

app.use('/api/admin/login', rateLimit({
    windowMs: 15 * 60 * 1000, max: 10, skipSuccessfulRequests: true
}));

app.use(express.static(path.join(__dirname, 'public'), {
    dotfiles: 'deny',
    index: 'index.html',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js')) res.setHeader('Service-Worker-Allowed', '/');
        if (filePath.endsWith('manifest.json')) res.setHeader('Content-Type', 'application/manifest+json');
    }
}));

// ============================================================
// AUTH
// ============================================================
function authAdmin(req, res, next) {
    const token = req.cookies?.admin_token ||
                  (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.admin = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Token tidak valid' });
    }
}

// ============================================================
// PUBLIC CONFIG
// ============================================================
app.get('/api/config/public', (req, res) => {
    res.json({
        aiName: CONFIG.aiName,
        tagline: CONFIG.tagline,
        logoUrl: CONFIG.logoUrl,
        logoSize: CONFIG.logoSize,
        theme: CONFIG.theme,
        welcomeMessage: CONFIG.welcomeMessage,
        quickButtons: CONFIG.quickButtons
    });
});

app.get('/api/admin/check', (req, res) => {
    const token = req.cookies?.admin_token ||
                  (req.headers['authorization'] || '').replace('Bearer ', '');
    if (!token) return res.json({ authenticated: false });
    try {
        const user = jwt.verify(token, JWT_SECRET);
        return res.json({ authenticated: true, username: user.username, token });
    } catch {
        return res.json({ authenticated: false });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        providers: PROVIDERS_CONFIG.map(p => ({ name: p.name, models: p.models.length, enabled: p.enabled })),
        knowledgeChunks: knowledgeChunks.length,
        topics: availableTopics.length,
        memory: memoryItems.length,
        sessions: Object.keys(sessions).length,
        unanswered: unansweredQuestions.filter(u => !u.resolved).length
    });
});


// ============================================================
// DASHBOARD STATS
// ============================================================
app.get('/api/admin/dashboard/stats', authAdmin, (req, res) => {
    const activeProviders = PROVIDERS_CONFIG.filter(p => p.enabled !== false).length;
    const totalSessions = Object.keys(sessions).length;
    const totalMessages = Object.values(sessions).reduce((sum, s) => sum + s.messages.length, 0);
    const unreadNotif = notifications.filter(n => !n.read).length;
    const pendingUnanswered = unansweredQuestions.filter(u => !u.resolved).length;
    const feedbackStats = getStats();
    const queueStats = getQueueStats();

    const now = Date.now();
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
        const dayStart = now - i * 86400000;
        const dayEnd = dayStart + 86400000;
        const count = Object.values(sessions).filter(s =>
            s.lastActivity >= dayStart && s.lastActivity < dayEnd
        ).length;
        const date = new Date(dayStart);
        dailyStats.push({
            date: date.toISOString().slice(0, 10),
            day: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][date.getDay()],
            sessions: count
        });
    }

    res.json({
        aiName: CONFIG.aiName,
        uptime: process.uptime(),
        providers: {
            total: PROVIDERS_CONFIG.length,
            active: activeProviders,
            inactive: PROVIDERS_CONFIG.length - activeProviders,
            list: PROVIDERS_CONFIG.map(p => ({
                name: p.displayName || PROVIDERS[p.name]?.name || p.name,
                enabled: p.enabled !== false,
                models: p.models.length
            }))
        },
        knowledge: {
            chunks: knowledgeChunks.length,
            topics: availableTopics.length,
            files: fs.existsSync(PATHS.knowledge)
                ? fs.readdirSync(PATHS.knowledge).filter(f => /\.(md|txt)$/i.test(f)).length
                : 0
        },
        memory: {
            total: memoryItems.length,
            totalHits: memoryItems.reduce((sum, m) => sum + (m.hit || 0), 0)
        },
        sessions: {
            total: totalSessions,
            messages: totalMessages,
            daily: dailyStats
        },
        notifications: {
            total: notifications.length,
            unread: unreadNotif
        },
        unanswered: {
            total: unansweredQuestions.length,
            pending: pendingUnanswered,
            resolved: unansweredQuestions.length - pendingUnanswered
        },
        feedback: feedbackStats.feedback,
        analytics: feedbackStats.analytics,
        learning: queueStats
    });
});

// ============================================================
// LOGIN / LOGOUT
// ============================================================
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Input tidak valid' });

    if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        console.warn(`[AUTH] Login gagal: ${username}`);
        return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });
    console.log(`[AUTH] Login sukses: ${username}`);
    res.json({ success: true, token });
});

app.post('/api/admin/logout', authAdmin, (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true });
});

// ============================================================
// ADMIN CONFIG
// ============================================================
app.get('/api/admin/config', authAdmin, (req, res) => {
    res.json({
        ...CONFIG,
        providers: PROVIDERS_CONFIG.map((p, i) => ({
            index: i,
            name: p.name,
            displayName: p.displayName || PROVIDERS[p.name]?.name || p.name,
            models: p.models,
            masked: p.apiKey ? p.apiKey.slice(0, 8) + '...' + p.apiKey.slice(-6) : '',
            enabled: p.enabled !== false,
            isCustom: !!p.customEndpoint,
            customEndpoint: p.customEndpoint || null
        })),
        knowledgeFiles: fs.existsSync(PATHS.knowledge)
            ? fs.readdirSync(PATHS.knowledge).filter(f => /\.(md|txt)$/i.test(f)).map(f => {
                const s = fs.statSync(path.join(PATHS.knowledge, f));
                return { name: f, size: s.size, modified: s.mtime };
            })
            : [],
        knowledgeChunks: knowledgeChunks.length,
        memoryCount: memoryItems.length,
        sessionCount: Object.keys(sessions).length,
        unreadNotifications: notifications.filter(n => !n.read).length,
        pendingUnanswered: unansweredQuestions.filter(u => !u.resolved).length,
        pendingLearning: getQueueStats().pending
    });
});

app.post('/api/admin/config', authAdmin, (req, res) => {
    try {
        const allowed = ['aiName','tagline','logoUrl','logoSize','theme','welcomeMessage',
                        'systemInstruction','quickButtons','memoryEnabled',
                        'memoryMinScore','memorySaveThreshold',
                        'conversationHistoryEnabled','conversationHistorySize',
                        'rateLimitPerSession','contactInfo','strictMode'];
        for (const k of allowed) {
            if (req.body[k] !== undefined) {
                if (k === 'theme' && typeof req.body[k] === 'object') {
                    CONFIG.theme = { ...CONFIG.theme, ...req.body[k] };
                } else {
                    CONFIG[k] = req.body[k];
                }
            }
        }
        saveConfig();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================
// PROVIDERS — CRUD + CUSTOM
// ============================================================
app.post('/api/admin/providers/add', authAdmin, (req, res) => {
    try {
        const { name, apiKey, models, customEndpoint, displayName } = req.body;
        if (!name || !apiKey) {
            return res.json({ success: false, message: 'Nama provider & API key wajib diisi' });
        }

        const isBuiltIn = !!PROVIDERS[name];

        if (!isBuiltIn && !customEndpoint) {
            return res.json({
                success: false,
                message: `Provider "${name}" tidak dikenal. Pilih provider terdaftar atau isi Custom Endpoint.`
            });
        }

        const newProvider = {
            name,
            apiKey: apiKey.trim(),
            models: Array.isArray(models) && models.length > 0
                ? models
                : (PROVIDERS[name]?.models || []),
            enabled: true,
            addedAt: new Date().toISOString()
        };

        if (!isBuiltIn) {
            newProvider.customEndpoint = customEndpoint;
            newProvider.displayName = displayName || name;
        }

        PROVIDERS_CONFIG.push(newProvider);
        saveProviders();
        notifAdd('info', 'Provider Ditambahkan',
            `${newProvider.displayName || PROVIDERS[name]?.name || name} berhasil ditambahkan`, 'info');
        res.json({ success: true, total: PROVIDERS_CONFIG.length });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/admin/providers/remove', authAdmin, (req, res) => {
    const { index } = req.body;
    if (index < 0 || index >= PROVIDERS_CONFIG.length) {
        return res.json({ success: false, message: 'Index tidak valid' });
    }
    PROVIDERS_CONFIG.splice(index, 1);
    saveProviders();
    res.json({ success: true, total: PROVIDERS_CONFIG.length });
});

app.post('/api/admin/providers/toggle', authAdmin, (req, res) => {
    const { index } = req.body;
    if (index < 0 || index >= PROVIDERS_CONFIG.length) {
        return res.json({ success: false, message: 'Index tidak valid' });
    }
    PROVIDERS_CONFIG[index].enabled = !PROVIDERS_CONFIG[index].enabled;
    saveProviders();
    const p = PROVIDERS_CONFIG[index];
    const state = p.enabled ? 'AKTIF' : 'NONAKTIF';
    notifAdd('info', `Provider ${state}`,
        `${p.displayName || PROVIDERS[p.name]?.name || p.name} → ${state}`, 'info');
    res.json({ success: true, enabled: PROVIDERS_CONFIG[index].enabled });
});

app.post('/api/admin/providers/update-models', authAdmin, (req, res) => {
    try {
        const { index, models } = req.body;
        if (index < 0 || index >= PROVIDERS_CONFIG.length) {
            return res.json({ success: false, message: 'Index tidak valid' });
        }
        if (!Array.isArray(models) || models.length === 0) {
            return res.json({ success: false, message: 'Models harus array minimal 1' });
        }
        PROVIDERS_CONFIG[index].models = models.map(m => String(m).trim()).filter(Boolean);
        saveProviders();
        res.json({ success: true, models: PROVIDERS_CONFIG[index].models });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/admin/providers/update-key', authAdmin, (req, res) => {
    try {
        const { index, apiKey } = req.body;
        if (index < 0 || index >= PROVIDERS_CONFIG.length) {
            return res.json({ success: false, message: 'Index tidak valid' });
        }
        if (!apiKey || apiKey.trim().length < 5) {
            return res.json({ success: false, message: 'API key tidak valid' });
        }
        PROVIDERS_CONFIG[index].apiKey = apiKey.trim();
        saveProviders();
        notifAdd('info', 'API Key Diperbarui',
            `Provider #${index + 1} API key diupdate`, 'info');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/admin/providers/test', authAdmin, async (req, res) => {
    try {
        const { index } = req.body;
        if (index < 0 || index >= PROVIDERS_CONFIG.length) {
            return res.json({ success: false, message: 'Index tidak valid' });
        }
        const p = PROVIDERS_CONFIG[index];

        let callFn, baseUrl, models;
        if (p.customEndpoint) {
            callFn = callOpenAICompatible;
            baseUrl = p.customEndpoint;
            models = p.models;
        } else {
            const provider = PROVIDERS[p.name];
            if (!provider) return res.json({ success: false, message: 'Provider tidak dikenal' });
            callFn = provider.call;
            baseUrl = provider.baseUrl;
            models = p.models || provider.models;
        }

        const testConv = [{ role: 'user', text: 'Balas dengan: OK' }];
        const text = await callFn({
            apiKey: p.apiKey,
            model: models[0],
            baseUrl,
            systemPrompt: 'Balas singkat.',
            conversation: testConv
        });

        res.json({ success: true, message: `Aktif: "${text.slice(0, 50)}"`, model: models[0] });
    } catch (err) {
        const msg = String(err?.message || err);
        let advice = 'Gagal';
        if (msg.includes('401')) advice = 'API key tidak valid';
        else if (msg.includes('429')) advice = 'Kuota habis';
        else if (msg.includes('404')) advice = 'Model tidak tersedia';
        res.json({ success: false, message: advice, detail: msg.slice(0, 200) });
    }
});

// ============================================================
// FEEDBACK ENDPOINTS
// ============================================================
app.post('/api/feedback', async (req, res) => {
    try {
        const { question, answer, rating, sessionId, provider, model, source } = req.body;
        if (!question || !answer || !['good', 'bad'].includes(rating)) {
            return res.status(400).json({ error: 'Data tidak valid' });
        }
        addFeedback(question, answer, rating, sessionId, { provider, model, source });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/admin/feedback/stats', authAdmin, (req, res) => {
    res.json(getStats());
});

app.get('/api/admin/feedback/list', authAdmin, (req, res) => {
    res.json({ items: getFeedbackList(200) });
});

app.get('/api/admin/feedback/bad', authAdmin, (req, res) => {
    res.json({ items: getBadExamples(50) });
});

app.get('/api/admin/feedback/good', authAdmin, (req, res) => {
    res.json({ items: getGoodExamples(50) });
});

app.post('/api/admin/feedback/clear', authAdmin, (req, res) => {
    const { analytics } = req.body || {};
    if (analytics) clearAnalytics();
    else clearFeedback();
    res.json({ success: true });
});

// ============================================================
// LEARNING ENDPOINTS
// ============================================================
app.get('/api/admin/learning/queue', authAdmin, (req, res) => {
    const filter = req.query.filter || 'all';
    res.json({
        stats: getQueueStats(),
        items: getLearningQueue(filter)
    });
});

app.get('/api/admin/learning/stats', authAdmin, (req, res) => {
    res.json(getQueueStats());
});

app.post('/api/admin/learning/resolve', authAdmin, (req, res) => {
    const { id } = req.body;
    if (resolveQuestion(id)) res.json({ success: true });
    else res.json({ success: false, message: 'Tidak ditemukan' });
});

app.post('/api/admin/learning/delete', authAdmin, (req, res) => {
    const { id } = req.body;
    if (deleteQuestion(id)) res.json({ success: true });
    else res.json({ success: false, message: 'Tidak ditemukan' });
});

app.post('/api/admin/learning/clear-resolved', authAdmin, (req, res) => {
    clearLearningResolved();
    res.json({ success: true });
});

app.post('/api/admin/learning/clear-all', authAdmin, (req, res) => {
    clearLearningAll();
    res.json({ success: true });
});

// ============================================================
// SUMMARY & INSIGHTS
// ============================================================
app.get('/api/admin/summary/latest', authAdmin, (req, res) => {
    res.json(getLatestSummary() || {});
});

app.get('/api/admin/summary/list', authAdmin, (req, res) => {
    const limit = parseInt(req.query.limit) || 30;
    res.json({ items: getSummaries(limit) });
});

app.get('/api/admin/summary/knowledge', authAdmin, (req, res) => {
    res.json(generateKnowledgeSummary(knowledgeChunks));
});

app.post('/api/admin/summary/generate', authAdmin, (req, res) => {
    try {
        const insight = generateDailyInsight(
            getFeedbackList(500),
            getLearningQueue('all'),
            unansweredQuestions
        );
        res.json({ success: true, insight });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================
// UNANSWERED QUESTIONS
// ============================================================
app.get('/api/admin/unanswered', authAdmin, (req, res) => {
    const filter = req.query.filter || 'all';
    let items = [...unansweredQuestions];
    if (filter === 'pending') items = items.filter(u => !u.resolved);
    else if (filter === 'resolved') items = items.filter(u => u.resolved);
    items.sort((a, b) => new Date(b.lastAsked) - new Date(a.lastAsked));

    res.json({
        total: unansweredQuestions.length,
        pending: unansweredQuestions.filter(u => !u.resolved).length,
        resolved: unansweredQuestions.filter(u => u.resolved).length,
        items
    });
});

app.post('/api/admin/unanswered/resolve', authAdmin, (req, res) => {
    const { id } = req.body;
    const item = unansweredQuestions.find(u => u.id === id);
    if (!item) return res.json({ success: false, message: 'Tidak ditemukan' });
    item.resolved = true;
    item.resolvedAt = new Date().toISOString();
    unansweredSave();
    res.json({ success: true });
});

app.post('/api/admin/unanswered/delete', authAdmin, (req, res) => {
    const { id } = req.body;
    const idx = unansweredQuestions.findIndex(u => u.id === id);
    if (idx === -1) return res.json({ success: false, message: 'Tidak ditemukan' });
    unansweredQuestions.splice(idx, 1);
    unansweredSave();
    res.json({ success: true });
});

app.post('/api/admin/unanswered/clear', authAdmin, (req, res) => {
    const { onlyResolved } = req.body || {};
    if (onlyResolved) {
        unansweredQuestions = unansweredQuestions.filter(u => !u.resolved);
    } else {
        unansweredQuestions = [];
    }
    unansweredSave();
    res.json({ success: true, total: unansweredQuestions.length });
});

app.post('/api/admin/unanswered/add-to-knowledge', authAdmin, (req, res) => {
    try {
        const { id, question, answer, category } = req.body;
        if (!question || !answer) {
            return res.json({ success: false, message: 'Pertanyaan & jawaban wajib diisi' });
        }

        const timestamp = new Date().toISOString();
        const title = question.length > 80 ? question.slice(0, 77) + '...' : question;

        let block = `\n\n## ${title}\n\n`;
        block += `Kata kunci : ${question}\n\n`;
        block += `Pertanyaan : ${question}\n\n`;
        block += `Jawaban : ${answer}\n\n`;
        if (category) block += `Kategori : ${category}\n`;

        const knowledgeFile = path.join(PATHS.knowledge, 'buku-pengetahuan.md');
        if (!fs.existsSync(knowledgeFile)) {
            fs.writeFileSync(knowledgeFile, '# Buku Pengetahuan SIVT AI\n', 'utf-8');
        }

        fs.appendFileSync(knowledgeFile, block, 'utf-8');

        if (id) {
            const item = unansweredQuestions.find(u => u.id === id);
            if (item) {
                item.resolved = true;
                item.resolvedAt = timestamp;
                unansweredSave();
            }
        }

        loadKnowledge();

        notifAdd('info', 'Pengetahuan Ditambahkan',
            `"${title}" berhasil ditambahkan`, 'info');

        res.json({
            success: true,
            message: 'Berhasil ditambahkan ke buku pengetahuan',
            chunks: knowledgeChunks.length
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/admin/learning/add-to-knowledge', authAdmin, (req, res) => {
    try {
        const { id, question, answer, category } = req.body;
        if (!question || !answer) {
            return res.json({ success: false, message: 'Pertanyaan & jawaban wajib diisi' });
        }

        const timestamp = new Date().toISOString();
        const title = question.length > 80 ? question.slice(0, 77) + '...' : question;

        let block = `\n\n## ${title}\n\n`;
        block += `Kata kunci : ${question}\n\n`;
        block += `Pertanyaan : ${question}\n\n`;
        block += `Jawaban : ${answer}\n\n`;
        if (category) block += `Kategori : ${category}\n`;

        const knowledgeFile = path.join(PATHS.knowledge, 'buku-pengetahuan.md');
        if (!fs.existsSync(knowledgeFile)) {
            fs.writeFileSync(knowledgeFile, '# Buku Pengetahuan SIVT AI\n', 'utf-8');
        }

        fs.appendFileSync(knowledgeFile, block, 'utf-8');

        if (id) resolveQuestion(id);

        loadKnowledge();

        notifAdd('info', 'Pengetahuan Ditambahkan',
            `"${title}" dari learning queue ditambahkan`, 'info');

        res.json({
            success: true,
            message: 'Berhasil ditambahkan ke buku pengetahuan',
            chunks: knowledgeChunks.length
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================
// UPLOAD LOGO
// ============================================================
const logoUpload = multer({
    dest: PATHS.tmp,
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (!/^image\/(png|jpe?g|gif|webp|svg\+xml)$/i.test(file.mimetype)) {
            return cb(new Error('Hanya gambar'));
        }
        cb(null, true);
    }
});

app.post('/api/admin/logo/upload', authAdmin, logoUpload.single('logo'), (req, res) => {
    try {
        if (!req.file) return res.json({ success: false, message: 'Tidak ada file' });
        const ext = path.extname(req.file.originalname).toLowerCase() || '.png';
        const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
        const finalExt = allowed.includes(ext) ? ext : '.png';

        if (fs.existsSync(PATHS.uploadsDir)) {
            fs.readdirSync(PATHS.uploadsDir).forEach(f => {
                if (f.startsWith('logo')) {
                    try { fs.unlinkSync(path.join(PATHS.uploadsDir, f)); } catch (_) {}
                }
            });
        }
        const fileName = `logo${finalExt}`;
        fs.renameSync(req.file.path, path.join(PATHS.uploadsDir, fileName));
        CONFIG.logoUrl = `/uploads/${fileName}?v=${Date.now()}`;
        saveConfig();
        notifAdd('info', 'Logo Diperbarui', 'Logo berhasil diupload', 'info');
        res.json({ success: true, logoUrl: CONFIG.logoUrl });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/admin/logo/delete', authAdmin, (req, res) => {
    if (fs.existsSync(PATHS.uploadsDir)) {
        fs.readdirSync(PATHS.uploadsDir).forEach(f => {
            if (f.startsWith('logo')) {
                try { fs.unlinkSync(path.join(PATHS.uploadsDir, f)); } catch (_) {}
            }
        });
    }
    CONFIG.logoUrl = '';
    saveConfig();
    res.json({ success: true });
});

// ============================================================
// GANTI PASSWORD
// ============================================================
app.post('/api/admin/change-password', authAdmin, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 8) {
        return res.json({ success: false, message: 'Password minimal 8 karakter' });
    }
    if (!bcrypt.compareSync(oldPassword, ADMIN_PASSWORD_HASH)) {
        return res.json({ success: false, message: 'Password lama salah' });
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    ADMIN_PASSWORD_HASH = newHash;
    const envPath = path.join(__dirname, '.env');
    try {
        let envContent = fs.readFileSync(envPath, 'utf-8');
        if (/^ADMIN_PASSWORD_HASH=/m.test(envContent)) {
            envContent = envContent.replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH=${newHash}`);
        } else if (/^ADMIN_PASSWORD=/m.test(envContent)) {
            envContent = envContent.replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD_HASH=${newHash}`);
        } else {
            envContent += `\nADMIN_PASSWORD_HASH=${newHash}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf-8');
        res.json({ success: true, message: 'Password diganti. Restart server.' });
    } catch (e) {
        res.json({ success: false, message: 'Gagal simpan: ' + e.message });
    }
});

// ============================================================
// NOTIFICATIONS
// ============================================================
app.get('/api/admin/notifications', authAdmin, (req, res) => {
    res.json({
        unread: notifications.filter(n => !n.read).length,
        total: notifications.length,
        items: notifications.slice().reverse().slice(0, 50)
    });
});

app.post('/api/admin/notifications/read', authAdmin, (req, res) => {
    const { id } = req.body;
    if (id) {
        const n = notifications.find(x => x.id === id);
        if (n) n.read = true;
    } else {
        notifications.forEach(n => n.read = true);
    }
    notifSave();
    res.json({ success: true });
});

app.post('/api/admin/notifications/clear', authAdmin, (req, res) => {
    notifications = [];
    notifSave();
    res.json({ success: true });
});

// ============================================================
// KNOWLEDGE
// ============================================================
const upload = multer({
    dest: PATHS.tmp,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (!/\.(md|txt)$/i.test(file.originalname)) return cb(new Error('Hanya .md / .txt'));
        cb(null, true);
    }
});

app.post('/api/admin/knowledge/upload', authAdmin, upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.json({ success: false, message: 'Tidak ada file' });
        const safeName = path.basename(req.file.originalname).replace(/[^\w\-. ]/g, '_');
        fs.renameSync(req.file.path, path.join(PATHS.knowledge, safeName));
        loadKnowledge();
        res.json({ success: true, message: `${safeName} diupload`, chunks: knowledgeChunks.length });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
app.post('/api/admin/knowledge/delete', authAdmin, (req, res) => {
    const safe = path.basename(req.body.name || '');
    const filePath = path.join(PATHS.knowledge, safe);
    if (!fs.existsSync(filePath)) return res.json({ success: false, message: 'Tidak ada' });
    fs.unlinkSync(filePath);
    loadKnowledge();
    res.json({ success: true, chunks: knowledgeChunks.length });
});
app.post('/api/admin/knowledge/reload', authAdmin, (req, res) => {
    loadKnowledge();
    res.json({ success: true, chunks: knowledgeChunks.length });
});

// ============================================================
// MEMORY ENDPOINTS
// ============================================================
app.get('/api/admin/memory', authAdmin, (req, res) => {
    res.json({
        total: memoryItems.length,
        items: memoryItems.map(m => ({
            timestamp: m.timestamp,
            title: m.title,
            question: m.question,
            answer: m.answer,
            hit: m.hit,
            variants: m.variants
        }))
    });
});
app.post('/api/admin/memory/delete', authAdmin, (req, res) => {
    const { index } = req.body;
    if (index < 0 || index >= memoryItems.length) return res.json({ success: false });
    memoryItems.splice(index, 1);
    memorySave();
    res.json({ success: true, total: memoryItems.length });
});
app.post('/api/admin/memory/clear', authAdmin, (req, res) => {
    memoryItems = [];
    memorySave();
    res.json({ success: true, total: 0 });
});
app.post('/api/admin/memory/reload', authAdmin, (req, res) => {
    memoryLoad();
    res.json({ success: true, total: memoryItems.length });
});

// ============================================================
// SESSIONS
// ============================================================
app.get('/api/admin/sessions', authAdmin, (req, res) => {
    const list = Object.values(sessions).map(s => ({
        id: s.id,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
        messageCount: s.messages.length,
        lastMessage: s.messages.length > 0 ? s.messages[s.messages.length - 1].text.slice(0, 80) : ''
    }));
    res.json({ total: list.length, sessions: list.sort((a, b) => b.lastActivity - a.lastActivity) });
});

app.get('/api/admin/sessions/:id', authAdmin, (req, res) => {
    const session = sessions[req.params.id];
    if (!session) return res.json({ success: false, message: 'Sesi tidak ditemukan' });
    res.json({ success: true, session });
});

app.post('/api/admin/sessions/clear', authAdmin, (req, res) => {
    sessions = {};
    if (fs.existsSync(PATHS.sessionsDir)) {
        fs.readdirSync(PATHS.sessionsDir).forEach(f => {
            try { fs.unlinkSync(path.join(PATHS.sessionsDir, f)); } catch (_) {}
        });
    }
    res.json({ success: true });
});

// ============================================================
// BACKUP
// ============================================================
app.post('/api/admin/backup', authAdmin, async (req, res) => {
    try {
        await runBackup();
        notifAdd('info', 'Backup Berhasil', 'File backup telah dibuat', 'info');
        res.json({ success: true, message: 'Backup dibuat' });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});
app.get('/api/admin/backups', authAdmin, (req, res) => {
    if (!fs.existsSync(PATHS.backupsDir)) return res.json({ items: [] });
    const items = fs.readdirSync(PATHS.backupsDir)
        .filter(f => f.endsWith('.zip.enc'))
        .map(name => {
            const s = fs.statSync(path.join(PATHS.backupsDir, name));
            return { name, created: s.mtime, size: s.size };
        }).sort((a, b) => b.created - a.created);
    res.json({ items });
});

// ============================================================
// CHAT — AKURAT & TIDAK TERPOTONG
// ============================================================
app.post('/api/chat', async (req, res) => {
    const { message, sessionId: incomingSessionId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Pesan kosong' });
    }
    if (message.length > 2000) {
        return res.status(400).json({ error: 'Pesan maksimal 2000 karakter' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);

    try {
        const userText = message.trim();
        const session = sessionGetOrCreate(incomingSessionId);
        send({ sessionId: session.id });

        // ====================================================
        // STEP 1: CLASSIFIER
        // ====================================================
        const classification = classifyQuestion(userText, knowledgeChunks);
        console.log(`[CLASSIFY] relevant=${classification.relevant}, conf=${classification.confidence}`);

        if (!classification.relevant || classification.action === 'redirect') {
            trackEvent('out_of_scope');
            unansweredAdd(userText, session.id);
            recordUnansweredQuestion(userText);

            const redirectMsg = generateRedirectMessage(classification.reason, CONFIG.aiName);
            sessionAddMessage(session.id, 'user', userText);
            sessionAddMessage(session.id, 'bot', redirectMsg);

            send({ meta: { source: 'redirect', reason: classification.reason } });
            const text = cleanAIText(redirectMsg);
            for (let i = 0; i < text.length; i += 8) {
                send({ delta: text.slice(i, i + 8) });
                await new Promise(r => setTimeout(r, 10));
            }
            send({ done: true });
            return res.end();
        }

        // ====================================================
        // STEP 2: CEK MEMORY DULU (HEMAT TOKEN)
        // ====================================================
        if (CONFIG.memoryEnabled) {
            const memResult = memorySearch(userText, memoryItems, CONFIG.memoryMinScore || 60);

            if (memResult.item && memResult.isConfident) {
                const relevant = validateMemoryRelevance(userText, memResult.item);

                // Wajib jawaban lengkap (min 30 char, tidak diakhiri ":")
                const answerOk = memResult.item.answer &&
                                 memResult.item.answer.length > 30 &&
                                 !/:\s*$/.test(memResult.item.answer.trim());

                if (relevant && answerOk) {
                    console.log(`[MEMORY HIT] skor ${memResult.score} — "${userText.slice(0, 50)}"`);
                    memResult.item.hit = (memResult.item.hit || 0) + 1;
                    memorySave();
                    trackEvent('memory');

                    sessionAddMessage(session.id, 'user', userText);
                    sessionAddMessage(session.id, 'bot', memResult.item.answer);

                    send({ meta: { source: 'memory', score: memResult.score } });
                    const text = cleanAIText(memResult.item.answer);
                    for (let i = 0; i < text.length; i += 8) {
                        send({ delta: text.slice(i, i + 8) });
                        await new Promise(r => setTimeout(r, 10));
                    }
                    send({ done: true });
                    return res.end();
                } else {
                    console.log(`[MEMORY SKIP] skor ${memResult.score}, jawaban tidak lengkap`);
                }
            }
        }

        // ====================================================
        // STEP 3: RAG
        // ====================================================
        const searchResult = searchKnowledge(userText, 6);
        const relevantChunks = searchResult.chunks;
        const confidence = searchResult.confidence;
        let ctx = '';

        if (relevantChunks.length > 0 && confidence >= 40) {
            ctx = '=== KONTEKS DARI BUKU PENGETAHUAN ===\n' +
                  relevantChunks.map((c, i) => `[Kutipan ${i + 1}]\n${c.text}`).join('\n\n') +
                  '\n=== AKHIR KONTEKS ===\n\n';
            console.log(`[RAG] OK — ${relevantChunks.length} chunk (conf ${confidence})`);
        } else {
            console.log(`[RAG] KOSONG / confidence rendah`);
            const suggestions = getSuggestedTopics(6, userText);
            send({ needSuggestions: true, suggestions: suggestions.map(t => t.title) });
        }

        // ====================================================
        // STEP 4: Bangun conversation
        // ====================================================
        const conversation = [];

        if (CONFIG.conversationHistoryEnabled) {
            const recent = session.messages.slice(-(CONFIG.conversationHistorySize || 10));
            for (const m of recent) {
                conversation.push({ role: m.role, text: m.text });
            }
        }

        const userMessageText = ctx
            ? ctx + 'Pertanyaan user: ' + userText
            : 'Pertanyaan user: ' + userText;

        if (conversation.length === 0 || conversation[conversation.length - 1].role !== 'user') {
            conversation.push({ role: 'user', text: userMessageText });
        } else {
            conversation[conversation.length - 1].text = userMessageText;
        }

        // ====================================================
        // STEP 5: Kirim ke AI
        // ====================================================
        const enabledProviders = PROVIDERS_CONFIG.filter(p =>
            p && p.enabled !== false && p.apiKey && String(p.apiKey).trim().length > 5
        );

        console.log(`[CHAT] Provider aktif: ${enabledProviders.length} dari ${PROVIDERS_CONFIG.length}`);

        if (enabledProviders.length === 0) {
            send({ error: 'Belum ada provider aktif. Aktifkan minimal 1 di dashboard admin.' });
            return res.end();
        }

        send({ meta: { source: 'ai', context: relevantChunks.length, confidence } });

        let aiResult;
        try {
            aiResult = await callWithFallback(enabledProviders, {
                systemPrompt: CONFIG.systemInstruction,
                conversation,
                fileData: null,
                fileMimeType: null
            });
        } catch (err) {
            console.error('[AI] Semua provider gagal:', err.message);
            send({ error: 'Semua provider AI gagal. Coba lagi.' });
            notifAddThrottled('all_fail', 'danger', 'Semua Provider Gagal',
                'Cek API key di dashboard.', 'danger', 5 * 60 * 1000);
            return res.end();
        }

        console.log(`[AI OK] ${aiResult.provider} — ${aiResult.model}`);
        send({
            meta: {
                provider: aiResult.provider,
                model: aiResult.model,
                source: 'ai'
            }
        });

        // Gunakan teks asli (jangan dipotong)
        const rawText = aiResult.text;
        const text = cleanAIText(rawText);

        // Streaming smooth per 8 karakter
        for (let i = 0; i < text.length; i += 8) {
            send({ delta: text.slice(i, i + 8) });
            await new Promise(r => setTimeout(r, 10));
        }

        sessionAddMessage(session.id, 'user', userText);
        sessionAddMessage(session.id, 'bot', text);

        // ====================================================
        // STEP 6: Track & Learning
        // ====================================================
        const isRefusal = /belum ada di buku|belum ada di catatan|tidak tahu|tidak ada info|hubungi petugas langsung|belum yakin/i.test(text);

        if (isRefusal) {
            trackEvent('refusal');
            unansweredAdd(userText, session.id);
            recordUnansweredQuestion(userText);
        } else if (relevantChunks.length > 0 && confidence >= 70) {
            trackEvent('rag');
        } else {
            trackEvent('answer');
        }

        // Simpan memory hanya kalau jawaban LENGKAP & VALID
        if (relevantChunks.length > 0 && confidence >= 70 && !isRefusal) {
            const isComplete = text.length > 50 &&
                               !/:\s*$/.test(text.trim()) &&
                               !/\.\.\.$/.test(text.trim());

            if (isComplete) {
                const addResult = memoryAdd(userText, text, memoryItems, CONFIG.memorySaveThreshold || 40);
                if (addResult.added || addResult.updated) {
                    memorySave();
                    console.log(`[MEMORY] ${addResult.added ? 'Tersimpan' : 'Diupdate'}: "${userText.slice(0, 50)}"`);
                }
            }
        }

        send({ done: true });
        res.end();

    } catch (e) {
        console.error('Chat error:', e.message);
        send({ error: 'Terjadi kesalahan.' });
        res.end();
    }
});

app.get('/api/topics', (req, res) => {
    res.json({ topics: availableTopics });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('============================================');
    console.log(`SIVT AI siap di http://localhost:${PORT}`);
    const activeCount = PROVIDERS_CONFIG.filter(p => p.enabled !== false).length;
    console.log(`Provider AI    : ${PROVIDERS_CONFIG.length} terdaftar (${activeCount} aktif)`);
    PROVIDERS_CONFIG.forEach((p, i) => {
        const mark = p.enabled !== false ? '✓' : '✗';
        const models = (p.models || []).slice(0, 2).join(', ');
        console.log(`  ${i + 1}. [${mark}] ${p.displayName || p.name} → ${models}`);
    });
    console.log(`Memori         : ${memoryItems.length} item`);
    console.log(`Knowledge      : ${knowledgeChunks.length} chunk`);
    console.log(`Unanswered     : ${unansweredQuestions.filter(u => !u.resolved).length} pending`);
    console.log('============================================');
    memoryInit();
    sessionInit();
    loadKnowledge();
    console.log('');
});