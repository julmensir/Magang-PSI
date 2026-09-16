# 📘 SIVT AI — Sistem Informasi Virtual TEGALREJO

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Repo](https://img.shields.io/badge/repo-private-red)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

**Asisten Virtual Cerdas untuk Kemantren Tegalrejo, Yogyakarta**

Chatbot berbasis AI dengan RAG (Retrieval-Augmented Generation), Memory System, dan Multi-Provider Fallback

> 🔒 **Repository ini bersifat PRIVATE** — masih dalam tahap pengembangan aktif. Belum untuk konsumsi publik.

---

[Fitur](#-fitur-utama) • [Arsitektur](#%EF%B8%8F-arsitektur--teknologi) • [Instalasi](#-instalasi) • [Konfigurasi](#%EF%B8%8F-konfigurasi) • [API](#-api-endpoints) • [Roadmap](#%EF%B8%8F-roadmap)

</div>

---

## 📖 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Status Pengembangan](#-status-pengembangan)
- [Fitur Utama](#-fitur-utama)
- [Arsitektur & Teknologi](#%EF%B8%8F-arsitektur--teknologi)
- [Struktur Folder](#-struktur-folder)
- [Instalasi](#-instalasi)
- [Konfigurasi](#%EF%B8%8F-konfigurasi)
- [Cara Menjalankan](#-cara-menjalankan)
- [Alur Kerja Chat](#-alur-kerja-chat)
- [Sistem RAG & Memory](#-sistem-rag--memory)
- [API Endpoints](#-api-endpoints)
- [Keamanan](#-keamanan)
- [PWA Support](#-pwa-support)
- [Deployment](#-deployment)
- [Roadmap](#%EF%B8%8F-roadmap)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq)
- [Kontribusi](#-kontribusi)
- [Kontak](#-kontak)
- [Lisensi](#-lisensi)

---

## 🎯 Tentang Proyek

**SIVT AI** (Sistem Informasi Virtual TEGALREJO) adalah aplikasi chatbot cerdas berbasis web yang dirancang khusus untuk **Kemantren Tegalrejo, Yogyakarta**. Aplikasi ini berfungsi sebagai **asisten virtual 24 jam** yang menjawab pertanyaan warga seputar:

- ✅ Layanan administrasi kependudukan (KK, KTP, Akta Kelahiran/Kematian)
- ✅ Persyaratan surat-menyurat (SKTM, Domisili, SKU, Izin Keramaian)
- ✅ Jam pelayanan & alamat kantor
- ✅ Prosedur pengaduan & kontak darurat
- ✅ Informasi umum seputar Kemantren Tegalrejo
- ✅ Prosedur pindah datang/keluar domisili

### 🎯 Tujuan Proyek

1. **Mempermudah warga** mendapatkan informasi layanan tanpa harus datang ke kantor
2. **Mengurangi beban petugas** dalam menjawab pertanyaan berulang
3. **Meningkatkan kualitas layanan** publik berbasis teknologi
4. **Menyediakan layanan 24/7** untuk warga
5. **Mengumpulkan data** pertanyaan warga untuk perbaikan layanan

### 🎁 Keunggulan Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🤖 **Multi-Provider AI** | 6 provider dengan fallback otomatis (tidak mati jika satu down) |
| 📚 **RAG System** | Menjawab berdasarkan buku pengetahuan resmi (anti-halusinasi) |
| 🧠 **Memory System** | Belajar dari pertanyaan warga & menyimpan jawaban terbaik |
| 📝 **Unanswered Logger** | Mencatat pertanyaan tak terjawab untuk ditindaklanjuti admin |
| 🔐 **Enkripsi AES-256** | API key & backup terenkripsi standar industri |
| 📱 **PWA Ready** | Bisa diinstal di HP warga seperti aplikasi native |
| 🎨 **Tema Kustom** | 7 preset warna + custom color picker |
| 💾 **Backup Otomatis** | Cron harian jam 02.00, retensi 30 hari |
| ⚡ **Streaming Response** | Jawaban muncul real-time seperti sedang mengetik |
| 🔄 **Rate Limiting** | Mencegah spam & abuse |

---

## 🚧 Status Pengembangan

**Versi Saat Ini**: `v1.0.0` (Stable Internal Release)

### ✅ Selesai

- [x] Chat publik dengan streaming
- [x] Login admin + JWT
- [x] Multi-provider AI (6 provider)
- [x] RAG knowledge base
- [x] Memory system
- [x] Unanswered logger
- [x] Backup otomatis (cron)
- [x] Enkripsi AES-256
- [x] PWA support
- [x] Theme customizer
- [x] Upload logo
- [x] Notifikasi sistem
- [x] Dashboard admin lengkap

### 🚧 Sedang Dikerjakan

- [ ] Export chat history (CSV/JSON)
- [ ] Dark mode untuk chat publik
- [ ] Multi-bahasa (Indonesia + Jawa)
- [ ] Feedback rating per jawaban

### 📅 Direncanakan

- [ ] Voice input (Web Speech API)
- [ ] Analytics lanjutan
- [ ] WhatsApp Business API integration
- [ ] Vector database untuk RAG
- [ ] Mobile app (React Native)

> ⚠️ **Catatan**: Repo ini masih **private** dan dalam tahap pengembangan aktif. Belum siap untuk publik.

---

## ✨ Fitur Utama

### 1. 💬 Chat Publik (Warga)

Interface chat untuk warga dengan pengalaman modern:

- **Streaming real-time** — jawaban muncul kata per kata
- **Typing indicator** — animasi 3 titik saat AI berpikir
- **Quick buttons** — tombol pertanyaan populer
- **Suggestion chips** — saran topik ketika AI tidak yakin
- **Session persistence** — riwayat chat tersimpan di localStorage
- **Reset chat** — mulai percakapan baru
- **Responsive mobile-first** — nyaman di HP & desktop

**Contoh tampilan:**
```
┌───────────────────────────────┐
│ 🤖 SIVT AI                    │
│ Sistem Informasi Virtual...   │
├───────────────────────────────┤
│                               │
│        Halo! Saya SIVT AI...  │
│        ┌─────────────────┐    │
│        │ Syarat buat KK? │ ←──│── User
│        └─────────────────┘    │
│                               │
│ 🤖 Untuk membuat KK baru...   │
│    • Surat pengantar RT/RW    │
│    • Fotokopi KTP suami/istri │
│    • Fotokopi Buku Nikah      │
│                               │
├───────────────────────────────┤
│ [Syarat KK] [KTP Hilang] ...  │
├───────────────────────────────┤
│ [Ketik pertanyaan...] [Kirim] │
└───────────────────────────────┘
```

### 2. 🎛️ Dashboard Admin

Halaman admin dengan 13 menu:

| Menu | Fungsi |
|------|--------|
| **Dashboard** | Statistik real-time, chart 7 hari, quick actions |
| **Umum** | Nama AI, tagline, welcome message, kontak |
| **Logo & Branding** | Upload logo, atur ukuran |
| **Warna Tema** | 7 preset + custom color picker |
| **Provider AI** | Tambah/hapus/test/toggle provider |
| **Prompt AI** | Edit system instruction (personality) |
| **Pengetahuan** | Upload/hapus file knowledge base |
| **Tak Terjawab** | Daftar pertanyaan yang AI belum bisa jawab |
| **Memori AI** | Pengaturan memory system & list memori |
| **Percakapan** | Daftar sesi aktif |
| **Backup** | Backup manual & list backup |
| **Keamanan** | Ganti password admin |
| **Notifikasi** | Log notifikasi sistem |

### 3. 🔌 Manajemen Provider AI

**Provider yang didukung:**

| Provider | Model Default | Tier Gratis |
|----------|--------------|-------------|
| **Google Gemini** | gemini-2.5-flash, gemini-2.5-flash-lite | ✅ Generous |
| **Groq** | llama-3.3-70b-versatile, llama-3.1-8b-instant | ✅ 14.400 req/hari |
| **OpenRouter** | meta-llama/llama-3.3-70b:free | ✅ Model `:free` |
| **Cerebras** | llama-3.3-70b, llama3.1-8b | ✅ Free tier |
| **Together AI** | Llama-3.3-70B-Instruct-Turbo | ✅ $25 credit |
| **Mistral AI** | mistral-small-latest, open-mistral-nemo | ✅ Free tier |

**Fitur:**
- Tambah provider dengan API key
- Hapus provider
- Test API key (cek valid/tidak)
- Toggle aktif/nonaktif
- Edit daftar model
- **Fallback otomatis** — jika provider 1 gagal, coba provider 2, dst.

### 4. 📚 Knowledge Base Management

**Cara kerja:**
- Upload file `.md` atau `.txt`
- Sistem auto-chunking (potong jadi bagian kecil)
- Setiap chunk di-index (kata, stem, bigram, keyword)
- Deteksi topik otomatis (dari heading markdown)
- Reload tanpa restart server

**File yang sudah ada:**
- `buku-pengetahuan.md` — informasi Kemantren Tegalrejo
- `Buku_Panduan_Lengkap_JSS_v7.md` — panduan Jogja Smart Service

### 5. 🧠 Memory System

**Cara kerja:**
- Setiap jawaban AI yang berkualitas disimpan ke memori
- Pencarian dengan **sinonim bahasa Indonesia** (bikin → buat)
- **Stemming otomatis** (membuat → buat)
- **Bigram matching** untuk frasa ("syarat kk" ≠ "buat kk")
- **Validasi relevansi** sebelum menjawab dari memori

**Threshold:**
- Min skor pakai memori: **40** (configurable)
- Min skor simpan baru: **30** (configurable)

### 6. ❓ Unanswered Questions

**Kapan pertanyaan dicatat?**
- RAG tidak menemukan konteks
- Confidence rendah (< 70)
- AI menolak jawab ("belum ada di buku")

**Fitur:**
- Filter: pending / resolved / all
- Tambah jawaban → langsung masuk knowledge base
- Tandai resolved
- Hapus individual / massal
- Counter berapa kali ditanya

### 7. 🎨 Kustomisasi Tampilan

**Logo:**
- Upload (PNG, JPG, GIF, WEBP, SVG) max 2MB
- Auto-resize & preview
- Ukuran: small / medium / large / xlarge
- Otomatis dipakai di header, login, sidebar, favicon

**Tema Warna:**
- Primary, Dark, Accent
- Sidebar gradient (start + end)
- **7 preset**: Biru, Dark, Hijau, Ungu, Merah, Teal, Orange
- **Live preview** saat ganti warna
- Custom color picker + input hex

### 8. 🔔 Notifikasi Sistem

- Dropdown di kanan atas dashboard
- Badge unread count (dengan animasi pulse)
- Auto-refresh setiap 30 detik
- Mark as read / clear all
- Log ke `logs/notifications.json`
- **Throttling** — notif sama tidak muncul berulang dalam 5 menit

### 9. 💾 Backup & Restore

- **Backup manual** via tombol di dashboard
- **Backup otomatis** harian (cron jam 02.00)
- **Enkripsi AES-256-GCM** sebelum disimpan
- **Magic header** `SIVTBK01` untuk validasi
- **Retensi 30 hari** — file lama auto-hapus
- Format: `backup-YYYY-MM-DD-HH-mm-ss.zip.enc`

**Isi backup:**
- `config.json`
- `providers.json.enc`
- `memory.md`
- `unanswered.json`
- Folder `knowledge/`

### 10. 🔒 Keamanan

| Fitur | Implementasi |
|-------|-------------|
| **Enkripsi API Key** | AES-256-GCM dengan IV & auth tag |
| **Hash Password** | bcrypt dengan salt rounds 10 |
| **Autentikasi** | JWT (HS256) dengan expiry 30 hari |
| **Cookie** | httpOnly + sameSite=lax + secure |
| **Rate Limiting** | 300/15min global, 20/min chat, 10/15min login |
| **Path Protection** | Block akses `.env`, `keys.json`, dll |
| **Input Validation** | Max 2000 karakter per pesan |
| **Trust Proxy** | Support deployment behind proxy |

---

## 🏗️ Arsitektur & Teknologi

### Diagram Arsitektur

```
┌──────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                     │
│  ┌──────────────────┐  ┌──────────────────────────────────┐  │
│  │   Chat Publik    │  │      Dashboard Admin             │  │
│  │   (index.html)   │  │      (index.html)                │  │
│  └────────┬─────────┘  └──────────────┬───────────────────┘  │
│           │                           │                      │
│           └───────────┬───────────────┘                      │
│                       │                                      │
│                       ▼                                      │
│              ┌─────────────────┐                             │
│              │   script.js     │                             │
│              │   style.css     │                             │
│              │   sw.js (PWA)   │                             │
│              └────────┬────────┘                             │
└───────────────────────┼──────────────────────────────────────┘
                        │ HTTPS/SSE
                        ▼
┌──────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js + Express)                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                    index.js                          │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │    │
│  │  │   Auth     │  │   Routes   │  │   Middleware   │  │    │
│  │  │  (JWT)     │  │   (API)    │  │   (Rate Limit) │  │    │
│  │  └────────────┘  └────────────┘  └────────────────┘  │    │
│  └─────────┬────────────────┬─────────────────┬─────────┘    │
│            │                │                 │              │
│            ▼                ▼                 ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   memory.js  │  │ providers.js │  │  Backup Cron │        │
│  │              │  │              │  │              │        │
│  │ - tokenize   │  │ - Gemini     │  │ - ZIP        │        │
│  │ - stem       │  │ - Groq       │  │ - Encrypt    │        │
│  │ - bigram     │  │ - OpenRouter │  │ - Retensi    │        │
│  │ - search     │  │ - Cerebras   │  │              │        │
│  │ - validate   │  │ - Together   │  │              │        │
│  │              │  │ - Mistral    │  │              │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                │
└─────────┼─────────────────┼─────────────────┼────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  memory.md      │ │  AI Provider │ │  data/backups/  │
│  unanswered.json│ │  APIs        │ │  *.zip.enc      │
│  sessions/*.json│ │  (External)  │ │                 │
└─────────────────┘ └──────────────┘ └─────────────────┘
```

### Backend Stack

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Runtime | Node.js | ≥ 18.0.0 |
| Module System | ES Modules | - |
| Web Framework | Express.js | ^5.1.0 |
| AI SDK | @google/genai | ^1.30.0 |
| Autentikasi | jsonwebtoken + bcrypt | ^9.0.3 / ^6.0.0 |
| Cookie | cookie-parser | ^1.4.7 |
| Rate Limit | express-rate-limit | ^8.7.0 |
| Upload | multer | ^2.3.0 |
| Cron | node-cron | ^4.6.0 |
| Zip | adm-zip | ^0.6.1 |
| CORS | cors | ^2.8.5 |
| Env | dotenv | ^17.4.2 |

### Frontend Stack

| Komponen | Teknologi |
|----------|-----------|
| UI Framework | Bootstrap 5.3 |
| Icons | Font Awesome 6.4 |
| JavaScript | Vanilla JS (ES6+) |
| Styling | Custom CSS3 (CSS Variables) |
| Streaming | Server-Sent Events (SSE) |
| PWA | Service Worker + Manifest |
| Font | System font stack |

### AI Provider Details

```javascript
// Contoh fallback flow
Provider 1 (Gemini)  → Model 1 (gemini-2.5-flash)  → ✓ Sukses
       ↓ (jika gagal)
Provider 1 (Gemini)  → Model 2 (gemini-flash-latest) → ✓ Sukses
       ↓ (jika gagal)
Provider 2 (Groq)    → Model 1 (llama-3.3-70b)      → ✓ Sukses
       ↓ (jika gagal)
Provider 2 (Groq)    → Model 2 (llama-3.1-8b)       → ✓ Sukses
       ↓ (jika gagal)
... dst sampai semua provider habis
       ↓ (jika semua gagal)
Return error ke user
```

---

## 📁 Struktur Folder

```
sivt-ai-chatbot/
│
├── 📂 data/                          # Data runtime (auto-generated)
│   ├── 📂 backups/                   # Backup terenkripsi (.zip.enc)
│   ├── 📄 config.json                # Konfigurasi aplikasi
│   ├── 🔒 providers.json.enc         # API key provider (terenkripsi)
│   └── 📄 unanswered.json            # Pertanyaan tak terjawab
│
├── 📂 knowledge/                     # Buku pengetahuan AI
│   ├── 📄 Buku_Panduan_Lengkap_JSS_v7.md
│   └── 📄 buku-pengetahuan.md
│
├── 📂 lib/                           # Library internal
│   ├── 📄 memory.js                  # Sistem memori AI
│   └── 📄 providers.js               # Multi-provider manager
│
├── 📂 logs/                          # Log aplikasi
│   └── 📄 notifications.json         # Notifikasi sistem
│
├── 📂 memory/                        # Data memori AI
│   ├── 📂 sessions/                  # Sesi percakapan (.json)
│   └── 📄 memory.md                  # File memori AI
│
├── 📂 public/                        # Frontend static files
│   ├── 📂 uploads/                   # Logo yang diupload
│   │   └── 🖼️ logo.png
│   ├── 📄 index.html                 # Halaman utama
│   ├── 📄 script.js                  # Logic frontend
│   ├── 📄 style.css                  # Styling
│   ├── 📄 sw.js                      # Service Worker
│   └── 📄 manifest.json              # PWA manifest
│
├── 📂 tmp/                           # File sementara
│
├── 🔧 .env                           # Environment variables (JANGAN COMMIT!)
├── 📄 .env.example                   # Template .env
├── 📄 .gitignore                     # Git ignore rules
├── 📄 CHANGELOG.md                   # Riwayat versi
├── 📄 index.js                       # Entry point server
├── 📄 package.json                   # Manifest npm
└── 📄 README.md                      # Dokumentasi ini
```

### Penjelasan Folder Penting

| Folder | Fungsi |
|--------|--------|
| `data/` | Data runtime: config, backup, API key terenkripsi |
| `knowledge/` | File pengetahuan AI (markdown/txt) |
| `lib/` | Modul internal (memory, providers) |
| `logs/` | Log notifikasi & error |
| `memory/` | Memori AI + sesi percakapan |
| `public/` | Frontend statis (HTML, CSS, JS) |
| `tmp/` | File temporary (upload, backup sementara) |

---

## 🚀 Instalasi

### Prasyarat

- **Node.js** ≥ 18.0.0 → [download](https://nodejs.org/)
- **npm** ≥ 9.0.0 (bundled dengan Node.js)
- **Git** (opsional)
- **API Key** minimal 1 provider AI (gratis)

### Langkah Instalasi

#### 1. Clone Repository

```bash
git clone https://github.com/USERNAME/sivt-ai-chatbot.git
cd sivt-ai-chatbot
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Setup Environment

Copy template:

```bash
cp .env.example .env
```

Edit `.env` (lihat bagian [Konfigurasi](#%EF%B8%8F-konfigurasi)).

#### 4. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy hasil ke `.env` sebagai `ENCRYPTION_KEY`.

#### 5. Jalankan Server

```bash
npm start
```

Server jalan di `http://localhost:3000`.

---

## ⚙️ Konfigurasi

### File `.env`

```env
# ============================================
# SIVT AI - Environment Configuration
# ============================================

# JWT Secret (minimal 32 karakter random)
JWT_SECRET=change_me_to_random_32_chars_minimum

# Encryption Key (HARUS 64 karakter hex)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Server
PORT=3000
NODE_ENV=development
```

### Tabel Konfigurasi

| Variable | Wajib | Deskripsi | Default |
|----------|-------|-----------|---------|
| `JWT_SECRET` | ✅ | Secret JWT (min 32 char) | - |
| `ENCRYPTION_KEY` | ✅ | Key AES-256 (64 char hex) | - |
| `ADMIN_USERNAME` | ❌ | Username admin | `admin` |
| `ADMIN_PASSWORD` | ❌ | Password admin (plaintext) | `admin123` |
| `ADMIN_PASSWORD_HASH` | ❌ | Hash bcrypt (alternatif) | - |
| `PORT` | ❌ | Port server | `3000` |
| `NODE_ENV` | ❌ | `development`/`production` | `development` |

### Konfigurasi via Dashboard

Setelah login, admin bisa ubah:

- **Umum**: nama AI, tagline, welcome, kontak
- **Logo**: upload & ukuran
- **Tema**: 7 preset + custom color
- **Provider**: API key, model, status
- **Prompt**: system instruction
- **Knowledge**: upload/hapus file
- **Memory**: enable, threshold
- **Backup**: manual, retensi

---

## 🎮 Cara Menjalankan

### Development

```bash
npm start
```

### Production dengan PM2

```bash
npm install -g pm2
pm2 start index.js --name sivt-ai
pm2 save
pm2 startup
```

### Akses

| Halaman | URL |
|---------|-----|
| Chat Publik | `http://localhost:3000` |
| Login Admin | `http://localhost:3000` → klik ⚙️ |
| Health Check | `http://localhost:3000/api/health` |

**Default Login:**
- Username: `admin`
- Password: `admin123` ⚠️ **GANTI!**

---

## 🔄 Alur Kerja Chat

### Diagram Alur

```
┌─────────────────────────────────────┐
│  👤 User kirim pertanyaan           │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  STEP 1: Cek Memory System          │
│  ─────────────────────────────────  │
│  • Tokenize + stem + bigram         │
│  • Cari skor tertinggi              │
│  • Jika skor ≥ 40:                  │
│    → Jawab dari memori (hemat token)│
│  • Jika tidak: lanjut STEP 2        │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  STEP 2: RAG - Cari Knowledge Base  │
│  ─────────────────────────────────  │
│  • Scoring:                         │
│    - Kata cocok: +3                 │
│    - Stem cocok: +2                 │
│    - Bigram cocok: +6               │
│    - Keyword cocok: +4              │
│    - Title cocok: +5                │
│  • Ambil top 6 chunk                │
│  • Hitung confidence:               │
│    - Skor ≥ 15 → 100%               │
│    - Skor ≥ 8  → 70%                │
│    - Skor ≥ 4  → 40%                │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  STEP 3: Bangun Konteks + History   │
│  ─────────────────────────────────  │
│  • Sisipkan chunk ke prompt         │
│  • Tambahkan 10 pesan terakhir      │
│  • Format: [KONTEKS] + [HISTORY]    │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  STEP 4: Kirim ke Provider AI       │
│  ─────────────────────────────────  │
│  • Fallback otomatis:               │
│    Provider 1 → Model 1             │
│    Jika gagal → Model 2             │
│    Jika gagal → Provider 2, dst.    │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  STEP 5: Clean Format Markdown      │
│  ─────────────────────────────────  │
│  • Hapus ** * ## ` (markdown)       │
│  • Ubah - menjadi • (bullet)        │
│  • Rapikan spacing                  │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  STEP 6: Stream ke User (SSE)       │
│  ─────────────────────────────────  │
│  • Kirim per 8 karakter             │
│  • Delay 10ms → efek mengetik       │
│  • Real-time update                 │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  STEP 7: Logika Penyimpanan         │
│  ─────────────────────────────────  │
│  Jika RAG kosong ATAU               │
│  confidence < 70 ATAU               │
│  AI menolak jawab:                  │
│    → Simpan ke unanswered.json      │
│                                     │
│  Jika RAG bagus & confidence ≥ 70   │
│  DAN AI tidak menolak:              │
│    → Simpan ke memory.md            │
└─────────────────────────────────────┘
```

### Contoh Skenario

**Skenario 1: Pertanyaan Ada di Memori**

```
User: "syarat bikin kk baru"
  ↓
Memory: Skor 65 (≥ 40) → HIT!
  ↓
Jawab dari memori (instan, hemat token)
```

**Skenario 2: Pertanyaan Ada di Knowledge Base**

```
User: "berapa lama bikin akta kelahiran"
  ↓
Memory: Skor 15 (< 40) → tidak cocok
  ↓
RAG: Ditemukan 2 chunk, confidence 100%
  ↓
Kirim ke AI dengan konteks
  ↓
AI jawab: "3-7 hari kerja"
  ↓
Simpan ke memory (kualitas bagus)
```

**Skenario 3: Pertanyaan Tidak Ada di Mana-mana**

```
User: "bagaimana cara urus SIM di Tegalrejo"
  ↓
Memory: Skor 10 → tidak cocok
  ↓
RAG: Kosong
  ↓
Kirim ke AI tanpa konteks
  ↓
AI jawab: "Wah, info itu belum ada di buku saya..."
  ↓
Simpan ke unanswered.json (untuk admin tindak lanjut)
```

---

## 🧠 Sistem RAG & Memory

### RAG (Retrieval-Augmented Generation)

**Cara kerja:**

1. **Chunking** — File pengetahuan dipotong jadi bagian kecil
2. **Indexing** — Setiap chunk di-index:
   - Kata asli (`words`)
   - Stem/kata dasar (`stems`)
   - Bigram/pasangan kata (`bigrams`)
   - Kata kunci khusus (`keywordWords`)
3. **Scoring** — Pertanyaan user dibandingkan dengan tiap chunk
4. **Top-K** — Ambil 6 chunk dengan skor tertinggi
5. **Confidence** — Hitung tingkat keyakinan (0-100%)

**Rumus scoring:**
```
score = (kata_cocok × 3) + (stem_cocok × 2) + (bigram_cocok × 6)
      + (keyword_cocok × 4) + (title_cocok × 5)
```

**Confidence level:**
- Skor ≥ 15 → 100% (sangat yakin)
- Skor ≥ 8 → 70% (yakin)
- Skor ≥ 4 → 40% (kurang yakin)
- Skor < 4 → 0% (tidak yakin)

### Memory System

**Cara kerja:**

1. **Save** — Setiap jawaban berkualitas disimpan:
   - Pertanyaan
   - Jawaban
   - Variasi pertanyaan
   - Kata kunci
   - Hit counter

2. **Search** — Cari memori yang cocok:
   - Tokenize + stem + bigram
   - Skor: kata(4) + stem(3) + bigram(10) + hit bonus(max 5)

3. **Validate** — Cek relevansi:
   - Minimal 40% kata kunci user cocok
   - Mencegah jawaban ngawur

4. **Threshold**:
   - `memoryMinScore`: 40 (min skor pakai)
   - `memorySaveThreshold`: 30 (min skor simpan)

**Contoh memori:**
```markdown
## [2026-09-13T09:18:55.859Z] Syarat membuat KK baru
**Pertanyaan:** syarat membuat kk baru
**Variasi:** bikin kk baru, syarat kk baru
**Jawaban:** Untuk membuat KK baru...
**Hit:** 3
**Kata kunci:** syarat, buat, kk, baru
```

---

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/config/public` | Konfigurasi publik (nama, logo, tema) |
| `GET` | `/api/health` | Health check & status server |
| `GET` | `/api/topics` | Daftar topik dari knowledge base |
| `POST` | `/api/chat` | Kirim pesan ke AI (SSE stream) |

### Auth Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/admin/login` | Login admin |
| `POST` | `/api/admin/logout` | Logout admin |
| `GET` | `/api/admin/check` | Cek session admin |

### Admin Endpoints (Perlu Auth)

#### Config

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/admin/config` | Ambil konfigurasi lengkap |
| `POST` | `/api/admin/config` | Update konfigurasi |
| `POST` | `/api/admin/logo/upload` | Upload logo |
| `POST` | `/api/admin/logo/delete` | Hapus logo |
| `POST` | `/api/admin/change-password` | Ganti password |

#### Providers

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/admin/providers/add` | Tambah provider |
| `POST` | `/api/admin/providers/remove` | Hapus provider |
| `POST` | `/api/admin/providers/toggle` | Aktif/nonaktif |
| `POST` | `/api/admin/providers/update-models` | Update model |
| `POST` | `/api/admin/providers/test` | Test API key |

#### Knowledge

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/admin/knowledge/upload` | Upload file |
| `POST` | `/api/admin/knowledge/delete` | Hapus file |
| `POST` | `/api/admin/knowledge/reload` | Reload |

#### Memory

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/admin/memory` | List memori |
| `POST` | `/api/admin/memory/delete` | Hapus 1 |
| `POST` | `/api/admin/memory/clear` | Hapus semua |
| `POST` | `/api/admin/memory/reload` | Reload |

#### Unanswered

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/admin/unanswered` | List |
| `POST` | `/api/admin/unanswered/resolve` | Tandai resolved |
| `POST` | `/api/admin/unanswered/delete` | Hapus 1 |
| `POST` | `/api/admin/unanswered/clear` | Hapus massal |
| `POST` | `/api/admin/unanswered/add-to-knowledge` | Tambah ke KB |

#### Sessions & Notifications

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/admin/sessions` | List sesi |
| `GET` | `/api/admin/sessions/:id` | Detail sesi |
| `POST` | `/api/admin/sessions/clear` | Hapus semua |
| `GET` | `/api/admin/notifications` | List notif |
| `POST` | `/api/admin/notifications/read` | Tandai baca |
| `POST` | `/api/admin/notifications/clear` | Hapus |

#### Backup & Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/admin/backup` | Backup manual |
| `GET` | `/api/admin/backups` | List backup |
| `GET` | `/api/admin/dashboard/stats` | Statistik |

### Contoh Request

**Chat (SSE):**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "syarat buat KK", "sessionId": "sess_123"}'
```

**Response (SSE stream):**
```
data: {"sessionId":"sess_123"}
data: {"meta":{"source":"memory","score":65}}
data: {"delta":"Untuk "}
data: {"delta":"membuat "}
data: {"delta":"KK baru..."}
data: {"done":true}
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🔒 Keamanan

### Fitur Keamanan

| Fitur | Implementasi |
|-------|-------------|
| **Enkripsi API Key** | AES-256-GCM dengan IV & auth tag |
| **Hash Password** | bcrypt salt rounds 10 |
| **Autentikasi** | JWT HS256, expiry 30 hari |
| **Cookie** | httpOnly + sameSite=lax + secure |
| **Rate Limiting** | Global 300/15min, chat 20/min, login 10/15min |
| **Path Protection** | Block `.env`, `keys.json`, `config.json` |
| **Input Validation** | Max 2000 char per pesan |
| **Trust Proxy** | Support behind reverse proxy |
| **Backup Encryption** | AES-256-GCM + magic header |

### Format Enkripsi

**String (API key):**
```
iv_hex:authTag_hex:encrypted_hex
contoh: a1b2c3d4...:e5f6g7h8...:i9j0k1l2...
```

**Binary (backup):**
```
[SIVTBK01][iv 12 bytes][authTag 16 bytes][encrypted data]
```

### Best Practices Production

1. ✅ Ganti password admin default
2. ✅ Generate random `JWT_SECRET` & `ENCRYPTION_KEY`
3. ✅ Set `NODE_ENV=production`
4. ✅ Gunakan HTTPS
5. ✅ Backup `.env` di tempat aman
6. ✅ Update dependencies (`npm audit fix`)
7. ✅ Monitor logs
8. ✅ Batasi akses admin via IP whitelist

### Hal yang HARUS Dihindari

- ❌ **JANGAN commit `.env`** ke Git
- ❌ **JANGAN share `ENCRYPTION_KEY`**
- ❌ **JANGAN pakai password default** di production
- ❌ **JANGAN expose dashboard admin** tanpa proteksi
- ❌ **JANGAN pakai HTTP** di production

---

## 📱 PWA Support

### Cara Install

**Android (Chrome):**
1. Buka aplikasi di Chrome
2. Menu ⋮ → **"Install app"**
3. Icon muncul di home screen

**iOS (Safari):**
1. Buka di Safari
2. Tombol **Share** → **"Add to Home Screen"**
3. Icon muncul di home screen

### Service Worker Strategy

| Request | Strategy |
|---------|----------|
| HTML | Network-first, fallback cache |
| CSS/JS/Icon | Cache-first, update background |
| API (`/api/*`) | Network only |
| Uploads | Network only |
| CDN | Network only |

### Cache Version

Cache name: `sivt-ai-v3` (update jika ada perubahan besar)

---

## 🌐 Deployment

### Opsi 1: VPS / Dedicated Server

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone & install
git clone https://github.com/USERNAME/sivt-ai-chatbot.git
cd sivt-ai-chatbot
npm install --production

# Setup .env
cp .env.example .env
nano .env

# PM2
npm install -g pm2
pm2 start index.js --name sivt-ai
pm2 save
pm2 startup
```

### Opsi 2: Docker

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  sivt-ai:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    volumes:
      - ./data:/app/data
      - ./knowledge:/app/knowledge
      - ./memory:/app/memory
      - ./logs:/app/logs
    restart: unless-stopped
```

Jalankan: `docker-compose up -d`

### Opsi 3: Railway / Render / Fly.io

1. Push repo ke GitHub
2. Connect repo ke platform
3. Set env vars di dashboard
4. Deploy otomatis

### Opsi 4: Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name sivt-ai.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE streaming
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

---

## 🗺️ Roadmap

### ✅ V1.0.0 - Stable Internal (Current)

- [x] Chat publik dengan streaming
- [x] Login admin JWT
- [x] Multi-provider AI (6)
- [x] RAG knowledge base
- [x] Memory system
- [x] Unanswered logger
- [x] Backup otomatis
- [x] Enkripsi AES-256
- [x] PWA support
- [x] Theme customizer
- [x] Upload logo
- [x] Notifikasi sistem

### 🔜 V1.1.0 - Enhancement (Target: Oktober 2026)

- [ ] Export chat history
- [ ] Dark mode chat publik
- [ ] Multi-bahasa (Indonesia + Jawa)
- [ ] Feedback rating per jawaban
- [ ] Analytics lanjutan
- [ ] Bulk import knowledge

### 🔮 V1.2.0 - Advanced (Target: November 2026)

- [ ] Voice input (Web Speech API)
- [ ] WhatsApp Business API
- [ ] Vector database untuk RAG
- [ ] Advanced analytics
- [ ] User authentication untuk warga

### 🚀 V2.0.0 - Public Release (Target: Desember 2026)

- [ ] Multi-tenant
- [ ] Fine-tuning model lokal
- [ ] Mobile app (React Native)
- [ ] Advanced RBAC
- [ ] Real-time collaboration

---

## 🧪 Testing

### Manual Testing Checklist

**Chat Publik:**
- [ ] Kirim pesan sederhana
- [ ] Kirim pesan panjang (>1000 char)
- [ ] Kirim pesan kosong (harus ditolak)
- [ ] Kirim pesan >2000 char (harus ditolak)
- [ ] Klik quick buttons
- [ ] Klik suggestion chips
- [ ] Reset chat
- [ ] Test di HP (responsive)

**Admin Dashboard:**
- [ ] Login dengan password benar
- [ ] Login dengan password salah (harus ditolak)
- [ ] Test tambah provider
- [ ] Test hapus provider
- [ ] Test toggle provider
- [ ] Test upload knowledge
- [ ] Test tambah jawaban ke KB
- [ ] Test backup manual
- [ ] Test ganti password
- [ ] Test logout

**Provider Fallback:**
- [ ] Nonaktifkan provider 1 → harus fallback ke provider 2
- [ ] Test dengan API key invalid → harus coba model berikutnya
- [ ] Test semua provider nonaktif → harus error yang jelas

### Automated Testing (Planned)

```bash
npm test
```

Coverage target: 60%+

---

## 🆘 Troubleshooting

### Error: "JWT_SECRET tidak ada atau terlalu pendek"

**Penyebab:** `.env` tidak ada atau `JWT_SECRET` < 32 char.

**Solusi:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy hasil ke `.env` sebagai `JWT_SECRET`.

### Error: "ENCRYPTION_KEY harus 64 karakter hex"

**Solusi:** Generate ulang:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### AI tidak menjawab / jawaban kosong

**Cek:**
1. Provider aktif? Dashboard → Provider AI
2. API key valid? Klik tombol Test
3. Koneksi internet stabil?
4. Cek log server

### Error: "Tidak ada provider AI yang aktif"

**Solusi:**
1. Buka dashboard admin → **Provider AI**
2. Tambah minimal 1 provider dengan API key valid
3. Pastikan status **Aktif** (✓)

### File `.env` ter-commit ke Git

**Solusi:**
1. **SEGERA** ganti `JWT_SECRET` & `ENCRYPTION_KEY`
2. Ganti password admin
3. Regenerate API key provider
4. Hapus dari tracking:
```bash
git rm --cached .env
git commit -m "chore: remove .env"
```

### Upload gagal karena folder besar

**Solusi:** Upload per-bagian via GitHub web. Pisahkan per folder.

### Server tidak bisa start: "Port 3000 already in use"

**Solusi:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Backup gagal karena disk penuh

**Solusi:**
1. Hapus backup lama manual di `data/backups/`
2. Atau kurangi retensi (edit kode `keepDays = 30` jadi lebih kecil)

### CORS error saat akses dari domain lain

**Solusi:** Edit `index.js`, ganti:
```javascript
app.use(cors({ origin: true, credentials: true }));
```
Menjadi:
```javascript
app.use(cors({
  origin: ['https://domain-anda.com'],
  credentials: true
}));
```

---

## ❓ FAQ

<details>
<summary><b>Bagaimana cara mendapatkan API key gratis?</b></summary>

- **Gemini**: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Groq**: [console.groq.com/keys](https://console.groq.com/keys) (14.400 req/hari!)
- **OpenRouter**: [openrouter.ai/keys](https://openrouter.ai/keys) (model `:free`)
- **Cerebras**: [cloud.cerebras.ai](https://cloud.cerebras.ai)
- **Together**: [api.together.xyz](https://api.together.xyz)
- **Mistral**: [console.mistral.ai](https://console.mistral.ai)

</details>

<details>
<summary><b>Berapa biaya menjalankan aplikasi ini?</b></summary>

**Gratis** kalau pakai:
- Provider AI tier gratis (Groq 14.400 req/hari cukup!)
- Hosting gratis (Railway, Render, Fly.io)
- Domain gratis (subdomain platform)

**Berbayar** kalau:
- Butuh performa tinggi → VPS ($5-10/bulan)
- Domain custom (~Rp150rb/tahun)
- Provider AI premium (kalau butuh model canggih)

</details>

<details>
<summary><b>Apakah data warga aman?</b></summary>

Ya, sangat aman:
- API key dienkripsi AES-256-GCM
- Password admin di-hash bcrypt
- Backup dienkripsi sebelum disimpan
- JWT token dengan expiry
- Rate limiting anti brute force

**Tips tambahan:**
- Ganti password default
- Aktifkan 2FA di akun GitHub
- Jangan share `.env` ke siapapun
- Backup rutin

</details>

<details>
<summary><b>Bagaimana cara menambah pengetahuan AI?</b></summary>

**Cara 1 - Manual:**
1. Buka dashboard → **Pengetahuan**
2. Upload file `.md` atau `.txt`
3. Klik **Reload**

**Cara 2 - Dari Unanswered:**
1. Buka **Tak Terjawab**
2. Pilih pertanyaan pending
3. Klik **Tambah Jawaban**
4. Isi jawaban → **Simpan ke Pengetahuan**
5. Otomatis masuk KB

</details>

<details>
<summary><b>Bagaimana cara reset password admin?</b></summary>

**Via Dashboard:**
1. Login → **Keamanan** → Ganti Password

**Via `.env`:**
1. Edit `.env`, hapus `ADMIN_PASSWORD_HASH`
2. Tambah `ADMIN_PASSWORD=passwordbaru`
3. Restart server

**Via Node:**
```bash
node -e "console.log(require('bcrypt').hashSync('passwordbaru', 10))"
```
Copy hash ke `.env` sebagai `ADMIN_PASSWORD_HASH`.

</details>

<details>
<summary><b>Apakah bisa dijalankan tanpa API key berbayar?</b></summary>

**Bisa banget!** Semua provider punya tier gratis:
- Gemini: generous free tier
- Groq: 14.400 req/hari
- OpenRouter: model `:free` unlimited
- Cerebras: free tier

Cukup 1 provider sudah jalan.

</details>

<details>
<summary><b>Bagaimana cara backup data?</b></summary>

**Otomatis:** Setiap jam 02.00 (cron)

**Manual:**
1. Dashboard → **Backup**
2. Klik **Backup Sekarang**
3. File `.zip.enc` muncul di `data/backups/`

**Restore:**
1. Decrypt file backup
2. Extract isinya
3. Copy ke folder yang sesuai
4. Restart server

</details>

<details>
<summary><b>Apakah bisa diakses dari HP?</b></summary>

Ya! PWA-ready:
1. Deploy ke server (VPS/Railway)
2. Buka URL di HP
3. Install sebagai PWA
4. Bisa diakses seperti aplikasi native

</details>

<details>
<summary><b>Kenapa jawaban AI formatnya aneh (ada ** atau ##)?</b></summary>

Aplikasi sudah otomatis bersihkan format markdown. Kalau masih aneh:
1. Cek `systemInstruction` di Prompt AI
2. Update prompt agar AI tidak pakai markdown
3. Contoh prompt ada di `config.json`

</details>

<details>
<summary><b>Bagaimana cara kontribusi?</b></summary>

1. Fork repo
2. Buat branch: `git checkout -b feature/xyz`
3. Commit: `git commit -m "feat: fitur baru"`
4. Push: `git push origin feature/xyz`
5. Buat Pull Request

Ikuti [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` fitur baru
- `fix:` bug fix
- `docs:` dokumentasi
- `refactor:` refactor
- `test:` testing
- `chore:` maintenance

</details>

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Ikuti langkah:

1. **Fork** repository ini
2. **Clone** fork Anda: `git clone https://github.com/USERNAME/sivt-ai-chatbot.git`
3. Buat branch: `git checkout -b feature/fitur-baru`
4. Commit: `git commit -m "feat: tambah fitur baru"`
5. Push: `git push origin feature/fitur-baru`
6. Buat **Pull Request**

### Aturan Kontribusi

- ✅ Ikuti code style yang ada
- ✅ Tulis commit message yang jelas
- ✅ Update dokumentasi kalau perlu
- ✅ Test sebelum PR
- ❌ JANGAN commit `.env` atau API key
- ❌ JANGAN push langsung ke `main`

---

## 📞 Kontak

| Channel | Info |
|---------|------|
| 📧 Email | kemantren.tegalrejo@jogjakota.go.id |
| 🌐 Website | tegalrejo.jogjakota.go.id |
| 📱 WhatsApp | 0812-3456-7890 |
| ☎️ Telepon | (0274) 123456 |
| 📍 Alamat | Jl. Tegalrejo No.1, Yogyakarta 55241 |

---

## 🙏 Ucapan Terima Kasih

- **Kemantren Tegalrejo** — dukungan & data layanan
- **Pemerintah Kota Yogyakarta** — inspirasi layanan publik digital
- **Google Gemini, Groq, OpenRouter** — API gratis
- **Komunitas Open Source** — library luar biasa

---

## 📄 Lisensi

MIT License — lihat [LICENSE](LICENSE) untuk detail.

```
Copyright (c) 2026 Kemantren Tegalrejo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**🔒 Repository Private — Dalam Tahap Pengembangan Aktif 🔒**

**⭐ Jangan lupa kasih bintang kalau bermanfaat! ⭐**

Made with ❤️ in Yogyakarta, Indonesia

**[⬆ Kembali ke Atas](#-sivt-ai--sistem-informasi-virtual-tegalrejo)**

</div>
