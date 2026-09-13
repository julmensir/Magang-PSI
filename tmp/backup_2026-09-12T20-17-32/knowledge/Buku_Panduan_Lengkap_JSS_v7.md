# BUKU PANDUAN LENGKAP PENGGUNAAN APLIKASI JOGJA SMART SERVICE (JSS)
*Versi Aplikasi: JSS v7.x / Portal Maya Pemerintah Kota Yogyakarta*

---

## BAB 1: PENDAHULUAN & PROFIL APLIKASI JSS

### 1.1 Mengenal Jogja Smart Service (JSS)
**Jogja Smart Service (JSS)** adalah portal maya terpadu (*Balaikota Virtual*) resmi milik Pemerintah Kota Yogyakarta. Didevelop oleh Dinas Komunikasi, Informatika, dan Persandian Kota Yogyakarta, JSS dirancang untuk mengintegrasikan seluruh layanan publik, administrasi pemerintah, perizinan, hingga fasilitas kegawatdaruratan ke dalam satu pintu (*Single Sign-On / SSO*).

Dengan mengusung konsep **Swalayan Layanan Publik**, masyarakat Kota Yogyakarta maupun pendatang/wisatawan dapat mengakses ratusan fitur layanan Pemkot Jogja secara mandiri tanpa harus datang langsung ke kantor kedinasan.

### 1.2 Konsep Single Sign-On (SSO)
Satu Akun JSS dapat digunakan untuk mengoperasikan seluruh sistem informasi dan aplikasi pelayanan publik yang dimiliki oleh Organisasi Perangkat Daerah (OPD) di lingkungan Pemerintah Kota Yogyakarta. Pengguna tidak perlu mengingat banyak *username* dan *password* untuk layanan yang berbeda.

### 1.3 Keamanan Data & Kebijakan Privasi
- **Enkripsi Data**: Seluruh pertukaran data pada aplikasi JSS dilindungi dengan teknologi enkripsi SSL/TLS saat pengiriman.
- **Kepatuhan Regulasi**: Pengelolaan data pribadi masyarakat mengacu pada Undang-Undang Perlindungan Data Pribadi (UU PDP) serta standar keamanan CSIRT Pemkot Yogyakarta.
- **Privasi**: Informasi lokasi, foto KTP, dan identitas pribadi tidak dibagikan kepada pihak ketiga di luar instansi berwenang.

---

## BAB 2: SPESIFIKASI DAN PERSYARATAN SISTEM

### 2.1 Persyaratan Perangkat
1. **Perangkat Android**: 
   - Sistem Operasi: Android 6.0 (Marshmallow) atau lebih baru.
   - Koneksi Internet: Minimum 3G/4G/5G atau WiFi.
   - Fitur Pendukung: GPS/Lokasi aktif, Kamera (untuk presensi & scan QR), Sensor Biometrik (opsional untuk Passkey).
2. **Perangkat iOS (iPhone/iPad)**:
   - Sistem Operasi: iOS 12.0 atau lebih baru.
