import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

// ============================================================
// VALIDASI ENV
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET tidak ada atau terlalu pendek di .env');
    process.exit(1);
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

// ============================================================
// PATH
// ============================================================
const PATHS = {
    config: path.join(__dirname, 'config.json'),
    keys: path.join(__dirname, 'keys.json'),
    knowledge: path.join(__dirname, 'knowledge'),
    memoryDir: path.join(__dirname, 'memory'),
    memoryFile: path.join(__dirname, 'memory', 'memory.md'),
    sessionsDir: path.join(__dirname, 'memory', 'sessions'),
    tmp: path.join(__dirname, 'tmp')
};

Object.values(PATHS).forEach(p => {
    const dir = p.includes('.') ? path.dirname(p) : p;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============================================================
// SESSION STORE
// ============================================================
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_SESSION_MESSAGES = 30;

let sessions = {};

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
            } catch (e) {
                console.error(`[SESSION] Gagal load ${file}:`, e.message);
            }
        }
        console.log(`[SESSION] ${Object.keys(sessions).length} sesi dimuat dari disk.`);
    }
}

function sessionSave(sessionId) {
    if (!sessions[sessionId]) return;
    try {
        const file = path.join(PATHS.sessionsDir, `${sessionId}.json`);
        fs.writeFileSync(file, JSON.stringify(sessions[sessionId]), 'utf-8');
    } catch (e) {
        console.error(`[SESSION] Gagal simpan ${sessionId}:`, e.message);
    }
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
            messages: [],
            summary: ''
        };
        console.log(`[SESSION] Sesi baru: ${sessionId}`);
    }
    sessions[sessionId].lastActivity = Date.now();
    return sessions[sessionId];
}

function sessionAddMessage(sessionId, role, text) {
    const session = sessions[sessionId];
    if (!session) return;
    session.messages.push({
        role,
        text: text.slice(0, 2000),
        ts: Date.now()
    });
    if (session.messages.length > MAX_SESSION_MESSAGES) {
        session.messages = session.messages.slice(-MAX_SESSION_MESSAGES);
    }
    sessionSave(sessionId);
}

function sessionCleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const id of Object.keys(sessions)) {
        if (now - sessions[id].lastActivity > SESSION_TTL_MS) {
            delete sessions[id];
            try {
                const file = path.join(PATHS.sessionsDir, `${id}.json`);
                if (fs.existsSync(file)) fs.unlinkSync(file);
            } catch (_) {}
            cleaned++;
        }
    }
    if (cleaned > 0) console.log(`[SESSION] Cleanup: ${cleaned} sesi lama dihapus.`);
}

setInterval(sessionCleanup, 30 * 60 * 1000);

