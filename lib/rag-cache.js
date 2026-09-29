// ============================================================
// RAG SMART CACHE
// Cache hasil pencarian RAG untuk pertanyaan yang mirip
// TTL pendek (1 jam) — untuk pertanyaan populer
// ============================================================

import crypto from 'crypto';

const DEFAULT_TTL = 60 * 60 * 1000; // 1 jam
const MAX_ENTRIES = 500;

function normalizeQuery(q) {
    return String(q || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function hashQuery(q) {
    const norm = normalizeQuery(q);
    return crypto.createHash('md5').update(norm).digest('hex').slice(0, 12);
}

export class RAGCache {
    constructor(options = {}) {
        this.ttl = options.ttl || DEFAULT_TTL;
        this.maxEntries = options.maxEntries || MAX_ENTRIES;
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };

        // Cleanup timer
        this._cleanupTimer = setInterval(() => this._cleanup(), 10 * 60 * 1000);
        if (this._cleanupTimer.unref) this._cleanupTimer.unref();
    }

    get(query) {
        const key = hashQuery(query);
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        return entry.data;
    }

    set(query, data) {
        const key = hashQuery(query);

        // Evict kalau penuh
        if (this.cache.size >= this.maxEntries) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
            this.stats.evictions++;
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    _cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(`[RAG-CACHE] Cleaned ${cleaned} expired entries`);
        }
    }

    clear() {
        this.cache.clear();
    }

    getStats() {
        return {
            size: this.cache.size,
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            hitRate: this.stats.hits + this.stats.misses > 0
                ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%'
                : '0%'
        };
    }
}