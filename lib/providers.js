// ============================================================
// MULTI-PROVIDER AI MANAGER - VERSI DIPERBAIKI
// Support: Gemini, Groq, OpenRouter, Cerebras, Together, Mistral
// ============================================================

import { GoogleGenAI } from '@google/genai';

// Daftar provider yang didukung
export const PROVIDERS = {
    gemini: {
        name: 'Google Gemini',
        needsKey: true,
        models: [
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-flash-latest'
        ],
        call: callGemini
    },
    groq: {
        name: 'Groq',
        needsKey: true,
        models: [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'mixtral-8x7b-32768'
        ],
        call: callOpenAICompatible,
        baseUrl: 'https://api.groq.com/openai/v1'
    },
    openrouter: {
        name: 'OpenRouter',
        needsKey: true,
        models: [
            'meta-llama/llama-3.3-70b-instruct:free',
            'google/gemini-flash-1.5:free',
            'mistralai/mistral-7b-instruct:free',
            'meta-llama/llama-3.1-8b-instruct:free'
        ],
        call: callOpenAICompatible,
        baseUrl: 'https://openrouter.ai/api/v1'
    },
    cerebras: {
        name: 'Cerebras',
        needsKey: true,
        models: [
            'llama-3.3-70b',
            'llama3.1-8b'
        ],
        call: callOpenAICompatible,
        baseUrl: 'https://api.cerebras.ai/v1'
    },
    together: {
        name: 'Together AI',
        needsKey: true,
        models: [
            'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
        ],
        call: callOpenAICompatible,
        baseUrl: 'https://api.together.xyz/v1'
    },
    mistral: {
        name: 'Mistral AI',
        needsKey: true,
        models: [
            'mistral-small-latest',
            'open-mistral-7b',
            'open-mistral-nemo'
        ],
        call: callOpenAICompatible,
        baseUrl: 'https://api.mistral.ai/v1'
    }
};

// ============================================================
// GEMINI PROVIDER
// ============================================================
export async function callGemini({ apiKey, model, systemPrompt, conversation, fileData, fileMimeType }) {
    const ai = new GoogleGenAI({ apiKey });
    const contents = conversation.map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        parts: [{ text: m.text }]
    }));

    // Sisipkan file ke pesan user terakhir
    if (fileData && fileMimeType) {
        const lastUser = contents.map(c => c.role).lastIndexOf('user');
        if (lastUser !== -1) {
            contents[lastUser].parts.push({
                inlineData: { data: fileData, mimeType: fileMimeType }
            });
        }
    }

    const response = await ai.models.generateContent({
        model,
        contents,
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.2,
            topP: 0.85,
            topK: 30,
            maxOutputTokens: 1500
        }
    });

    return response.text || '';
}

// ============================================================
// OPENAI-COMPATIBLE PROVIDER (Groq, OpenRouter, Cerebras, dst)
// ============================================================
export async function callOpenAICompatible({ apiKey, model, systemPrompt, conversation, baseUrl }) {
    if (!baseUrl) {
        throw new Error(`Base URL tidak ada untuk provider ini`);
    }

    // Ubah format conversation ke format OpenAI
    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.map(m => ({
            role: m.role === 'bot' ? 'assistant' : 'user',
            content: m.text
        }))
    ];

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    // OpenRouter butuh header tambahan
    if (baseUrl.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = 'http://localhost:3000';
        headers['X-Title'] = 'SIVT AI Chatbot';
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.2,
            max_tokens: 1500,
            stream: false
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (!text) {
        throw new Error('Response kosong dari API');
    }

    return text;
}

// ============================================================
// FALLBACK LOGIC — coba provider satu per satu (HANYA YANG ENABLED)
// ============================================================
export async function callWithFallback(providers, options) {
    let lastError = null;

    // ✅ FILTER: hanya provider yang enabled DAN punya API key valid
    const activeProviders = (providers || []).filter(p =>
        p &&
        p.enabled !== false &&
        p.apiKey &&
        String(p.apiKey).trim().length > 5
    );

    if (activeProviders.length === 0) {
        throw new Error('Tidak ada provider AI yang aktif. Aktifkan minimal 1 di dashboard admin → Provider AI.');
    }

    console.log(`[FALLBACK] Mencoba ${activeProviders.length} provider aktif...`);

    for (const providerConfig of activeProviders) {
        const provider = PROVIDERS[providerConfig.name];
        if (!provider) {
            console.warn(`[SKIP] Provider "${providerConfig.name}" tidak dikenal`);
            continue;
        }

        // ✅ Pastikan models adalah array valid
        const models = Array.isArray(providerConfig.models) && providerConfig.models.length > 0
            ? providerConfig.models
            : provider.models;

        for (const model of models) {
            try {
                console.log(`[TRY] ${provider.name} — ${model}`);
                const text = await provider.call({
                    apiKey: providerConfig.apiKey,
                    model,
                    baseUrl: provider.baseUrl,
                    systemPrompt: options.systemPrompt,
                    conversation: options.conversation,
                    fileData: options.fileData,
                    fileMimeType: options.fileMimeType
                });

                if (!text || text.trim().length < 3) {
                    throw new Error('Response kosong');
                }

                console.log(`[OK] ${provider.name} — ${model}`);
                return { provider: provider.name, model, text };
            } catch (err) {
                const msg = String(err?.message || err);
                console.warn(`[FAIL] ${provider.name} ${model}: ${msg.slice(0, 150)}`);
                lastError = err;

                // Delay kecil sebelum coba model berikutnya
                await new Promise(r => setTimeout(r, 200));
            }
        }

        console.warn(`[SKIP-PROVIDER] ${provider.name} gagal semua model, lanjut ke provider berikutnya...`);
    }

    throw lastError || new Error('Semua provider gagal');
}