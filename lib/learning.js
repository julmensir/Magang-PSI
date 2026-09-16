// ============================================================
// AUTO-LEARNING — Deteksi pola pertanyaan & suggest perbaikan
// ============================================================
import fs from 'fs';
import path from 'path';
import { tokenize, stemID } from './memory.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'learning-queue.json');

let learningQueue = []; // Pertanyaan yang sering ditanya tapi belum ada jawabannya

// ============================================================
// INIT & SAVE
// ============================================================
export function learningInit() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(QUEUE_FILE)) {
        try { learningQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')); } catch { learningQueue = []; }
    }
    console.log(`[LEARNING] ${learningQueue.length} pertanyaan di learning queue.`);
}

export function learningSave() {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(learningQueue.slice(-1000), null, 2), 'utf-8');
}

// ============================================================
// HITUNG SIMILARITAS DENGAN LEVENSHTEIN (edit distance)
// ============================================================
function similarity(a, b) {
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLen = longer.length;

    const costs = [];
    for (let i = 0; i <= longerLen; i++) costs[i] = i;

    for (let i = 1; i <= shorter.length; i++) {
        let lastValue = i;
        for (let j = 1; j <= longerLen; j++) {
            if (shorter[i - 1] === longer[j - 1]) {
                costs[j] = costs[j - 1];
            } else {
                costs[j] = Math.min(costs[j - 1], costs[j], lastValue) + 1;
            }
            lastValue = costs[j];
        }
    }
    return 1 - costs[longerLen] / longerLen;
}

// ============================================================
// DETEKSI PERTANYAAN YANG SERING DITANYA TAPI BELUM ADA JAWABAN
// ============================================================
export function recordUnansweredQuestion(question) {
    const qNorm = question.toLowerCase().trim();

    // Cari di queue apakah sudah ada yang mirip (>= 85%)
    let existing = null;
    for (const item of learningQueue) {
        if (similarity(item.question, qNorm) >= 0.85) {
            existing = item;
            break;
        }
    }

    if (existing) {
        existing.count++;
        existing.lastAsked = new Date().toISOString();
        if (!existing.variants.includes(qNorm)) {
            existing.variants.push(qNorm);
            if (existing.variants.length > 10) existing.variants = existing.variants.slice(-10);
        }
    } else {
        learningQueue.push({
            id: 'lq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            question: qNorm,
            original: question,
            variants: [],
            count: 1,
            firstAsked: new Date().toISOString(),
            lastAsked: new Date().toISOString(),
            priority: 'normal',
            resolved: false
        });
    }

    // Auto-tentukan priority berdasarkan frekuensi
    for (const item of learningQueue) {
        if (item.resolved) continue;
        if (item.count >= 10) item.priority = 'urgent';
        else if (item.count >= 5) item.priority = 'high';
        else if (item.count >= 3) item.priority = 'medium';
        else item.priority = 'normal';
    }

    learningSave();
    return existing || learningQueue[learningQueue.length - 1];
}

// ============================================================
// AMBIL DAFTAR PRIORITAS
// ============================================================
export function getLearningQueue(filter = 'all') {
    let items = [...learningQueue];

    if (filter === 'pending') items = items.filter(i => !i.resolved);
    else if (filter === 'urgent') items = items.filter(i => i.priority === 'urgent' && !i.resolved);
    else if (filter === 'high') items = items.filter(i => (i.priority === 'urgent' || i.priority === 'high') && !i.resolved);

    items.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, normal: 1 };
        const pa = priorityOrder[a.priority] || 0;
        const pb = priorityOrder[b.priority] || 0;
        if (pa !== pb) return pb - pa;
        return b.count - a.count;
    });

    return items;
}

export function getQueueStats() {
    const pending = learningQueue.filter(i => !i.resolved);
    return {
        total: learningQueue.length,
        pending: pending.length,
        resolved: learningQueue.length - pending.length,
        urgent: pending.filter(i => i.priority === 'urgent').length,
        high: pending.filter(i => i.priority === 'high').length,
        medium: pending.filter(i => i.priority === 'medium').length
    };
}

export function resolveQuestion(id) {
    const item = learningQueue.find(i => i.id === id);
    if (item) {
        item.resolved = true;
        item.resolvedAt = new Date().toISOString();
        learningSave();
        return true;
    }
    return false;
}

export function deleteQuestion(id) {
    const idx = learningQueue.findIndex(i => i.id === id);
    if (idx !== -1) {
        learningQueue.splice(idx, 1);
        learningSave();
        return true;
    }
    return false;
}

export function clearResolved() {
    learningQueue = learningQueue.filter(i => !i.resolved);
    learningSave();
}

export function clearAll() {
    learningQueue = [];
    learningSave();
}