// ============================================================
// RAG LAYER 2: SEMANTIC SEARCH (Embedding)
// Ubah teks menjadi vector menggunakan provider embedding
// Cache embedding di JSON untuk hemat API call
// ============================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const EMBEDDING_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 hari

/**
 * Cosine similarity antara 2 vector
 */
function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * Hash teks untuk cache key
 */
function hashText(text) {
    return crypto.createHash('sha256').update(String(text)).digest('hex').slice(0, 16);
}

// ============================================================
// CLASS: EMBEDDING ENGINE
// ============================================================
export class EmbeddingEngine {
    constructor(options = {}) {
        this.cachePath = options.cachePath || null;
        this.cache = new Map();      // textHash → { vector, timestamp }
        this.chunks = [];             // knowledge chunks
        this.chunkVectors = [];       // parallel array of vectors
        this.dirty = false;
        this.stats = {
            hits: 0,
            misses: 0,
            apiCalls: 0,
            lastSaveAt: null
        };

        this._loadCache();

        // Auto-save cache
        if (this.cachePath) {
            this._saveTimer = setInterval(() => this._autoSave(), 5 * 60 * 1000);
            if (this._saveTimer.unref) this._saveTimer.unref();
        }
    }

    // ============================================================
    // CACHE MANAGEMENT
    // ============================================================
    _loadCache() {
        if (!this.cachePath || !fs.existsSync(this.cachePath)) return;
        try {
            const raw = fs.readFileSync(this.cachePath, 'utf-8');
            const data = JSON.parse(raw);
            const now = Date.now();

            for (const [key, item] of Object.entries(data.entries || {})) {
                if (item.timestamp && (now - item.timestamp) < EMBEDDING_CACHE_TTL) {
                    this.cache.set(key, item);
                }
            }

            console.log(`[EMBEDDING] Cache loaded: ${this.cache.size} entries`);
        } catch (err) {
            console.warn('[EMBEDDING] Gagal load cache:', err.message);
        }
    }

    _saveCache() {
        if (!this.cachePath) return false;
        try {
            const entries = {};
            for (const [key, item] of this.cache.entries()) {
                entries[key] = item;
            }

            const data = {
                version: 1,
                savedAt: new Date().toISOString(),
                entries
            };

            const tmpPath = this.cachePath + '.tmp';
            fs.writeFileSync(tmpPath, JSON.stringify(data), 'utf-8');
            fs.renameSync(tmpPath, this.cachePath);

            this.dirty = false;
            this.stats.lastSaveAt = new Date().toISOString();
            return true;
        } catch (err) {
            console.error('[EMBEDDING] Gagal save cache:', err.message);
            return false;
        }
    }

    _autoSave() {
        if (this.dirty) this._saveCache();
    }

    // ============================================================
    // EMBED SINGLE TEXT
    // ============================================================
    async embedText(text, embeddingCall) {
        if (!text || text.length === 0) return null;

        const key = hashText(text);
        const cached = this.cache.get(key);

        if (cached && cached.vector) {
            this.stats.hits++;
            return cached.vector;
        }

        this.stats.misses++;

        try {
            this.stats.apiCalls++;
            const vector = await embeddingCall(text);

            if (Array.isArray(vector) && vector.length > 0) {
                this.cache.set(key, {
                    vector,
                    timestamp: Date.now()
                });
                this.dirty = true;
                return vector;
            }
            return null;
        } catch (err) {
            console.warn('[EMBEDDING] Gagal embed:', err.message);
            return null;
        }
    }

    // ============================================================
    // BUILD INDEX — Embed semua chunk
    // ============================================================
    async buildIndex(chunks, embeddingCall, options = {}) {
        const onProgress = options.onProgress || (() => {});
        const maxChunks = options.maxChunks || chunks.length;

        this.chunks = chunks.slice(0, maxChunks);
        this.chunkVectors = new Array(this.chunks.length).fill(null);

        console.log(`[EMBEDDING] Building index for ${this.chunks.length} chunks...`);

        let done = 0;
        let failed = 0;

        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];
            try {
                const vector = await this.embedText(chunk.text, embeddingCall);
                this.chunkVectors[i] = vector;
                if (!vector) failed++;
            } catch (err) {
                failed++;
            }

            done++;
            if (done % 20 === 0 || done === this.chunks.length) {
                onProgress(done, this.chunks.length);
            }

            // Jeda kecil biar tidak kena rate limit
            await new Promise(r => setTimeout(r, 100));
        }

        // Save cache setelah build
        this._saveCache();

        const success = this.chunkVectors.filter(v => v).length;
        console.log(`[EMBEDDING] Index built: ${success}/${this.chunks.length} chunks (${failed} failed)`);

        return { success, failed, total: this.chunks.length };
    }

    // ============================================================
    // SEARCH — Semantic search
    // ============================================================
    async semanticSearch(query, embeddingCall, topK = 15) {
        if (this.chunks.length === 0 || this.chunkVectors.length === 0) return [];

        const queryVector = await this.embedText(query, embeddingCall);
        if (!queryVector) return [];

        const scored = [];
        for (let i = 0; i < this.chunkVectors.length; i++) {
            const vec = this.chunkVectors[i];
            if (!vec) continue;

            const score = cosineSimilarity(queryVector, vec);
            scored.push({
                chunk: this.chunks[i],
                score,
                chunkIndex: i
            });
        }

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    // ============================================================
    // STATS
    // ============================================================
    getStats() {
        return {
            cacheSize: this.cache.size,
            cacheHits: this.stats.hits,
            cacheMisses: this.stats.misses,
            apiCalls: this.stats.apiCalls,
            indexedChunks: this.chunkVectors.filter(v => v).length,
            totalChunks: this.chunks.length,
            lastSaveAt: this.stats.lastSaveAt
        };
    }

    isReady() {
        return this.chunkVectors.length > 0 &&
               this.chunkVectors.some(v => v !== null);
    }
}

export { cosineSimilarity, hashText };