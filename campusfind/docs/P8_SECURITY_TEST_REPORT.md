# Laporan Pengujian Keamanan (Security Test Report) - P8
**Proyek:** CampusFind - Sistem Informasi Pelaporan & Pengembalian Barang Hilang Kampus  
**Branch:** `p8-security-quality`  
**Tanggal Pengujian:** 5 November 2026  
**Status Pengujian:** PASS (Semua temuan risiko telah ditangani dan diverifikasi)

---

## 1. Ruang Lingkup dan Environment Pengujian

### Ruang Lingkup Pengujian
Pengujian keamanan mencakup seluruh komponen arsitektur CampusFind:
1. **Backend API (`apps/api`)**: Autentikasi JWT, otorisasi berbasis peran (Role-Based Access Control / RBAC), validasi input (Zod), isolasi data pengguna, proteksi file upload (Multer), penanganan error & proteksi kebocoran informasi, rate limiting (`express-rate-limit`), security headers (`helmet`), dan konfigurasi CORS.
2. **Frontend Klien (`apps/web`)**: Pembersihan dependensi, sanitasi input, proteksi token di client-side, dan penanganan status respons aman.
3. **Konfigurasi Environment & Database**: Sanitasi `.env`, validasi schema environment pada saat startup, dan dependensi proyek (`npm audit`).

### Environment Pengujian
- **Sistem Operasi:** Windows 11 (x64)
- **Node.js:** v20.x
- **NPM:** v10.x
- **Database Engine:** MySQL 8.0 (Docker Container `campusfind_db`) / PostgreSQL (Cloud compatibility)
- **Framework & Libraries:** Express 4.18, Prisma ORM 5.x, Helmet 7.x, Zod 3.22, Bcryptjs 2.4, Supertest 7.x, Jest 30.x, Vitest 2.1.9

---

## 2. Metodologi & Daftar Pemeriksaan Keamanan

Pemeriksaan dilakukan dengan mengombinasikan static code analysis, dependency vulnerability audit, serta automated security integration testing menggunakan suite test `apps/api/test/security.spec.ts`.

| No | Kategori Pemeriksaan | Item Pengujian | Target Standar |
|---|---|---|---|
| 1 | Autentikasi & Sesi | Verifikasi format token JWT, masa berlaku, dan validitas secret | RFC 7519, OWASP ASVS V3 |
| 2 | Otorisasi & Akses Role | Proteksi route `/api/admin/*` dan pencegahan privilege escalation | OWASP Top 10 A01: Broken Access Control |
| 3 | Isolasi Data Pengguna | Mahasiswa tidak dapat memodifikasi, menghapus, atau membatalkan data milik mahasiswa lain | BOLA / IDOR Prevention |
| 4 | Validasi Input | Schema Zod pada payload request login, registrasi, laporan, klaim, handover, dan kategori | OWASP Top 10 A03: Injection |
| 5 | Proteksi Upload Berkas | Validasi whitelist MIME type, ekstensi berkas, ukuran, dan nama berkas aman | OWASP File Upload Security Guidelines |
| 6 | Penanganan Error & Log | Mencegah kebocoran stack trace, query SQL, credential, dan token dalam respon & log | OWASP Top 10 A09: Security Logging & Monitoring |
| 7 | HTTP Headers & CORS | Penerapan Helmet (nosniff, frameguard) dan CORS whitelist spesifik | OWASP Secure Headers |
| 8 | Rate Limiting | Pembatasan frekuensi request pada endpoint sensitif (login & register) | OWASP Automated Threats (Brute Force) |
| 9 | Audit Dependensi | Pemindaian kerentanan paket pihak ketiga menggunakan `npm audit` | OWASP Top 10 A06: Vulnerable Components |

---

## 3. Temuan, Tingkat Risiko, Tindakan Perbaikan, dan Status Akhir

