// ============================================================
// KNOWLEDGE GRAPH ENGINE — Otak Graph untuk SIVT AI
// - Ringan, cepat, in-memory, persisten
// - Ekstraksi entitas via NLP lokal (tanpa API)
// - Graph traversal untuk konteks RAG
// - Auto-save ke JSON, auto-load saat restart
// - Support semantic triples dari LLM
// - Support incremental update dari jawaban admin
// ============================================================

import fs from 'fs';
import path from 'path';
import Graph from 'graphology';
import compromise from 'compromise';

const MAX_NODES = 20000;
const MAX_EDGES = 60000;
const AUTO_SAVE_INTERVAL = 60000;
const MAX_NEIGHBORS_PER_QUERY = 30;

const STOP_ENTITIES = new Set([
    'hal', 'cara', 'orang', 'waktu', 'tempat', 'hari', 'tahun', 'bulan',
    'kata', 'bagian', 'nomor', 'surat', 'berkas', 'dokumen', 'pihak',
    'info', 'informasi', 'keterangan', 'catatan', 'penjelasan',
    'bantuan', 'help', 'syarat', 'ketentuan', 'aturan', 'prosedur',
    'proses', 'langkah', 'tahap', 'alur', 'hasil', 'akhir', 'awal',
    'bisa', 'tidak', 'ya', 'dan', 'atau', 'yang', 'untuk', 'dari',
    'ke', 'di', 'pada', 'dengan', 'adalah', 'akan', 'sudah', 'belum'
]);

class GraphEngine {
    constructor(options = {}) {
        this.graph = new Graph({ multi: false, type: 'undirected' });
        this.savePath = options.savePath || null;
        this.dirty = false;
        this.stats = {
            totalAdded: 0,
            lastSaveAt: null,
            loadTimeMs: 0
        };

        if (this.savePath) {
            this._autoSaveTimer = setInterval(() => this._autoSave(), AUTO_SAVE_INTERVAL);
            if (this._autoSaveTimer.unref) this._autoSaveTimer.unref();
        }
    }