// ============================================================
// CONFIG
// ============================================================
const DEFAULT_CONFIG = {
    aiName: 'SIVT AI',
    tagline: 'Sistem Informasi Virtual TEGALREJO',
    logoUrl: '',
    logoText: 'S',
    welcomeMessage:
        'Halo! Saya SIVT AI, asisten virtual Kemantren Tegalrejo.\nTanya apa saja tentang layanan administrasi, persyaratan, jadwal, dan info lainnya. Saya siap bantu 24 jam!',
    systemInstruction: `Kamu adalah SIVT AI, asisten virtual resmi Kemantren Tegalrejo, Yogyakarta.

Gaya bicara: santai, gaul, ramah. Gunakan "nih, dong, yuk, gimana, sip" secukupnya.
Jawab SINGKAT, PADAT, LANGSUNG KE INTI. Maksimal 3 paragraf pendek.
Jangan pakai tanda bintang dua (**).

=== ATURAN UTAMA ===

1. KONTEKS PERCAKAPAN: Kamu akan menerima riwayat percakapan sebelumnya. BACA dengan teliti apa yang sedang dibahas. Kalau user bertanya lanjutan ("terus?", "kalau yang tadi?", "yang satunya?"), jawab berdasarkan topik yang SEDANG DIBICARAKAN, bukan topik baru.

2. JAWAB BERDASARKAN "KONTEKS BUKU PENGETAHUAN" yang diberikan. Kalau ada di konteks, sebutkan SEMUA poin penting. Kalau daftar bernomor, tulis ulang rapi.

3. Kalau pertanyaan TIDAK ADA di konteks, jawab jujur dan singkat.

4. Kalau pertanyaan ambigu atau singkat banget ("iya", "terus", "gimana"), lihat riwayat percakapan untuk tahu maksudnya.

=== CONTOH SITUASI ===

User: "syarat bikin KK?"
AI: [jawab daftar syarat KK]
User: "kalau yang hilang?"
AI: [harusnya jawab SYARAT KK HILANG, bukan KTP hilang, karena topiknya KK]

User: "jam buka kemantren?"
AI: [jawab jam buka]
User: "kalau sabtu?"
AI: [harusnya jawab jam Sabtu — karena topiknya jam buka]

=== DILARANG ===
- Mengarang persyaratan, nomor telepon, atau alamat
- Memberi jawaban di luar konteks
- Lupa topik yang sedang dibahas

Info umum:
- Alamat: Jl. Tegalrejo No.1, Yogyakarta
- Jam: Senin-Jumat 08.00-15.00, Sabtu 08.00-12.00 WIB
- Telepon: (0274) 123456`,
    models: [
        'gemini-3.6-flash',
        'gemini-3.8-flash',
        'gemini-flash-latest'
    ],
    generationConfig: {
        temperature: 0.2,
        topP: 0.85,
        topK: 30,
        maxOutputTokens: 1200
    },
    contactInfo: {
        address: 'Jl. Tegalrejo No.1, Yogyakarta',
        phone: '(0274) 123456',
        whatsapp: '0812-3456-7890',
        email: 'kemantren.tegalrejo@jogjakota.go.id',
        hours: 'Senin-Jumat 08.00-15.00, Sabtu 08.00-12.00'
    },
    quickButtons: [
        { label: 'Syarat KK', question: 'Syarat membuat KK baru' },
        { label: 'KTP Hilang', question: 'Syarat KTP hilang' },
        { label: 'Jam Pelayanan', question: 'Jam pelayanan Kemantren' },
        { label: 'Alamat', question: 'Alamat Kemantren Tegalrejo' }
    ],
    memoryEnabled: true,
    memoryMinScore: 20,
    memorySaveThreshold: 25,
    conversationHistoryEnabled: true,
    conversationHistorySize: 10
};

function loadConfig() {
    if (!fs.existsSync(PATHS.config)) {
        fs.writeFileSync(PATHS.config, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
        return { ...DEFAULT_CONFIG };
    }
    try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(PATHS.config, 'utf-8')) };
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}

function saveConfig() {
    fs.writeFileSync(PATHS.config, JSON.stringify(CONFIG, null, 2), 'utf-8');
}

let CONFIG = loadConfig();

// ============================================================
// API KEYS
// ============================================================
function loadKeys() {
    if (!fs.existsSync(PATHS.keys)) {
        const envKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
            .split(',').map(k => k.trim()).filter(Boolean);
        fs.writeFileSync(PATHS.keys, JSON.stringify(envKeys, null, 2), 'utf-8');
        return envKeys;
    }
    try { return JSON.parse(fs.readFileSync(PATHS.keys, 'utf-8')); }
    catch { return []; }
}

function saveKeys(keys) {
    fs.writeFileSync(PATHS.keys, JSON.stringify(keys, null, 2), 'utf-8');
}

let API_KEYS = loadKeys();
let clients = API_KEYS.map(k => new GoogleGenAI({ apiKey: k }));

function rebuildClients() {
    API_KEYS = loadKeys();
    clients = API_KEYS.map(k => new GoogleGenAI({ apiKey: k }));
}

