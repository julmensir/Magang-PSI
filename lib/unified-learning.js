// ============================================================
// UNIFIED LEARNING PIPELINE
// 1 kali jawab admin → update 3 fitur + graph sekaligus
// - Simpan ke buku-pengetahuan.md
// - Update Graph (incremental, bukan rebuild)
// - Enrich triple via LLM (opsional)
// - Tandai resolved di: Unanswered, Learning Queue, Feedback
// ============================================================

import fs from 'fs';
import path from 'path';

/**
 * Pipeline utama untuk memproses jawaban admin
 * @param {Object} opts
 * @param {Object} opts.question - { id, question, source } — source: 'unanswered' | 'learning'
 * @param {String} opts.answer - Jawaban lengkap dari admin
 * @param {String} opts.category - Kategori opsional
 * @param {String} opts.knowledgeFile - Path file buku-pengetahuan.md
 * @param {Object} opts.brain - GraphEngine instance
 * @param {Function} opts.loadKnowledge - Callback reload knowledge
 * @param {Function} opts.resolveUnanswered - Callback resolve di unanswered store
 * @param {Function} opts.resolveLearning - Callback resolve di learning queue
 * @param {Function} opts.notifAdd - Callback notifikasi admin
 * @param {Function} opts.llmCall - (Opsional) Callback LLM untuk enrich
 * @returns {Promise<Object>} - Hasil pipeline
 */
export async function processAdminAnswer(opts) {
    const {
        question,
        answer,
        category,
        knowledgeFile,
        brain,
        loadKnowledge,
        resolveUnanswered,
        resolveLearning,
        notifAdd,
        llmCall
    } = opts;

    const result = {
        success: false,
        steps: {
            savedToKnowledge: false,
            resolvedUnanswered: false,
            resolvedLearning: false,
            graphUpdated: false,
            triplesExtracted: 0,
            edgesAdded: 0
        },
        errors: []
    };

    if (!question || !question.question || !answer) {
        result.errors.push('Pertanyaan & jawaban wajib diisi');
        return result;
    }

    const qText = question.question.trim();
    const aText = answer.trim();

    // =========================================================
    // STEP 1: Simpan ke buku-pengetahuan.md
    // =========================================================
    try {
        const title = qText.length > 80 ? qText.slice(0, 77) + '...' : qText;

        let block = `\n\n## ${title}\n\n`;
        block += `Kata kunci : ${qText}\n\n`;
        block += `Pertanyaan : ${qText}\n\n`;
        block += `Jawaban : ${aText}\n\n`;
        if (category) block += `Kategori : ${category}\n`;

        if (!fs.existsSync(knowledgeFile)) {
            fs.writeFileSync(knowledgeFile, '# Buku Pengetahuan SIVT AI\n', 'utf-8');
        }

        fs.appendFileSync(knowledgeFile, block, 'utf-8');
        result.steps.savedToKnowledge = true;
    } catch (err) {
        result.errors.push(`Gagal simpan ke knowledge: ${err.message}`);
    }

    // =========================================================
    // STEP 2: Update Graph secara incremental (TIDAK rebuild)
    // =========================================================
    try {
        if (brain && typeof brain.updateFromAnswer === 'function') {
            const graphResult = brain.updateFromAnswer(qText, aText, category);
            result.steps.graphUpdated = true;
            result.steps.edgesAdded = graphResult.edges || 0;

            // Simpan graph ke disk
            brain.save();
        }
    } catch (err) {
        result.errors.push(`Gagal update graph: ${err.message}`);
    }

    // =========================================================
    // STEP 3: Enrich triple via LLM (opsional, kalau ada llmCall)
    // =========================================================
    if (llmCall) {
        try {
            const { extractTriples } = await import('./graph-enricher.js');
            const combinedText = `Pertanyaan: ${qText}\n\nJawaban: ${aText}`;
            const triples = await extractTriples(combinedText, llmCall);

            if (triples.length > 0 && brain && typeof brain.addTriples === 'function') {
                const added = brain.addTriples(triples, `admin:${question.id || 'unknown'}`);
                result.steps.triplesExtracted = triples.length;
                result.steps.edgesAdded += added.edges || 0;
                brain.save();
            }
        } catch (err) {
            // Silent fail — enrich bukan wajib
            console.warn('[UNIFIED] Enrich gagal:', err.message);
        }
    }

    // =========================================================
    // STEP 4: Tandai resolved di Unanswered
    // =========================================================
    if (question.source === 'unanswered' && question.id && resolveUnanswered) {
        try {
            const ok = resolveUnanswered(question.id);
            result.steps.resolvedUnanswered = ok;
        } catch (err) {
            result.errors.push(`Gagal resolve unanswered: ${err.message}`);
        }
    }

    // =========================================================
    // STEP 5: Tandai resolved di Learning Queue
    // =========================================================
    if (question.source === 'learning' && question.id && resolveLearning) {
        try {
            const ok = resolveLearning(question.id);
            result.steps.resolvedLearning = ok;
        } catch (err) {
            result.errors.push(`Gagal resolve learning: ${err.message}`);
        }
    }

    // =========================================================
    // STEP 6: Reload knowledge (untuk update chunk index & topics)
    // =========================================================
    try {
        if (loadKnowledge) loadKnowledge();
    } catch (err) {
        result.errors.push(`Gagal reload knowledge: ${err.message}`);
    }

    // =========================================================
    // STEP 7: Notifikasi admin
    // =========================================================
    try {
        if (notifAdd) {
            const title = qText.length > 60 ? qText.slice(0, 57) + '...' : qText;
            notifAdd('info', 'Pengetahuan & Graph Diperbarui',
                `"${title}" — ${result.steps.edgesAdded} edge baru ditambahkan ke graph`, 'info');
        }
    } catch (err) {
        // Silent
    }

    result.success = result.steps.savedToKnowledge;
    return result;
}