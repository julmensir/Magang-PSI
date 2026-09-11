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
    tmp: path.join(__dirname, 'tmp')
};

Object.values(PATHS).forEach(p => {
    const dir = p.includes('.') ? path.dirname(p) : p;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

ATURAN WAJIB:
1. Jawab berdasarkan "KONTEKS" yang diberikan. Konteks dari buku resmi Kemantren.
2. Kalau ada di konteks, sebutkan SEMUA poin penting. Kalau daftar bernomor, tulis ulang rapi.
3. Kalau pertanyaan TIDAK ADA di konteks, jawab dengan ramah dan singkat.

CARA MENJAWAB KALAU TIDAK YAKIN:
Kalau konteks tidak relevan atau kosong, jawab HANYA dengan kalimat pendek seperti:
"Wah, aku belum yakin nangkep pertanyaannya nih. Coba pilih salah satu topik di bawah ya, atau tulis ulang pertanyaanmu pakai kata kunci yang lebih spesifik."
Setelah kalimat itu, cukup berhenti.

DILARANG:
- Mengarang persyaratan, nomor telepon, atau alamat
- Memberi jawaban di luar konteks
- Panjang lebar kalau tidak ada jawaban

Info umum (boleh dipakai tanpa konteks):
- Alamat: Jl. Tegalrejo No.1, Yogyakarta
- Jam pelayanan: Senin-Jumat 08.00-15.00 WIB, Sabtu 08.00-12.00 WIB
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
    ]
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
// KNOWLEDGE (dengan pencarian pintar)
// ============================================================
let knowledgeChunks = [];
let availableTopics = [];

// Sinonim bahasa Indonesia
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
    'mohon','minta','kasih','beri','coba','cek','lihat','tanya'
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
    for (let i = 0; i < words.length - 1; i++) {
        bigrams.push(words[i] + ' ' + words[i + 1]);
    }
    return bigrams;
}

function makeTrigrams(words) {
    const trigrams = [];
    for (let i = 0; i < words.length - 2; i++) {
        trigrams.push(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
    }
    return trigrams;
}

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
            keywordBigrams: new Set(makeBigrams(keywordWords)),
            normalized: chunk.text.toLowerCase()
        };
    }
}

function extractTopics() {
    availableTopics = [];
    const seen = new Set();

    for (const chunk of knowledgeChunks) {
        const match = chunk.text.match(/^\[(.+?)\]/);
        if (!match) continue;
        const title = match[1].trim();
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
        .filter(f => f.toLowerCase().endsWith('.txt'));

    for (const file of files) {
        try {
            const text = fs.readFileSync(path.join(PATHS.knowledge, file), 'utf-8');
            const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 20);
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
    if (knowledgeChunks.length === 0) {
        return { chunks: [], confidence: 0 };
    }
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

        const titleMatch = chunk.text.match(/^\[(.+?)\]/);
        if (titleMatch) {
            const titleWords = tokenize(titleMatch[1]);
            for (const w of qWords) {
                if (titleWords.includes(w)) score += 4;
            }
        }
        return { chunk, score };
    });

    const filtered = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    const chunks = filtered.map(s => s.chunk);
    const topScore = filtered.length > 0 ? filtered[0].score : 0;

    let confidence = 0;
    if (topScore >= 15) confidence = 100;
    else if (topScore >= 8) confidence = 60;
    else if (topScore > 0) confidence = 30;

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
        for (const w of qWords) {
            if (titleWords.includes(w)) score += 1;
        }
        return { topic: t, score };
    });

    const relevant = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    if (relevant.length >= 3) {
        return relevant.slice(0, limit).map(s => s.topic);
    }

    const shuffled = [...availableTopics].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
}

// ============================================================
// MIDDLEWARE
// ============================================================

// Blokir akses file sensitif
app.use((req, res, next) => {
    const blocked = ['.env', 'keys.json', 'config.json', 'package.json', 'package-lock.json'];
    const p = req.path.toLowerCase();
    if (blocked.some(f => p.includes(f))) return res.status(404).end();
    if (p.startsWith('/knowledge/') || p.startsWith('/tmp/') || p.startsWith('/node_modules/')) {
        return res.status(404).end();
    }
    next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Rate limits
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Terlalu banyak request. Coba lagi nanti.' }
}));

app.use('/api/chat', rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'Pelan dong, tunggu bentar ya.' }
}));

app.use('/api/admin/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.' }
}));

// Log akses
app.use((req, res, next) => {
    const time = new Date().toISOString();
    res.on('finish', () => {
        if (req.path.startsWith('/api/')) {
            console.log(`[${time}] ${req.ip} ${req.method} ${req.path} → ${res.statusCode}`);
        }
    });
    next();
});

// Static files
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
        quickButtons: CONFIG.quickButtons
    });
});

// ============================================================
// LOGIN
// ============================================================
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password ||
        typeof username !== 'string' || typeof password !== 'string' ||
        username.length > 50 || password.length > 100) {
        return res.status(400).json({ success: false, message: 'Input tidak valid' });
    }

    const okUser = username === ADMIN_USERNAME;
    const okPass = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);

    if (!okUser || !okPass) {
        console.warn(`[AUTH] Login gagal: ${username} dari ${req.ip}`);
        return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const token = jwt.sign(
        { username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    });

    console.log(`[AUTH] Login sukses: ${username} dari ${req.ip}`);
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
            ? fs.readdirSync(PATHS.knowledge).filter(f => f.endsWith('.txt')).map(f => {
                const s = fs.statSync(path.join(PATHS.knowledge, f));
                return { name: f, size: s.size, modified: s.mtime };
            })
            : [],
        knowledgeChunks: knowledgeChunks.length,
        availableTopics: availableTopics.length
    });
});

