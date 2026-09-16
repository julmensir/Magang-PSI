// ============================================================
// CLASSIFIER — Deteksi apakah pertanyaan bisa dijawab atau tidak
// ============================================================
import { tokenize, stemID, makeBigrams } from './memory.js';

// Kata kunci yang menunjukkan pertanyaan "di luar topik"
const OUT_OF_SCOPE_KEYWORDS = [
    'politik', 'presiden', 'pemilu', 'partai',
    'cuaca', 'ramalan', 'zodiak', 'horoskop',
    'saham', 'crypto', 'bitcoin', 'trading',
    'jodoh', 'mantan', 'pacar',
    'game', 'ml', 'pubg', 'free fire',
    'film', 'artis', 'selebgram',
    'resep', 'masak', 'kue',
    'obat', 'penyakit', 'dokter',
    'hukum pidana', 'pengacara', 'sidang',
    'pajak motor', 'pajak mobil',
    'sim', 'stnk', 'bpkb'
];

// Kata kunci yang menunjukkan pertanyaan MASIH relevan dengan Kemantren
const IN_SCOPE_KEYWORDS = [
    'ktp', 'kk', 'kartu keluarga', 'akta', 'akte',
    'kelahiran', 'kematian', 'pernikahan', 'nikah',
    'pindah', 'domisili', 'usaha', 'umkm',
    'surat', 'keterangan', 'pengantar',
    'kemantren', 'tegalrejo', 'kelurahan', 'kecamatan',
    'layanan', 'administrasi', 'berkas', 'syarat',
    'biaya', 'gratis', 'jam', 'buka', 'tutup',
    'alamat', 'kontak', 'telepon', 'whatsapp',
    'formulir', 'pendaftaran', 'pengajuan',
    'ijin', 'izin', 'keramaian', 'bangunan',
    'pbb', 'tanah', 'sertifikat',
    'nikah', 'cerai', 'nikah siri',
    'kia', 'kartu identitas anak',
    'skck', 'catatan kepolisian'
];

/**
 * Cek apakah pertanyaan relevan dengan topik Kemantren
 * @returns {Object} { relevant: boolean, confidence: number, reason: string }
 */
export function classifyQuestion(question, knowledgeChunks) {
    const qLower = question.toLowerCase();
    const qWords = tokenize(question);

    // 1. Cek keyword OUT OF SCOPE
    for (const kw of OUT_OF_SCOPE_KEYWORDS) {
        if (qLower.includes(kw)) {
            // Kecuali kalau ada juga keyword in-scope
            const hasInScope = IN_SCOPE_KEYWORDS.some(k => qLower.includes(k));
            if (!hasInScope) {
                return {
                    relevant: false,
                    confidence: 0,
                    reason: `Pertanyaan tentang "${kw}" di luar topik Kemantren Tegalrejo`,
                    action: 'redirect'
                };
            }
        }
    }

    // 2. Cek keyword IN SCOPE
    let inScopeMatches = 0;
    for (const kw of IN_SCOPE_KEYWORDS) {
        if (qLower.includes(kw)) inScopeMatches++;
    }

    // 3. Cek kecocokan dengan knowledge chunks
    let knowledgeMatch = 0;
    if (knowledgeChunks && knowledgeChunks.length > 0) {
        const qStems = qWords.map(stemID);
        const qBigrams = makeBigrams(qWords);

        for (const chunk of knowledgeChunks) {
            if (!chunk._index) continue;
            const idx = chunk._index;

            let score = 0;
            for (const w of qWords) if (idx.words.has(w)) score += 1;
            for (const s of qStems) if (idx.stems.has(s)) score += 0.5;
            for (const bg of qBigrams) if (idx.bigrams.has(bg)) score += 2;

            if (score >= 2) knowledgeMatch++;
        }
    }

    // 4. Keputusan akhir
    if (inScopeMatches > 0) {
        return {
            relevant: true,
            confidence: Math.min(100, 50 + inScopeMatches * 15),
            reason: `Topik Kemantren (${inScopeMatches} kata kunci cocok)`,
            action: 'proceed'
        };
    }

    if (knowledgeMatch > 0) {
        return {
            relevant: true,
            confidence: Math.min(100, 30 + knowledgeMatch * 20),
            reason: `Ada ${knowledgeMatch} chunk pengetahuan yang cocok`,
            action: 'proceed'
        };
    }

    // Default: tidak yakin → tetap coba RAG, tapi dengan warning
    return {
        relevant: true,
        confidence: 20,
        reason: 'Tidak ada kata kunci spesifik, coba RAG',
        action: 'proceed_with_caution'
    };
}

/**
 * Generate redirect message untuk pertanyaan out-of-scope
 */
export function generateRedirectMessage(reason, aiName = 'SIVT AI') {
    return `Wah, pertanyaan itu kayaknya di luar tugas saya deh 😊

Saya ${aiName} cuma bisa bantu soal layanan administrasi Kemantren Tegalrejo, seperti:
• KTP, KK, Akta Kelahiran, Akta Kematian
• Surat Keterangan, Surat Pengantar
• Izin Usaha, Izin Keramaian
• Pindah Domisili, dll.

Untuk pertanyaan tentang ${reason.split('"')[1] || 'hal lain'}, coba tanya yang lebih ahli ya. Kalau ada pertanyaan seputar layanan Kemantren, saya siap bantu! 🙏`;
}