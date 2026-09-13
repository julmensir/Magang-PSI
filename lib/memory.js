// ============================================================
// MEMORY SYSTEM — DIPERBAIKI
// - Threshold lebih tinggi (anti-jawaban ngaco)
// - Session isolation (memori per-sesi, bukan global)
// - Validasi topik sebelum menjawab dari memori
// ============================================================

// Sinonim bahasa Indonesia
const SYNONYMS = {
    'bikin': 'buat', 'membuat': 'buat', 'bikinin': 'buat', 'buatkan': 'buat',
    'gimana': 'bagaimana', 'caranya': 'cara', 'gmn': 'bagaimana',
    'syrat': 'syarat', 'syaratnya': 'syarat', 'persyaratan': 'syarat',
    'ilang': 'hilang', 'kehilangan': 'hilang', 'raib': 'hilang',
    'sobek': 'rusak',
    'ktpel': 'ktp', 'miskin': 'tidak mampu', 'akte': 'akta',
    'srt': 'surat', 'suratnya': 'surat',
    'waktu': 'jam', 'pukul': 'jam',
    'lokasi': 'alamat', 'tempat': 'alamat',
    'telp': 'telepon', 'tlp': 'telepon', 'kontak': 'telepon',
    'wa': 'whatsapp',
    'harga': 'biaya', 'bayar': 'biaya', 'tarif': 'biaya',
    'free': 'gratis', 'daring': 'online'
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

export function normalizeWord(w) {
    let word = w.toLowerCase().trim();
    if (SYNONYMS[word]) word = SYNONYMS[word];
    return word;
}

export function stemID(word) {
    let w = word;
    w = w.replace(/^(memper|diper|me|di|ter|ber|pe|se)/, '');
    w = w.replace(/(kan|lah|nya|kah|pun|ku|mu)$/, '');
    return w.length > 2 ? w : word;
}

export function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .map(normalizeWord)
        .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

export function makeBigrams(words) {
    const bigrams = [];
    for (let i = 0; i < words.length - 1; i++) {
        bigrams.push(words[i] + ' ' + words[i + 1]);
    }
    return bigrams;
}

// ============================================================
// CARI DI MEMORI
// ============================================================
export function memorySearch(question, memoryItems, minScore = 40) {
    if (!memoryItems || memoryItems.length === 0) {
        return { item: null, score: 0, isConfident: false };
    }

    const qWords = tokenize(question);
    if (qWords.length === 0) {
        return { item: null, score: 0, isConfident: false };
    }

    const qStems = qWords.map(stemID);
    const qBigrams = makeBigrams(qWords);

    let best = null;
    let bestScore = 0;

    for (const m of memoryItems) {
        const allText = [m.question, ...(m.variants || []), ...(m.keywords || [])].join(' ');
        const tokens = tokenize(allText);
        const tokenSet = new Set(tokens);
        const stemSet = new Set(tokens.map(stemID));
        const bigramSet = new Set(makeBigrams(tokens));

        let score = 0;
        for (const w of qWords) if (tokenSet.has(w)) score += 4;
        for (const s of qStems) if (stemSet.has(s)) score += 3;
        for (const bg of qBigrams) if (bigramSet.has(bg)) score += 10;

        // Bonus kecil untuk hit (max 5, bukan 10)
        score += Math.min(m.hit || 0, 5);

        if (score > bestScore) {
            bestScore = score;
            best = m;
        }
    }

    return {
        item: best,
        score: bestScore,
        isConfident: bestScore >= minScore
    };
}

// ============================================================
// SIMPAN KE MEMORI
// ============================================================
export function memoryAdd(question, answer, memoryItems, saveThreshold = 30) {
    if (!answer || answer.length < 30) return false;
    if (/belum ada di buku|belum yakin|tidak tahu|tidak ada info/i.test(answer)) {
        return false;
    }

    const qNorm = question.toLowerCase().trim();
    const existing = memorySearch(question, memoryItems, saveThreshold);

    if (existing.item && existing.isConfident) {
        // Sudah ada — tambah hit + variasi
        existing.item.hit = (existing.item.hit || 0) + 1;
        if (!existing.item.variants) existing.item.variants = [];
        if (!existing.item.variants.includes(qNorm) && existing.item.question.toLowerCase() !== qNorm) {
            existing.item.variants.push(qNorm);
        }
        return { added: false, updated: true };
    }

    const title = question.length > 60 ? question.slice(0, 57) + '...' : question;
    memoryItems.push({
        timestamp: new Date().toISOString(),
        title,
        question: qNorm,
        variants: [],
        answer: answer.slice(0, 1500),
        hit: 1,
        keywords: tokenize(question).slice(0, 10)
    });
    return { added: true, updated: false };
}

// ============================================================
// VALIDASI — apakah jawaban dari memori masih relevan?
// ============================================================
export function validateMemoryRelevance(question, memoryItem) {
    if (!memoryItem) return false;

    const qWords = tokenize(question);
    const qStems = qWords.map(stemID);
    const qBigrams = makeBigrams(qWords);

    const memTokens = tokenize(memoryItem.question);
    const memTokenSet = new Set(memTokens);
    const memStemSet = new Set(memTokens.map(stemID));
    const memBigramSet = new Set(makeBigrams(memTokens));

    let matchCount = 0;
    for (const w of qWords) if (memTokenSet.has(w)) matchCount++;
    for (const s of qStems) if (memStemSet.has(s)) matchCount += 0.5;

    // Minimal 40% kata kunci user harus cocok
    const minRequired = Math.max(2, qWords.length * 0.4);
    return matchCount >= minRequired;
}