app.post('/api/admin/config', authAdmin, (req, res) => {
    try {
        const allowed = [
            'aiName', 'tagline', 'logoUrl', 'logoText', 'welcomeMessage',
            'systemInstruction', 'models', 'generationConfig',
            'contactInfo', 'quickButtons'
        ];
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

// ============================================================
// GANTI PASSWORD
// ============================================================
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

    console.log('[SECURITY] Password admin diganti. Restart server untuk efek penuh.');
    res.json({ success: true, message: 'Password diganti. Restart server untuk efek penuh.' });
});

// ============================================================
// API KEYS
// ============================================================
app.post('/api/admin/keys/add', authAdmin, (req, res) => {
    const { key } = req.body;
    if (!key || typeof key !== 'string' || key.length < 10 || key.length > 200) {
        return res.json({ success: false, message: 'API key tidak valid' });
    }
    const keys = loadKeys();
    if (keys.includes(key.trim())) {
        return res.json({ success: false, message: 'API key sudah ada' });
    }
    keys.push(key.trim());
    saveKeys(keys);
    rebuildClients();
    console.log(`[ADMIN] API key ditambahkan. Total: ${keys.length}`);
    res.json({ success: true, total: keys.length });
});

app.post('/api/admin/keys/remove', authAdmin, (req, res) => {
    const { index } = req.body;
    const keys = loadKeys();
    if (index < 0 || index >= keys.length) {
        return res.json({ success: false, message: 'Index tidak valid' });
    }
    keys.splice(index, 1);
    saveKeys(keys);
    rebuildClients();
    res.json({ success: true, total: keys.length });
});

app.post('/api/admin/keys/test', authAdmin, async (req, res) => {
    const { index } = req.body;
    const keys = loadKeys();
    if (index < 0 || index >= keys.length) {
        return res.json({ success: false, message: 'Index tidak valid' });
    }
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
        if (!file.originalname.toLowerCase().endsWith('.txt')) {
            return cb(new Error('Hanya file .txt'));
        }
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
// CHAT
// ============================================================
async function* streamGemini(contents) {
    let lastError = null;
    const models = CONFIG.models?.length ? CONFIG.models : ['gemini-flash-latest'];

    for (const model of models) {
        for (let k = 0; k < clients.length; k++) {
            try {
                const stream = await clients[k].models.generateContentStream({
                    model,
                    contents,
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
    const { conversation } = req.body;

    if (!Array.isArray(conversation) || conversation.length === 0 || conversation.length > 15) {
        return res.status(400).json({ error: 'Format tidak valid' });
    }

    const last = conversation[conversation.length - 1];
    if (!last || typeof last.text !== 'string' || last.text.trim().length === 0) {
        return res.status(400).json({ error: 'Pesan kosong' });
    }
    if (last.text.length > 2000) {
        return res.status(400).json({ error: 'Pesan maksimal 2000 karakter' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);

    try {
        if (clients.length === 0) {
            send({ error: 'Belum ada API key. Hubungi admin.' });
            return res.end();
        }

        const userText = last.text;
        const searchResult = searchKnowledge(userText, 6);
        const relevant = searchResult.chunks;
        const confidence = searchResult.confidence;
        let ctx = '';

        // Kirim saran kalau tidak yakin
        if (relevant.length === 0 || confidence < 50) {
            const suggestions = getSuggestedTopics(8, userText);
            send({ needSuggestions: true, suggestions: suggestions.map(t => t.title) });
            console.log(`[RAG] RENDAH (${confidence}) - kirim ${suggestions.length} saran`);
        }

        if (relevant.length > 0) {
            ctx = '=== KONTEKS ===\n' +
                  relevant.map((c, i) => `[${i + 1}]\n${c.text}`).join('\n\n') +
                  '\n=== AKHIR ===\n\n';
            console.log(`[RAG] OK - ${relevant.length} chunk (confidence ${confidence}): "${userText.slice(0, 50)}"`);
        } else {
            console.log(`[RAG] KOSONG: "${userText.slice(0, 50)}"`);
        }

        const contents = conversation.map(({ role, text }) => ({
            role: role === 'bot' ? 'model' : role,
            parts: [{ text: text || '' }]
        }));

        const lastUser = contents.map(c => c.role).lastIndexOf('user');
        if (lastUser !== -1) {
            const orig = contents[lastUser].parts[0].text || '';
            contents[lastUser].parts[0].text = (ctx || '') + 'Pertanyaan: ' + orig;
        }

        let ok = false;
        try {
            for await (const ev of streamGemini(contents)) {
                send({ meta: { model: ev.model, key: ev.key, context: relevant.length, confidence } });
                for await (const chunk of ev.stream) {
                    if (chunk?.text) send({ delta: chunk.text });
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

        send({ done: true });
        res.end();
    } catch (e) {
        console.error('Chat error: ' + e.message);
        send({ error: 'Terjadi kesalahan.' });
        res.end();
    }
});

// ============================================================
// ENDPOINT: daftar semua topik (untuk halaman "semua topik")
// ============================================================
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
    console.log(`Mode           : ${process.env.NODE_ENV || 'development'}`);
    console.log('============================================');
    loadKnowledge();
    console.log('');
});