// ============================================================
// MEMORY
// ============================================================
let memoryItems = [];

function memoryInit() {
    if (!fs.existsSync(PATHS.memoryFile)) {
        const header = `# Memori SIVT AI\n\nFile ini berisi catatan pertanyaan & jawaban yang pernah ditanyakan pengguna.\n\nTotal memori: 0\nTerakhir diperbarui: ${new Date().toISOString()}\n\n---\n\n`;
        fs.writeFileSync(PATHS.memoryFile, header, 'utf-8');
        console.log('[MEMORY] File memory.md dibuat.');
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
            const timestamp = headerMatch[1];
            const title = headerMatch[2].trim();
            const getField = (name) => {
                const line = lines.find(l => l.startsWith(`**${name}:**`));
                if (!line) return '';
                return line.replace(`**${name}:**`, '').trim();
            };
            memoryItems.push({
                timestamp,
                title,
                question: getField('Pertanyaan'),
                variants: getField('Variasi').split(',').map(s => s.trim()).filter(Boolean),
                answer: getField('Jawaban'),
                hit: parseInt(getField('Hit')) || 0,
                keywords: getField('Kata kunci').split(',').map(s => s.trim()).filter(Boolean)
            });
        } catch (e) {
            console.error('[MEMORY] Gagal parse blok:', e.message);
        }
    }
    console.log(`[MEMORY] ${memoryItems.length} memori dimuat.`);
}

function memorySave() {
    const lines = [
        '# Memori SIVT AI',
        '',
        'File ini berisi catatan pertanyaan & jawaban yang pernah ditanyakan pengguna.',
        '',
        `Total memori: ${memoryItems.length}`,
        `Terakhir diperbarui: ${new Date().toISOString()}`,
        '',
        '---',
        ''
    ];
    for (const m of memoryItems) {
        lines.push(`## [${m.timestamp}] ${m.title}`);
        lines.push(`**Pertanyaan:** ${m.question}`);
        lines.push(`**Variasi:** ${m.variants.join(', ')}`);
        lines.push(`**Jawaban:** ${m.answer}`);
        lines.push(`**Hit:** ${m.hit}`);
        lines.push(`**Kata kunci:** ${m.keywords.join(', ')}`);
        lines.push('');
    }
    fs.writeFileSync(PATHS.memoryFile, lines.join('\n'), 'utf-8');
}

// ============================================================
// KNOWLEDGE HELPERS
// ============================================================
const SYNONYMS = {
    'bikin': 'buat', 'membuat': 'buat', 'bikinin': 'buat', 'buatkan': 'buat',
    'gimana': 'bagaimana', 'caranya': 'cara', 'gmn': 'bagaimana',
    'syrat': 'syarat', 'syaratnya': 'syarat', 'persyaratan': 'syarat',
    'perlu': 'butuh', 'perlunya': 'butuh', 'diperlukan': 'butuh', 'dibutuhkan': 'butuh',
    'ilang': 'hilang', 'kehilangan': 'hilang', 'raib': 'hilang',
    'sobek': 'rusak', 'rusaknya': 'rusak',
    'ktpel': 'ktp',
    'miskin': 'tidak mampu',
    'akte': 'akta',
    'srt': 'surat', 'suratnya': 'surat',
    'waktu': 'jam', 'pukul': 'jam',
    'lokasi': 'alamat', 'tempat': 'alamat',
    'telp': 'telepon', 'tlp': 'telepon', 'kontak': 'telepon',
    'wa': 'whatsapp',
    'harga': 'biaya', 'bayar': 'biaya', 'tarif': 'biaya',
    'free': 'gratis',
    'daring': 'online', 'internet': 'online',
    'migrasi': 'pindah'
};

