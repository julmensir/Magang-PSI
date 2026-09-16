# Changelog

Semua perubahan penting pada proyek **SIVT AI - Sistem Informasi Virtual TEGALREJO** akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 📅 Direncanakan (V1.1.0 - Target: Oktober 2026)

- Export chat history (CSV/JSON)
- Dark mode untuk chat publik
- Multi-bahasa (Indonesia + Jawa)
- Feedback rating per jawaban
- Analytics lanjutan (topik populer, jam sibuk)
- Bulk import knowledge (upload folder)

### 🔮 Direncanakan (V1.2.0 - Target: November 2026)

- Voice input (Web Speech API)
- WhatsApp Business API integration
- Vector database untuk RAG (Qdrant/Pinecone)
- Advanced analytics dashboard
- User authentication untuk warga

### 🚀 Direncanakan (V2.0.0 - Target: Desember 2026)

- Multi-tenant support
- Fine-tuning model lokal
- Mobile app (React Native)
- Advanced RBAC (role-based access control)
- Real-time collaboration admin

---

## [1.0.0] - 2026-09-16

### 🎉 Initial Stable Release

Rilis stabil pertama SIVT AI - Asisten Virtual Kemantren Tegalrejo Yogyakarta.

### ✨ Added (Fitur Baru)

#### Chat Publik
- Interface chat modern dengan streaming real-time (SSE)
- Efek typing indicator dengan animasi 3 titik
- Quick buttons untuk pertanyaan populer
- Suggestion chips ketika AI tidak yakin
- Session persistence di localStorage
- Reset chat untuk mulai percakapan baru
- Responsive mobile-first design

#### Dashboard Admin
- Statistik real-time (provider, knowledge, memory, sesi, unanswered)
- Chart aktivitas 7 hari terakhir
- Status provider dengan badge aktif/nonaktif
- Quick actions untuk aksi cepat
- 13 menu navigasi lengkap

#### Multi-Provider AI
- Support 6 provider:
  - Google Gemini (gemini-2.5-flash, gemini-2.5-flash-lite)
  - Groq (llama-3.3-70b-versatile, llama-3.1-8b-instant)
  - OpenRouter (meta-llama/llama-3.3-70b:free)
  - Cerebras (llama-3.3-70b, llama3.1-8b)
  - Together AI (Llama-3.3-70B-Instruct-Turbo)
  - Mistral AI (mistral-small-latest, open-mistral-nemo)
- Fallback otomatis antar provider & model
- Toggle aktif/nonaktif provider
- Test API key dari dashboard
- Edit daftar model per provider

#### RAG System
- Auto-chunking file knowledge base
- Indexing: kata, stem, bigram, keyword
- Deteksi topik otomatis dari heading markdown
- Scoring dengan rumus berbobot
- Confidence level (100%, 70%, 40%, 0%)
- Reload knowledge tanpa restart server

#### Memory System
- Sinonim bahasa Indonesia (bikin → buat)
- Stemming otomatis (membuat → buat)
- Bigram matching untuk frasa
- Validasi relevansi sebelum menjawab
- Auto-save jawaban berkualitas tinggi
- Hit counter untuk tracking popularitas
- Threshold configurable (min pakai: 40, min simpan: 30)

#### Unanswered Logger
- Otomatis mencatat pertanyaan tak terjawab
- Filter: pending / resolved / all
- Tambah jawaban → langsung masuk knowledge base
- Tandai resolved / unresolve
- Hapus individual / massal
- Counter berapa kali ditanya

#### Kustomisasi Tampilan
- Upload logo (PNG, JPG, GIF, WEBP, SVG) max 2MB
- Auto-resize & preview logo
- 4 ukuran logo: small, medium, large, xlarge
- 7 preset warna: Biru, Dark, Hijau, Ungu, Merah, Teal, Orange
- Custom color picker + input hex
- Live preview saat ganti warna
- Sidebar gradient customizable

#### Notifikasi Sistem
- Dropdown notifikasi di kanan atas
- Badge unread count dengan animasi pulse
- Auto-refresh setiap 30 detik
- Mark as read / clear all
- Throttling untuk mencegah spam notif
- Log ke `logs/notifications.json`

