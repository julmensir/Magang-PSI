// ============================================================
// SUMMARIZER — Auto-generate ringkasan pengetahuan & insight
// ============================================================
import fs from 'fs';
import path from 'path';
import { tokenize, stemID } from './memory.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUMMARY_FILE = path.join(DATA_DIR, 'summaries.json');

let summaries = [];

export function summarizerInit() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(SUMMARY_FILE)) {
        try { summaries = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf-8')); } catch { summaries = []; }
    }
}

export function summarizerSave() {
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summaries.slice(-100), null, 2), 'utf-8');
}

// ============================================================
// ANALISIS TOPIK DARI KNOWLEDGE
// ============================================================
export function analyzeKnowledgeTopics(knowledgeChunks) {
    const topicMap = new Map();

    for (const chunk of knowledgeChunks) {
        const title = chunk.text.match(/^#{1,6}\s+(.+)$/m)?.[1]
            || chunk.text.match(/^\[(.+?)\]/)?.[1]
            || chunk.source.replace(/\.(md|txt)$/i, '');

        if (!title) continue;

        const key = title.toLowerCase().slice(0, 50);
        if (!topicMap.has(key)) {
            topicMap.set(key, {
                title,
                count: 0,
                chunks: [],
                keywords: new Set()
            });
        }
        const entry = topicMap.get(key);
        entry.count++;
        entry.chunks.push(chunk.source);

        // Ekstrak kata kunci
        const words = tokenize(chunk.text).slice(0, 10);
        words.forEach(w => entry.keywords.add(w));
    }

    return Array.from(topicMap.values())
        .map(t => ({
            ...t,
            keywords: Array.from(t.keywords).slice(0, 8)
        }))
        .sort((a, b) => b.count - a.count);
}

// ============================================================
// GENERATE SUMMARY UNTUK ADMIN
// ============================================================
export function generateKnowledgeSummary(knowledgeChunks) {
    const topics = analyzeKnowledgeTopics(knowledgeChunks);

    return {
        timestamp: new Date().toISOString(),
        totalChunks: knowledgeChunks.length,
        totalTopics: topics.length,
        topTopics: topics.slice(0, 20).map(t => ({
            title: t.title,
            chunks: t.count,
            keywords: t.keywords
        }))
    };
}

// ============================================================
// GENERATE INSIGHT HARIAN
// ============================================================
export function generateDailyInsight(feedbackData, learningQueue, unansweredData) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const todayFeedback = feedbackData.filter(f => f.timestamp.startsWith(today));
    const todayGood = todayFeedback.filter(f => f.rating === 'good').length;
    const todayBad = todayFeedback.filter(f => f.rating === 'bad').length;

    // Topik yang perlu perhatian
    const topPending = learningQueue
        .filter(q => !q.resolved && q.count >= 3)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Total pertanyaan tak terjawab
    const unanswered = unansweredData.filter(u => !u.resolved).length;

    const insight = {
        id: 'ins_' + Date.now(),
        date: today,
        feedback: {
            total: todayFeedback.length,
            good: todayGood,
            bad: todayBad,
            satisfaction: todayFeedback.length > 0
                ? ((todayGood / todayFeedback.length) * 100).toFixed(1)
                : 0
        },
        pendingTopics: topPending.map(t => ({
            question: t.original,
            count: t.count,
            priority: t.priority
        })),
        unansweredCount: unanswered,
        recommendations: generateRecommendations(todayFeedback, topPending, unanswered),
        timestamp: new Date().toISOString()
    };

    summaries.push(insight);
    if (summaries.length > 100) summaries = summaries.slice(-100);
    summarizerSave();

    return insight;
}

// ============================================================
// GENERATE REKOMENDASI OTOMATIS
// ============================================================
function generateRecommendations(todayFeedback, topPending, unansweredCount) {
    const recs = [];

    if (todayFeedback.length === 0) {
        recommendations_push(recs, 'info', 'Belum ada feedback hari ini. Ajak user kasih rating ya!');
    }

    const badCount = todayFeedback.filter(f => f.rating === 'bad').length;
    if (badCount >= 3) {
        recommendations_push(recs, 'warning',
            `Ada ${badCount} jawaban dengan rating buruk hari ini. Cek halaman Feedback untuk perbaikan.`);
    }

    if (unansweredCount >= 5) {
        recommendations_push(recs, 'warning',
            `Ada ${unansweredCount} pertanyaan belum terjawab. Tambahkan ke buku pengetahuan!`);
    }

    if (topPending.length > 0) {
        recs.push({
            level: 'info',
            message: `Topik sering ditanya: "${topPending[0].original}" (${topPending[0].count}x). Segera tambahkan ke pengetahuan.`
        });
    }

    if (recs.length === 0) {
        recs.push({ level: 'success', message: 'Semua berjalan baik. Pertahankan kualitas layanan! ✅' });
    }

    return recs;
}

function recommendations_push(arr, level, message) {
    arr.push({ level, message });
}

export function getSummaries(limit = 30) {
    return summaries.slice(-limit).reverse();
}

export function getLatestSummary() {
    return summaries[summaries.length - 1] || null;
}