const STOPWORDS = new Set([
    'yang','dan','di','ke','dari','untuk','apa','itu','ini','saya','kamu',
    'adalah','atau','dengan','pada','akan','bisa','ada','tidak','nya',
    'kalau','gimana','bagaimana','mau','ingin','tolong','dong','sih','ya',
    'nih','deh','kok','lah','kan','aku','anda','kita','mereka','saja',
    'juga','masih','sudah','belum','hanya','sama','punya','tapi','tetapi',
    'oleh','buat','dalam','luar','atas','bawah','sini','sana','situ',
    'mohon','minta','kasih','beri','coba','cek','lihat','tanya',
    'kenapa','kog','ko','eh','woi','bang','mas','mbak','terus','lanjut',
    'selanjutnya','kemudian','gitu','gt','gni','gini','yah'
]);

function normalizeWord(w) {
    let word = w.toLowerCase().trim();
    if (SYNONYMS[word]) word = SYNONYMS[word];
    return word;
}

function stemID(word) {
    let w = word;
    w = w.replace(/^(memper|diper|me|di|ter|ber|pe|se)/, '');
    w = w.replace(/(kan|lah|nya|kah|pun|ku|mu)$/, '');
    return w.length > 2 ? w : word;
}

function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .map(normalizeWord)
        .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function makeBigrams(words) {
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) bigrams.push(words[i] + ' ' + words[i + 1]);
    return bigrams;
}

function makeTrigrams(words) {
    const trigrams = [];
    for (let i = 0; i < words.length - 2; i++) {
        trigrams.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
    }
    return trigrams;
}

function memorySearch(question) {
    if (!CONFIG.memoryEnabled || memoryItems.length === 0) return { item: null, score: 0 };
    const qWords = tokenize(question);
    if (qWords.length === 0) return { item: null, score: 0 };
    const qStems = qWords.map(stemID);
    const qBigrams = makeBigrams(qWords);

    let best = null;
    let bestScore = 0;
    for (const m of memoryItems) {
        const allText = [m.question, ...m.variants, ...m.keywords].join(' ');
        const tokens = tokenize(allText);
        const stems = tokens.map(stemID);
        const bigrams = makeBigrams(tokens);
        const tokenSet = new Set(tokens);
        const stemSet = new Set(stems);
        const bigramSet = new Set(bigrams);

        let score = 0;
        for (const w of qWords) if (tokenSet.has(w)) score += 4;
        for (const s of qStems) if (stemSet.has(s)) score += 3;
        for (const bg of qBigrams) if (bigramSet.has(bg)) score += 8;
        score += Math.min(m.hit, 10);

        if (score > bestScore) {
            bestScore = score;
            best = m;
        }
    }
    return { item: best, score: bestScore };
}

function memoryAdd(question, answer) {
    if (!CONFIG.memoryEnabled) return false;
    if (!answer || answer.length < 20) return false;
    if (/belum ada di buku|belum yakin|tidak tahu|tidak ada info/i.test(answer)) return false;

    const qNorm = question.toLowerCase().trim();
    const existing = memorySearch(question);
    if (existing.item && existing.score >= CONFIG.memorySaveThreshold) {
        existing.item.hit += 1;
        if (!existing.item.variants.includes(qNorm) && existing.item.question.toLowerCase() !== qNorm) {
            existing.item.variants.push(qNorm);
        }
        memorySave();
        console.log(`[MEMORY] Hit tambah: "${question.slice(0, 50)}" (hit=${existing.item.hit})`);
        return true;
    }

    const title = question.length > 60 ? question.slice(0, 57) + '...' : question;
    memoryItems.push({
        timestamp: new Date().toISOString(),
        title,
        question: qNorm,
        variants: [],
        answer: answer.slice(0, 1000),
        hit: 1,
        keywords: tokenize(question).slice(0, 10)
    });
    memorySave();
    console.log(`[MEMORY] Tersimpan baru: "${question.slice(0, 50)}"`);
    return true;
}

