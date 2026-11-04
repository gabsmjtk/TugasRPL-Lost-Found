# CampusFind - Sistem Informasi Pelaporan & Pengembalian Barang Hilang Kampus

CampusFind adalah aplikasi web terintegrasi untuk mengelola siklus pelaporan, verifikasi, pencarian, klaim kepemilikan, dan serah terima (handover) barang hilang atau ditemukan di lingkungan kampus. Proyek ini mengadopsi arsitektur monorepo berbasis NPM Workspaces dengan fokus tinggi pada integritas data, keamanan sistem, dan keandalan operasional.

---

## 1. Fitur Utama

- **Pelaporan Barang Hilang & Ditemukan (Lost & Found):** Mahasiswa dapat membuat laporan barang hilang (*lost*) atau barang temuan (*found*) dilengkapi dengan unggahan foto, lokasi kejadian, kategori, dan deskripsi detail.
- **Pencarian Cepat & Filter Multikriteria:** Pencarian real-time berbasis kata kunci, kategori barang, tipe laporan, lokasi kejadian, dan status barang.
- **Verifikasi & Moderasi Admin:** Admin meninjau laporan pending untuk disetujui (*OPEN*) atau ditolak (*REJECTED*) dengan catatan moderator.
- **Klaim Kepemilikan Barang:** Mahasiswa dapat mengajukan klaim atas barang temuan dengan menyertakan bukti kepemilikan dan kontak verifikasi.
- **Pencatatan Serah Terima (Handover Audit):** Admin mencatat eksekusi penyerahan barang secara formal dengan bukti tanda terima sehingga status laporan beralih menjadi *RETURNED*.
- **Dashboard Mahasiswa & Admin:** Panel metrik visual ringkas untuk memantau status laporan aktif, klaim menunggu, dan riwayat transaksi.
- **Keamanan Tingkat Tinggi (Hardened Security):** Rate limiting autentikasi, proteksi upload berkas aman (MIME & ekstensi whitelist), kontrol akses berbasis peran (RBAC), pencegahan cross-user tampering, dan sanitasi log otomatis tanpa kebocoran rahasia.

---

## 2. Arsitektur & Teknologi

Proyek ini dibangun menggunakan arsitektur monorepo yang terbagi ke dalam 3 paket utama:
- `apps/api`: RESTful API backend menggunakan Node.js, Express, TypeScript, dan Prisma ORM.
- `apps/web`: Frontend Single Page Application (SPA) modern menggunakan React 18, TypeScript, Tailwind CSS, Lucide Icons, dan Vite.
- `packages/shared`: Modul bersama yang menyimpan Data Transfer Objects (DTO), Enums, dan Type Definitions.

| Layer | Teknologi | Peran & Tanggung Jawab |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Axios | Antarmuka pengguna responsif & intuitif |
| **Backend** | Express 4, TypeScript, Node.js 20 | Logika bisnis, otorisasi RBAC, API gateway |
| **Database & ORM** | MySQL 8.0 / PostgreSQL, Prisma ORM 5 | Persistensi data terstruktur, skema migrasi |
| **Keamanan** | Helmet, express-rate-limit, Zod, Bcrypt | HTTP hardening, pembatas laju, validasi input |
| **Testing** | Jest, Supertest, Vitest | Pengujian unit, integrasi, dan keamanan otomatis |
| **Kontainerisasi** | Docker & Docker Compose | Standardisasi lingkungan database lokal |

---

## 3. Prasyarat Sistem

Sebelum memulai, pastikan perangkat penguji telah terpasang:
- **Node.js:** Versi 20.x LTS (minimal v18.x)
- **NPM:** Versi 10.x atau lebih baru
- **Docker & Docker Compose:** Untuk menjalankan layanan database MySQL lokal
- **Git:** Untuk manajemen kode sumber
- **Browser:** Google Chrome, Mozilla Firefox, atau Microsoft Edge versi terbaru

---

## 4. Panduan Fresh Clone

Ikuti langkah-langkah di bawah ini untuk mengkloning dan menyiapkan proyek dari nol:

```bash
# 1. Kloning repository
git clone https://github.com/gabsmjtk/TugasRPL-Lost-Found.git

# 2. Masuk ke direktori proyek monorepo
cd TugasRPL-Lost-Found/campusfind

# 3. Checkout ke branch P8
git checkout p8-security-quality
```

---

## 5. Konfigurasi Environment Variable (`.env`)

Aplikasi menggunakan file `.env` di direktori root untuk backend dan `apps/web/.env` untuk frontend.

### A. Konfigurasi Backend & Database (Root)
Salin berkas template contoh:
```bash
# Linux / macOS / Git Bash
cp .env.example .env

# Windows PowerShell
copy .env.example .env
```

