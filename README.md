# SIVT AI — Sistem Informasi Virtual TEGALREJO

> **AI Chatbot Multi-Provider dengan RAG Hybrid, Knowledge Graph, Memory, Auto-Learning, dan Feedback System untuk Kemantren Tegalrejo Yogyakarta**

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

🔗 **Repository**: [https://github.com/julmensir/Magang-PSI](https://github.com/julmensir/Magang-PSI)

---

## 📋 DAFTAR ISI

1. [Tentang Aplikasi](#-tentang-aplikasi)
2. [Fitur Utama](#-fitur-utama)
3. [Arsitektur Sistem](#-arsitektur-sistem)
4. [Alur Kerja AI](#-alur-kerja-ai)
5. [Struktur Folder](#-struktur-folder)
6. [Instalasi & Setup](#-instalasi--setup)
7. [Konfigurasi Environment](#-konfigurasi-environment)
8. [Cara Menjalankan](#-cara-menjalankan)
9. [Panduan Admin Dashboard](#-panduan-admin-dashboard)
10. [Multi-Provider AI & Role System](#-multi-provider-ai--role-system)
11. [Sistem Pengetahuan (RAG Hybrid)](#-sistem-pengetahuan-rag-hybrid)
12. [Knowledge Graph (Graph RAG)](#-knowledge-graph-graph-rag)
13. [Sistem Memori AI](#-sistem-memori-ai)
14. [Anti-Halusinasi (Classifier)](#-anti-halusinasi-classifier)
15. [Auto-Learning System](#-auto-learning-system)
16. [Unified Learning Pipeline](#-unified-learning-pipeline)
17. [Feedback & Analytics](#-feedback--analytics)
18. [Keamanan](#-keamanan)
19. [API Endpoints](#-api-endpoints)
20. [Troubleshooting](#-troubleshooting)
21. [Tips & Best Practices](#-tips--best-practices)
22. [Konsep Penting](#-konsep-penting)
23. [FAQ](#-faq-frequently-asked-questions)
24. [Kontak & Lisensi](#-kontak--lisensi)

---

## 🎯 TENTANG APLIKASI

**SIVT AI** (Sistem Informasi Virtual TEGALREJO) adalah asisten virtual berbasis AI yang dirancang khusus untuk **Kemantren Tegalrejo, Yogyakarta**. Aplikasi ini membantu warga mendapatkan informasi tentang layanan administrasi kependudukan seperti KTP, KK, Akta Kelahiran, dan lain-lain.

### Keunggulan Utama

- 🧠 **AI yang Akurat** — Tidak mengarang jawaban (anti-halusinasi)
- 📚 **Belajar dari Pengetahuan** — Berbasis buku panduan resmi
- 🔍 **RAG Hybrid** — Gabungan BM25 + Embedding + RRF Fusion
- 🕸️ **Knowledge Graph** — Graph RAG untuk konteks lebih dalam
- 💾 **Ingat Percakapan** — Memory system yang cerdas
- 🎓 **Belajar Mandiri** — Auto-learning dari pertanyaan warga
- 🔄 **Unified Learning** — 1x jawab admin, 5 sistem terupdate
- 👍 **Feedback User** — Rating jawaban untuk perbaikan
- 🔌 **Multi-Provider AI** — 9 provider + custom, dengan Role System
- 🛡️ **Aman** — Enkripsi AES-256, JWT, bcrypt
- 📱 **PWA** — Bisa diinstall di HP

---

## ✨ FITUR UTAMA

### 🎯 Untuk Warga (Pengguna Chat)

| Fitur | Deskripsi |
|-------|-----------|
| 💬 **Chat Interaktif** | Tanya jawab dengan AI 24/7 |
| 🎨 **Desain Modern** | UI/UX mobile-friendly |
| ⚡ **Tombol Cepat** | Pertanyaan umum 1-klik |
| 👍 **Rating Jawaban** | Kasih feedback jika jawaban kurang pas |
| 🎙️ **Multi-Bahasa** | Indonesia santai & natural |
| 📲 **PWA** | Install seperti aplikasi native |
| 🌙 **Warna Kustom** | Sesuai tema Kemantren |

### 🛠️ Untuk Admin

| Fitur | Deskripsi |
|-------|-----------|
| 📊 **Dashboard Real-time** | Statistik lengkap aplikasi |
| 🔌 **Multi-Provider AI** | 9 provider + custom endpoint |
| 🎭 **Provider Role System** | chat / embedding / enrichment / query-rewriter |
| 📚 **Upload Pengetahuan** | Upload file .md / .txt |
| 🕸️ **Knowledge Graph** | Visualisasi + semantic enrichment |
| 💾 **Kelola Memori** | Lihat/edit/hapus memori AI |
| ❓ **Tak Terjawab** | Pertanyaan yang belum dijawab AI |
| 🧠 **Auto-Learning** | AI deteksi pertanyaan populer otomatis |
| 🔄 **Unified Learning** | 1x jawab → 5 sistem update |
| ⭐ **Feedback & Analytics** | Statistik kepuasan user |
| 🔔 **Notifikasi** | Alert sistem real-time |
| 🎨 **Theme Kustom** | Ganti warna aplikasi |
| 🖼️ **Logo Branding** | Upload logo instansi |
| 🔐 **Keamanan** | Ganti password, enkripsi AES-256 |
| 💾 **Backup Otomatis** | Backup harian terenkripsi |
| 📱 **Responsive** | Mobile, tablet, desktop |

---

## 🏗️ ARSITEKTUR SISTEM

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                           │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │   CHAT PAGE     │         │   ADMIN DASHBOARD       │   │
│  │   (Public)      │         │   (Login Required)      │   │
│  └────────┬────────┘         └──────────┬──────────────┘   │
└───────────┼─────────────────────────────┼───────────────────┘
            │ HTTPS                       │ HTTPS + JWT
┌───────────▼─────────────────────────────▼───────────────────┐
│                    EXPRESS.JS SERVER                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               MIDDLEWARE LAYER                       │   │
│  │  CORS · Rate Limit · Auth · Enkripsi · Helmet       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CHAT PIPELINE                          │   │
│  │                                                     │   │
│  │  User Query                                         │   │
│  │      │                                              │   │
│  │      ▼                                              │   │
│  │  ┌────────────────┐                                 │   │
│  │  │  CLASSIFIER    │ ← Anti-halusinasi               │   │
│  │  └────────┬───────┘                                 │   │
│  │           ▼                                         │   │
│  │  ┌────────────────┐                                 │   │
│  │  │    MEMORY      │ ← Cek memori lama               │   │
│  │  │    SEARCH      │                                 │   │
│  │  └────────┬───────┘                                 │   │
│  │           ▼ (kosong)                                │   │
│  │  ┌────────────────┐                                 │   │
│  │  │  RAG HYBRID    │ ← BM25 + Embedding + RRF        │   │
│  │  │  + QUERY REWR. │                                 │   │
│  │  └────────┬───────┘                                 │   │
│  │           ▼                                         │   │
│  │  ┌────────────────┐                                 │   │
│  │  │ KNOWLEDGE      │ ← Graph traversal               │   │
│  │  │ GRAPH QUERY    │                                 │   │
│  │  └────────┬───────┘                                 │   │
│  │           ▼                                         │   │
│  │  ┌────────────────┐                                 │   │
│  │  │  AI PROVIDER   │ ← Fallback multi-provider       │   │
│  │  │   (Fallback)   │                                 │   │
│  │  └────────┬───────┘                                 │   │
│  │           ▼                                         │   │
│  │  ┌────────────────┐                                 │   │
│  │  │   TRACKING     │ ← Feedback, Learning, Stats     │   │
│  │  └────────────────┘                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA STORAGE                            │
│                                                             │
│  knowledge/     memory/         data/                       │
│  *.md, *.txt    memory.md       config.json                 │
│                 sessions/       providers.json.enc          │
│                                 knowledge-graph.json        │
│                                 embedding-cache.json        │
│                                 feedback.json               │
│                                 analytics.json              │
│                                 learning-queue.json         │
│                                 unanswered.json             │
│                                 backups/                    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI PROVIDERS                             │
│  Gemini · Groq · OpenRouter · Cerebras · Together           │
│  Mistral · DeepSeek · Fireworks · xAI Grok · Custom         │
│                                                             │
│  Setiap provider bisa punya role:                           │
│  [chat] [embedding] [enrichment] [query-rewriter]           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 ALUR KERJA AI

### 📝 Step-by-Step: Apa yang Terjadi Saat Warga Bertanya?

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: USER MENGIRIM PESAN                                │
│  User: "Syarat membuat KK baru apa?"                        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: RATE LIMIT & VALIDASI                              │
│  • Cek apakah user terlalu sering kirim pesan               │
│  • Validasi panjang pesan (max 2000 karakter)               │
│  • Cek session ID user                                      │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: CLASSIFIER (Anti-Halusinasi)                       │
│  Cek: Apakah pertanyaan relevan dengan Kemantren?           │
│  • Scan kata kunci OUT_OF_SCOPE (politik, jodoh, dll)       │
│  • Scan kata kunci IN_SCOPE (KTP, KK, syarat, dll)          │
│  • Cek kecocokan dengan knowledge chunks                    │
│                                                             │
│  ✅ IN-SCOPE  → lanjut ke STEP 4                            │
│  ❌ OUT-SCOPE → kirim pesan tolak sopan → SIMPAN ke          │
│                  "Tak Terjawab" → selesai                   │
└────────────────────────┬────────────────────────────────────┘
                         ▼ (IN-SCOPE)
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: MEMORY SEARCH (Cek Ingatan Lama)                   │
│  Cari di memori AI apakah pernah jawab pertanyaan serupa    │
│                                                             │
│  Scoring: kata cocok +5, stem +4, bigram +15,               │
│           identik +50, bonus hit +3                         │
│  Threshold: 60 poin                                         │
│                                                             │
│  ✅ COCOK (≥60) → kirim jawaban dari memori                 │
│  ❌ TIDAK      → lanjut ke STEP 5                           │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: RAG HYBRID SEARCH                                  │
│                                                             │
│  a) QUERY REWRITING (via LLM, opsional)                     │
│     "syarat kk baru ilang" → "syarat KK, KK hilang"         │
│                                                             │
│  b) BM25 SEARCH (Layer 1 — keyword)                         │
│     • Index dokumen, term frequency                         │
│     • IDF × TF normalization                                │
│     • Ambil top 15                                          │
│                                                             │
│  c) SEMANTIC SEARCH (Layer 2 — embedding)                   │
│     • Query → vector via provider embedding                 │
│     • Cosine similarity dengan chunk vectors                │
│     • Ambil top 15                                          │
│                                                             │
│  d) RRF FUSION                                              │
│     • Gabungkan hasil BM25 + Semantic                       │
│     • Reciprocal Rank Fusion (k=60)                         │
│     • Ambil top 6                                           │
│                                                             │
│  e) CACHE (opsional)                                        │
│     • Kalau query ini pernah ditanya <1 jam → cache hit     │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: KNOWLEDGE GRAPH TRAVERSAL                          │
│  • Ekstrak entitas dari query via NLP lokal                 │
│  • Cari node yang cocok di graph                            │
│  • Ambil neighbor (depth 1) sebagai konteks tambahan        │
│  • Contoh: "KK" → terkait "KTP", "akta", "kelahiran"        │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: KIRIM KE AI PROVIDER (Fallback)                    │
│                                                             │
│  System Prompt + Konteks (RAG+Graph) + Pertanyaan User      │
│                                                             │
│  Coba provider satu per satu (role: chat):                  │
│  1. Gemini 2.0 Flash                                        │
│  2. Gemini Flash Latest                                     │
│  3. Groq llama-3.3-70b                                      │
│  4. OpenRouter llama-3.3-70b:free                           │
│  ...dst sampai berhasil                                     │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 8: BERSIHKAN FORMAT (cleanAIText)                     │
│  • Hapus ** ** (bold markdown)                              │
│  • Hapus ## ## (heading markdown)                           │
│  • Hapus ` ` (code markdown)                                │
│  • Convert - item → • item                                  │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 9: STREAMING KE USER                                  │
│  Kirim per 8 karakter untuk efek mengetik                   │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 10: TRACKING & LEARNING                               │
│  • Kalau AI menolak → catat ke "Tak Terjawab"               │
│  • Kalau RAG confidence ≥70 → simpan ke memori              │
│  • Update analytics (totalChats, dll)                       │
│  • Tampilkan tombol feedback 👍👎                           │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 11: USER BERI FEEDBACK (Opsional)                     │
│  • User klik 👍 → simpan sebagai "Good Example"             │
│  • User klik 👎 → simpan sebagai "Bad Example"              │
│  • Admin bisa lihat di dashboard                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 STRUKTUR FOLDER

```
MAGANG PSI/
│
├── 📄 .env                      # Environment variables (RAHASIA!)
├── 📄 .env.example              # Template environment
├── 📄 .gitignore                # Git ignore rules
├── 📄 index.js                  # Main server file
├── 📄 package.json              # Dependencies
├── 📄 package-lock.json         # Lock file
├── 📄 README.md                 # Dokumentasi ini
├── 📄 CHANGELOG.md              # Riwayat perubahan
│
├── 📂 lib/                      # Library modules (OTAK AI)
│   ├── providers.js             # Multi-provider AI manager
│   ├── provider-role.js         # Role system (chat/embed/enrich/rewrite)
│   ├── memory.js                # Memory + stemming Indonesia
│   ├── classifier.js            # Anti-halusinasi classifier
│   ├── feedback.js              # Feedback & analytics
│   ├── learning.js              # Auto-learning engine
│   ├── summarizer.js            # Auto-summarization & insight
│   │
│   ├── 🆕 rag-bm25.js           # RAG Layer 1: BM25 keyword search
│   ├── 🆕 rag-embedding.js      # RAG Layer 2: Semantic (embedding)
│   ├── 🆕 rag-hybrid.js         # RAG Fusion (RRF) + Query Rewriting
│   ├── 🆕 rag-cache.js          # Cache query populer
│   │
│   ├── 🆕 graph-engine.js       # Knowledge Graph (graphology)
│   ├── 🆕 graph-enricher.js     # Triple extraction via LLM
│   │
│   └── 🆕 unified-learning.js   # Pipeline 1x jawab → 5 sistem update
│
├── 📂 data/                     # Data storage
│   ├── config.json              # Konfigurasi aplikasi
│   ├── providers.json.enc       # API keys (encrypted AES-256)
│   ├── unanswered.json          # Pertanyaan tak terjawab
│   ├── feedback.json            # Feedback user
│   ├── analytics.json           # Data analytics
│   ├── learning-queue.json      # Antrian auto-learning
│   ├── 🆕 knowledge-graph.json  # Knowledge Graph (nodes + edges)
│   ├── 🆕 embedding-cache.json  # Cache embedding (7 hari TTL)
│   └── 📂 backups/              # Backup otomatis
│       └── backup-*.zip.enc
│
├── 📂 knowledge/                # Buku pengetahuan (RAG)
│   ├── buku-pengetahuan.md      # Konten pengetahuan utama
│   └── Buku Panduan.txt         # Sumber tambahan
│
├── 📂 memory/                   # Memori AI
│   ├── memory.md                # Memori Q&A tervalidasi
│   └── 📂 sessions/             # Sesi percakapan aktif
│       └── sess_*.json
│
├── 📂 logs/                     # Log sistem
│   └── notifications.json       # Riwayat notifikasi
│
├── 📂 public/                   # Frontend files
│   ├── index.html               # HTML halaman utama
│   ├── script.js                # JavaScript frontend
│   ├── style.css                # CSS styling
│   ├── sw.js                    # Service Worker (PWA)
│   ├── manifest.json            # PWA manifest
│   └── 📂 uploads/              # Upload file user
│       └── logo.png
│
└── 📂 tmp/                      # Temporary files
```

---

## 🚀 INSTALASI & SETUP

### 📋 Persyaratan Sistem

| Requirement | Minimum | Rekomendasi |
|-------------|---------|-------------|
| **Node.js** | v20.0.0 | v22+ |
| **NPM** | v10.0.0 | v11+ |
| **RAM** | 2 GB | 4 GB+ |
| **Storage** | 500 MB | 1 GB+ |
| **OS** | Windows 10 / Ubuntu 20.04 | Windows 11 / Ubuntu 22.04 |

### 🔧 Langkah Instalasi

#### 1. Clone Repository
```bash
git clone https://github.com/julmensir/Magang-PSI.git
cd Magang-PSI
```

#### 2. Install Dependencies
```bash
npm install
```

Dependencies:
- `express` — Web framework
- `@google/genai` — Google Gemini SDK
- `graphology` — Knowledge Graph
- `compromise` — NLP lokal (ekstraksi entitas)
- `bcrypt` — Password hashing
- `jsonwebtoken` — JWT auth
- `cookie-parser`, `cors`, `helmet` — Middleware
- `express-rate-limit` — Rate limiting
- `multer` — Upload file
- `adm-zip` — Backup
- `node-cron` — Scheduled tasks
- `dotenv` — Environment variables

#### 3. Setup Environment Variables
Copy `.env.example` ke `.env`:
```bash
copy .env.example .env
```

Generate `JWT_SECRET` & `ENCRYPTION_KEY` (jalankan 2x):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GantiPasswordAnda123!
JWT_SECRET=<hasil_generate_1>
ENCRYPTION_KEY=<hasil_generate_2>
```

#### 4. Tambahkan Buku Pengetahuan
Buat `knowledge/buku-pengetahuan.md`:
```markdown
# Buku Pengetahuan SIVT AI

## Syarat Membuat KK Baru

Kata kunci : syarat membuat KK baru, cara urus KK
Pertanyaan : Syarat membuat KK baru

Jawaban : Untuk membuat KK baru, siapkan:
• Surat pengantar RT/RW (asli)
• Fotokopi KTP suami dan istri
• Fotokopi Buku Nikah atau Akta Perkawinan
• Formulir permohonan KK (diisi di kantor)
• Fotokopi Akta Kelahiran anak (jika ada)

Semua proses GRATIS dan selesai dalam 1-3 hari kerja.
```

**Format penting**: setiap topik dipisah `##`, ada `Kata kunci :` dan `Jawaban :`.

---

## ⚙️ KONFIGURASI ENVIRONMENT

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `PORT` | ✅ | Port server (default 3000) |
| `NODE_ENV` | ✅ | `production` / `development` |
| `ADMIN_USERNAME` | ✅ | Username admin login |
| `ADMIN_PASSWORD` | ✅ | Password admin (plain text) |
| `ADMIN_PASSWORD_HASH` | ⚠️ | Auto-generated oleh sistem |
| `JWT_SECRET` | ✅ | Secret JWT (min 32 char) |
| `ENCRYPTION_KEY` | ✅ | Key AES-256 (64 char hex) |

### 🔐 Auto-Migration Password

Saat pertama start, sistem akan:
1. Deteksi `ADMIN_PASSWORD` plain text
2. Auto-hash dengan bcrypt
3. Simpan sebagai `ADMIN_PASSWORD_HASH`
4. Restart server untuk efek penuh

---

## 🎬 CARA MENJALANKAN

### 🚀 Mode Production
```bash
npm start
```

Output:
```
[FEEDBACK] 40 feedback dimuat.
[LEARNING] 3 pertanyaan di learning queue.
============================================
SIVT AI siap di http://localhost:3000
Provider AI    : 5 terdaftar (5 aktif)
  1. [✓] Google Gemini [chat,embedding] → gemini-2.0-flash
  2. [✓] Groq [chat,query-rewriter] → llama-3.3-70b-versatile
  3. [✓] OpenRouter [chat] → meta-llama/llama-3.3-70b:free
Memori         : 36 item
Knowledge      : 88 chunk
Unanswered     : 1 pending
Graph          : 234 nodes, 567 edges
RAG Hybrid     : BM25=88 docs, Embedding=88 vecs
============================================
```

### 🛑 Stop Server
Tekan `Ctrl+C` — server menyimpan semua sesi & graph sebelum keluar.

### 🌐 Akses Aplikasi
- **Chat (Public)**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000 → klik ⚙️ kanan atas

### 🌍 Akses dari LAN (HP)
1. Cari IP lokal: `ipconfig` → IPv4 Address
2. Buka di HP: `http://192.168.x.x:3000`
3. Allow Node.js di Windows Firewall

---

## 🎛️ PANDUAN ADMIN DASHBOARD

### 🔐 Cara Login
1. Buka `http://localhost:3000`
2. Klik ikon **⚙️** (kanan atas chat header)
3. Masukkan username & password dari `.env`

### 📊 Menu Dashboard

| Menu | Fungsi |
|------|--------|
| **📊 Dashboard** | Statistik & ringkasan aplikasi |
| **⚙️ Umum** | Identitas AI, kontak, sambutan |
| **🖼️ Logo & Branding** | Upload logo instansi |
| **🎨 Warna Tema** | Kustom warna aplikasi |
| **🔌 Provider AI** | Kelola provider + role system |
| **💬 Prompt AI** | Atur system instruction AI |
| **📚 Pengetahuan** | Upload & kelola buku pengetahuan |
| **🕸️ Knowledge Graph** | Visualisasi + semantic enrichment |
| **❓ Tak Terjawab** | Pertanyaan yang tidak bisa dijawab AI |
| **🧠 Auto-Learning** | Antrian belajar dari pertanyaan populer |
| **⭐ Feedback & Akurasi** | Statistik kepuasan & akurasi |
| **💾 Memori AI** | Kelola memori AI |
| **💬 Percakapan** | Sesi percakapan aktif |
| **🔔 Notifikasi** | Riwayat notifikasi sistem |
| **💾 Backup** | Backup & restore data |
| **🔐 Keamanan** | Ganti password admin |

### 📊 Dashboard Stat

| Stat | Deskripsi |
|------|-----------|
| 🔌 **Provider AI** | Total & berapa aktif |
| 📚 **Chunk Pengetahuan** | Jumlah chunk di buku |
| 💾 **Memori AI** | Total memori & total hit |
| 💬 **Sesi Aktif** | Sesi aktif & total pesan |
| ⭐ **Kepuasan User** | % feedback positif |
| ✅ **Akurasi Jawaban** | % jawaban berhasil |
| ❓ **Tak Terjawab** | Pertanyaan pending |
| 🔔 **Notifikasi** | Belum dibaca |
| 🕸️ **Graph Nodes** | Total node knowledge graph |
| 🔗 **Graph Edges** | Total edge knowledge graph |

Ditambah:
- **Chart aktivitas 7 hari**
- **RAG Hybrid Stats** (BM25 docs, embedding vecs, cache size, hit rate)
- **Status provider**
- **Antrian belajar**

---

## 🔌 MULTI-PROVIDER AI & ROLE SYSTEM

### 🎭 Provider Role System 🆕

Setiap provider bisa punya **1 atau lebih role**:

| Role | Fungsi |
|------|--------|
| 🗨️ **chat** | Menjawab user (LLM utama) |
| 📐 **embedding** | Ubah teks jadi vector untuk RAG semantic |
| ✨ **enrichment** | Ekstrak triple (subjek-predikat-objek) ke Graph |
| 🔄 **query-rewriter** | Rewrite pertanyaan user agar RAG lebih akurat |

**1 provider bisa punya beberapa role sekaligus.** Contoh:
- **Gemini** → `chat` + `embedding` + `enrichment` (all-rounder)
- **Groq** → `chat` + `query-rewriter` (tercepat)
- **Mistral** → `chat` + `enrichment` (fallback bagus)

**Cara setting**: di tabel provider, klik badge role untuk toggle on/off.

### 🌐 9 Provider Built-in

| Provider | Gratis? | Link Daftar |
|----------|---------|-------------|
| Google Gemini | ✅ | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| Groq | ✅ | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenRouter | ✅ | [openrouter.ai/keys](https://openrouter.ai/keys) |
| Cerebras | ✅ | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| Together AI | 💰 | [api.together.xyz](https://api.together.xyz) |
| Mistral AI | ✅ | [console.mistral.ai](https://console.mistral.ai) |
| DeepSeek | 💰 | [platform.deepseek.com](https://platform.deepseek.com) |
| Fireworks AI | 💰 | [fireworks.ai](https://fireworks.ai) |
| xAI Grok | 💰 | [console.x.ai](https://console.x.ai) |

### 🔧 Provider Custom (OpenAI-compatible)

Contoh untuk **Ollama Lokal**:
| Field | Nilai |
|-------|-------|
| Nama | `ollama` |
| Custom Endpoint | `http://localhost:11434/v1` |
| API Key | `ollama` |
| Models | `llama3.2,mistral,qwen2.5` |

### 🎯 Fallback Logic

```
Provider 1, Model 1 → FAIL (429)
Provider 1, Model 2 → FAIL (404)
Provider 1, Model 3 → OK  ✅ SELESAI
   (kalau semua fail → provider 2)
```

| Error | Tindakan |
|-------|----------|
| 401 | API key invalid → coba provider lain |
| 429 | Kuota habis → coba provider lain |
| 404 | Model tidak ada → coba model lain |
| 503 | Server sibuk → coba provider lain |

---

## 📚 SISTEM PENGETAHUAN (RAG HYBRID) 🆕

### 🎯 Konsep RAG Hybrid

**RAG** (Retrieval-Augmented Generation) — Ambil dulu dari database, baru kirim ke AI.

**Hybrid** — Gabungkan **2 metode pencarian** + **fusion**:

```
User Query
   ↓
[Query Rewriting] ← LLM ubah ke keyword
   ↓
┌────────────────┬────────────────┐
│  BM25 SEARCH   │  SEMANTIC      │
│  (keyword)     │  (embedding)   │
└────────┬───────┴────────┬───────┘
         ↓                ↓
    [RRF FUSION] ← Gabungkan hasil
         ↓
   Top 6 Chunk
         ↓
   Kirim ke AI + Konteks
```

### 📐 Layer 1: BM25 Search

Implementasi **BM25 (Best Match 25)** — standar industri untuk keyword search:

- `K1 = 1.5` — term frequency saturation
- `B = 0.75` — length normalization
- `IDF = log(1 + (N - df + 0.5) / (df + 0.5))`

**Kelebihan**: Akurat untuk kata kunci spesifik (KTP, KK, syarat).

### 🧠 Layer 2: Semantic Search

Ubah teks jadi **vector** via provider embedding, lalu hitung **cosine similarity**.

**Kelebihan**: Paham makna, bukan cuma kata. Contoh:
- "cara bikin kk" ≈ "syarat membuat kartu keluarga" (beda kata, makna sama)

### 🔀 RRF Fusion

**Reciprocal Rank Fusion (RRF)** — gabungkan ranking dari 2 sumber:

```
RRF_score(d) = Σ 1 / (k + rank(d))
```

`k = 60` (konstanta standar).

**Hasil**: chunk yang muncul di **kedua** ranking dapat skor tinggi.

### 🔄 Query Rewriting 🆕

Ubah pertanyaan user jadi **keyword pencarian** via LLM:

| Input | Output |
|-------|--------|
| "cara bikin KTP yang ilang gimana ya?" | "syarat KTP hilang, prosedur penggantian" |
| "jam buka kantor hari sabtu?" | "jam pelayanan sabtu, jam operasional" |

### ⚡ Smart Cache

Query populer di-cache **1 jam**. Query mirip → cache hit → hemat token + cepat.

### 📊 Confidence Level

| Top Score | Confidence | Aksi |
|-----------|-----------|------|
| ≥ 0.03 | 100% | Kirim jawaban |
| ≥ 0.02 | 70% | Kirim jawaban |
| ≥ 0.015 | 40% | Kirim dengan konteks terbatas |
| < 0.015 | 0% | Kirim suggestions |

### 🎛️ Rebuild RAG Index

Kalau upload pengetahuan baru tapi RAG belum update:
1. Dashboard → **RAG Hybrid Stats** → **Rebuild RAG Index**
2. Sistem akan re-embed semua chunk (butuh provider role `embedding`)

---

## 🕸️ KNOWLEDGE GRAPH (GRAPH RAG) 🆕

### 🎯 Konsep

**Knowledge Graph** menyimpan **relasi antar konsep** dalam bentuk:

```
[Subjek] ──predikat──> [Objek]
```

Contoh:
```
[KK]  ──memerlukan──>  [KTP]
[KK]  ──memerlukan──>  [Akta Kelahiran]
[KTP] ──berlaku untuk──> [Warga 17+]
```

### 🛠️ Cara Kerja

1. **Ekstraksi entitas** via NLP lokal (`compromise`) — ambil kata benda penting
2. **Ekstraksi relasi** (co-occurrence) — kata benda yang muncul bareng jadi edge
3. **Semantic triple extraction** via LLM (`graph-enricher.js`) — relasi lebih cerdas
4. **Traversal** saat user bertanya — ambil konteks dari node sekitar

### ✨ Semantic Enrichment (Beta)

Menu **Knowledge Graph** → **Mulai Enrich**:

- Proses N chunk (default 30)
- Kirim ke provider role `enrichment`
- LLM ekstrak triple → tambahkan edge semantic
- **Hemat**: pakai provider gratis (Gemini/Groq) untuk enrichment

### 🎨 Visualisasi

- Node = konsep (makin besar = makin penting)
- Edge = relasi (makin tebal = makin kuat)
- Klik node → lihat detail + neighbor
- Search box untuk cari node

### 📊 Auto-Save

Graph disimpan otomatis ke `data/knowledge-graph.json` tiap 60 detik kalau ada perubahan.

---

## 💾 SISTEM MEMORI AI

### 🎯 Konsep

Memori menyimpan **Q&A tervalidasi** dari percakapan. AI cek memori **SEBELUM** RAG.

**Keuntungan**:
- 🚀 Respon lebih cepat
- 💰 Hemat token API
- 🎯 Jawaban konsisten

### 📊 Threshold

| Setting | Default | Fungsi |
|---------|---------|--------|
| `memoryMinScore` | 60 | Min skor untuk **pakai** memori |
| `memorySaveThreshold` | 40 | Min skor untuk **simpan** baru |

### ✅ Syarat Simpan ke Memori

Jawaban baru disimpan **hanya jika**:
- ✅ Panjang ≥50 karakter
- ✅ Tidak diakhiri `:`
- ✅ Tidak diakhiri `...`
- ✅ Bukan refusal
- ✅ RAG confidence ≥70%

### 🔤 Variasi Pertanyaan

Memori mendukung **variasi**:
```
Pertanyaan  : syarat membuat kk baru
Variasi     : syarat kk baru, cara buat kk, syarat bikin kk
```

### 📈 Hit Counter

Setiap dipakai, `hit` bertambah. Semakin sering → bonus skor.

---

## 🛡️ ANTI-HALUSINASI (CLASSIFIER)

### 🎯 Konsep

Sebelum AI menjawab, **Classifier** cek apakah pertanyaan:
1. **Relevan dengan Kemantren** → Lanjut
2. **Di luar topik** → Tolak sopan

### 🚫 Out-of-Scope Keywords

```
politik, presiden, pemilu, partai
cuaca, ramalan, zodiak, horoskop
saham, crypto, bitcoin, trading
jodoh, mantan, pacar
game, ml, pubg, free fire
film, artis, selebgram
resep, masak, kue
obat, penyakit, dokter
sim, stnk, bpkb
```

### ✅ In-Scope Keywords

```
ktp, kk, kartu keluarga, akta, akte
kelahiran, kematian, pernikahan, nikah
pindah, domisili, usaha, umkm
surat, keterangan, pengantar
kemantren, tegalrejo, kelurahan
syarat, biaya, gratis, jam
alamat, kontak, telepon
```

### 🧠 Logika Keputusan

| Kondisi | Hasil |
|---------|-------|
| Ada OUT + tidak ada IN | ❌ Redirect |
| Ada IN | ✅ Proceed |
| Ada knowledge match | ✅ Proceed |
| Tidak ada keyword | ⚠️ Proceed with caution |

---

## 🎓 AUTO-LEARNING SYSTEM

### 🎯 Konsep

Deteksi pertanyaan **populer** yang sering ditanya tapi belum ada di pengetahuan.

### 📊 Frekuensi → Prioritas

| Frekuensi | Prioritas | Ikon |
|-----------|-----------|------|
| ≥10x | 🚨 Urgent | Merah |
| ≥5x | ⚠️ Tinggi | Orange |
| ≥3x | 📌 Sedang | Biru |
| <3x | ℹ️ Normal | Abu |

### 🔍 Similarity Detection

**Levenshtein Distance** untuk deteksi pertanyaan mirip. Threshold: **85%**.

```
"Syarat KK baru"     ← 100%
"syarat membuat kk"   ← 85% (dianggap sama)
"cara buat kk baru"   ← 78% (dianggap sama)
"KTP hilang"          ← 20% (beda)
```

### 📝 Variant Collection

Setiap pertanyaan mirip disimpan sebagai variant:
```json
{
  "question": "syarat membuat kk baru",
  "variants": ["syarat membuat kk", "cara buat kk baru"],
  "count": 15,
  "priority": "urgent"
}
```

---

## 🔄 UNIFIED LEARNING PIPELINE 🆕

### 🎯 Konsep

**1x jawab admin = 5 sistem terupdate otomatis:**

Saat admin jawab pertanyaan di menu **"Tak Terjawab"** atau **"Auto-Learning"**:

1. ✅ **Buku Pengetahuan** — Append otomatis ke `buku-pengetahuan.md`
2. ✅ **Knowledge Graph** — Update incremental (+ nodes, + edges)
3. ✅ **Auto-Learning Queue** — Tandai resolved
4. ✅ **Pertanyaan Tak Terjawab** — Tandai resolved
5. ✅ **Semantic Triple** — Ekstrak triple baru via LLM (opsional)

### 🚀 Cara Pakai

1. Buka menu **Tak Terjawab** atau **Auto-Learning**
2. Klik **➕ Tambah Jawaban**
3. Isi kategori (opsional)
4. Isi **jawaban lengkap** (min 20 karakter)
5. Klik **Simpan & Update Semua**
6. Lihat progress pipeline di modal:
   ```
   ✅ Buku Pengetahuan terupdate
   ✅ Knowledge Graph +12 edges
   ✅ Resolved: Tak Terjawab ✓ Auto-Learning ✓
   ✅ Semantic: 4 triple diekstrak
   ```

### 💡 Kenapa Powerful?

Tanpa unified pipeline, admin harus:
- Append manual ke `.md`
- Rebuild graph
- Tandai resolved di 2 tempat
- Trigger enrichment manual

Dengan unified: **1 klik, semua selesai**.

---

## ⭐ FEEDBACK & ANALYTICS

### 👍 Feedback User

Setiap jawaban AI, user bisa kasih:
- 👍 **Berguna**
- 👎 **Kurang tepat**

### 📊 Analytics Tracking

| Event | Kapan |
|-------|-------|
| `totalChats` | Setiap chat |
| `totalAnswers` | AI berhasil jawab |
| `totalRefusals` | AI menolak jawab |
| `totalMemoryHits` | Jawaban dari memori |
| `totalRagHits` | Jawaban dari RAG |
| `totalOutOfScope` | Out of topik |

### 📈 Akurasi Formula

```
Akurasi = (Total Answers - Total Refusals) / Total Answers × 100%
```

---

## 🔐 KEAMANAN

| Data | Metode |
|------|--------|
| API Keys (`providers.json.enc`) | AES-256-GCM |
| Backup files | AES-256 |
| Password admin | bcrypt (10 rounds) |
| JWT Token | HS256 |
| Cookies | httpOnly, sameSite=lax |

### 🚦 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/*` | 500 req / 15 menit |
| `/api/chat` | 20 req / menit |
| `/api/admin/login` | 10 req / 15 menit |

### 🛡️ File Protection

File ini **tidak bisa diakses publik**: `.env`, `data/*.json`, `data/*.enc`, `knowledge/*`, `memory/*`, `logs/*`.

---

## 🔌 API ENDPOINTS

### 🌐 Public Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/config/public` | Config publik |
| GET | `/api/health` | Health check |
| GET | `/api/topics` | Daftar topik |
| POST | `/api/chat` | Chat dengan AI (SSE) |
| POST | `/api/feedback` | Kirim feedback |

### 🔐 Admin Endpoints (JWT Required)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/admin/login` | Login |
| POST | `/api/admin/logout` | Logout |
| GET | `/api/admin/check` | Cek session |
| GET/POST | `/api/admin/config` | Config |
| GET | `/api/admin/dashboard/stats` | Stats |
| POST | `/api/admin/providers/add` | Tambah provider |
| POST | `/api/admin/providers/remove` | Hapus provider |
| POST | `/api/admin/providers/toggle` | Toggle on/off |
| POST | `/api/admin/providers/update-models` | Update models |
| POST | `/api/admin/providers/update-key` | Update API key |
| POST | `/api/admin/providers/update-roles` | 🆕 Update roles |
| POST | `/api/admin/providers/test` | Test koneksi |
| GET | `/api/admin/knowledge/...` | Kelola pengetahuan |
| GET | `/api/admin/memory` | Lihat memori |
| POST | `/api/admin/memory/delete` | Hapus memori |
| GET | `/api/admin/unanswered` | Tak terjawab |
| POST | `/api/admin/unified/add-to-knowledge` | 🆕 Unified pipeline |
| GET | `/api/admin/learning/queue` | Learning queue |
| GET | `/api/admin/feedback/stats` | Stats feedback |
| GET | `/api/admin/graph/visualize` | 🆕 Data graph |
| GET | `/api/admin/graph/node/:id` | 🆕 Detail node |
| POST | `/api/admin/graph/enrich` | 🆕 Enrich via AI |
| GET | `/api/admin/rag/stats` | 🆕 RAG stats |
| POST | `/api/admin/rag/rebuild` | 🆕 Rebuild index |
| GET | `/api/admin/notifications` | Notifikasi |
| POST | `/api/admin/backup` | Backup manual |
| POST | `/api/admin/change-password` | Ganti password |

### 📡 Chat API (SSE)

**Request**:
```json
POST /api/chat
{ "message": "Syarat membuat KK?", "sessionId": "sess_xxx" }
```

**Response Stream**:
```
data: {"sessionId":"sess_xxx"}
data: {"meta":{"source":"ai","context":6,"confidence":100}}
data: {"meta":{"provider":"Mistral AI","model":"open-mistral-nemo"}}
data: {"delta":"Untuk"}
data: {"delta":" membuat"}
data: {"delta":" KK baru..."}
data: {"done":true}
```

---

## 🐛 TROUBLESHOOTING

### Error: `Cannot find module 'X'`
**Solusi**: `npm install`

### Error: `EADDRINUSE`
**Solusi**: Ganti port di `.env` → `PORT=3001`

### Error: `FATAL: JWT_SECRET tidak ada`
**Solusi**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Paste hasilnya ke `.env`.

### AI Tidak Menjawab
**Cek**:
1. Log terminal — cari `[FAIL]`
2. Menu **Provider AI** → **Test**
3. Error 401 → API key salah
4. Error 429 → Kuota habis
5. Error 404 → Model tidak ada

### RAG Tidak Temukan Chunk
**Solusi**:
1. Upload file `.md` / `.txt` di **Pengetahuan**
2. Klik **Reload**
3. **Rebuild RAG Index** dari dashboard

### Graph Kosong / Tidak Muncul Node
**Solusi**:
1. Pastikan sudah upload pengetahuan
2. Graph dibangun otomatis saat load knowledge
3. Atau klik **Rebuild Graph** di menu Graph

### Enrichment Gagal
**Solusi**:
1. Pastikan ada provider role `enrichment`
2. Kalau tidak ada, provider `chat` akan dipakai
3. Test dengan 5 chunk dulu

### Memori Tidak Bekerja
**Cek**:
1. Menu **Memori AI** — ada data?
2. Threshold `memoryMinScore` — default 60
3. 50-60 untuk akurasi, 40-50 untuk responsif

### Model Gemini/Groq Tidak Ada
**Error**: `HTTP 404: Model tidak tersedia`
**Solusi**: Menu Provider → ✏️ Edit Model → update ke model terbaru.

### Reset Provider Lama
```bash
del data\providers.json.enc
npm start
```
Lalu tambah ulang via dashboard.

### Backup Tidak Jalan
**Cek**:
1. Log terminal — cari `[CRON]`
2. Backup otomatis jam **02:00** — server harus nyala
3. Manual: klik **Backup Sekarang**

---

## 📈 TIPS & BEST PRACTICES

### 🎯 Untuk Akurasi AI
1. **Buku pengetahuan lengkap** — semakin lengkap semakin akurat
2. **Format konsisten** — selalu pakai `Kata kunci :` & `Jawaban :`
3. **Variasi kata kunci** — tambahkan sinonim & typo umum
4. **Update berkala** — cek "Tak Terjawab" tiap minggu
5. **Enrich graph** — pakai LLM untuk triple semantic

### 💰 Hemat Token API
1. **Memory threshold 60** — jawaban populer dari memori
2. **RAG confidence 70** — hanya kirim kalau yakin
3. **Provider gratis dulu** — Gemini, Groq, OpenRouter
4. **Query cache** aktif — query populer dari cache
5. **Pilih provider role tepat**:
   - `chat` → Gemini (cepat & pintar)
   - `embedding` → Gemini text-embedding-004 (gratis)
   - `query-rewriter` → Groq (paling cepat)
   - `enrichment` → Gemini/Groq (jarang dipakai)

### 🔒 Keamanan
1. **Ganti password default** — jangan `admin123`
2. **Random JWT_SECRET** — 64 char hex
3. **Random ENCRYPTION_KEY** — 64 char hex
4. **Backup rutin** — minimal 1x per minggu
5. **Update dependencies** — `npm update` tiap bulan

### 🚀 Performa
1. **Restart server** kalau memory leak
2. **Backup lama dihapus** — retention 30 hari
3. **Session cleanup** — auto 2 jam
4. **Monitor log** — cek output `npm start`
5. **Rebuild RAG** kalau lambat — mungkin index korup

---

## 🎓 KONSEP PENTING

### RAG vs Memory vs AI vs Graph

| Aspek | RAG | Memory | AI | Graph |
|-------|-----|--------|-----|-------|
| **Sumber** | Buku pengetahuan | Q&A lama | LLM | Relasi antar konsep |
| **Kecepatan** | Cepat | Sangat cepat | Tergantung API | Sangat cepat |
| **Biaya** | Gratis | Gratis | Bayar | Gratis |
| **Akurasi** | 100% dari buku | 100% dari sebelumnya | Bisa halusinasi | 100% dari relasi |
| **Kapan** | Pertanyaan baru | Pertanyaan mirip | Umum | Konteks tambahan |

### 🔀 Flow Optimasi

```
Pertanyaan Populer  → Memory (Cepat + Hemat)
Pertanyaan Mirip    → RAG Hybrid (Akurat + Gratis)
Pertanyaan Umum     → AI + Graph (Fleksibel + Kontekstual)
Pertanyaan Out      → Tolak (Sopan)
Jawaban Admin       → Unified Pipeline (5 sistem update)
```

---

## ❓ FAQ (FREQUENTLY ASKED QUESTIONS)

**Q: Apakah bisa offline?**
A: Tidak sepenuhnya. Butuh internet untuk akses AI provider. UI bisa diakses via PWA offline.

**Q: Berapa biaya operasional?**
A: Minimal. Kalau pakai provider gratis (Gemini, Groq, OpenRouter), bisa **Rp 0**.

**Q: Apakah data warga disimpan?**
A: Yang disimpan hanya pertanyaan populer (di memori & learning queue). **Data pribadi warga TIDAK disimpan.**

**Q: Bisa dipakai instansi lain?**
A: Bisa. Ganti nama AI, logo, dan isi buku pengetahuan sesuai instansi.

**Q: Bagaimana kalau AI salah jawab?**
A: Admin bisa koreksi lewat menu "Tak Terjawab", "Auto-Learning", atau "Memori AI".

**Q: Support Bahasa Jawa?**
A: Bisa ditambahkan di `systemInstruction` prompt AI.

**Q: Berapa lama setup awal?**
A: ~15-30 menit untuk instalasi + tambah 1 provider + upload pengetahuan dasar.

**Q: Bisa jalan di HP?**
A: Ya. Buka di browser HP, atau install sebagai PWA (Add to Home Screen).

**Q: Apa itu RAG Hybrid?**
A: Gabungan 2 metode pencarian (BM25 keyword + Semantic embedding) dengan RRF Fusion. Lebih akurat dari RAG biasa.

**Q: Apa itu Knowledge Graph?**
A: Struktur relasi antar konsep (contoh: "KK memerlukan KTP"). Membantu AI paham konteks lebih dalam.

**Q: Apa itu Unified Learning Pipeline?**
A: Fitur di mana 1x admin jawab pertanyaan = otomatis update 5 sistem (buku pengetahuan, graph, learning queue, unanswered, semantic triple).

**Q: Apa itu Provider Role System?**
A: Setiap provider AI bisa punya role berbeda: chat, embedding, enrichment, query-rewriter. 1 provider bisa punya banyak role.

---

## 📞 KONTAK & LISENSI

### 🏢 Kemantren Tegalrejo

- 📍 **Alamat**: Jl. Tegalrejo No.1, Tegalrejo, Kota Yogyakarta, DIY 55241
- 🧭 **Patokan**: dekat Pasar Tegalrejo, seberang SMP Negeri, ±500 m dari Jalan Magelang
- 🚌 **Transportasi**: Trans Jogja jalur 2A/2B, turun di halte Tegalrejo
- 📞 **Telepon**: (0274) 123456
- 📱 **WhatsApp**: 0812-3456-7890
- ✉️ **Email**: kemantren.tegalrejo@jogjakota.go.id
- 🌐 **Website**: tegalrejo.jogjakota.go.id
- 📸 **Instagram**: @kemantren.tegalrejo

### 🕐 Jam Pelayanan

| Hari | Jam |
|------|-----|
| Senin – Jumat | 08.00 – 15.00 WIB |
| Istirahat | 12.00 – 13.00 WIB |
| Sabtu | 08.00 – 12.00 WIB |
| Minggu & Libur | TUTUP |

### 🚨 Kontak Darurat

| Layanan | Nomor |
|---------|-------|
| Ambulans | 118 |
| Polisi | 110 |
| Pemadam Kebakaran | 113 |
| SAR | 115 |
| PLN | 123 |
| PDAM | (0274) 1234567 |

> ✅ **Semua layanan administrasi di Kemantren Tegalrejo GRATIS.** Kalau ada pihak yang minta biaya, laporkan ke **(0274) 123456**.

### 📄 Lisensi

**ISC License** — Bebas digunakan untuk keperluan internal Kemantren Tegalrejo Yogyakarta.

🔗 Repository: [https://github.com/julmensir/Magang-PSI](https://github.com/julmensir/Magang-PSI)

---

## 🙏 TERIMA KASIH

Aplikasi ini dibuat untuk mempermudah warga Kemantren Tegalrejo dalam mengakses informasi layanan administrasi kependudukan.

**Semoga bermanfaat!** 🇮🇩

---

*README ini dibuat dengan ❤️ untuk SIVT AI — Sistem Informasi Virtual TEGALREJO*

*Last updated: 2026 | Version 2.1.0*