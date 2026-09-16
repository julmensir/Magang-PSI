## [2.0.0] - 2026-09-XX

### 🎉 Major Release - Advanced Features

Rilis besar dengan fitur AI yang lebih pintar & aman.

### ✨ Added

#### 🛡️ Anti-Halusinasi Classifier
- Deteksi pertanyaan in-scope vs out-of-scope
- Keyword scanning (politik, jodoh, game, dll)
- Redirect sopan untuk pertanyaan di luar topik
- Log out-of-scope ke analytics

#### 🎓 Auto-Learning System
- Deteksi pertanyaan populer otomatis
- Prioritas: Urgent (≥10x), High (≥5x), Medium (≥3x)
- Similarity detection pakai Levenshtein Distance
- Variant collection untuk pertanyaan mirip
- Antrian belajar untuk admin

#### ⭐ Feedback & Analytics
- Rating jawaban 👍👎 dari user
- Statistik kepuasan user
- Akurasi jawaban (answers vs refusals)
- Chart feedback 7 hari terakhir
- Daily stats tracking

#### 🔌 Provider Baru
- DeepSeek
- Fireworks AI
- xAI Grok
- Custom Provider (OpenAI-compatible apapun)
- Support Ollama lokal
- Support LocalAI

#### 🎛️ Dashboard Enhancement
- 8 stat cards (dari 6)
- Chart analytics
- Feedback page
- Auto-learning page
- Update API key provider
- Custom provider form

### 🔧 Changed

- Node.js minimum: 18 → **20**
- Versi: 1.0.0 → **2.0.0**
- Deskripsi aplikasi lebih detail
- Prompt AI lebih smart

### 🔒 Security

- Rate limit global naik: 300 → **500 req/15min**
- Classifier anti-halusinasi
- Improved JWT handling

### ⚠️ Breaking Changes

- Struktur `config.json` bertambah field baru
- `analytics.json`, `feedback.json`, `learning-queue.json` (file baru)
- Provider config support custom endpoint
- Beberapa endpoint admin API bertambah

### 🐛 Fixed

- Memory threshold lebih stabil (60 untuk pakai, 40 untuk simpan)
- Refusal detection lebih akurat
- Session cleanup lebih baik