#### Penjelasan Setiap Variabel Lingkungan:
- `NODE_ENV`: Mode eksekusi aplikasi (`development`, `production`, atau `test`).
- `PORT`: Nomor port TCP yang digunakan server backend API (default: `3001`).
- `DATABASE_URL`: URL koneksi lengkap ke database MySQL (`mysql://<user>:<password>@<host>:<port>/<dbname>`).
- `JWT_SECRET`: Kunci rahasia berkekuatan tinggi (minimal 16 karakter acak) untuk enkripsi token JWT sesi.
- `JWT_EXPIRES_IN`: Masa berlaku token otentikasi JWT sebelum kedaluwarsa (misal: `1d`, `7d`).
- `CLIENT_URL`: URL asal klien frontend yang diizinkan mengakses API melalui CORS (whitelist).
- `UPLOAD_DIR`: Lokasi direktori penyimpanan berkas gambar upload (default: `uploads`).
- `MAX_FILE_SIZE_MB`: Batas ukuran maksimal satu berkas upload dalam satuan Megabyte (default: `5`).

> [!IMPORTANT]
> Jangan pernah menyertakan password asli, token pribadi, atau credential rahasia ke dalam commit Git.

### B. Konfigurasi Frontend (`apps/web/.env`)
Salin berkas template contoh frontend:
```bash
# Linux / macOS / Git Bash
cp apps/web/.env.example apps/web/.env

# Windows PowerShell
copy apps/web\.env.example apps/web\.env
```
Variabel:
- `VITE_API_URL`: URL basis endpoint API backend yang dihubungi oleh frontend (default: `http://localhost:3001/api`).

---

## 6. Instalasi Dependensi

Jalankan perintah instalasi bersih dari direktori root `campusfind`:
```bash
npm install
```
Perintah ini akan secara otomatis menginstal dependensi seluruh workspace (`apps/api`, `apps/web`, dan `packages/shared`).

---

## 7. Menjalankan Database, Migrasi, dan Seeding

### A. Menjalankan Database MySQL via Docker
Pastikan Docker Desktop aktif, lalu jalankan:
```bash
npm run db:start
```
*Layanan MySQL 8 akan berjalan di port `3306` pada latar belakang.*

### B. Menjalankan Migrasi Skema Basis Data
Terapkan migrasi tabel database menggunakan Prisma:
```bash
npm run db:migrate
```

### C. Menjalankan Seeding Data Awal (Kategori & Akun Demo)
Isi database dengan kategori bawaan, akun demonstrasi, dan sampel laporan awal:
```bash
npm run db:seed
```

---

## 8. Akun Demonstrasi (Demo Accounts)

Database seed menyediakan akun pengujian siap pakai dengan password standar: `password123`

| Role | Nama Pengguna | Email Login | Password | Hak Akses Utama |
|---|---|---|---|---|
| **Admin** | Administrator | `admin@campusfind.ac.id` | `password123` | Akses penuh dashboard admin, verifikasi laporan, keputusan klaim, serah terima barang, manajemen kategori & pengguna |
| **Mahasiswa 1** | Budi Santoso | `student1@campusfind.ac.id` | `password123` | Buat laporan, ajukan klaim, kelola laporan & klaim pribadi |
| **Mahasiswa 2** | Siti Aminah | `student2@campusfind.ac.id` | `password123` | Buat laporan barang temuan, klaim barang |
| **Mahasiswa 3** | Joko Widodo | `student3@campusfind.ac.id` | `password123` | Lapor barang hilang, lihat katalog publik |

---

## 9. Menjalankan Aplikasi

### Mode Pengembangan (Development)
Jalankan frontend dan backend secara bersamaan (konkuren) dari root:
```bash
npm run dev
```

Atau jalankan masing-masing di terminal terpisah:
- **Backend API:**
  ```bash
  npm run dev --workspace=@campusfind/api
  ```
- **Frontend Web:**
  ```bash
  npm run dev --workspace=@campusfind/web
  ```

### URL Akses Aplikasi
- **Aplikasi Web (Frontend):** `http://localhost:5173`
- **Backend REST API:** `http://localhost:3001/api`
- **Health Check API:** `http://localhost:3001/api/health`

---

## 10. Menjalankan Lint, Test, dan Build

### A. Menjalankan Linting Kode
Memeriksa kepatuhan aturan penulisan kode dan tipe TypeScript pada seluruh paket:
```bash
npm run lint
```

### B. Menjalankan Automated Testing (Unit & Security Integration)
Menjalankan seluruh 57 automated tests (Jest di backend dan Vitest di frontend):
```bash
npm test
```

### C. Menjalankan Production Build
Mengompilasi paket shared, backend TypeScript, dan mem-bundle aset frontend Vite:
```bash
npm run build
```
*Hasil kompilasi frontend tersimpan di `apps/web/dist` dan backend di `apps/api/dist`.*