// ============================================================
// KNOWLEDGE
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
            trigrams: new Set(makeTrigrams(rawWords)),
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
    availableTopics.sort((a, b) => {
        if (a.source !== b.source) return a.source.localeCompare(b.source);
        return a.title.localeCompare(b.title);
    });
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
    const qTrigrams = makeTrigrams(qWords);

    const scored = knowledgeChunks.map((chunk) => {
        const idx = chunk._index;
        let score = 0;
        for (const w of qWords) if (idx.words.has(w)) score += 3;
        for (const s of qStems) if (idx.stems.has(s)) score += 2;
        for (const bg of qBigrams) if (idx.bigrams.has(bg)) score += 5;
        for (const tg of qTrigrams) if (idx.trigrams.has(tg)) score += 8;
        for (const w of qWords) if (idx.keywordWords.has(w)) score += 4;
        for (const bg of qBigrams) if (idx.keywordBigrams.has(bg)) score += 6;

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
    if (topScore >= 12) confidence = 100;
    else if (topScore >= 6) confidence = 70;
    else if (topScore > 0) confidence = 40;

    return { chunks, confidence };
}

function getSuggestedTopics(limit = 8, query = '') {
    if (!query) {
        const shuffled = [...availableTopics].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, limit);
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
    const shuffled = [...availableTopics].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.use((req, res, next) => {
    const blocked = ['.env', 'keys.json', 'config.json', 'package.json', 'package-lock.json'];
    const p = req.path.toLowerCase();
    if (blocked.some(f => p.includes(f))) return res.status(404).end();
    if (p.startsWith('/knowledge/') || p.startsWith('/memory/') || p.startsWith('/tmp/') || p.startsWith('/node_modules/')) {
        return res.status(404).end();
    }
    next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, max: 300,
    standardHeaders: true, legacyHeaders: false,
    message: { error: 'Terlalu banyak request. Coba lagi nanti.' }
}));

app.use('/api/chat', rateLimit({
    windowMs: 60 * 1000, max: 30,
    message: { error: 'Pelan dong, tunggu bentar ya.' }
}));

app.use('/api/admin/login', rateLimit({
    windowMs: 15 * 60 * 1000, max: 10, skipSuccessfulRequests: true,
    message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi nanti.' }
}));

app.use((req, res, next) => {
    const time = new Date().toISOString();
    res.on('finish', () => {
        if (req.path.startsWith('/api/')) {
            console.log(`[${time}] ${req.ip} ${req.method} ${req.path} → ${res.statusCode}`);
        }
    });
    next();
});

app.use(express.static(path.join(__dirname, 'public'), {
    dotfiles: 'deny',
    index: 'index.html'
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
        res.status(401).json({ error: 'Token tidak valid atau kadaluarsa' });
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
        logoText: CONFIG.logoText,
        welcomeMessage: CONFIG.welcomeMessage,
        quickButtons: CONFIG.quickButtons,
        conversationHistoryEnabled: CONFIG.conversationHistoryEnabled
    });
});

// ============================================================
// LOGIN
// ============================================================
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ success: false, message: 'Input tidak valid' });
    }
    const okUser = username === ADMIN_USERNAME;
    const okPass = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
    if (!okUser || !okPass) {
        console.warn(`[AUTH] Login gagal: ${username} dari ${req.ip}`);
        return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
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
        apiKeys: API_KEYS.map((k, i) => ({
            index: i,
            masked: k.slice(0, 8) + '...' + k.slice(-6)
        })),
        knowledgeFiles: fs.existsSync(PATHS.knowledge)
            ? fs.readdirSync(PATHS.knowledge)
                .filter(f => /\.(md|txt)$/i.test(f))
                .map(f => {
                    const s = fs.statSync(path.join(PATHS.knowledge, f));
                    return { name: f, size: s.size, modified: s.mtime };
                })
            : [],
        knowledgeChunks: knowledgeChunks.length,
        availableTopics: availableTopics.length,
        memoryCount: memoryItems.length,
        sessionCount: Object.keys(sessions).length,
        memoryLastUpdate: fs.existsSync(PATHS.memoryFile)
            ? fs.statSync(PATHS.memoryFile).mtime
            : null
    });
});

