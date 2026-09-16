# SIVT AI — Sistem Informasi Virtual TEGALREJO

> **AI Chatbot Multi-Provider dengan RAG, Memory, Auto-Learning, dan Feedback System untuk Kemantren Tegalrejo Yogyakarta**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

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
10. [Multi-Provider AI](#-multi-provider-ai)
11. [Sistem Pengetahuan (RAG)](#-sistem-pengetahuan-rag)
12. [Sistem Memori AI](#-sistem-memori-ai)
13. [Anti-Halusinasi (Classifier)](#-anti-halusinasi-classifier)
14. [Auto-Learning System](#-auto-learning-system)
15. [Feedback & Analytics](#-feedback--analytics)
16. [Keamanan](#-keamanan)
17. [API Endpoints](#-api-endpoints)
18. [Troubleshooting](#-troubleshooting)
19. [Tips & Best Practices](#-tips--best-practices)
20. [Kontak & Lisensi](#-kontak--lisensi)

---

## 🎯 TENTANG APLIKASI

**SIVT AI** (Sistem Informasi Virtual TEGALREJO) adalah asisten virtual berbasis AI yang dirancang khusus untuk **Kemantren Tegalrejo, Yogyakarta**. Aplikasi ini membantu warga mendapatkan informasi tentang layanan administrasi kependudukan seperti KTP, KK, Akta Kelahiran, dan lain-lain.

### Keunggulan Utama

- 🧠 **AI yang Akurat** — Tidak mengarang jawaban (anti-halusinasi)
- 📚 **Belajar dari Pengetahuan** — Berbasis buku panduan resmi
- 💾 **Ingat Percakapan** — Memory system yang cerdas
- 🎓 **Belajar Mandiri** — Auto-learning dari pertanyaan warga
- 👍 **Feedback User** — Rating jawaban untuk perbaikan
- 🔌 **Multi-Provider AI** — Gemini, Groq, OpenRouter, dll.
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
| 🔌 **Multi-Provider AI** | Tambah provider dari dashboard |
| 🎨 **Kustom Provider** | Endpoint OpenAI-compatible apapun |
| 📚 **Upload Pengetahuan** | Upload file .md / .txt |
| 💾 **Kelola Memori** | Lihat/edit/hapus memori AI |
| ❓ **Tak Terjawab** | Daftar pertanyaan yang belum dijawab AI |
| 🧠 **Auto-Learning** | AI deteksi pertanyaan populer otomatis |
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
│           │                             │                   │
└───────────┼─────────────────────────────┼───────────────────┘
            │                             │
            │ HTTPS                       │ HTTPS + JWT
            │                             │
┌───────────▼─────────────────────────────▼───────────────────┐
│                    EXPRESS.JS SERVER                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               MIDDLEWARE LAYER                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │   CORS   │ │Rate Limit│ │  Auth    │ │ Enkrip │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CHAT PIPELINE                          │   │
│  │                                                     │   │
│  │  User Query                                         │   │
│  │      │                                              │   │
│  │      ▼                                              │   │
│  │  ┌────────────────┐                                 │   │
│  │  │  CLASSIFIER    │ ← Deteksi in-scope/out-of-scope │   │
│  │  └────────┬───────┘                                 │   │
│  │           │                                         │   │
│  │           ▼                                         │   │
│  │  ┌────────────────┐                                 │   │
│  │  │    MEMORY      │ ← Cek ingatan lama              │   │
│  │  │    SEARCH      │                                 │   │
│  │  └────────┬───────┘                                 │   │
│  │           │ (kosong)                                │   │
│  │           ▼                                         │   │
│  │  ┌────────────────┐                                 │   │
│  │  │      RAG       │ ← Cari di buku pengetahuan      │   │
│  │  │    SEARCH      │                                 │   │
│  │  └────────┬───────┘                                 │   │
│  │           │                                         │   │
│  │           ▼                                         │   │
│  │  ┌────────────────┐                                 │   │
│  │  │  AI PROVIDER   │ ← Fallback multi-provider       │   │
│  │  │   (Fallback)   │                                 │   │
│  │  └────────┬───────┘                                 │   │
│  │           │                                         │   │
│  │           ▼                                         │   │
│  │  ┌────────────────┐                                 │   │
│  │  │   TRACKING     │ ← Feedback, Learning, Stats     │   │
│  │  └────────────────┘                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA STORAGE                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  knowledge/  │  │   memory/    │  │    data/     │     │
│  │  *.md, *.txt │  │  memory.md   │  │  config.json │     │
│  │              │  │  sessions/   │  │  *.enc       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI PROVIDERS                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Gemini  │ │  Groq   │ │OpenRout.│ │Cerebras │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │Together │ │ Mistral │ │DeepSeek │ │ Custom  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
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
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: RATE LIMIT & VALIDASI                              │
│  • Cek apakah user terlalu sering kirim pesan               │
│  • Validasi panjang pesan (max 2000 karakter)               │
│  • Cek session ID user                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: CLASSIFIER (Anti-Halusinasi)                       │
│  Cek: Apakah pertanyaan relevan dengan Kemantren?           │
│  • Scan kata kunci OUT_OF_SCOPE (politik, jodoh, dll)       │
│  • Scan kata kunci IN_SCOPE (KTP, KK, syarat, dll)          │
│  • Cek kecocokan dengan knowledge chunks                    │
│                                                             │
│  HASIL:                                                     │
│  ✅ IN-SCOPE  → lanjut ke STEP 4                            │
│  ❌ OUT-SCOPE → kirim pesan tolak sopan → SIMPAN ke          │
│                  "Tak Terjawab" → selesai                   │
└────────────────────────┬────────────────────────────────────┘
                         │ (IN-SCOPE)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: MEMORY SEARCH (Cek Ingatan Lama)                   │
│  Cari di memori AI apakah pernah jawab pertanyaan serupa    │
│                                                             │
│  Scoring:                                                   │
│  • Kata kunci cocok: +5 poin                                │
│  • Kata dasar cocok: +4 poin                                │
│  • Bigram cocok: +15 poin                                   │
│  • Pertanyaan identik: +50 poin                             │
│  • Bonus hit: +max 3 poin                                   │
│                                                             │
│  THRESHOLD: 60 poin minimum                                 │
│                                                             │
│  HASIL:                                                     │
│  ✅ COCOK (≥60) → kirim jawaban dari memori                 │
│  ❌ TIDAK COCOK (<60) → lanjut ke STEP 5                    │
└────────────────────────┬────────────────────────────────────┘
                         │ (tidak cocok)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: RAG SEARCH (Cari di Buku Pengetahuan)              │
│  Cari chunk yang paling relevan di knowledge base           │
│                                                             │
│  Scoring:                                                   │
│  • Kata kunci cocok: +3                                     │
│  • Kata dasar cocok: +2                                     │
│  • Bigram cocok: +6                                         │
│  • Kata kunci metadata: +4                                  │
│  • Bigram metadata: +8                                      │
│  • Judul cocok: +5                                          │
│                                                             │
│  CONFIDENCE:                                                │
│  • Top score ≥15 → 100%                                     │
│  • Top score ≥8  → 70%                                      │
│  • Top score ≥4  → 40%                                      │
│                                                             │
│  HASIL: Ambil 6 chunk terbaik sebagai konteks               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: KIRIM KE AI PROVIDER (Fallback)                    │
│  System Prompt + Konteks + Pertanyaan User                  │
│                                                             │
│  Coba provider satu per satu:                               │
│  1. Gemini 2.0 Flash (model 1)                              │
│  2. Gemini 2.0 Flash (model 2)                              │
│  3. Gemini Flash Latest                                     │
│  4. Groq llama-3.3-70b                                      │
│  5. Groq llama-3.1-8b                                       │
│  ...dst sampai berhasil                                     │
│                                                             │
│  Setiap provider dapat kesempatan sampai berhasil           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: BERSIHKAN FORMAT (cleanAIText)                     │
│  • Hapus ** ** (bold markdown)                              │
│  • Hapus ## ## (heading markdown)                           │
│  • Hapus ` ` (code markdown)                                │
│  • Convert - item → • item                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 8: STREAMING KE USER                                  │
│  Kirim per 8 karakter untuk efek mengetik                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 9: TRACKING & LEARNING                                │
│  • Kalau AI menolak → catat ke "Tak Terjawab"               │
│  • Kalau RAG confidence ≥70 → simpan ke memori              │
│  • Update analytics (totalChats, dll)                       │
│  • Tampilkan tombol feedback 👍👎                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 10: USER BERI FEEDBACK (Opsional)                     │
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
│
├── 📂 lib/                      # Library modules
│   ├── providers.js             # Multi-provider AI manager
│   ├── memory.js                # Memory system
│   ├── classifier.js            # Anti-halusinasi classifier
│   ├── feedback.js              # Feedback & analytics
│   ├── learning.js              # Auto-learning engine
│   └── summarizer.js            # Auto-summarization
│
├── 📂 data/                     # Data storage
│   ├── config.json              # Konfigurasi aplikasi
│   ├── providers.json.enc       # Provider API keys (encrypted)
│   ├── unanswered.json          # Pertanyaan tak terjawab
│   ├── feedback.json            # Feedback user
│   ├── analytics.json           # Data analytics
│   ├── learning-queue.json      # Antrian auto-learning
│   └── 📂 backups/              # Backup otomatis
│       └── backup-*.zip.enc
│
├── 📂 knowledge/                # Buku pengetahuan (RAG)
│   └── buku-pengetahuan.md      # Konten pengetahuan
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
├── 📂 tmp/                      # Temporary files
│
└── 📂 tools/                    # Utility tools
    ├── sivt-tools.js
    └── package.json
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

#### 1. Buka Folder Project

```bash
cd "D:\SEMUA PROJEK APLIKASI\AI\MAGANG PSI"
```

#### 2. Install Dependencies

```bash
npm install
```

Dependencies yang terinstall:
- `express` — Web framework
- `@google/genai` — Google Gemini SDK
- `bcrypt` — Password hashing
- `jsonwebtoken` — JWT authentication
- `cookie-parser` — Cookie management
- `cors` — Cross-Origin Resource Sharing
- `dotenv` — Environment variables
- `express-rate-limit` — Rate limiting
- `multer` — File upload
- `adm-zip` — ZIP backup
- `node-cron` — Scheduled tasks

#### 3. Setup Environment Variables

Copy `.env.example` ke `.env`:

```bash
copy .env.example .env
```

Edit `.env`:

```env
# ============================================
# SIVT AI — Environment Variables
# ============================================

# Server
PORT=3000
NODE_ENV=production

# Admin Login
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GantiPasswordAnda123!

# Security (WAJIB GANTI!)
JWT_SECRET=ganti_dengan_random_64_karakter_hex_anda
ENCRYPTION_KEY=ganti_dengan_random_64_karakter_hex_anda
```

**⚠️ PENTING**: Generate `JWT_SECRET` dan `ENCRYPTION_KEY` dengan:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Jalankan **2 kali**, copy hasilnya ke masing-masing variabel.

#### 4. Siapkan Struktur Folder

Server akan otomatis membuat folder saat pertama kali dijalankan.

#### 5. Tambahkan Buku Pengetahuan

Buat file `knowledge/buku-pengetahuan.md`:

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

## Syarat Mengganti KTP Hilang

Kata kunci : syarat KTP hilang, cara urus KTP hilang
Pertanyaan : Syarat KTP hilang

Jawaban : Untuk mengganti KTP hilang, siapkan:
• Surat keterangan kehilangan dari Polres
• Fotokopi Kartu Keluarga (KK)
• Fotokopi KTP lama (jika ada)
• Surat pengantar RT/RW
• Formulir permohonan (diisi di kantor)

Semua proses GRATIS.
```

**Format Penting**:
- Setiap topik dipisah dengan `##` (heading level 2)
- Kata kunci & pertanyaan untuk pencarian RAG
- Jawaban lengkap (jangan terpotong)

---

## ⚙️ KONFIGURASI ENVIRONMENT

### 📝 File `.env` Lengkap

| Variable | Wajib | Deskripsi | Contoh |
|----------|-------|-----------|--------|
| `PORT` | ✅ | Port server | `3000` |
| `NODE_ENV` | ✅ | Environment mode | `production` |
| `ADMIN_USERNAME` | ✅ | Username admin login | `admin` |
| `ADMIN_PASSWORD` | ✅ | Password admin (plain text) | `RahasiaBanget123!` |
| `ADMIN_PASSWORD_HASH` | ⚠️ | Hash password (auto-generated) | `$2b$10$...` |
| `JWT_SECRET` | ✅ | Secret untuk JWT (64 char hex) | `a1b2c3...` |
| `ENCRYPTION_KEY` | ✅ | Key AES-256 (64 char hex) | `d4e5f6...` |

### 🔐 Auto-Migration Password

Saat pertama kali start, sistem akan:
1. Deteksi `ADMIN_PASSWORD` (plain text)
2. Auto-hash dengan bcrypt
3. Simpan sebagai `ADMIN_PASSWORD_HASH`
4. Hapus `ADMIN_PASSWORD` dari `.env`

Log akan menampilkan:
```
[SECURITY] ADMIN_PASSWORD terdeteksi plain text. Auto-migrasi ke hash...
[SECURITY] ✅ Password berhasil di-hash ke .env. Restart server untuk efek penuh.
```

---

## 🎬 CARA MENJALANKAN

### 🚀 Mode Production

```bash
npm start
```

Output yang diharapkan:

```
[FEEDBACK] 40 feedback dimuat.
[LEARNING] 3 pertanyaan di learning queue.
============================================
SIVT AI siap di http://localhost:3000
Provider AI    : 5 terdaftar (5 aktif)
  1. [✓] Google Gemini → gemini-2.0-flash, gemini-2.0-flash-lite
  2. [✓] Groq → llama-3.3-70b-versatile, llama-3.1-8b-instant
  3. [✓] OpenRouter → meta-llama/llama-3.3-70b-instruct:free
  4. [✓] Cerebras → llama-3.3-70b, llama3.1-8b
  5. [✓] Mistral AI → open-mistral-nemo, mistral-small-latest
Memori         : 36 item
Knowledge      : 88 chunk
Unanswered     : 1 pending
============================================
[MEMORY] 36 memori dimuat.
[SESSION] 0 sesi dimuat.
[TOPICS] 88 topik terdeteksi.
[KNOWLEDGE] Total 88 chunk siap.
```

### 🛑 Cara Stop Server

Tekan `Ctrl+C` di terminal. Server akan menyimpan semua sesi sebelum keluar.

### 🔄 Restart Server

```bash
# Stop dulu dengan Ctrl+C, lalu:
npm start
```

### 🌐 Akses Aplikasi

- **Chat (Public)**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000 → klik ⚙️ kanan atas

### 🌍 Akses dari Jaringan (LAN)

Kalau mau diakses dari HP/komputer lain di jaringan yang sama:

1. Cari IP lokal komputer Anda:
   ```bash
   ipconfig
   ```
   Cari **IPv4 Address** (contoh: `192.168.1.10`)

2. Buka di HP: `http://192.168.1.10:3000`

3. Kalau firewall memblokir:
   - Windows: Allow Node.js di Windows Defender Firewall
   - Atau jalankan terminal sebagai **Administrator**

---

## 🎛️ PANDUAN ADMIN DASHBOARD

### 🔐 Cara Login

1. Buka `http://localhost:3000`
2. Klik ikon **⚙️** (kanan atas chat header)
3. Masukkan:
   - Username: `admin` (atau sesuai `.env`)
   - Password: password Anda
4. Klik **Login**

### 📊 Menu Dashboard

| Menu | Fungsi |
|------|--------|
| **📊 Dashboard** | Statistik & ringkasan aplikasi |
| **⚙️ Umum** | Identitas AI, kontak, sambutan |
| **🖼️ Logo & Branding** | Upload logo instansi |
| **🎨 Warna Tema** | Kustom warna aplikasi |
| **🔌 Provider AI** | Kelola provider (built-in & custom) |
| **💬 Prompt AI** | Atur system instruction AI |
| **📚 Pengetahuan** | Upload & kelola buku pengetahuan |
| **❓ Tak Terjawab** | Pertanyaan yang tidak bisa dijawab AI |
| **🧠 Auto-Learning** | Antrian belajar dari pertanyaan populer |
| **⭐ Feedback & Akurasi** | Statistik kepuasan & akurasi |
| **💾 Memori AI** | Kelola memori AI |
| **💬 Percakapan** | Sesi percakapan aktif |
| **🔔 Notifikasi** | Riwayat notifikasi sistem |
| **💾 Backup** | Backup & restore data |
| **🔐 Keamanan** | Ganti password admin |

---

### 📊 Dashboard

Menampilkan **8 stat cards**:

| Stat | Deskripsi |
|------|-----------|
| 🔌 **Provider AI** | Total provider & berapa aktif |
| 📚 **Chunk Pengetahuan** | Jumlah chunk di buku pengetahuan |
| 💾 **Memori AI** | Total memori & total hit |
| 💬 **Sesi Aktif** | Sesi percakapan aktif & total pesan |
| ⭐ **Kepuasan User** | Persentase feedback positif |
| ✅ **Akurasi Jawaban** | Persentase jawaban berhasil |
| ❓ **Tak Terjawab** | Pertanyaan pending |
| 🔔 **Notifikasi** | Notifikasi belum dibaca |

Ditambah:
- **Chart aktivitas 7 hari** — Grafik sesi harian
- **Status provider** — Daftar provider & statusnya
- **Antrian belajar** — Highlight pertanyaan populer
- **Aksi cepat** — Tombol shortcut ke fitur populer

---

### 🔌 Provider AI

Halaman ini punya **2 tab**:

#### Tab 1: Provider Terdaftar (Built-in)

Pilih dari **9 provider**:

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

**Cara tambah**:
1. Pilih provider dari dropdown
2. Paste **API Key**
3. (Opsional) Isi **Models** — pisah dengan koma
4. Klik **Tambah Provider**

#### Tab 2: Provider Custom

Untuk provider **OpenAI-compatible** apapun:

**Contoh: Ollama Lokal**

| Field | Nilai |
|-------|-------|
| Nama Provider | `ollama` |
| Display Name | `Ollama Lokal` |
| Custom Endpoint | `http://localhost:11434/v1` |
| API Key | `ollama` (bebas) |
| Models | `llama3.2,mistral,qwen2.5` |

**Contoh: LocalAI**

| Field | Nilai |
|-------|-------|
| Nama Provider | `localai` |
| Custom Endpoint | `http://localhost:8080/v1` |
| API Key | `not-needed` |
| Models | `gpt-3.5-turbo,llama-3-8b` |

#### Tabel Provider

Setelah ditambahkan, provider muncul di tabel dengan **5 tombol aksi**:

| Ikon | Fungsi |
|------|--------|
| 🔬 | **Test koneksi** — Cek API key valid |
| ✏️ | **Edit models** — Ganti daftar model |
| 🔑 | **Edit API key** — Update API key baru |
| ⚡ | **Toggle ON/OFF** — Aktifkan/nonaktifkan |
| 🗑️ | **Hapus** — Hapus provider |

---

### 📚 Pengetahuan (RAG)

#### Upload File

1. Klik **Upload File Pengetahuan**
2. Pilih file `.md` atau `.txt`
3. Klik **Upload**
4. Sistem akan otomatis:
   - Baca file
   - Split jadi chunk
   - Index untuk pencarian
   - Update `availableTopics`

#### Format File Pengetahuan

```markdown
# Buku Pengetahuan SIVT AI

## Topik Pertama

Kata kunci : kata1, kata2, kata3
Pertanyaan : Pertanyaan yang sering ditanya

Jawaban : Jawaban lengkap dan detail
• Point pertama
• Point kedua

## Topik Kedua

Kata kunci : ...
Pertanyaan : ...
Jawaban : ...
```

#### Reload

Kalau Anda edit file manual, klik **Reload** untuk refresh index.

---

### 💾 Memori AI

Menampilkan semua memori yang tersimpan dari percakapan.

**Format memori**:
```
Pertanyaan : syarat membuat kk baru
Variasi    : syarat kk baru, cara buat kk
Jawaban    : Untuk membuat KK baru...
Hit        : 15
Kata kunci : syarat, baru
```

**Aksi**:
- 🗑️ **Hapus memori** — Hapus satu memori
- **Hapus Semua** — Reset semua memori
- **Reload** — Baca ulang dari file

**Threshold Memori**:
- **Min skor pakai memori** (default 60) — Skor minimum untuk pakai memori
- **Min skor simpan baru** (default 40) — Skor minimum untuk simpan ke memori

---

### ❓ Tak Terjawab

Menampilkan pertanyaan yang **tidak bisa dijawab AI** karena:
- Tidak ada di buku pengetahuan
- AI menolak menjawab (refusal)
- Di luar topik Kemantren

**Filter**:
- **Pending** — Belum ditangani admin
- **Resolved** — Sudah ditangani
- **Semua** — Semua pertanyaan

**Aksi**:
- ➕ **Tambah Jawaban** — Buka modal untuk tambah jawaban
- ✅ **Tandai Sudah** — Tandai sudah dijawab
- 🗑️ **Hapus** — Hapus dari daftar

**Cara Tambah Jawaban ke Pengetahuan**:
1. Klik **➕ Tambah Jawaban**
2. Modal terbuka
3. Isi kategori (opsional)
4. Isi **jawaban lengkap** (min 20 karakter)
5. Klik **Simpan ke Pengetahuan**
6. Sistem otomatis:
   - Append ke `buku-pengetahuan.md`
   - Reload knowledge
   - Tandai sebagai resolved
   - Kirim notifikasi

---

### 🧠 Auto-Learning

Menampilkan pertanyaan **populer** yang sering ditanya tapi belum ada di pengetahuan.

**Prioritas**:
- 🚨 **Urgent** — Ditanya ≥10x
- ⚠️ **Tinggi** — Ditanya ≥5x
- 📌 **Sedang** — Ditanya ≥3x
- ℹ️ **Normal** — Ditanya <3x

**Filter**:
- **Pending** — Belum diselesaikan
- **Urgent** — Hanya urgent
- **High** — Urgent + High
- **Semua** — Semua

**Aksi**:
- ➕ **Tambah ke Pengetahuan** — Sama seperti di "Tak Terjawab"
- ✅ **Tandai Selesai** — Tandai sudah ditangani
- 🗑️ **Hapus** — Hapus dari antrian

---

### ⭐ Feedback & Akurasi

**Statistik Feedback**:
| Stat | Deskripsi |
|------|-----------|
| **Total Feedback** | Total 👍 + 👎 |
| **Bagus 👍** | Jumlah rating positif |
| **Kurang 👎** | Jumlah rating negatif |
| **Kepuasan** | Persentase positif |

**Statistik Analytics**:
| Stat | Deskripsi |
|------|-----------|
| **Total Chat** | Total percakapan |
| **Jawaban Diberikan** | Jumlah jawaban berhasil |
| **Penolakan** | AI menolak jawab |
| **Akurasi** | (Answers - Refusals) / Answers |
| **Memory Hits** | Jawaban dari memori |
| **RAG Hits** | Jawaban dari RAG |
| **Out of Scope** | Pertanyaan di luar topik |

**Chart** — Visualisasi feedback 7 hari terakhir.

**Filter**:
- **Semua** — Semua feedback
- **Bagus** — Hanya 👍
- **Kurang** — Hanya 👎

---

### 🔔 Notifikasi

Sistem notifikasi otomatis untuk event penting:

| Level | Event |
|-------|-------|
| ℹ️ **Info** | Provider ditambah/dihapus, logo diupdate |
| ⚠️ **Warning** | Provider gagal, kuota habis |
| 🚨 **Danger** | Semua provider gagal |

Notifikasi muncul di **bell icon** (kanan atas) dengan badge merah.

---

### 💾 Backup

**Backup Otomatis**:
- Setiap hari jam **02:00**
- Format: `backup-YYYY-MM-DD-HHmmss.zip.enc`
- Enkripsi: **AES-256**
- Retention: **30 hari**

**Backup Manual**:
- Klik **Backup Sekarang**

**Isi Backup**:
- `config.json`
- `providers.json.enc`
- `memory.md`
- `unanswered.json`
- `feedback.json`
- `learning-queue.json`
- `analytics.json`
- Seluruh folder `knowledge/`

---

## 🔌 MULTI-PROVIDER AI

### Konsep Fallback

Sistem mencoba provider **satu per satu** sampai berhasil:

```
Provider 1, Model 1 → FAIL (429)
Provider 1, Model 2 → FAIL (404)
Provider 1, Model 3 → OK  ✅ SELESAI
   (kalau semua fail)
Provider 2, Model 1 → ...
```

### Model yang Didukung

| Provider | Model Utama |
|----------|-------------|
| **Gemini** | gemini-2.0-flash, gemini-flash-latest |
| **Groq** | llama-3.3-70b-versatile, llama-3.1-8b-instant |
| **OpenRouter** | meta-llama/llama-3.3-70b-instruct:free |
| **Cerebras** | llama-3.3-70b, llama3.1-8b |
| **Together** | meta-llama/Llama-3.3-70B-Instruct-Turbo |
| **Mistral** | open-mistral-nemo, mistral-small-latest |
| **DeepSeek** | deepseek-chat, deepseek-coder |
| **Fireworks** | llama-v3p3-70b-instruct |
| **xAI** | grok-beta |

### Error Handling

| Error | Tindakan |
|-------|----------|
| **401** | API key tidak valid → coba provider lain |
| **429** | Kuota habis → coba provider lain |
| **404** | Model tidak ada → coba model lain |
| **503** | Server sibuk → coba provider lain |
| **Timeout** | Coba provider lain |

---

## 📚 SISTEM PENGETAHUAN (RAG)

### Konsep RAG

**RAG** (Retrieval-Augmented Generation) = Ambil dulu dari database, baru kirim ke AI.

```
User Query
   ↓
Tokenize & Stemming
   ↓
Search di Knowledge Base (Scoring)
   ↓
Ambil Top 6 Chunk
   ↓
Kirim ke AI dengan Konteks
   ↓
AI Jawab Berdasarkan Konteks
```

### Scoring System

| Faktor | Skor |
|--------|------|
| Kata cocok (exact) | +3 |
| Kata dasar cocok (stem) | +2 |
| Bigram cocok | +6 |
| Kata kunci metadata | +4 |
| Bigram metadata | +8 |
| Judul cocok | +5 |

### Confidence Level

| Top Score | Confidence | Aksi |
|-----------|-----------|------|
| ≥15 | 100% | Kirim jawaban |
| ≥8 | 70% | Kirim jawaban |
| ≥4 | 40% | Kirim dengan konteks terbatas |
| <4 | 0% | Kirim suggestions |

---

## 💾 SISTEM MEMORI AI

### Konsep

Memori menyimpan **Q&A tervalidasi** dari percakapan. AI cek memori **SEBELUM** RAG.

**Keuntungan**:
- 🚀 Respon lebih cepat
- 💰 Hemat token API
- 🎯 Jawaban konsisten

### Threshold

| Setting | Default | Fungsi |
|---------|---------|--------|
| `memoryMinScore` | 60 | Min skor untuk pakai memori |
| `memorySaveThreshold` | 40 | Min skor untuk simpan baru |

### Syarat Simpan ke Memori

Jawaban baru disimpan ke memori **hanya jika**:
- ✅ Panjang jawaban ≥50 karakter
- ✅ Tidak diakhiri `:` (tidak terpotong)
- ✅ Tidak diakhiri `...`
- ✅ Bukan refusal (penolakan)
- ✅ RAG confidence ≥70%
- ✅ Bukan pertanyaan out-of-scope

### Variasi Pertanyaan

Memori mendukung **variasi pertanyaan**:

```
Pertanyaan  : syarat membuat kk baru
Variasi     : syarat kk baru, cara buat kk, syarat bikin kk
```

### Hit Counter

Setiap kali memori dipakai, `hit` bertambah. Semakin sering → semakin tinggi bonus skor.

---

## 🛡️ ANTI-HALUSINASI (CLASSIFIER)

### Konsep

Sebelum AI menjawab, **Classifier** cek apakah pertanyaan:

1. **Relevan dengan Kemantren** → Lanjut ke AI
2. **Di luar topik** → Tolak sopan

### Out-of-Scope Keywords

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

### In-Scope Keywords

```
ktp, kk, kartu keluarga, akta, akte
kelahiran, kematian, pernikahan, nikah
pindah, domisili, usaha, umkm
surat, keterangan, pengantar
kemantren, tegalrejo, kelurahan
syarat, biaya, gratis, jam
alamat, kontak, telepon
```

### Logika Keputusan

| Kondisi | Hasil |
|---------|-------|
| Ada OUT + tidak ada IN | ❌ Redirect |
| Ada IN | ✅ Proceed |
| Ada knowledge match | ✅ Proceed |
| Tidak ada keyword | ⚠️ Proceed with caution |

### Pesan Redirect

```
Wah, pertanyaan itu kayaknya di luar tugas saya deh 😊

Saya SIVT AI cuma bisa bantu soal layanan administrasi Kemantren Tegalrejo, seperti:
• KTP, KK, Akta Kelahiran, Akta Kematian
• Surat Keterangan, Surat Pengantar
• Izin Usaha, Izin Keramaian
• Pindah Domisili, dll.

Untuk pertanyaan tentang "...", coba tanya yang lebih ahli ya.
```

---

## 🎓 AUTO-LEARNING SYSTEM

### Konsep

Deteksi pertanyaan **populer** yang sering ditanya tapi **belum ada** di pengetahuan.

### Frekuensi → Prioritas

| Frekuensi | Prioritas | Ikon |
|-----------|-----------|------|
| ≥10x | 🚨 Urgent | Merah |
| ≥5x | ⚠️ Tinggi | Orange |
| ≥3x | 📌 Sedang | Biru |
| <3x | ℹ️ Normal | Abu |

### Similarity Detection

Menggunakan **Levenshtein Distance** untuk deteksi pertanyaan yang mirip:

```
"Syarat KK baru"     ← 100%
"syarat membuat kk"   ← 85%  (dianggap sama)
"cara buat kk baru"   ← 78%  (dianggap sama)
"KTP hilang"          ← 20%  (beda)
```

Threshold: **85%**

### Variant Collection

Setiap pertanyaan mirip disimpan sebagai **variant**:

```json
{
  "question": "syarat membuat kk baru",
  "variants": [
    "syarat membuat kk",
    "cara buat kk baru",
    "syarat bikin kk"
  ],
  "count": 15,
  "priority": "urgent"
}
```

---

## ⭐ FEEDBACK & ANALYTICS

### Feedback User

Setiap jawaban AI, user bisa kasih:
- 👍 **Berguna**
- 👎 **Kurang tepat**

Feedback tersimpan di `feedback.json`.

### Analytics Tracking

Setiap event tercatat:

| Event | Kapan |
|-------|-------|
| `totalChats` | Setiap chat |
| `totalAnswers` | AI berhasil jawab |
| `totalRefusals` | AI menolak jawab |
| `totalMemoryHits` | Jawaban dari memori |
| `totalRagHits` | Jawaban dari RAG |
| `totalOutOfScope` | Out of topik |

### Daily Stats

Tracking per-hari:

```json
{
  "2026-09-14": {
    "chats": 27,
    "good": 17,
    "bad": 2
  }
}
```

### Akurasi Formula

```
Akurasi = (Total Answers - Total Refusals) / Total Answers × 100%
```

---

## 🔐 KEAMANAN

### Enkripsi

| Data | Metode |
|------|--------|
| API Keys (providers.json) | AES-256-GCM |
| Backup files | AES-256 |
| Password admin | bcrypt (10 rounds) |
| JWT Token | HS256 |
| Cookies | httpOnly, sameSite=lax |

### Login Flow

```
1. User submit username + password
2. Server hash password dengan bcrypt
3. Bandingkan dengan ADMIN_PASSWORD_HASH
4. Kalau cocok → generate JWT (30 hari)
5. Set cookie httpOnly
6. Redirect ke dashboard
```

### JWT Payload

```json
{
  "username": "admin",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/*` | 500 req / 15 menit |
| `/api/chat` | 20 req / menit |
| `/api/admin/login` | 10 req / 15 menit |

### File Protection

File berikut **tidak bisa diakses publik**:
- `.env`
- `data/config.json`
- `data/*.enc`
- `knowledge/*`
- `memory/*`
- `logs/*`

---

## 🔌 API ENDPOINTS

### 🌐 Public Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/config/public` | Config publik (nama, logo, theme) |
| GET | `/api/health` | Health check |
| GET | `/api/topics` | Daftar topik pengetahuan |
| POST | `/api/chat` | Chat dengan AI (SSE) |
| POST | `/api/feedback` | Kirim feedback |

### 🔐 Admin Endpoints (JWT Required)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/admin/login` | Login |
| POST | `/api/admin/logout` | Logout |
| GET | `/api/admin/check` | Cek session |
| GET | `/api/admin/config` | Ambil semua config |
| POST | `/api/admin/config` | Update config |
| GET | `/api/admin/dashboard/stats` | Statistik dashboard |
| POST | `/api/admin/providers/add` | Tambah provider |
| POST | `/api/admin/providers/remove` | Hapus provider |
| POST | `/api/admin/providers/toggle` | Toggle provider |
| POST | `/api/admin/providers/update-models` | Update models |
| POST | `/api/admin/providers/update-key` | Update API key |
| POST | `/api/admin/providers/test` | Test provider |
| GET | `/api/admin/knowledge/...` | Kelola pengetahuan |
| GET | `/api/admin/memory` | Lihat memori |
| POST | `/api/admin/memory/delete` | Hapus memori |
| POST | `/api/admin/memory/clear` | Clear memori |
| GET | `/api/admin/unanswered` | Lihat tak terjawab |
| POST | `/api/admin/unanswered/add-to-knowledge` | Tambah ke pengetahuan |
| GET | `/api/admin/learning/queue` | Learning queue |
| POST | `/api/admin/learning/add-to-knowledge` | Dari learning ke knowledge |
| GET | `/api/admin/feedback/stats` | Statistik feedback |
| GET | `/api/admin/notifications` | Notifikasi |
| POST | `/api/admin/backup` | Backup manual |
| GET | `/api/admin/backups` | Daftar backup |
| POST | `/api/admin/change-password` | Ganti password |

### 📡 Chat API (Server-Sent Events)

**Request**:
```json
POST /api/chat
{
  "message": "Syarat membuat KK?",
  "sessionId": "sess_xxx"
}
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

**Meta Sources**:
- `memory` — Jawaban dari memori
- `ai` — Jawaban dari provider AI
- `redirect` — Pertanyaan out-of-scope

---

## 🐛 TROUBLESHOOTING

### Error: `Cannot find module 'X'`

**Solusi**:
```bash
npm install
```

### Error: `EADDRINUSE` (Port 3000 dipakai)

**Solusi**:
1. Matikan aplikasi lain yang pakai port 3000
2. Atau ganti port di `.env`:
   ```env
   PORT=3001
   ```

### Error: `FATAL: JWT_SECRET tidak ada`

**Solusi**:
Isi `JWT_SECRET` di `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### AI Tidak Menjawab / Error

**Cek**:
1. Buka log terminal — cari `[FAIL]`
2. Cek menu **Provider AI** → Test provider
3. Kalau error 401 → API key salah
4. Kalau error 429 → Kuota habis
5. Kalau error 404 → Model tidak ada

**Solusi**: Tambah provider lain untuk fallback.

### AI Jawab "Belum ada di buku"

**Artinya**: Pertanyaan tidak ada di pengetahuan.

**Solusi**:
1. Buka menu **Tak Terjawab**
2. Klik **➕ Tambah Jawaban**
3. Isi jawaban lengkap
4. Simpan

### Memori Tidak Bekerja

**Cek**:
1. Menu **Memori AI** — apakah ada data?
2. Threshold `memoryMinScore` — default 60
3. Kalau terlalu tinggi, jawaban tidak akan pakai memori
4. Kalau terlalu rendah, memori sering salah

**Rekomendasi**: 50-60 untuk akurasi, 40-50 untuk responsif.

### Notifikasi Tidak Muncul

**Cek**:
1. Menu **Notifikasi** — apakah ada data?
2. Browser console — cari error
3. Hard refresh (Ctrl+Shift+R)

### Service Worker Cache Lama

**Solusi**:
1. Buka DevTools (F12)
2. Application → Service Workers
3. Klik **Unregister**
4. Clear Storage
5. Refresh

### Model Gemini/Groq Tidak Ada

**Error**: `HTTP 404: Model tidak tersedia`

**Solusi**:
1. Buka menu **Provider AI**
2. Klik ✏️ **Edit Model**
3. Update ke model terbaru:
   - Gemini: `gemini-2.0-flash,gemini-flash-latest`
   - Groq: `llama-3.3-70b-versatile,llama-3.1-8b-instant`

### Reset Provider Lama

Kalau provider lama error semua:

```bash
del data\providers.json.enc
npm start
```

Lalu tambah ulang provider via dashboard.

### Backup Tidak Jalan Otomatis

**Cek**:
1. Log terminal — cari `[CRON]`
2. Waktu backup: **02:00 setiap hari**
3. Kalau server mati jam 02:00, backup tidak jalan

**Manual backup**: Klik **Backup Sekarang** di dashboard.

### Ukuran File Terlalu Besar

Kalau `memory.md` atau `buku-pengetahuan.md` terlalu besar:

1. **Memory**: Hapus entri lama via **Memori AI** → 🗑️
2. **Knowledge**: Split jadi beberapa file
3. **Sessions**: Auto cleanup setelah 2 jam

---

## 📈 TIPS & BEST PRACTICES

### 🎯 Untuk Akurasi AI

1. **Buku pengetahuan lengkap** — Semakin lengkap, semakin akurat
2. **Format konsisten** — Selalu pakai `Kata kunci :` dan `Jawaban :`
3. **Variasi kata kunci** — Tambahkan sinonim & typo umum
4. **Update berkala** — Cek "Tak Terjawab" setiap minggu
5. **Feedback admin** — Koreksi jawaban yang kurang tepat

### 💰 Hemat Token API

1. **Memory threshold 60** — Jawaban populer dari memori
2. **RAG confidence 70** — Hanya kirim kalau yakin
3. **Provider gratis dulu** — Gemini, Groq, OpenRouter
4. **Monitor usage** — Cek dashboard statistik

### 🔒 Keamanan

1. **Ganti password default** — Jangan `admin123`
2. **Random JWT_SECRET** — 64 char hex
3. **Random ENCRYPTION_KEY** — 64 char hex
4. **Backup rutin** — Minimal 1x per minggu
5. **Update dependencies** — `npm update` tiap bulan

### 🚀 Performa

1. **Restart server** — Kalau memory leak
2. **Backup lama dihapus** — Retention 30 hari
3. **Session cleanup** — Auto 2 jam
4. **Monitor log** — Cek `npm start` output

---

## 🎓 KONSEP PENTING

### RAG vs Memory vs AI

| Aspek | RAG | Memory | AI |
|-------|-----|--------|-----|
| **Sumber** | Buku pengetahuan | Q&A lama | Model LLM |
| **Kecepatan** | Cepat | Sangat cepat | Tergantung API |
| **Biaya** | Gratis | Gratis | Bayar (kecuali free tier) |
| **Akurasi** | 100% (dari buku) | 100% (dari sebelumnya) | Bisa halusinasi |
| **Kapan dipakai** | Pertanyaan baru | Pertanyaan mirip | Umum |

### Flow Optimasi

```
Pertanyaan Populer → Memory (Cepat + Hemat)
Pertanyaan Baru → RAG (Akurat + Gratis)
Pertanyaan Umum → AI (Fleksibel)
Pertanyaan Luar Topik → Tolak (Sopan)
```

---

## ❓ FAQ (FREQUENTLY ASKED QUESTIONS)

**Q: Apakah aplikasi ini bisa offline?**  
A: Tidak sepenuhnya. Butuh internet untuk akses AI provider. Tapi chat bisa diakses via PWA offline untuk bagian UI.

**Q: Berapa biaya operasional?**  
A: Minimal. Kalau pakai provider gratis (Gemini, Groq, OpenRouter), bisa Rp 0. Kalau pakai berbayar, tergantung pemakaian.

**Q: Apakah data warga disimpan?**  
A: Yang disimpan hanya pertanyaan populer (di memori & learning queue). Data pribadi warga TIDAK disimpan.

**Q: Bisa dipakai untuk instansi lain?**  
A: Bisa. Tinggal ganti nama AI, logo, dan isi buku pengetahuan sesuai instansi.

**Q: Bagaimana kalau AI salah jawab?**  
A: Admin bisa koreksi lewat menu "Tak Terjawab" atau "Memori AI".

**Q: Apakah support Bahasa Jawa?**  
A: Bisa ditambahkan di `systemInstruction` prompt AI.

**Q: Berapa lama setup awal?**  
A: ~15-30 menit untuk instalasi + tambah 1 provider + upload pengetahuan dasar.

**Q: Bisa jalan di HP?**  
A: Ya. Buka di browser HP, atau install sebagai PWA (Add to Home Screen).

---

## 📞 KONTAK & LISENSI

### 🏢 Kemantren Tegalrejo

- 📍 **Alamat**: Jl. Tegalrejo No.1, Kota Yogyakarta (dekat Pasar Tegalrejo)
- 📞 **Telepon**: (0274) 123456
- 📱 **WhatsApp**: 0812-3456-7890
- ✉️ **Email**: kemantren.tegalrejo@jogjakota.go.id
- 🕐 **Jam Buka**: Senin-Jumat 08.00-15.00 WIB, Sabtu 08.00-12.00 WIB
- 💰 **Biaya**: Semua layanan **GRATIS**

### 📄 Lisensi

**ISC License** — Bebas digunakan untuk keperluan internal Kemantren Tegalrejo Yogyakarta.

---

## 🙏 TERIMA KASIH

Aplikasi ini dibuat untuk mempermudah warga Kemantren Tegalrejo dalam mengakses informasi layanan administrasi kependudukan.

**Semoga bermanfaat!** 🇮🇩

---

*README ini dibuat dengan ❤️ untuk SIVT AI — Sistem Informasi Virtual TEGALREJO*

*Last updated: 2026*