---

## 11. Menghentikan Aplikasi & Reset Data

### Menghentikan Database
```bash
npm run db:stop
```

### Reset Data Development secara Bersih
Jika Anda ingin menghapus seluruh data dan memulai ulang dari awal:
```bash
# 1. Hentikan dan hapus volume database Docker
docker compose down -v

# 2. Nyalakan kembali container database bersih
npm run db:start

# 3. Jalankan kembali migrasi dan seed
npm run db:migrate
npm run db:seed
```

---

## 12. Panduan Deployment

### Opsi A: Deployment Mandiri Berbasis Node.js & Reverse Proxy (VPS / VM)
1. **Server Provisioning:** Siapkan server Ubuntu 22.04 / 24.04 dengan Node.js 20, Nginx, dan MySQL 8.
2. **Setup Repository:** Kloning repo, atur file `.env` dengan kredensial produksi dan `NODE_ENV=production`.
3. **Build:** Jalankan `npm ci && npm run db:migrate && npm run build`.
4. **Process Manager:** Gunakan PM2 untuk menjaga proses backend API tetap berjalan:
   ```bash
   pm2 start apps/api/dist/index.js --name "campusfind-api"
   ```
5. **Nginx Reverse Proxy:**
   - Arahkan rute `/api` dan `/uploads` ke `http://localhost:3001`.
   - Sajikan berkas statis dari `apps/web/dist` untuk rute root `/`.
6. **SSL / TLS:** Pasang sertifikat HTTPS menggunakan Certbot (`certbot --nginx`).

### Opsi B: Deployment Cloud PaaS (Railway / Render / Nixpacks)
1. **Database:** Gunakan managed MySQL atau PostgreSQL cloud (konfigurasi skema PostgreSQL tersedia di `apps/api/prisma/schema.postgres.prisma`).
2. **Backend Service:** Arahkan root direktori ke `apps/api` atau gunakan konfigurasi monorepo dengan start command: `node dist/index.js`. Masukkan environment variables via dashboard cloud.
3. **Frontend Service (Vercel / Netlify):** Arahkan ke `apps/web`, build command: `npm run build`, output directory: `dist`. Masukkan environment variable `VITE_API_URL` mengarah ke URL publik backend Anda.

---

## 13. Checklist Verifikasi Pasca-Deployment

Setelah proses deployment selesai, lakukan pemeriksaan verifikasi berikut:
- [ ] Endpoint `/api/health` mengembalikan status HTTP 200 `{ Status: "ok" }`.
- [ ] Header keamanan `X-Content-Type-Options: nosniff` aktif dan `X-Powered-By` tersembunyi.
- [ ] Login menggunakan akun admin (`admin@campusfind.ac.id`) berhasil dan menghasilkan token JWT valid.
- [ ] Pengujian rate limiting: percobaan login gagal >10 kali memunculkan respons HTTP 429.
- [ ] Formulir pembuatan laporan barang dapat mengunggah berkas gambar JPG/PNG dan file tersimpan aman.
- [ ] Berkas non-gambar (`.exe`, `.sh`, `.php`) ditolak dengan respons HTTP 400.
- [ ] Mahasiswa biasa tidak dapat mengakses endpoint `/api/admin/dashboard` (menerima HTTP 403 Forbidden).
- [ ] Respon server saat terjadi kesalahan internal tidak membocorkan stack trace atau query database.

---

## 14. Troubleshooting Ringkas untuk Kendala Umum

| Kendala | Indikator | Solusi Cepat |
|---|---|---|
| **EADDRINUSE: 3001** | Server crash saat startup | Hentikan proses yang menempati port 3001 (`Stop-Process` di Windows / `kill -9` di Linux) atau ubah `PORT` di `.env`. |
| **Prisma Error P2021** | Tabel tidak ditemukan | Jalankan `npm run db:migrate` untuk mengaplikasikan migrasi skema database. |
| **Database Connection Refused** | Error connect `localhost:3306` | Pastikan container database aktif: jalankan `npm run db:start` dan cek `docker compose ps`. |
| **Token Expired / 401** | Sesi berakhir | Hapus sesi lama di browser dengan menekan tombol Logout, lalu login kembali. |
| **File Upload 400** | Upload ditolak | Pastikan format foto adalah `.jpg`, `.jpeg`, `.png`, atau `.webp` dengan ukuran berkas < 5 MB. |

*Panduan investigasi log aman dan analisis mendalam dapat dibaca pada dokumen [docs/P8_SAFE_LOGGING_AND_TROUBLESHOOTING.md](docs/P8_SAFE_LOGGING_AND_TROUBLESHOOTING.md).*