    _normalize(text) {
        if (!text) return '';
        return String(text)
            .toLowerCase()
            .replace(/[^\w\s\-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _isValidEntity(entity) {
        if (!entity) return false;
        const e = this._normalize(entity);
        if (e.length < 3 || e.length > 60) return false;
        if (STOP_ENTITIES.has(e)) return false;
        if (/^\d+$/.test(e)) return false;
        return true;
    }

    _extractEntities(text) {
        if (!text || typeof text !== 'string') return [];
        try {
            const doc = compromise(text);
            const nouns = doc.nouns().out('array');
            const entities = [];
            for (const noun of nouns) {
                const normalized = this._normalize(noun);
                if (this._isValidEntity(normalized)) {
                    entities.push(normalized);
                }
            }
            return [...new Set(entities)];
        } catch (err) {
            console.warn('[GRAPH] Ekstraksi gagal:', err.message);
            return [];
        }
    }

    _extractRelations(text, maxRelationsPerSentence = 5) {
        if (!text) return [];
        try {
            const doc = compromise(text);
            const sentences = doc.sentences().out('array');
            const relations = [];

            for (const sentence of sentences) {
                const sDoc = compromise(sentence);
                const nouns = sDoc.nouns().out('array')
                    .map(n => this._normalize(n))
                    .filter(n => this._isValidEntity(n));

                const uniqueNouns = [...new Set(nouns)];

                for (let i = 0; i < uniqueNouns.length - 1; i++) {
                    for (let j = i + 1; j < uniqueNouns.length && j <= i + 2; j++) {
                        if (relations.length >= maxRelationsPerSentence) break;
                        relations.push({
                            source: uniqueNouns[i],
                            target: uniqueNouns[j],
                            weight: 1
                        });
                    }
                }
            }
            return relations;
        } catch (err) {
            return [];
        }
    }

    addKnowledge(text, sourceId = 'unknown') {
        if (!text || text.length < 10) return { added: 0, edges: 0 };

        const entities = this._extractEntities(text);
        if (entities.length === 0) return { added: 0, edges: 0 };

        let nodesAdded = 0;

        for (const entity of entities) {
            if (this.graph.order >= MAX_NODES) break;

            if (!this.graph.hasNode(entity)) {
                this.graph.addNode(entity, {
                    label: entity,
                    sources: new Set([sourceId]),
                    degree: 0,
                    createdAt: Date.now()
                });
                nodesAdded++;
            } else {
                const attrs = this.graph.getNodeAttributes(entity);
                if (!attrs.sources) attrs.sources = new Set();
                attrs.sources.add(sourceId);
            }
        }

        const relations = this._extractRelations(text);
        let edgesAdded = 0;

        for (const rel of relations) {
            if (this.graph.size >= MAX_EDGES) break;
            if (!this.graph.hasNode(rel.source) || !this.graph.hasNode(rel.target)) continue;
            if (rel.source === rel.target) continue;

            if (this.graph.hasEdge(rel.source, rel.target)) {
                const currentWeight = this.graph.getEdgeAttribute(rel.source, rel.target, 'weight') || 1;
                this.graph.setEdgeAttribute(rel.source, rel.target, 'weight', currentWeight + 1);
            } else {
                this.graph.addEdge(rel.source, rel.target, {
                    weight: rel.weight,
                    source: sourceId,
                    createdAt: Date.now()
                });
                edgesAdded++;
            }
        }

        if (nodesAdded > 0 || edgesAdded > 0) {
            this.dirty = true;
            this.stats.totalAdded++;
        }

        return { added: nodesAdded, edges: edgesAdded };
    }

    addTriples(triples, sourceId = 'llm') {
        if (!Array.isArray(triples) || triples.length === 0) return { added: 0, edges: 0 };

        let nodesAdded = 0;
        let edgesAdded = 0;

        for (const t of triples) {
            if (!t.subject || !t.predicate || !t.object) continue;

            const subj = this._normalize(t.subject);
            const pred = this._normalize(t.predicate);
            const obj = this._normalize(t.object);

            if (!this._isValidEntity(subj) || !this._isValidEntity(obj)) continue;

            if (!this.graph.hasNode(subj)) {
                if (this.graph.order >= MAX_NODES) break;
                this.graph.addNode(subj, {
                    label: t.subject,
                    sources: new Set([sourceId]),
                    degree: 0,
                    createdAt: Date.now()
                });
                nodesAdded++;
            } else {
                const attrs = this.graph.getNodeAttributes(subj);
                if (!attrs.sources) attrs.sources = new Set();
                attrs.sources.add(sourceId);
            }

            if (!this.graph.hasNode(obj)) {
                if (this.graph.order >= MAX_NODES) break;
                this.graph.addNode(obj, {
                    label: t.object,
                    sources: new Set([sourceId]),
                    degree: 0,
                    createdAt: Date.now()
                });
                nodesAdded++;
            } else {
                const attrs = this.graph.getNodeAttributes(obj);
                if (!attrs.sources) attrs.sources = new Set();
                attrs.sources.add(sourceId);
            }

            if (this.graph.size >= MAX_EDGES) break;
            if (subj === obj) continue;

            if (this.graph.hasEdge(subj, obj)) {
                const currentWeight = this.graph.getEdgeAttribute(subj, obj, 'weight') || 1;
                this.graph.setEdgeAttribute(subj, obj, 'weight', currentWeight + 2);

                const currentLabel = this.graph.getEdgeAttribute(subj, obj, 'label') || '';
                if (!currentLabel.includes(pred)) {
                    const newLabel = currentLabel ? `${currentLabel}, ${pred}` : pred;
                    this.graph.setEdgeAttribute(subj, obj, 'label', newLabel.slice(0, 100));
                }
            } else {
                this.graph.addEdge(subj, obj, {
                    weight: 2,
                    label: pred,
                    source: sourceId,
                    semantic: true,
                    createdAt: Date.now()
                });
                edgesAdded++;
            }
        }

        if (nodesAdded > 0 || edgesAdded > 0) {
            this.dirty = true;
        }

        return { added: nodesAdded, edges: edgesAdded };
    }

    // ============================================================
    // UPDATE DARI JAWABAN ADMIN — Incremental (TIDAK rebuild total)
    // ============================================================
    updateFromAnswer(question, answer, category = '') {
        if (!question || !answer) return { nodes: 0, edges: 0 };

        const combined = `${question} ${answer} ${category || ''}`;
        const sourceId = `admin:${Date.now()}`;

        // 1. Ekstrak & tambah node + co-occurrence edges (seperti addKnowledge)
        const result = this.addKnowledge(combined, sourceId);

        // 2. Tandai graph dirty
        this.dirty = true;

        // 3. Update degree tracking untuk node yang terlibat
        try {
            const entities = this._extractEntities(combined);
            for (const entity of entities) {
                if (this.graph.hasNode(entity)) {
                    const deg = this.graph.degree(entity);
                    this.graph.setNodeAttribute(entity, 'degree', deg);
                }
            }
        } catch (_) {}

        console.log(`[GRAPH] updateFromAnswer: +${result.added} nodes, +${result.edges} edges`);
        return result;
    }

    // ============================================================
    // HAPUS NODE (dengan semua edges-nya)
    // ============================================================
    removeNode(nodeId) {
        if (!this.graph.hasNode(nodeId)) return false;
        this.graph.dropNode(nodeId);
        this.dirty = true;
        return true;
    }

    queryContext(question, options = {}) {
        const maxDepth = options.maxDepth || 1;
        const maxNodes = options.maxNodes || 20;

        if (!question || this.graph.order === 0) {
            return { context: '', nodes: [], matchedEntities: [] };
        }

        const queryEntities = this._extractEntities(question);
        if (queryEntities.length === 0) {
            return { context: '', nodes: [], matchedEntities: [] };
        }

        const matchedNodes = new Set();
        const nodeKeys = this.graph.nodes();

        for (const qe of queryEntities) {
            if (this.graph.hasNode(qe)) {
                matchedNodes.add(qe);
                continue;
            }
            for (const node of nodeKeys) {
                if (node.includes(qe) || qe.includes(node)) {
                    if (qe.length >= 4 && node.length >= 4) {
                        matchedNodes.add(node);
                        if (matchedNodes.size >= maxNodes) break;
                    }
                }
            }
            if (matchedNodes.size >= maxNodes) break;
        }

        if (matchedNodes.size === 0) {
            return { context: '', nodes: [], matchedEntities: queryEntities };
        }

        const visited = new Set();
        const queue = [...matchedNodes].map(id => ({ id, depth: 0 }));
        const collected = [];

        while (queue.length > 0 && collected.length < maxNodes) {
            const { id, depth } = queue.shift();
            if (visited.has(id)) continue;
            visited.add(id);

            if (!this.graph.hasNode(id)) continue;

            const attrs = this.graph.getNodeAttributes(id);
            const neighbors = this.graph.neighbors(id);

            collected.push({
                id,
                label: attrs.label || id,
                degree: neighbors.length,
                sources: attrs.sources ? [...attrs.sources] : [],
                neighbors: neighbors.slice(0, MAX_NEIGHBORS_PER_QUERY)
            });

            if (depth < maxDepth) {
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        queue.push({ id: neighbor, depth: depth + 1 });
                    }
                }
            }
        }

        const contextLines = [];
        for (const node of collected.slice(0, maxNodes)) {
            const neighborLabels = node.neighbors
                .filter(n => this.graph.hasNode(n))
                .map(n => this.graph.getNodeAttributes(n).label)
                .slice(0, 8);

            if (neighborLabels.length > 0) {
                contextLines.push(`• ${node.label} → terkait dengan: ${neighborLabels.join(', ')}`);
            } else {
                contextLines.push(`• ${node.label}`);
            }
        }

        return {
            context: contextLines.join('\n'),
            nodes: collected.map(n => n.label),
            matchedEntities: queryEntities
        };
    }

    getStats() {
        return {
            nodes: this.graph.order,
            edges: this.graph.size,
            totalAdded: this.stats.totalAdded,
            lastSaveAt: this.stats.lastSaveAt,
            loadTimeMs: this.stats.loadTimeMs,
            dirty: this.dirty
        };
    }

    save() {
        if (!this.savePath) return false;
        try {
            const exportData = {
                version: 2,
                savedAt: new Date().toISOString(),
                nodes: [],
                edges: []
            };

            this.graph.forEachNode((node, attrs) => {
                exportData.nodes.push({
                    id: node,
                    label: attrs.label,
                    sources: attrs.sources ? [...attrs.sources] : [],
                    degree: attrs.degree || 0,
                    createdAt: attrs.createdAt
                });
            });

            this.graph.forEachEdge((edge, attrs, source, target) => {
                exportData.edges.push({
                    source,
                    target,
                    weight: attrs.weight || 1,
                    label: attrs.label || '',
                    semantic: attrs.semantic || false,
                    sourceFile: attrs.source
                });
            });

            const tmpPath = this.savePath + '.tmp';
            fs.writeFileSync(tmpPath, JSON.stringify(exportData), 'utf-8');
            fs.renameSync(tmpPath, this.savePath);

            this.dirty = false;
            this.stats.lastSaveAt = new Date().toISOString();
            return true;
        } catch (err) {
            console.error('[GRAPH] Gagal save:', err.message);
            return false;
        }
    }

    load() {
        if (!this.savePath || !fs.existsSync(this.savePath)) return false;
        const t0 = Date.now();

        try {
            const raw = fs.readFileSync(this.savePath, 'utf-8');
            const data = JSON.parse(raw);

            if (!data.nodes || !Array.isArray(data.nodes)) return false;

            this.graph = new Graph({ multi: false, type: 'undirected' });

            for (const node of data.nodes) {
                if (this.graph.order >= MAX_NODES) break;
                this.graph.addNode(node.id, {
                    label: node.label || node.id,
                    sources: new Set(node.sources || []),
                    degree: node.degree || 0,
                    createdAt: node.createdAt || Date.now()
                });
            }

            for (const edge of data.edges) {
                if (this.graph.size >= MAX_EDGES) break;
                if (!this.graph.hasNode(edge.source) || !this.graph.hasNode(edge.target)) continue;
                if (this.graph.hasEdge(edge.source, edge.target)) continue;

                this.graph.addEdge(edge.source, edge.target, {
                    weight: edge.weight || 1,
                    label: edge.label || '',
                    semantic: edge.semantic || false,
                    source: edge.sourceFile || 'unknown'
                });
            }

            this.stats.loadTimeMs = Date.now() - t0;
            this.dirty = false;

            console.log(`[GRAPH] Loaded: ${this.graph.order} nodes, ${this.graph.size} edges (${this.stats.loadTimeMs}ms)`);
            return true;
        } catch (err) {
            console.error('[GRAPH] Gagal load:', err.message);
            this.graph = new Graph({ multi: false, type: 'undirected' });
            return false;
        }
    }

    _autoSave() {
        if (this.dirty) this.save();
    }

    destroy() {
        if (this._autoSaveTimer) clearInterval(this._autoSaveTimer);
        if (this.dirty) this.save();
    }
}

export default GraphEngine;