// ============================================================
// RAG HYBRID — Gabungan BM25 + Semantic + RRF Fusion
// + Query Rewriting untuk akurasi lebih tinggi
// ============================================================

import { bm25Search } from './rag-bm25.js';
import { RAGCache } from './rag-cache.js';

// ============================================================
// QUERY REWRITING
// Ubah pertanyaan user jadi lebih searchable
// ============================================================
const REWRITE_PROMPT = `Kamu adalah AI yang bertugas mengubah pertanyaan user menjadi kata kunci pencarian yang efektif untuk sistem RAG.

Tugas: Ubah pertanyaan user menjadi 3-5 kata kunci/frasa kunci yang paling relevan untuk pencarian dokumen.

ATURAN:
- Output HANYA kata kunci, dipisah koma
- JANGAN pakai penjelasan, tanda kutip, atau kalimat lengkap
- Fokus pada: nama dokumen, jenis layanan, kata kunci penting
- Hilangkan kata tanya (apa, bagaimana, kapan, di mana)
- Pertahankan singkatan umum (KTP, KK, akta, dll)
- Maksimal 5 kata kunci

CONTOH:
Input: "cara bikin KTP yang ilang gimana ya?"
Output: syarat KTP hilang, prosedur KTP hilang, dokumen penggantian

Input: "jam buka kantor hari sabtu?"
Output: jam buka sabtu, jam pelayanan, jam operasional

Input: "syarat membuat KK baru setelah menikah"
Output: syarat KK baru, KK pengantin baru, dokumen KK

PERTANYAAN USER:
"""{{QUERY}}"""

OUTPUT:`;

/**
 * Rewrite query pakai LLM kecil untuk hasil RAG lebih akurat
 */
