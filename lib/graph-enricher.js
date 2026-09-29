// ============================================================
// GRAPH ENRICHER — Semantic Extraction via LLM
// Mengubah teks menjadi triple (subjek, predikat, objek)
// untuk memperkaya knowledge graph
// ============================================================

const ENRICH_PROMPT = `Kamu adalah AI ekstraksi pengetahuan. Tugasmu: dari teks berikut, ekstrak relasi antar konsep dalam format triple.

FORMAT OUTPUT (HARUS JSON valid, tanpa markdown, tanpa penjelasan):
{
  "triples": [
    {"subject": "konsep A", "predicate": "hubungan", "object": "konsep B"},
    {"subject": "konsep C", "predicate": "memerlukan", "object": "konsep D"}
  ]
}

ATURAN:
- Subject & Object: 1-4 kata, berupa konsep/benda/hal (bukan kata umum).
- Predicate: 1-3 kata kerja hubungan (contoh: "memerlukan", "berhubungan dengan", "menghasilkan", "mengurus", "membuat", "menggunakan", "berlaku untuk", "termasuk").
- Maksimal 10 triple per teks.
- HANYA ekstrak relasi yang JELAS ada di teks.
- Abaikan kata umum (hal, cara, orang, dll).
- Output HARUS JSON valid, tanpa backtick, tanpa penjelasan tambahan.

TEKS:
"""
{{TEXT}}
"""

OUTPUT JSON:`;

export async function extractTriples(text, llmCall) {
    if (!text || text.length < 30) return [];

    const trimmed = text.slice(0, 2500);
    const prompt = ENRICH_PROMPT.replace('{{TEXT}}', trimmed);

    try {
        const response = await llmCall({
            systemPrompt: 'Kamu adalah AI yang hanya output JSON valid. Tidak ada penjelasan tambahan.',
            conversation: [{ role: 'user', text: prompt }]
        });

        const rawText = typeof response === 'string' ? response : response.text;
        if (!rawText) return [];

        let cleaned = rawText.trim();
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
        cleaned = cleaned.replace(/\s*```$/i, '');

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return [];

        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.triples || !Array.isArray(parsed.triples)) return [];

        return parsed.triples
            .filter(t => t && t.subject && t.predicate && t.object)
            .map(t => ({
                subject: String(t.subject).toLowerCase().trim().slice(0, 60),
                predicate: String(t.predicate).toLowerCase().trim().slice(0, 40),
                object: String(t.object).toLowerCase().trim().slice(0, 60)
            }))
            .filter(t =>
                t.subject.length >= 3 && t.object.length >= 3 &&
                t.subject !== t.object &&
                t.predicate.length >= 3
            )
            .slice(0, 15);

    } catch (err) {
        console.warn('[ENRICHER] Gagal ekstrak triple:', err.message);
        return [];
    }
}

export async function batchEnrich(chunks, llmCall, options = {}) {
    const concurrency = options.concurrency || 2;
    const onProgress = options.onProgress || (() => {});
    const results = [];

    console.log(`[ENRICHER] Mulai enrich ${chunks.length} chunk dengan concurrency ${concurrency}...`);

    let index = 0;
    let done = 0;

    async function worker() {
        while (index < chunks.length) {
            const myIndex = index++;
            const chunk = chunks[myIndex];

            try {
                const triples = await extractTriples(chunk.text, llmCall);
                results.push({ source: chunk.source, triples, chunkIndex: myIndex });
            } catch (err) {
                results.push({ source: chunk.source, triples: [], chunkIndex: myIndex, error: err.message });
            }

            done++;
            if (done % 5 === 0 || done === chunks.length) {
                onProgress(done, chunks.length);
            }

            await new Promise(r => setTimeout(r, 200));
        }
    }

    const workers = Array(Math.min(concurrency, chunks.length))
        .fill(null)
        .map(() => worker());

    await Promise.all(workers);

    console.log(`[ENRICHER] Selesai. ${results.length} chunk diproses.`);
    return results;
}