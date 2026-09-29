// ============================================================
// MULTI-PROVIDER AI MANAGER — VERSI FINAL 2026
// Support: Gemini, Groq, OpenRouter, Cerebras, Together, Mistral,
//          DeepSeek, Fireworks, xAI Grok + Custom Provider apapun
// + EMBEDDING SUPPORT (Gemini, OpenAI, Cohere)
// ============================================================

import { GoogleGenAI } from '@google/genai';

export const PROVIDERS = {
    gemini: {
        name: 'Google Gemini',
        needsKey: true,
        models: [
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-2.5-flash',
            'gemini-flash-latest'
        ],
        embeddingModels: ['text-embedding-004', 'text-embedding-001'],
        call: callGemini,
        embed: callGeminiEmbedding
    },
    groq: {
        name: 'Groq',
        needsKey: true,
        models: [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'llama3-70b-8192',
            'llama3-8b-8192',
            'mixtral-8x7b-32768',
            'gemma2-9b-it'
        ],
        call: callOpenAICompatible,
        baseUrl: 'https://api.groq.com/openai/v1'
    },
    openrouter: {
        name: 'OpenRouter',
        needsKey: true,
        models: [
            'meta-llama/llama-3.3-70b-instruct:free',
            'meta-llama/llama-3.1-8b-instruct:free',
            'google/gemini-2.0-flash-exp:free',
            'google/gemma-2-9b-it:free',
            'mistralai/mistral-7b-instruct:free',
            'qwen/qwen-2.5-72b-instruct:free'
        ],
        call: callOpenAICompatible,
        baseUrl: 'https://openrouter.ai/api/v1'
    },
    cerebras: {
        name: 'Cerebras',
        needsKey: true,
        models: ['llama-3.3-70b', 'llama3.1-70b', 'llama3.1-8b'],
        call: callOpenAICompatible,
        baseUrl: 'https://api.cerebras.ai/v1'
    },
    together: {
        name: 'Together AI',
        needsKey: true,
        models: [
            'meta-llama/Llama-3.3-70B-Instruct-Turbo',
            'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
            'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
        ],
        embeddingModels: ['BAAI/bge-large-en-v1.5', 'togethercomputer/m2-bert-80M-8k-retrieval'],
        call: callOpenAICompatible,
        baseUrl: 'https://api.together.xyz/v1',
        embed: callOpenAICompatibleEmbedding
    },
    mistral: {
        name: 'Mistral AI',
        needsKey: true,
        models: ['open-mistral-nemo', 'mistral-small-latest', 'open-mixtral-8x7b'],
        embeddingModels: ['mistral-embed'],
        call: callOpenAICompatible,
        baseUrl: 'https://api.mistral.ai/v1',
        embed: callOpenAICompatibleEmbedding
    },
    deepseek: {
        name: 'DeepSeek',
        needsKey: true,
        models: ['deepseek-chat', 'deepseek-coder'],
        call: callOpenAICompatible,
        baseUrl: 'https://api.deepseek.com/v1'
    },
    fireworks: {
        name: 'Fireworks AI',
        needsKey: true,
        models: [
            'accounts/fireworks/models/llama-v3p3-70b-instruct',
            'accounts/fireworks/models/llama-v3p1-8b-instruct'
        ],
        call: callOpenAICompatible,
        baseUrl: 'https://api.fireworks.ai/inference/v1'
    },
    xai: {
        name: 'xAI Grok',
        needsKey: true,
        models: ['grok-beta', 'grok-vision-beta'],
        call: callOpenAICompatible,
        baseUrl: 'https://api.x.ai/v1'
    }
};

// ============================================================
// GEMINI CHAT
// ============================================================
export async function callGemini({ apiKey, model, systemPrompt, conversation, fileData, fileMimeType }) {
    const ai = new GoogleGenAI({ apiKey });
    const contents = conversation.map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        parts: [{ text: m.text }]
    }));

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
            maxOutputTokens: 2000
        }
    });

    return response.text || '';
}

// ============================================================
// GEMINI EMBEDDING
// ============================================================
export async function callGeminiEmbedding({ apiKey, model, text }) {
    const ai = new GoogleGenAI({ apiKey });
    const actualModel = model || 'text-embedding-004';

    const response = await ai.models.embedContent({
        model: actualModel,
        contents: [{ parts: [{ text }] }]
    });

    // response.embeddings[0].values
    const vector = response?.embeddings?.[0]?.values;
    if (!Array.isArray(vector)) {
        throw new Error('Response embedding tidak valid');
    }
    return vector;
}