#### Backup & Restore
- Backup manual via tombol dashboard
- Backup otomatis harian (cron 02.00)
- Enkripsi AES-256-GCM sebelum disimpan
- Magic header `SIVTBK01` untuk validasi
- Retensi otomatis 30 hari
- Format: `backup-YYYY-MM-DD-HH-mm-ss.zip.enc`

#### PWA Support
- Service Worker dengan cache strategy
- Manifest.json untuk install di HP
- Offline mode untuk aset statis
- Network-first untuk HTML
- Cache-first untuk CSS/JS/Icon

### 🔒 Security (Keamanan)

- API key provider dienkripsi AES-256-GCM
- Password admin di-hash bcrypt (salt rounds 10)
- Autentikasi JWT (HS256) dengan expiry 30 hari
- Cookie httpOnly + sameSite=lax + secure
- Rate limiting:
  - Global: 300 req/15min
  - Chat: 20 req/min per session
  - Login: 10 req/15min
- Path traversal protection
- Input validation (max 2000 karakter per pesan)
- Trust proxy support untuk deployment
- Backup encryption AES-256-GCM

### 🛠️ Technical

- **Backend**: Node.js ≥ 18.0.0, Express.js v5
- **Frontend**: Bootstrap 5.3, Font Awesome 6.4, Vanilla JS
- **Runtime**: ES Modules
- **Database**: File-based (JSON + Markdown)
- **Streaming**: Server-Sent Events (SSE)
- **Cron**: node-cron untuk backup otomatis
- **Upload**: Multer untuk file handling
- **Zip**: AdmZip untuk backup

### 📚 Knowledge Base

- `buku-pengetahuan.md` — Informasi lengkap Kemantren Tegalrejo
- `Buku_Panduan_Lengkap_JSS_v7.md` — Panduan Jogja Smart Service

### 📝 Documentation

- README.md lengkap dengan:
  - Tentang proyek & tujuan
  - 10 fitur utama
  - Arsitektur & teknologi
  - Struktur folder
  - Panduan instalasi
  - Konfigurasi `.env`
  - Alur kerja chat (diagram)
  - API endpoints lengkap
  - Panduan keamanan
  - PWA support
  - Deployment (VPS, Docker, Railway, Nginx)
  - Roadmap
  - Troubleshooting
  - FAQ (10 pertanyaan)
  - Kontribusi & lisensi

### ⚠️ Known Issues

- Belum ada export chat history
- Belum ada multi-bahasa
- Belum ada voice input
- Belum ada vector database (masih pakai keyword matching)
- Belum ada automated testing

---

## Format Versi

Proyek ini mengikuti [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Perubahan besar yang **tidak backward compatible**
- **MINOR** (x.Y.0): Fitur baru yang **backward compatible**
- **PATCH** (x.y.Z): Bug fix yang **backward compatible**

**Contoh:**
- `1.0.0` → `1.0.1` = Bug fix kecil
- `1.0.0` → `1.1.0` = Fitur baru
- `1.0.0` → `2.0.0` = Breaking change

---

## Kategori Perubahan

Setiap versi bisa berisi kategori berikut:

| Kategori | Deskripsi |
|----------|-----------|
| **Added** | Fitur baru |
| **Changed** | Perubahan pada fitur yang sudah ada |
| **Deprecated** | Fitur yang akan dihapus |
| **Removed** | Fitur yang dihapus |
| **Fixed** | Bug fix |
| **Security** | Perbaikan keamanan |

---

## Cara Update CHANGELOG

Setiap kali ada perubahan, ikuti langkah:

1. **Tambah di `[Unreleased]`** — untuk perubahan yang belum dirilis
2. **Saat rilis** — pindahkan ke section versi baru dengan tanggal
3. **Buat section kosong** `[Unreleased]` baru di atas

**Contoh:**

Sebelum rilis v1.1.0:
```markdown
## [Unreleased]

### Added
- Fitur dark mode
- Export chat history

## [1.0.0] - 2026-09-16
...
