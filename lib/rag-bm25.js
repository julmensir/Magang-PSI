// ============================================================
// RAG LAYER 1: BM25 SEARCH
// Implementasi BM25 (Best Match 25) untuk pencarian keyword
// Lebih akurat dari TF-IDF sederhana
// ============================================================

import { tokenize, stemID } from './memory.js';

const K1 = 1.5;  // BM25 parameter: k1 (term frequency saturation)
const B = 0.75;  // BM25 parameter: b (length normalization)

/**
 * Bangun index BM25 dari knowledge chunks
 */
export function buildBM25Index(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) {
        return { docs: [], avgdl: 0, df: new Map(), N: 0 };
    }

    const docs = [];
    const df = new Map(); // document frequency per term
    let totalLen = 0;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const rawTokens = tokenize(chunk.text);
        const tokens = rawTokens.map(stemID);

        // Term frequency (TF)
        const tf = new Map();
        for (const t of tokens) {
            tf.set(t, (tf.get(t) || 0) + 1);
        }

        // Update document frequency (DF)
        for (const t of tf.keys()) {
            df.set(t, (df.get(t) || 0) + 1);
        }

        docs.push({
            chunkIndex: i,
            tokens,
            tf,
            len: tokens.length
        });

        totalLen += tokens.length;
    }

    const avgdl = totalLen / docs.length;

    return {
        docs,
        avgdl,
        df,
        N: docs.length,
        chunks
    };
}

/**
 * Hitung skor BM25 untuk 1 query terhadap 1 dokumen
 */
function bm25Score(queryTerms, doc, df, N, avgdl) {
    let score = 0;

    for (const term of queryTerms) {
        const tf = doc.tf.get(term);
        if (!tf) continue; // term tidak ada di dokumen

        const docFreq = df.get(term) || 0;
        if (docFreq === 0) continue;

        // IDF (Inverse Document Frequency)
        const idf = Math.log(1 + (N - docFreq + 0.5) / (docFreq + 0.5));

        // TF normalization
        const tfNorm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (doc.len / avgdl)));

        score += idf * tfNorm;
    }

    return score;
}

/**
 * Cari chunk teratas dengan BM25
 * @param {String} query - Pertanyaan user
 * @param {Object} index - Index BM25 (dari buildBM25Index)
 * @param {Number} topK - Jumlah hasil
 * @returns {Array} - Array { chunk, score, chunkIndex }
 */
export function bm25Search(query, index, topK = 15) {
    if (!index || !index.docs || index.docs.length === 0) return [];

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryTerms = [...new Set(queryTokens.map(stemID))];

    const scored = [];
    for (const doc of index.docs) {
        const score = bm25Score(queryTerms, doc, index.df, index.N, index.avgdl);
        if (score > 0) {
            scored.push({
                chunk: index.chunks[doc.chunkIndex],
                score,
                chunkIndex: doc.chunkIndex
            });
        }
    }

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}