| ID | Item Temuan | Tingkat Risiko | Bukti / Deskripsi Awal | Tindakan Perbaikan yang Diimplementasikan | Status Akhir |
|---|---|---|---|---|---|
| **SEC-01** | Hardcoded Fallback JWT Secret | **Tinggi (High)** | Pada `src/utils/jwt.ts`, fallback menggunakan string `'rahasia-jwt-super-aman'`. | Menambahkan modul `src/utils/env.ts` berbasis Zod. Pada mode `production`, sistem akan memblokir startup jika `JWT_SECRET` kosong atau memakai string bawaan. Minimal 16 karakter diwajibkan. | **RESOLVED** |
| **SEC-02** | Tidak Adanya Rate Limiting Endpoint Autentikasi | **Sedang (Medium)** | Endpoint `/api/auth/login` dan `/api/auth/register` tidak memiliki pembatas laju request, rentan terhadap brute-force password. | Mengimplementasikan `authLimiter` (maksimal 10 request per 15 menit per IP) dan `apiLimiter` (300 request per 15 menit) menggunakan `express-rate-limit`. | **RESOLVED** |
| **SEC-03** | Validasi Ekstensi dan Nama Berkas Upload Belum Ketat | **Tinggi (High)** | Upload hanya memvalidasi `mimetype`, namun ekstensi berkas asli tetap dipertahankan langsung tanpa whitelist ekstensi, dan nama berkas berpotensi disisipi traversal. | Memperbarui `src/middleware/upload.middleware.ts` dengan whitelist ekstensi ganda (`.jpg`, `.jpeg`, `.png`, `.webp`), penolakan karakter traversal (`..`, `\0`), sanitasi UUID aman via `crypto.randomUUID()`. | **RESOLVED** |
| **SEC-04** | Kebocoran Error Multer dan Pesan Error Database | **Sedang (Medium)** | Kesalahan upload `LIMIT_FILE_SIZE` menghasilkan HTTP 500 generik. Error database berpotensi membocorkan skema relasi dan constraint. | Menata `src/middleware/error.middleware.ts` untuk memetakan `multer.MulterError` menjadi HTTP 400 ramah pengguna, error Prisma `P2002` menjadi HTTP 409, dan error 500 tanpa stack trace. | **RESOLVED** |
| **SEC-05** | Potensi Informasi Laporan PENDING/REJECTED Bocor ke Publik | **Sedang (Medium)** | Endpoint `/api/reports/:id` dapat diakses oleh publik tanpa mengecek status approval laporan. | Menambahkan middleware `optionalAuthenticate` dan validasi status pada controller: jika laporan masih `PENDING` atau `REJECTED`, hanya pemilik laporan atau Admin yang diizinkan melihatnya (pengguna lain menerima HTTP 404). | **RESOLVED** |
| **SEC-06** | Admin Dapat Menonaktifkan Akunnya Sendiri (Self-Lockout) | **Rendah (Low)** | Endpoint `PATCH /api/admin/users/:id/active` tidak memeriksa apakah target ID adalah admin yang sedang login. | Menambahkan validasi proteksi: Admin tidak dapat menonaktifkan akunnya sendiri agar tidak terjadi penguncian sistem secara permanen. | **RESOLVED** |
| **SEC-07** | Format Logging Berpotensi Mencatat Data Sensitif | **Sedang (Medium)** | `console.error(err)` mencatat objek error mentah tanpa penyaringan credential / token. | Membuat modul `src/utils/logger.ts` dengan filter otomatis (`sanitizeLogData`) untuk menyamarkan password, hash, token Bearer, JWT, dan URL koneksi database. | **RESOLVED** |
| **SEC-08** | Kerentanan Dependensi Pihak Ketiga | **Sedang (Medium)** | Pemindaian awal `npm audit` mendeteksi paket rentan seperti `body-parser` dan `source-map-js`. | Menjalankan pembaruan dependensi bersih `npm audit fix` yang menyelesaikan kerentanan runtime produksi utama. | **RESOLVED** |

---

## 4. Perintah Pengujian dan Audit yang Digunakan

```bash
# 1. Menjalankan audit dependensi keamanan
npm audit

# 2. Menjalankan linter kode di seluruh workspace
npm run lint

# 3. Menjalankan seluruh test suite unit & security integration test
npm test

# 4. Menjalankan verifikasi suite keamanan backend secara spesifik
npm test --workspace=@campusfind/api test/security.spec.ts

# 5. Menjalankan production build
npm run build
```

---

## 5. Hasil Akhir Security Test

Semua test suite dan verifikasi otomatis berhasil lulus (100% PASS):