app.post('/api/admin/config', authAdmin, (req, res) => {
    try {
        const allowed = ['aiName','tagline','logoUrl','logoText','welcomeMessage',
                        'systemInstruction','models','generationConfig',
                        'contactInfo','quickButtons','memoryEnabled',
                        'memoryMinScore','memorySaveThreshold',
                        'conversationHistoryEnabled','conversationHistorySize'];
        for (const k of allowed) {
            if (req.body[k] !== undefined) CONFIG[k] = req.body[k];
        }
        saveConfig();
        console.log(`[ADMIN] Config diubah oleh ${req.admin.username}`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/admin/change-password', authAdmin, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 8) {
        return res.json({ success: false, message: 'Password baru minimal 8 karakter' });
    }
    if (!bcrypt.compareSync(oldPassword, ADMIN_PASSWORD_HASH)) {
        return res.json({ success: false, message: 'Password lama salah' });
    }
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD=${newPassword}`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('[SECURITY] Password admin diganti.');
    res.json({ success: true, message: 'Password diganti. Restart server untuk efek penuh.' });
});

// ============================================================
// API KEYS
// ============================================================
app.post('/api/admin/keys/add', authAdmin, (req, res) => {
    const { key } = req.body;
    if (!key || typeof key !== 'string' || key.length < 10) {
        return res.json({ success: false, message: 'API key tidak valid' });
    }
    const keys = loadKeys();
    if (keys.includes(key.trim())) return res.json({ success: false, message: 'API key sudah ada' });
    keys.push(key.trim());
    saveKeys(keys);
    rebuildClients();
    res.json({ success: true, total: keys.length });
});

app.post('/api/admin/keys/remove', authAdmin, (req, res) => {
    const { index } = req.body;
    const keys = loadKeys();
    if (index < 0 || index >= keys.length) return res.json({ success: false, message: 'Index tidak valid' });
    keys.splice(index, 1);
    saveKeys(keys);
    rebuildClients();
    res.json({ success: true, total: keys.length });
});

app.post('/api/admin/keys/test', authAdmin, async (req, res) => {
    const { index } = req.body;
    const keys = loadKeys();
    if (index < 0 || index >= keys.length) return res.json({ success: false, message: 'Index tidak valid' });
    try {
        const testClient = new GoogleGenAI({ apiKey: keys[index] });
        const model = CONFIG.models[0] || 'gemini-flash-latest';
        await testClient.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
            config: { maxOutputTokens: 5 }
        });
        res.json({ success: true, message: 'API key aktif' });
    } catch (err) {
        const msg = String(err?.message || err);
        let advice = 'API key gagal.';
        if (msg.includes('429')) advice = 'Kuota habis';
        else if (msg.includes('404')) advice = 'Model tidak tersedia';
        else if (msg.toLowerCase().includes('invalid')) advice = 'API key tidak valid';
        res.json({ success: false, message: advice });
    }
});

// ============================================================
// KNOWLEDGE FILES
// ============================================================
const upload = multer({
    dest: PATHS.tmp,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (!/\.(md|txt)$/i.test(file.originalname)) return cb(new Error('Hanya file .md atau .txt'));
        cb(null, true);
    }
});

app.post('/api/admin/knowledge/upload', authAdmin, upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.json({ success: false, message: 'Tidak ada file' });
        const safeName = path.basename(req.file.originalname).replace(/[^\w\-. ]/g, '_');
        const target = path.join(PATHS.knowledge, safeName);
        fs.renameSync(req.file.path, target);
        loadKnowledge();
        res.json({ success: true, message: `${safeName} diupload`, chunks: knowledgeChunks.length });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/admin/knowledge/delete', authAdmin, (req, res) => {
    const safe = path.basename(req.body.name || '');
    const filePath = path.join(PATHS.knowledge, safe);
    if (!fs.existsSync(filePath)) return res.json({ success: false, message: 'File tidak ada' });
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
            answer: m.answer.slice(0, 200),
            hit: m.hit,
            variants: m.variants
        }))
    });
});

app.post('/api/admin/memory/delete', authAdmin, (req, res) => {
    const { index } = req.body;
    if (index < 0 || index >= memoryItems.length) return res.json({ success: false, message: 'Index tidak valid' });
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
// SESSION ENDPOINTS
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
    const s = sessions[req.params.id];
    if (!s) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    res.json(s);
});

app.post('/api/admin/sessions/clear', authAdmin, (req, res) => {
    sessions = {};
    if (fs.existsSync(PATHS.sessionsDir)) {
        fs.readdirSync(PATHS.sessionsDir).forEach(f => {
            try { fs.unlinkSync(path.join(PATHS.sessionsDir, f)); } catch (_) {}
        });
    }
    console.log('[SESSION] Semua sesi dihapus oleh admin.');
    res.json({ success: true });
});

// ============================================================
// CHAT
// ============================================================
async function* streamGemini(contents) {
    let lastError = null;
    const models = CONFIG.models?.length ? CONFIG.models : ['gemini-flash-latest'];
    for (const model of models) {
        for (let k = 0; k < clients.length; k++) {
            try {
                const stream = await clients[k].models.generateContentStream({
                    model, contents,
                    config: {
                        systemInstruction: CONFIG.systemInstruction,
                        temperature: CONFIG.generationConfig?.temperature ?? 0.2,
                        topP: CONFIG.generationConfig?.topP ?? 0.85,
                        topK: CONFIG.generationConfig?.topK ?? 30,
                        maxOutputTokens: CONFIG.generationConfig?.maxOutputTokens ?? 1200
                    }
                });
                console.log(`[STREAM OK] ${model} key#${k + 1}`);
                yield { model, key: `key#${k + 1}`, stream };
                return;
            } catch (err) {
                lastError = err;
                const msg = String(err?.message || err);
                console.warn(`[SKIP] ${model} key#${k + 1}: ${msg.slice(0, 80)}`);
                if (!msg.match(/429|404|503|RESOURCE_EXHAUSTED|NOT_FOUND|UNAVAILABLE/)) throw err;
                await new Promise(r => setTimeout(r, 400));
            }
        }
    }
    throw lastError || new Error('Semua model & key gagal');
}

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

        const recentMessages = session.messages.slice(-(CONFIG.conversationHistorySize || 10));
        const isFollowUp = userText.length < 30 &&
            /^(terus|lanjut|trus|kalau|kalo|gimana|gmn|kok|apa|yang|iya|ya|dan|sama|juga|itu|tadi|tadinya|satunya|selain|lagi|masih|tapi|trs)/i.test(userText);

        let enrichedQuery = userText;
        if (isFollowUp && recentMessages.length > 0) {
            const prevMessages = recentMessages.slice(-4).map(m => m.text).join(' ');
            enrichedQuery = prevMessages + ' ' + userText;
            console.log(`[CONTEXT] Follow-up terdeteksi. Query diperkaya.`);
        }

        // 1. CEK MEMORY
        const exactMatch = memorySearch(userText);
        if (exactMatch.item && exactMatch.score >= CONFIG.memoryMinScore && !isFollowUp) {
            exactMatch.item.hit += 1;
            memorySave();
            console.log(`[MEMORY HIT] score=${exactMatch.score} — "${userText.slice(0, 50)}"`);
            sessionAddMessage(session.id, 'user', userText);
            sessionAddMessage(session.id, 'bot', exactMatch.item.answer);
            send({ meta: { source: 'memory', score: exactMatch.score, sessionId: session.id } });
            const text = exactMatch.item.answer;
            for (let i = 0; i < text.length; i += 5) {
                send({ delta: text.slice(i, i + 5) });
                await new Promise(r => setTimeout(r, 8));
            }
            send({ done: true });
            return res.end();
        }

        // 2. KNOWLEDGE SEARCH
        if (clients.length === 0) {
            send({ error: 'Belum ada API key. Hubungi admin.' });
            return res.end();
        }

        const searchResult = searchKnowledge(isFollowUp ? enrichedQuery : userText, 6);
        const relevant = searchResult.chunks;
        const confidence = searchResult.confidence;
        let ctx = '';

        if (relevant.length === 0 || confidence < 70) {
            const suggestions = getSuggestedTopics(8, userText);
            send({ needSuggestions: true, suggestions: suggestions.map(t => t.title) });
            console.log(`[RAG] Confidence ${confidence}, kirim ${suggestions.length} saran`);
        }

        if (relevant.length > 0) {
            ctx = '=== KONTEKS BUKU PENGETAHUAN ===\n' +
                  relevant.map((c, i) => `[${i + 1}]\n${c.text}`).join('\n\n') +
                  '\n=== AKHIR KONTEKS ===\n\n';
            console.log(`[RAG] OK - ${relevant.length} chunk (confidence ${confidence})`);
        } else {
            console.log(`[RAG] KOSONG`);
        }

        // 3. BANGUN CONTENTS DENGAN RIWAYAT
        const contents = [];
        if (CONFIG.conversationHistoryEnabled && recentMessages.length > 0) {
            for (const m of recentMessages) {
                contents.push({
                    role: m.role === 'bot' ? 'model' : 'user',
                    parts: [{ text: m.text }]
                });
            }
        }
        contents.push({
            role: 'user',
            parts: [{ text: (ctx || '') + 'Pertanyaan: ' + userText }]
        });

        // 4. STREAM
        let ok = false;
        let fullText = '';
        try {
            for await (const ev of streamGemini(contents)) {
                send({
                    meta: {
                        source: 'gemini',
                        model: ev.model,
                        key: ev.key,
                        context: relevant.length,
                        confidence,
                        historyCount: recentMessages.length,
                        isFollowUp,
                        sessionId: session.id
                    }
                });
                for await (const chunk of ev.stream) {
                    if (chunk?.text) {
                        fullText += chunk.text;
                        send({ delta: chunk.text });
                    }
                }
                ok = true;
                break;
            }
        } catch (err) {
            console.error('Stream error: ' + err.message);
            send({ error: 'Server sibuk. Coba lagi nanti.' });
            return res.end();
        }

        if (!ok) {
            send({ error: 'Gagal dapat balasan.' });
            return res.end();
        }

        // 5. SIMPAN
        sessionAddMessage(session.id, 'user', userText);
        sessionAddMessage(session.id, 'bot', fullText);

        if (!isFollowUp && fullText.length > 30 && relevant.length > 0 && confidence >= 70) {
            memoryAdd(userText, fullText);
        }

        send({ done: true });
        res.end();
    } catch (e) {
        console.error('Chat error: ' + e.message);
        send({ error: 'Terjadi kesalahan.' });
        res.end();
    }
});

app.get('/api/topics', (req, res) => {
    res.json({ topics: availableTopics });
});

// ============================================================
// START
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('============================================');
    console.log(`SIVT AI siap di http://localhost:${PORT}`);
    console.log(`Nama AI        : ${CONFIG.aiName}`);
    console.log(`Model dipakai  : ${CONFIG.models.join(', ')}`);
    console.log(`Jumlah API key : ${clients.length}`);
    console.log(`Konteks chat   : ${CONFIG.conversationHistoryEnabled ? 'AKTIF' : 'MATI'} (${CONFIG.conversationHistorySize} pesan)`);
    console.log(`Mode           : ${process.env.NODE_ENV || 'development'}`);
    console.log('============================================');
    memoryInit();
    sessionInit();
    loadKnowledge();
    console.log('');
});