export async function rewriteQuery(query, llmCall) {
    if (!query || query.length < 5) return query;

    try {
        const prompt = REWRITE_PROMPT.replace('{{QUERY}}', query);

        const response = await llmCall({
            systemPrompt: 'Output HANYA kata kunci dipisah koma. Tidak ada penjelasan.',
            conversation: [{ role: 'user', text: prompt }]
        });

        const rawText = typeof response === 'string' ? response : response.text;
        if (!rawText) return query;

        // Bersihkan output
        let cleaned = rawText.trim()
            .replace(/^```.*?\n/, '')
            .replace(/```$/, '')
            .replace(/^(output|hasil|jawaban)\s*:\s*/i, '')
            .replace(/["']/g, '')
            .split('\n')[0]
            .trim();

        // Kalau hasil rewrite terlalu pendek atau aneh, pakai query asli
        if (cleaned.length < 5 || cleaned.length > 200) return query;

        console.log(`[REWRITE] "${query.slice(0, 50)}" → "${cleaned.slice(0, 80)}"`);
        return cleaned;
    } catch (err) {
        console.warn('[REWRITE] Gagal rewrite:', err.message);
        return query;
    }
}

// ============================================================
// RRF FUSION (Reciprocal Rank Fusion)
// Gabungkan hasil dari beberapa sumber ranking
// ============================================================
const RRF_K = 60; // Konstanta RRF (standar industri)

/**
 * Gabungkan beberapa list ranked → 1 list terurut
 * @param {Array<Array>} rankedLists - Array of ranked list
 * @returns {Array} - Chunk terurut by RRF score
 */
export function rrfFusion(rankedLists) {
    const scoreMap = new Map(); // chunkKey → { chunk, score, sources: Set }
    const chunkByKey = new Map();

    for (let listIdx = 0; listIdx < rankedLists.length; listIdx++) {
        const list = rankedLists[listIdx];
        if (!Array.isArray(list)) continue;

        for (let rank = 0; rank < list.length; rank++) {
            const item = list[rank];
            if (!item || !item.chunk) continue;

            // Key unik per chunk (pakai source + snippet text)
            const key = `${item.chunk.source}::${item.chunk.text.slice(0, 80)}`;
            chunkByKey.set(key, item.chunk);

            if (!scoreMap.has(key)) {
                scoreMap.set(key, {
                    chunk: item.chunk,
                    score: 0,
                    sources: new Set(),
                    bm25Score: 0,
                    semanticScore: 0,
                    bm25Rank: null,
                    semanticRank: null
                });
            }

            const entry = scoreMap.get(key);
            const rrfScore = 1 / (RRF_K + rank + 1);
            entry.score += rrfScore;
            entry.sources.add(listIdx);

            if (listIdx === 0) {
                entry.bm25Score = item.score;
                entry.bm25Rank = rank;
            } else if (listIdx === 1) {
                entry.semanticScore = item.score;
                entry.semanticRank = rank;
            }
        }
    }

    return [...scoreMap.values()]
        .sort((a, b) => b.score - a.score)
        .map(e => ({
            chunk: e.chunk,
            rrfScore: e.score,
            bm25Score: e.bm25Score,
            semanticScore: e.semanticScore,
            bm25Rank: e.bm25Rank,
            semanticRank: e.semanticRank,
            sources: e.sources.size
        }));
}

// ============================================================
// HYBRID RAG SEARCH
// ============================================================
export class HybridRAG {
    constructor(options = {}) {
        this.bm25Index = null;
        this.embeddingEngine = options.embeddingEngine || null;
        this.cache = new RAGCache({ ttl: options.cacheTtl || 60 * 60 * 1000 });
        this.rewriteEnabled = options.rewriteEnabled !== false;
        this.stats = {
            totalQueries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            rewrites: 0
        };
    }

    /**
     * Build index (BM25 + Embedding)
     */
    async buildIndex(chunks, options = {}) {
        const { buildBM25Index } = await import('./rag-bm25.js');
        this.bm25Index = buildBM25Index(chunks);
        console.log(`[HYBRID-RAG] BM25 index built: ${this.bm25Index.docs.length} docs`);

        // Build embedding index kalau ada engine + embedding call
        if (this.embeddingEngine && options.embeddingCall) {
            try {
                await this.embeddingEngine.buildIndex(chunks, options.embeddingCall, {
                    onProgress: options.onProgress
                });
            } catch (err) {
                console.warn('[HYBRID-RAG] Embedding index gagal:', err.message);
            }
        }
    }

    /**
     * Search hybrid
     * @param {String} query - Pertanyaan user
     * @param {Object} options - { topK, embeddingCall, llmCall, useCache }
     * @returns {Promise<Object>} - { chunks, debug }
     */
    async search(query, options = {}) {
        const topK = options.topK || 6;
        const embeddingCall = options.embeddingCall;
        const llmCall = options.llmCall;
        const useCache = options.useCache !== false;

        this.stats.totalQueries++;

        // 1. Cek cache dulu
        if (useCache) {
            const cached = this.cache.get(query);
            if (cached) {
                this.stats.cacheHits++;
                console.log(`[HYBRID-RAG] Cache HIT for "${query.slice(0, 50)}"`);
                return {
                    chunks: cached.chunks,
                    debug: { ...cached.debug, fromCache: true }
                };
            }
            this.stats.cacheMisses++;
        }

        // 2. Query Rewriting (opsional)
        let searchQuery = query;
        if (this.rewriteEnabled && llmCall) {
            try {
                const rewritten = await rewriteQuery(query, llmCall);
                if (rewritten !== query) {
                    searchQuery = rewritten;
                    this.stats.rewrites++;
                }
            } catch (err) {
                console.warn('[HYBRID-RAG] Rewrite gagal:', err.message);
            }
        }

        // 3. BM25 Search
        let bm25Results = [];
        if (this.bm25Index) {
            bm25Results = bm25Search(searchQuery, this.bm25Index, 15);
        }

        // 4. Semantic Search
        let semanticResults = [];
        if (this.embeddingEngine && this.embeddingEngine.isReady() && embeddingCall) {
            try {
                semanticResults = await this.embeddingEngine.semanticSearch(
                    searchQuery,
                    embeddingCall,
                    15
                );
            } catch (err) {
                console.warn('[HYBRID-RAG] Semantic search gagal:', err.message);
            }
        }

        // 5. RRF Fusion
        const fused = rrfFusion([bm25Results, semanticResults]);
        const topChunks = fused.slice(0, topK).map(f => f.chunk);

        // Hitung confidence (0-100)
        let confidence = 0;
        if (fused.length > 0) {
            const topScore = fused[0].rrfScore;
            if (topScore >= 0.03) confidence = 100;
            else if (topScore >= 0.02) confidence = 70;
            else if (topScore >= 0.015) confidence = 40;
            else if (topScore > 0) confidence = 20;
        }

        const debug = {
            bm25Count: bm25Results.length,
            semanticCount: semanticResults.length,
            fusedCount: fused.length,
            topRRFScore: fused[0]?.rrfScore || 0,
            rewrittenQuery: searchQuery !== query ? searchQuery : null,
            fromCache: false,
            confidence
        };

        console.log(`[HYBRID-RAG] "${query.slice(0, 40)}" → BM25:${bm25Results.length} Semantic:${semanticResults.length} Fused:${fused.length} Conf:${confidence}`);

        // 6. Simpan ke cache
        if (useCache && topChunks.length > 0) {
            this.cache.set(query, { chunks: topChunks, debug });
        }

        return { chunks: topChunks, debug };
    }

    getStats() {
        return {
            ...this.stats,
            cache: this.cache.getStats(),
            embedding: this.embeddingEngine ? this.embeddingEngine.getStats() : null,
            bm25Docs: this.bm25Index ? this.bm25Index.docs.length : 0,
            rewriteEnabled: this.rewriteEnabled
        };
    }
}