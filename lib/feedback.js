// ============================================================
// FEEDBACK SYSTEM — Track user satisfaction & AI accuracy
// ============================================================
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

let feedbackData = [];
let analyticsData = {
    totalChats: 0,
    totalAnswers: 0,
    totalRefusals: 0,
    totalMemoryHits: 0,
    totalRagHits: 0,
    totalOutOfScope: 0,
    dailyStats: {} // { '2026-09-13': { chats: 10, good: 8, bad: 2 } }
};

// ============================================================
// INIT & SAVE
// ============================================================
export function feedbackInit() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    if (fs.existsSync(FEEDBACK_FILE)) {
        try { feedbackData = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8')); } catch { feedbackData = []; }
    }
    if (fs.existsSync(ANALYTICS_FILE)) {
        try { analyticsData = { ...analyticsData, ...JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8')) }; } catch {}
    }
    console.log(`[FEEDBACK] ${feedbackData.length} feedback dimuat.`);
}

export function feedbackSave() {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbackData.slice(-5000), null, 2), 'utf-8');
}

export function analyticsSave() {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analyticsData, null, 2), 'utf-8');
}

// ============================================================
// FEEDBACK
// ============================================================
export function addFeedback(question, answer, rating, sessionId, meta = {}) {
    const item = {
        id: 'fb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        question: question.slice(0, 500),
        answer: answer.slice(0, 1000),
        rating, // 'good' | 'bad'
        sessionId: sessionId || 'unknown',
        provider: meta.provider || 'unknown',
        model: meta.model || 'unknown',
        source: meta.source || 'ai', // 'ai' | 'memory' | 'refusal' | 'out_of_scope'
        timestamp: new Date().toISOString()
    };
    feedbackData.push(item);

    // Update daily stats
    const day = new Date().toISOString().slice(0, 10);
    if (!analyticsData.dailyStats[day]) {
        analyticsData.dailyStats[day] = { chats: 0, good: 0, bad: 0 };
    }
    if (rating === 'good') analyticsData.dailyStats[day].good++;
    else if (rating === 'bad') analyticsData.dailyStats[day].bad++;

    feedbackSave();
    analyticsSave();
    return item;
}

// ============================================================
// ANALYTICS
// ============================================================
export function trackEvent(type) {
    analyticsData.totalChats++;
    if (type === 'refusal') analyticsData.totalRefusals++;
    if (type === 'memory') analyticsData.totalMemoryHits++;
    if (type === 'rag') analyticsData.totalRagHits++;
    if (type === 'out_of_scope') analyticsData.totalOutOfScope++;
    if (type === 'answer') analyticsData.totalAnswers++;

    const day = new Date().toISOString().slice(0, 10);
    if (!analyticsData.dailyStats[day]) {
        analyticsData.dailyStats[day] = { chats: 0, good: 0, bad: 0 };
    }
    analyticsData.dailyStats[day].chats++;

    analyticsSave();
}

export function getStats() {
    const good = feedbackData.filter(f => f.rating === 'good').length;
    const bad = feedbackData.filter(f => f.rating === 'bad').length;
    const total = feedbackData.length;
    const satisfaction = total > 0 ? ((good / total) * 100).toFixed(1) : 0;

    return {
        feedback: {
            total,
            good,
            bad,
            satisfactionRate: parseFloat(satisfaction)
        },
        analytics: {
            totalChats: analyticsData.totalChats,
            totalAnswers: analyticsData.totalAnswers,
            totalRefusals: analyticsData.totalRefusals,
            totalMemoryHits: analyticsData.totalMemoryHits,
            totalRagHits: analyticsData.totalRagHits,
            totalOutOfScope: analyticsData.totalOutOfScope,
            accuracyRate: analyticsData.totalAnswers > 0
                ? (((analyticsData.totalAnswers - analyticsData.totalRefusals) / analyticsData.totalAnswers) * 100).toFixed(1)
                : 0
        },
        dailyStats: analyticsData.dailyStats
    };
}

export function getBadExamples(limit = 20) {
    return feedbackData
        .filter(f => f.rating === 'bad')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
}

export function getGoodExamples(limit = 20) {
    return feedbackData
        .filter(f => f.rating === 'good')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
}

export function getFeedbackList(limit = 100) {
    return feedbackData
        .slice()
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
}

export function clearFeedback() {
    feedbackData = [];
    feedbackSave();
}

export function clearAnalytics() {
    analyticsData = {
        totalChats: 0,
        totalAnswers: 0,
        totalRefusals: 0,
        totalMemoryHits: 0,
        totalRagHits: 0,
        totalOutOfScope: 0,
        dailyStats: {}
    };
    analyticsSave();
}