3. **Web Browser (Desktop/Laptop)**:
   - Browser: Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari versi terbaru.
   - Akses Portal Web: [https://jss.jogjakota.go.id](https://jss.jogjakota.go.id)

### 2.2 Persyaratan Berkas untuk Registrasi Full Account
- Nomor Induk Kependudukan (NIK) e-KTP.
- Alamat Email Aktif.
- Nomor WhatsApp Aktif (dapat menerima pesan teks/OTP).
- Foto Swafoto (Selfie) dengan memegang e-KTP (khusus untuk verifikasi tingkat lanjut).

---

## BAB 3: PANDUAN REGISTRASI, LOGIN, DAN MANAJEMEN AKUN

### 3.1 Cara Mengunduh & Instalasi
1. Buka **Google Play Store** (Android) atau **App Store** (iOS).
2. Pada kolom pencarian, ketikkan **"Jogja Smart Service"** atau **"JSS"**.
3. Pilih aplikasi resmi terbitan *Pemerintah Kota Yogyakarta / Dinas Komunikasi Informatika dan Persandian*.
4. Tekan **Install / Dapatkan**.
5. Selain itu, Anda juga dapat memindai QR Code resmi yang tersedia pada situs [https://jss.jogjakota.go.id/v6/panduan](https://jss.jogjakota.go.id/v6/panduan).

### 3.2 Langkah Pendaftaran Akun Baru (Registrasi)
Pendaftaran dapat dilakukan melalui **Smartphone** maupun **Website/Desktop**.

#### A. Registrasi via Smartphone:
1. Buka aplikasi JSS di ponsel Anda.
2. Pada halaman utama *Login*, tekan tombol **"Belum punya akun? Registrasi"**.
3. Masukkan **NIK** (Nomor Induk Kependudukan). 
   - *Catatan*: Sistem otomatis mendeteksi apakah Anda Warga Kota Yogyakarta atau Non-Warga. Non-warga tetap dapat mendaftar untuk mengakses layanan umum & pariwisata.
4. Isi data diri lengkap: Nama Lengkap (sesuai KTP), Tanggal Lahir, Alamat Email, dan Nomor WhatsApp aktif.
5. Buat **Kata Sandi (Password)** dengan kombinasi huruf dan angka.
6. Tekan tombol **"Daftar"**.

#### B. Aktivasi Akun:
1. Setelah menekan tombol Daftar, sistem akan mengirimkan **Pesan Verifikasi / Kode OTP** via WhatsApp atau Email.
2. Buka pesan WhatsApp dari akun resmi JSS / Pemkot Jogja atau cek Inbox/Folder Spam email Anda.
3. Masukkan kode verifikasi atau klik tautan aktivasi yang diberikan.
4. Akun JSS Anda kini telah aktif.

### 3.3 Metode Login yang Didukung
Aplikasi JSS menyediakan berbagai cara praktis untuk masuk ke sistem:

1. **Login Standar Form**:
   - Masukkan Username/Email/NIK dan Password.
2. **Login SSO Google / Apple**:
   - Tekan ikon **"Masuk dengan Google"** atau **"Masuk dengan Apple"**.
   - Tautkan akun Google/Apple yang terpasang di perangkat Anda.
3. **Login dengan Passkey**:
   - Memungkinkan Anda masuk tanpa mengetik kata sandi, melainkan menggunakan pengenalan wajah (*Face ID*) atau sidik jari (*Fingerprint*) perangkat.
4. **Login Web via Scan QR Code (SSO)**:
   - Apabila Anda mengakses JSS versi Web Komputer, pilih menu **"Masuk SSO JSS dengan Scan Kode QR"**.
   - Buka scanner QR di aplikasi JSS smartphone Anda, lalu arahkan ke layar komputer untuk mengotentikasi secara instant.

### 3.4 Pemulihan Lupa Kata Sandi (Reset Password)
Jika Anda tidak bisa masuk karena lupa password:
1. Pada halaman login, klik **"Lupa kata sandi?"**.
2. Pilih metode pemulihan:
   - **Via Email**: Masukkan email terdaftar. Sistem akan mengirimkan link reset password.
   - **Via WhatsApp**: Masukkan nomor HP/WhatsApp terdaftar. Sistem akan mengirimkan kode/link reset via pesan WhatsApp.
3. Buat kata sandi baru dan konfirmasi.

---

## BAB 4: DIREKTORI FITUR DAN LAYANAN TERINTEGRASI

Seluruh layanan dalam JSS dikelompokkan berdasarkan kategori sektoral. Berikut adalah rincian lengkap fitur yang tersedia:

### 4.1 Kategori Kedaruratan & Pengaduan
- **Panggilan Darurat 112**: Panggilan darurat terpusat bebas pulsa untuk musibah kebakaran, kecelakaan, bencana alam, dan gangguan keamanan.
- **UPIK (Unit Pelayanan Informasi dan Keluhan)**:
  - Layanan utama penyampaian aduan warga terkait infrastruktur, kebersihan, kemacetan, hingga pelayanan publik.
  - Dilengkapi fitur pengunggahan foto, penentuan titik lokasi (GPS geotagging), serta pelacakan *real-time* status pengerjaan aduan oleh OPD terkait.
- **Emergency / Panic Button**: Tombol sinyal bahaya cepat untuk kondisi darurat medis atau ancaman keselamatan jiwa (Hotline: 0274-587101 atau 119).

### 4.2 Kategori Kependudukan & Catatan Sipil (Dukcapil)
- **Buku Saku Layanan Dukcapil**: Panduan dan syarat pengurusan administrasi kependudukan.
- **Mutasi Warga**: Manajemen data perpindahan (datang/keluar) warga bagi pengurus RT/RW.
- **Pencetakan Dokumen**: Pengajuan cetak e-KTP, Kartu Keluarga (KK), Kartu Identitas Anak (KIA), Akta Kelahiran, Akta Kematian, dan Pemutakhiran Data Perkawinan.
- **MPP Digital & IKD**: Integrasi dengan aplikasi Identitas Kependudukan Digital resmi dari Kementerian Dalam Negeri.

### 4.3 Kategori Kesehatan
- **Antrean Puskesmas Online**: Pengambilan nomor antrean berobat secara elektronik di seluruh Puskesmas Kota Yogyakarta, lengkap dengan estimasi jam kedatangan.
- **Jadwal Dokter & Pendaftaran RSUD Kota Yogyakarta (RS Jogja)**: Pendaftaran poliklinik rawat jalan dan cek jadwal praktik dokter spesialis.
- **Ketersediaan Kamar Rawat Inap**: Pantauan kapasitas tempat tidur rawat inap rumah sakit secara transparan.
- **JAGA SULTAN**: Layanan pendaftaran Jaminan Keluarga Sehat dan Pembiayaan Kesehatan bagi warga Kota Yogyakarta.

### 4.4 Kategori Pajak & Retribusi Daerah
- **QRISNA**: Portal pembayaran terpadu berbasis QRIS dan e-payment untuk melunasi Pajak PBB, Pajak Hotel, Pajak Restoran, Retribusi Pasar, dan Retribusi Sampah/SAL.
- **Layanan PBB-P2 & e-SPPT**: Cek tagihan PBB, unduh lembar e-SPPT mandiri, serta pengajuan pembetulan atau mutasi objek pajak PBB.
- **E-SPTPD**: Fitur wajib pajak badan/usaha untuk melaporkan perhitungan pajak daerah secara self-assessment.
- **E-Retribusi Pasar & e-Sewa**: Layanan tagihan digital dan pembayaran sewa lapak/kios pasar tradisional Kota Yogyakarta.

### 4.5 Kategori Perizinan & Mal Pelayanan Publik (MPP)
- **Pelayanan Terpadu Satu Pintu (DPMPTSP)**: Permohonan izin usaha, bangunan, reklame, dan perizinan non-berusaha.
- **Izin Praktik Kesehatan (SIP)**: Permohonan Surat Izin Praktik online bagi tenaga dokter, perawat, bidan, dan tenaga medis lainnya.
- **Perizinan Sektor Damkar & Ketenagakerjaan**: Pemenuhan syarat sertifikasi laik fungsi Proteksi Kebakaran serta izin operasional ketenagakerjaan.
- **Virtual Tour & Denah 3D MPP**: Panduan lokasi dan loket pelayanan di Gedung Mal Pelayanan Publik Kota Yogyakarta.

### 4.6 Kategori Perhubungan, Transportasi & Informasi Publik
- **FreeHotspot JSS**: Akses internet gratis Pemkot Jogja di ratusan titik publik. Pengguna dapat mengunduh sertifikat WiFi khusus (`ca.der`) melalui aplikasi untuk koneksi aman metode TLS/PEAP.
- **Live CCTV Kota Yogyakarta**: Fitur pemantauan CCTV real-time di titik strategis seperti kawasan Tugu, Jalan Malioboro, Titik Nol Kilometer, dan persimpangan utama.
- **SI REGOL (KIR Online)**: Sistem registrasi online untuk uji berkala kendaraan bermotor (KIR) di UPTU Pengujian Kendaraan Bermotor.

### 4.7 Kategori Pendidikan, Kepemudaan & Sosial
- **PPDB Online**: Pendaftaran dan pemantauan seleksi Penerimaan Peserta Didik Baru tingkat SD dan SMP Negeri Kota Yogyakarta.
- **Monitoring Perkembangan Siswa**: Portal bagi orang tua untuk memantau kehadiran dan proses belajar anak di sekolah.
- **KBS (Konsultasi Belajar Siswa)**: Media konsultasi pembelajaran online langsung bersama tim guru/tutor khusus Dinas Pendidikan.
- **Pusat Informasi Sahabat Anak (PISA) & Katalog Perpustakaan**: Pencarian koleksi buku perpustakaan daerah dan layanan konsultasi anak.
- **Pemesanan Mobil Jenazah**: Layanan permintaan armada kendaraan jenazah untuk warga.

### 4.8 Kategori Pariwisata, Budaya & UMKM
- **Event Wisata & Hotline Anita Cantik**: Informasi kalender agenda pariwisata, destinasi populer, dan layanan panduan turis.
- **Pendaftaran Nomor Induk Kebudayaan**: Registrasi untuk lembaga, sanggar, dan kelompok seni/pelaku budaya.
- **Nglarisi**: E-katalog pemesanan makanan dan produk usaha mikro (UMKM) binaan Pemkot Yogyakarta.
- **Info Harga Pangan (Bapok)**: Pemantauan pergerakan harga komoditas beras, cabai, telur, dan daging di Pasar Beringharjo, Kranggan, dan pasar daerah lainnya.

### 4.9 Kategori Tenaga Kerja & Kepegawaian (ASN)
- **Pembuatan Kartu AK-1 (Kartu Kuning)**: Pengajuan sertifikat pencari kerja online.
- **Pendaftaran Pelatihan Kerja**: Akses program pelatihan vokasi yang diselenggarakan UPT BLK Yogyakarta.
- **Modul E-Kinerja & Presensi ASN**: Khusus Pegawai Negeri Sipil / P3K Pemkot Jogja untuk pencatatan kehadiran presensi wajah dan pelaporan kinerja harian.

---

## BAB 5: TUTORIAL TEKNIS & PANDUAN PENGGUNAAN FITUR POPULER

### 5.1 Cara Menghubungkan Internet "FREEHOTSPOT JSS"
1. Buka aplikasi JSS di HP Anda.
2. Cari fitur **"Sertifikat WiFi"** pada kolom pencarian.
3. Masukkan password akun JSS Anda, lalu unduh sertifikat `ca.der`.
4. Buka **Pengaturan HP > Keamanan > Enkripsi & Kredensial > Install Sertifikat dari Penyimpanan**.
5. Pilih file `ca.der` dan beri nama (misal: *Sertifikat JSS*).
6. Buka menu WiFi HP, hubungkan ke SSID **FREEHOTSPOT JSS**.
7. Atur metode EAP ke **TLS** atau **PEAP**, pilih Sertifikat CA yang telah diinstal, masukkan *Username JSS* Anda pada kolom Identitas, lalu tekan **Hubungkan**.

### 5.2 Langkah Membuat Laporan Aduan di UPIK JSS
1. Masuk ke aplikasi JSS, pilih menu **Pengaduan (UPIK)**.
2. Klik ikon **"Tulis Pengaduan Baru"**.
3. Pilih Kategori Aduan (misal: *Jalan Rusak*, *Sampah*, *Lampu PJU Mati*).
4. Tulis deskripsi kejadian secara rinci dan jelas.
5. Lampirkan foto bukti kondisi di lapangan.
6. Pastikan fitur GPS ponsel Anda AKTIF agar koordinat lokasi aduan terekam secara tepat (*geotagging*).
7. Tekan **Kirim**. Anda dapat memantau respons dan status tindak lanjut petugas melalui tab **"Aduan Saya"**.

---

## BAB 6: TROUBLESHOOTING DAN PUSAT BANTUAN

### 6.1 Pertanyaan Sering Diajukan (FAQ)
- **T: Kenapa akun saya berstatus "Belum Terverifikasi"?**
  - *Jawab*: Pendaftaran awal memberikan akses standar. Untuk mengakses fitur sensitif (seperti layanan Dukcapil dan Perizinan), Anda perlu mengunggah foto e-KTP dan foto diri pada menu profil untuk diverifikasi oleh petugas.
- **T: Tidak menerima kode OTP WhatsApp / Email saat registrasi?**
  - *Jawab*: Pastikan nomor WhatsApp dalam format aktif dan tidak diblokir. Cek folder *Spam / Junk* pada email Anda. Jika belum menerima dalam 5 menit, pilih opsi *Kirim Ulang OTP*.

### 6.2 Kontak Pengaduan Teknis Aplikasi JSS
- **Pengelola**: Dinas Komunikasi, Informatika, dan Persandian Kota Yogyakarta
- **Alamat Portal Web**: [https://jss.jogjakota.go.id](https://jss.jogjakota.go.id)
- **Halaman Panduan Resmi**: [https://jss.jogjakota.go.id/v6/panduan](https://jss.jogjakota.go.id/v6/panduan)
- **Layanan Panggilan Darurat**: 112 (Kota Yogyakarta)
