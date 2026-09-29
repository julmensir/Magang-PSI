// ============================================================
// MEMORY SYSTEM — VERSI AKURAT & ANTI-TERPOTONG
// - Threshold dinaikkan (60) supaya memori tidak salah jawab
// - Wajib jawaban lengkap (min 50 char, tidak diakhiri ":")
// - Validasi relevansi lebih ketat (80% cocok + kata kunci utama)
// ============================================================

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
    'free': 'gratis', 'daring': 'online',
    'urus': 'buat', 'ngurus': 'buat'
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
// SEARCH MEMORY — LEBIH AKURAT & KETAT
// ============================================================
export function memorySearch(question, memoryItems, minScore = 60) {
    if (!memoryItems || memoryItems.length === 0) {
        return { item: null, score: 0, isConfident: false };
    }

    const qWords = tokenize(question);
    if (qWords.length === 0) {
        return { item: null, score: 0, isConfident: false };
    }

    const qStems = qWords.map(stemID);
    const qBigrams = makeBigrams(qWords);
    const qNorm = question.toLowerCase().trim();

    let best = null;
    let bestScore = 0;

    for (const m of memoryItems) {
        const allText = [m.question, ...(m.variants || []), ...(m.keywords || [])].join(' ');
        const tokens = tokenize(allText);
        const tokenSet = new Set(tokens);
        const stemSet = new Set(tokens.map(stemID));
        const bigramSet = new Set(makeBigrams(tokens));

        let score = 0;
        for (const w of qWords) if (tokenSet.has(w)) score += 5;
        for (const s of qStems) if (stemSet.has(s)) score += 4;
        for (const bg of qBigrams) if (bigramSet.has(bg)) score += 15;

        // Bonus besar kalau pertanyaan IDENTIK / VARIASI PERSIS
        const mNorm = m.question.toLowerCase().trim();
        if (qNorm === mNorm) score += 50;
        else if (m.variants && m.variants.some(v => v.toLowerCase().trim() === qNorm)) score += 40;

        // Bonus hit
        score += Math.min(m.hit || 0, 3);

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
// ADD MEMORY — Jawaban WAJIB LENGKAP
// ============================================================
export function memoryAdd(question, answer, memoryItems, saveThreshold = 40) {
    // Wajib minimal 50 karakter
    if (!answer || answer.length < 50) return { added: false };

    // Jangan simpan jawaban yang menolak
    if (/belum ada di buku|belum yakin|tidak tahu|tidak ada info|di luar topik|di luar tugas|hubungi petugas langsung/i.test(answer)) {
        return { added: false };
    }

    // Jangan simpan jawaban yang masih terpotong (diakhiri titik dua)
    if (/:\s*$/.test(answer.trim())) {
        return { added: false };
    }

    // Jangan simpan jawaban yang diakhiri "..."
    if (/\.\.\.\s*$/.test(answer.trim())) {
        return { added: false };
    }

    const qNorm = question.toLowerCase().trim();
    const existing = memorySearch(question, memoryItems, saveThreshold);

    if (existing.item && existing.isConfident) {
        existing.item.hit = (existing.item.hit || 0) + 1;
        if (!existing.item.variants) existing.item.variants = [];
        if (!existing.item.variants.includes(qNorm) && existing.item.question.toLowerCase() !== qNorm) {
            existing.item.variants.push(qNorm);
            if (existing.item.variants.length > 10) {
                existing.item.variants = existing.item.variants.slice(-10);
            }
        }
        // Update jawaban kalau yang baru lebih lengkap
        if (answer.length > (existing.item.answer?.length || 0) + 20) {
            existing.item.answer = answer.slice(0, 3000);
        }
        return { added: false, updated: true };
    }

    const title = question.length > 60 ? question.slice(0, 57) + '...' : question;
    memoryItems.push({
        timestamp: new Date().toISOString(),
        title,
        question: qNorm,
        variants: [],
        answer: answer.slice(0, 3000),
        hit: 1,
        keywords: tokenize(question).slice(0, 10)
    });
    return { added: true, updated: false };
}

// ============================================================
// VALIDATE MEMORY RELEVANCE — SANGAT KETAT (v2)
// - Minimal 80% kata kunci user harus cocok (dari 60%)
// - WAJIB: kata kunci utama (terpanjang) harus ada di memory
// - Cegah kasus "KTP bukan Akte Nikah" cocok dengan memory "KTP hilang"
// ============================================================
export function validateMemoryRelevance(question, memoryItem) {
    if (!memoryItem) return false;

    const qWords = tokenize(question);
    if (qWords.length === 0) return false;

    const qStems = qWords.map(stemID);

    const memTokens = tokenize(memoryItem.question);
    const memVariantTokens = (memoryItem.variants || [])
        .flatMap(v => tokenize(v));
    const memKeywordTokens = (memoryItem.keywords || [])
        .flatMap(k => [k]);

    // Gabungkan semua token memory (pertanyaan + variasi + keywords)
    const allMemTokens = [...memTokens, ...memVariantTokens, ...memKeywordTokens];
    const memTokenSet = new Set(allMemTokens);
    const memStemSet = new Set(allMemTokens.map(stemID));

    // 1. Hitung match count
    let matchCount = 0;
    for (const w of qWords) if (memTokenSet.has(w)) matchCount++;
    for (const s of qStems) if (memStemSet.has(s)) matchCount += 0.5;

    // 2. PERKETAT: minimal 80% kata kunci user harus cocok
    const minRequired = Math.max(3, qWords.length * 0.8);
    if (matchCount < minRequired) return false;

    // 3. CEK KATA KUNCI UTAMA: kata terpanjang (>= 5 huruf) WAJIB ada di memory
    const qLongest = [...qWords].sort((a, b) => b.length - a.length)[0];
    if (qLongest && qLongest.length >= 5 && !memTokenSet.has(qLongest)) {
        return false;
    }

    // 4. Cek kontradiksi: jika user pakai kata "bukan", "salah", "bukan itu",
    //    pastikan bukan sekadar mengulang memory lama
    const qLower = question.toLowerCase();
    if (/(bukan|salah|bukan itu|keliru|tidak benar|beda)/i.test(qLower)) {
        // Untuk pertanyaan koreksi, wajib 100% match kata kunci
        const fullMatch = qWords.every(w => memTokenSet.has(w));
        if (!fullMatch) return false;
    }

    return true;
}