// ============================================================
// OPENAI-COMPATIBLE CHAT
// ============================================================
export async function callOpenAICompatible({ apiKey, model, systemPrompt, conversation, baseUrl }) {
    if (!baseUrl) throw new Error(`Base URL tidak ada`);
    if (!apiKey || String(apiKey).trim().length < 5) {
        throw new Error(`API Key kosong atau tidak valid`);
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...conversation.map(m => ({
            role: m.role === 'bot' ? 'assistant' : 'user',
            content: m.text
        }))
    ];

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
    };

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
            max_tokens: 2000,
            stream: false
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        let shortErr = errText.slice(0, 200);
        try {
            const parsed = JSON.parse(errText);
            shortErr = parsed.error?.message || parsed.message || shortErr;
        } catch (_) {}

        if (res.status === 401) throw new Error(`HTTP 401: API key tidak valid (${shortErr})`);
        else if (res.status === 404) throw new Error(`HTTP 404: Model tidak tersedia (${shortErr})`);
        else if (res.status === 429) throw new Error(`HTTP 429: Kuota habis (${shortErr})`);
        else throw new Error(`HTTP ${res.status}: ${shortErr}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('Response kosong dari API');
    return text;
}

// ============================================================
// OPENAI-COMPATIBLE EMBEDDING
// ============================================================
export async function callOpenAICompatibleEmbedding({ apiKey, model, text, baseUrl }) {
    if (!baseUrl) throw new Error('Base URL tidak ada');
    if (!apiKey) throw new Error('API Key kosong');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
    };

    if (baseUrl.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = 'http://localhost:3000';
        headers['X-Title'] = 'SIVT AI Chatbot';
    }

    const res = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            input: text
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 150)}`);
    }

    const data = await res.json();
    const vector = data?.data?.[0]?.embedding;
    if (!Array.isArray(vector)) throw new Error('Response embedding tidak valid');
    return vector;
}

// ============================================================
// FALLBACK LOGIC — Chat
// ============================================================
export async function callWithFallback(providers, options) {
    let lastError = null;

    const activeProviders = (providers || []).filter(p =>
        p && p.enabled !== false && p.apiKey && String(p.apiKey).trim().length > 5
    );

    if (activeProviders.length === 0) {
        throw new Error('Tidak ada provider AI yang aktif.');
    }

    console.log(`[FALLBACK] Mencoba ${activeProviders.length} provider aktif...`);

    for (const providerConfig of activeProviders) {
        const provider = PROVIDERS[providerConfig.name];

        if (!provider && providerConfig.customEndpoint) {
            console.log(`[TRY-CUSTOM] ${providerConfig.name} — ${providerConfig.models?.[0]}`);
            try {
                const text = await callOpenAICompatible({
                    apiKey: providerConfig.apiKey,
                    model: providerConfig.models[0],
                    baseUrl: providerConfig.customEndpoint,
                    systemPrompt: options.systemPrompt,
                    conversation: options.conversation
                });
                if (!text || text.trim().length < 3) throw new Error('Response kosong');
                console.log(`[OK-CUSTOM] ${providerConfig.name}`);
                return { provider: providerConfig.name, model: providerConfig.models[0], text };
            } catch (err) {
                console.warn(`[FAIL] ${providerConfig.name}: ${String(err?.message || err).slice(0, 150)}`);
                lastError = err;
                continue;
            }
        }

        if (!provider) {
            console.warn(`[SKIP] Provider "${providerConfig.name}" tidak dikenal`);
            continue;
        }

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

                if (!text || text.trim().length < 3) throw new Error('Response kosong');

                console.log(`[OK] ${provider.name} — ${model}`);
                return { provider: provider.name, model, text };
            } catch (err) {
                const msg = String(err?.message || err);
                console.warn(`[FAIL] ${provider.name} ${model}: ${msg.slice(0, 150)}`);
                lastError = err;
                await new Promise(r => setTimeout(r, 200));
            }
        }

        console.warn(`[SKIP-PROVIDER] ${provider.name} gagal semua model...`);
    }

    throw lastError || new Error('Semua provider gagal');
}

// ============================================================
// FALLBACK LOGIC — Embedding
// ============================================================
export async function callEmbeddingWithFallback(providers, options) {
    let lastError = null;

    const activeProviders = (providers || []).filter(p =>
        p && p.enabled !== false && p.apiKey && String(p.apiKey).trim().length > 5
    );

    if (activeProviders.length === 0) {
        throw new Error('Tidak ada provider embedding aktif.');
    }

    for (const providerConfig of activeProviders) {
        const provider = PROVIDERS[providerConfig.name];

        // Custom provider (OpenAI-compatible)
        if (!provider && providerConfig.customEndpoint) {
            try {
                const model = providerConfig.embeddingModels?.[0] || providerConfig.models?.[0];
                const vector = await callOpenAICompatibleEmbedding({
                    apiKey: providerConfig.apiKey,
                    model,
                    text: options.text,
                    baseUrl: providerConfig.customEndpoint
                });
                return { provider: providerConfig.name, model, vector };
            } catch (err) {
                console.warn(`[EMBED-FAIL] ${providerConfig.name}: ${err.message.slice(0, 100)}`);
                lastError = err;
                continue;
            }
        }

        if (!provider || !provider.embed) continue;

        const embedModels = providerConfig.embeddingModels
            || provider.embeddingModels
            || [];

        if (embedModels.length === 0) continue;

        const model = embedModels[0];

        try {
            console.log(`[EMBED-TRY] ${provider.name} — ${model}`);
            const vector = await provider.embed({
                apiKey: providerConfig.apiKey,
                model,
                text: options.text,
                baseUrl: provider.baseUrl
            });

            if (!Array.isArray(vector) || vector.length === 0) {
                throw new Error('Vector kosong');
            }

            console.log(`[EMBED-OK] ${provider.name} (${vector.length} dim)`);
            return { provider: provider.name, model, vector };
        } catch (err) {
            console.warn(`[EMBED-FAIL] ${provider.name}: ${err.message.slice(0, 100)}`);
            lastError = err;
        }
    }

    throw lastError || new Error('Semua provider embedding gagal');
}