```text
PASS apps/api/test/search.service.spec.ts
PASS apps/api/test/admin.service.spec.ts
PASS apps/api/test/report.service.spec.ts
PASS apps/api/test/handover.service.spec.ts
PASS apps/api/test/auth.service.spec.ts
PASS apps/api/test/security.spec.ts
  P8 Security & Quality Verification Suite
    1. Security Headers & Server Hardening
      ✓ harus memuat header Helmet (X-Content-Type-Options: nosniff) dan menyembunyikan X-Powered-By
      ✓ harus memblokir request CORS dengan origin yang tidak diizinkan
    2. Safe Logging & Data Sanitization
      ✓ harus menyamarkan password, token JWT, dan kredensial koneksi database
      ✓ harus menyamarkan string connection URL database langsung
      ✓ harus menyamarkan Bearer token dalam authorization header string
    3. Autentikasi, Token & Akses Akun Non-aktif
      ✓ harus menolak request tanpa token ke rute terproteksi (401 Unauthorized)
      ✓ harus menolak token dari pengguna yang telah dinonaktifkan (401 Unauthorized)
      ✓ harus menolak token dengan tanda tangan (signature) yang salah (401)
    4. Otorisasi Berbasis Peran (Admin vs Mahasiswa)
      ✓ harus menolak Mahasiswa mengakses rute admin (403 Forbidden)
      ✓ harus mengizinkan Admin mengakses rute admin (200 OK)
    5. Isolasi Data Antar Mahasiswa (Cross-User Access Control)
      ✓ harus menolak mahasiswa A mengubah laporan milik mahasiswa B (403 Forbidden)
      ✓ harus menolak mahasiswa A menghapus laporan milik mahasiswa B (403 Forbidden)
      ✓ harus menolak mahasiswa mengklaim laporan barang yang dilaporkan dirinya sendiri (400 Bad Request)
      ✓ harus menolak mahasiswa A membatalkan klaim milik mahasiswa B (403 Forbidden)
    6. Proteksi Visibilitas Laporan Pending & Rejected
      ✓ harus menolak publik/pengguna lain melihat detail laporan status PENDING (404 Not Found)
      ✓ harus mengizinkan pembuat laporan atau admin melihat laporan berstatus PENDING
    7. Validasi Input & Pencegahan Self-Lockout Admin
      ✓ harus menolak admin menonaktifkan akun admin dirinya sendiri (400 Bad Request)
      ✓ harus menolak input kategori tanpa Nama yang valid (400 Bad Request)
      ✓ harus menolak keputusan klaim jika status tidak valid (400 Bad Request)
    8. Proteksi Keamanan Upload File
      ✓ harus menolak upload file dengan ekstensi executable atau selain gambar (.exe/.php)
      ✓ harus menolak upload file dengan MIME type bukan gambar atau ekstensi tidak diizinkan (.sh)
    9. Penanganan Error Bersih Tanpa Kebocoran Informasi (No Stack Trace / DB Leak)
      ✓ harus menyembunyikan query database internal saat terjadi kesalahan Prisma P2002
      ✓ harus mengembalikan pesan kesalahan umum 500 tanpa stack trace untuk error yang tak terduga

Test Suites: 6 passed, 6 total
Tests:       50 passed, 50 total (Apps API) + 7 passed (Apps Web) = 57 Total Tests Passed
```

---

## 6. Batasan Pengujian dan Risiko yang Masih Tersisa

1. **Storage Berkas Lokal:**
   - Berkas upload saat ini disimpan di filesystem lokal server (`uploads/`). Untuk deployment skala produksi multi-instance / cloud stateless, disarankan menggunakan Object Storage (S3 / Cloud Storage / Supabase Storage) dengan bucket private dan signed URLs.
2. **Koneksi Database Production:**
   - Lingkungan pengujian lokal menggunakan MySQL Docker (`campusfind_db`). Pada production, pastikan koneksi database menggunakan TLS/SSL (`sslmode=require`) dan kredensial database terpisah dengan hak akses minimal (least privilege).
3. **Penyimpanan Token Klien:**
   - Frontend menyimpan token JWT di `localStorage`. Ini umum untuk SPA, namun rentan jika terdapat XSS. Pencegahan mitigasi saat ini adalah sanitasi ketat konten React dan CSP/Helmet headers. Untuk peningkatan keamanan di masa depan, pertimbangkan autentikasi berbasis `httpOnly` secure cookie.

---

## 7. Ringkasan Perubahan Keamanan pada Proyek

- **Penambahan Rate Limiting:** Mengamankan `/api/auth/login` dan `/api/auth/register` dari serangan brute-force credential stuffing.
- **Validasi Environment Terpusat:** Penambahan schema Zod untuk memvalidasi `DATABASE_URL`, `JWT_SECRET`, port, dan konfigurasi lainnya sebelum aplikasi berjalan.
- **Hardening Upload Berkas:** Penambahan filter ganda (ekstensi + MIME) dan penamaan acak menggunakan UUID v4 kriptografis native Node.
- **Sistem Logging Aman:** Filter otomatis terhadap string koneksi database, authorization header, password, dan token.
- **Peningkatan Kontrol Akses & Visibilitas:** Laporan berstatus PENDING/REJECTED dilindungi dari akses publik, mahasiswa dibatasi hanya pada resource miliknya, dan admin dicegah mengunci dirinya sendiri.
- **Integrasi Keamanan Otomatis:** Suite pengujian keamanan komprehensif (`security.spec.ts`) terpasang permanen pada alur testing dan GitHub Actions CI.
