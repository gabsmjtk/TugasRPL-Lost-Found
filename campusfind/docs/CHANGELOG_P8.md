# Changelog - P8: Security, Quality & Deployment Readiness

Semua perubahan pada milestone P8 ini berfokus pada penguatan keamanan (hardening), peningkatan kualitas kode, kelengkapan pengujian otomatis, serta verifikasi lingkungan bersih (fresh clone).

---

## [P8.0.0] - 2026-11-05

### 🔒 Security Changes
- **Hardening Environment & Secret Management:**
  - Menambahkan modul validasi schema environment `src/utils/env.ts` berbasis Zod.
  - Memastikan token JWT secret tidak menggunakan fallback tidak aman pada mode `production`.
  - Memvalidasi panjang minimal `JWT_SECRET` (16 karakter).
  - Melengkapi file `.env.example` dengan dokumentasi lengkap seluruh parameter tanpa mengekspos rahasia.
- **Implementasi Rate Limiting:**
  - Menambahkan `express-rate-limit` pada endpoint sensitif autentikasi (`/api/auth/login`, `/api/auth/register`) maksimal 10 request per 15 menit per IP.
  - Menambahkan general API rate limiter (300 request per 15 menit).
  - Bypass otomatis saat pengujian otomatis berjalan (`NODE_ENV === 'test'`).
- **Penguatan Proteksi Upload Berkas:**
  - Menambahkan validasi whitelist ganda untuk ekstensi berkas (`.jpg`, `.jpeg`, `.png`, `.webp`) dan MIME type (`image/jpeg`, `image/png`, `image/webp`).
  - Menambahkan deteksi dan penolakan karakter null byte (`\0`) dan path traversal (`..`).
  - Mengganti penamaan berkas dengan `crypto.randomUUID()` kriptografis native Node.js.
  - Menangani error ukuran berkas Multer (`LIMIT_FILE_SIZE`) agar mengembalikan HTTP 400 ramah pengguna.
- **Isolasi Data & Penguatan Otorisasi (RBAC):**
  - Mencegah mahasiswa memodifikasi atau menghapus laporan barang milik mahasiswa lain (HTTP 403 Forbidden).
  - Mencegah mahasiswa membatalkan klaim milik mahasiswa lain (HTTP 403 Forbidden).
  - Mencegah pelapor mengklaim barang yang dilaporkan oleh dirinya sendiri (HTTP 400 Bad Request).
  - Melindungi rute `/api/admin/*` dari akses mahasiswa dan pengguna tanpa token.
  - Menambahkan proteksi pencegahan admin menonaktifkan akun admin dirinya sendiri (Self-lockout prevention).
  - Melindungi visibilitas laporan berstatus `PENDING` dan `REJECTED` dari akses pengunjung publik.
  - Menolak akses pengguna yang akunnya telah dinonaktifkan (`IsActive === false`).
- **Sanitasi Logging & Penanganan Error:**
  - Membuat modul `src/utils/logger.ts` dengan fungsi penyaringan otomatis `sanitizeLogData`.
  - Redaksi otomatis terhadap password, hash, token Bearer, JWT, secret, dan kredensial URL koneksi database.
  - Memastikan respons HTTP 500 tidak membocorkan stack trace, query database Prisma, atau struktur internal server.
- **CORS & HTTP Security Headers:**
  - Mengonfigurasi Helmet untuk mengaktifkan `X-Content-Type-Options: nosniff`, `X-Frame-Options`, dan menyembunyikan header `X-Powered-By`.
  - Mengonfigurasi CORS whitelist dinamis berbasis `CLIENT_URL` dan melarang wildcard saat kredensial aktif.
- **Pembaruan Dependensi Rentan:**
  - Menjalankan audit dependensi via `npm audit` dan melakukan perbaikan via `npm audit fix` untuk paket kritis seperti `body-parser` dan `source-map-js`.

---

### 🧪 Quality & Testing
- **Penambahan Test Suite Keamanan Komprehensif (`security.spec.ts`):**
  - Menambahkan 23 pengujian keamanan otomatis baru di backend: security headers, CORS, JWT handling, akun nonaktif, isolasi data antar mahasiswa, upload berkas terlarang, pencegahan lockout admin, dan respon sanitasi error.
  - Total pengujian di backend meningkat dari 27 unit test menjadi **50 unit & integration test** (100% lulus).
  - Menghubungkan 7 unit test frontend pada vitest (`fileValidation.test.ts`, `filterValidation.test.ts`), sehingga total pengujian monorepo menjadi **57 automated tests** (100% lulus).
- **Perbaikan Linting Monorepo:**
  - Menambahkan konfigurasi ESLint `.eslintrc.cjs` pada `apps/web`.
  - Membersihkan seluruh unused variables dan unused imports di frontend sehingga lulus `npm run lint` dengan 0 warning dan 0 error.
  - Menambahkan script `lint` pada `apps/api` dan `packages/shared` (`tsc --noEmit`).

---

### 📦 CI & Automation
- **GitHub Actions CI Workflow:**
  - Menambahkan file workflow `.github/workflows/ci.yml` yang berjalan otomatis pada setiap pull request dan push ke branch `main`.
  - Menjalankan clean install (`npm ci`), Prisma client generation, linting (`npm run lint`), automated test (`npm test`), dan production build (`npm run build`).
  - Menggunakan caching dependensi npm dan tidak memerlukan external secret untuk menjalankan validasi dasar.

---

### 📚 Documentation
- **Pembaruan `README.md`:** Panduan menyeluruh mulai dari arsitektur, fresh clone, konfigurasi `.env`, Docker, migrasi database & seed, running frontend & backend, akun demo/seed, unit testing, lint, build, penghentian & reset data, panduan deployment, checklist pasca-deploy, hingga troubleshooting.
- **Dokumen Keamanan `docs/P8_SECURITY_TEST_REPORT.md`:** Laporan formal audit keamanan, temuan risiko, mitigasi, perintah audit, dan batasan pengujian.
- **Dokumen Logging Aman `docs/P8_SAFE_LOGGING_AND_TROUBLESHOOTING.md`:** Standar format log aman, data terlarang dalam log, serta 7 studi kasus error realistis lengkap dengan gejala, penyebab, contoh log, langkah perbaikan, dan pencegahan.
- **Dokumen Verifikasi `docs/P8_FRESH_CLONE_VERIFICATION.md`:** Bukti uji eksekusi lengkap dari lingkungan bersih (clean workspace/clone).
