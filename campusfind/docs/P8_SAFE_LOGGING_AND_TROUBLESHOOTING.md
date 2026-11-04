# Panduan Logging Aman & Troubleshooting Error (P8)
**Proyek:** CampusFind  
**Standar Keamanan:** OWASP Top 10 - A09: Security Logging and Monitoring Failures

---

## 1. Standar Logging Aman pada CampusFind

Logging merupakan instrumen krusial dalam pemantauan kesehatan aplikasi, investigasi insiden, dan audit trail operasional. Namun, log yang tidak terkontrol dapat menjadi celah kebocoran data sensitif (information leakage).

Di CampusFind, seluruh log sistem dikelola terpusat melalui modul `src/utils/logger.ts` yang secara aktif menjalankan sanitasi data otomatis (`sanitizeLogData`) sebelum pesan dicetak ke output konsol atau file log.

### Prinsip Utama Logging Aman
1. **Sanitasi Otomatis (Redaction by Default):** Parameter objek yang memiliki kunci sensitif langsung diganti dengan string `***REDACTED***`.
2. **Pencegahan Dump Stack Trace di Production:** Pada mode `NODE_ENV === 'production'`, stack trace internal, file path server, dan query SQL tidak pernah dicetak ke stream publik atau respon API.
3. **Structured & Timestamped:** Setiap entri log memiliki penanda waktu ISO 8601 dan tingkat keparahan (*severity level*) yang jelas: `[INFO]`, `[WARN]`, `[ERROR]`, `[DEBUG]`.

---

## 2. Daftar Data yang DILARANG Muncul di Log

Sesuai aturan keamanan data, komponen berikut **dilarang keras** dicetak dalam bentuk plain-text di seluruh layer log:

| Kategori Data | Contoh Bentuk Asli | Representasi Aman dalam Log |
|---|---|---|
| **Password & Kredensial** | `password: "MySecret123!"`, `PasswordConfirmation` | `"password": "***REDACTED***"` |
| **Password Hash** | `$2a$10$wK1m1j3kL4...` | `"PasswordHash": "***REDACTED***"` |
| **Token Sesi & JWT** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | `"Token": "***REDACTED***"` |
| **Authorization Header** | `Authorization: Bearer eyJhbGci...` | `Authorization: Bearer ***` |
| **Kunci Rahasia (Secret)** | `JWT_SECRET="rahasia-panjang-acak"` | `"JWT_SECRET": "***REDACTED***"` |
| **Koneksi Database Lengkap** | `mysql://root:rahasia123@localhost:3306/campusfind` | `mysql://root:***@localhost:3306/campusfind` |
| **Cookie & Session ID** | `connect.sid=s%3A29381...` | `"cookie": "***REDACTED***"` |

---

## 3. Format Contoh Log Aman

Format standar log sistem CampusFind mengadopsi format terstruktur:

```text
# Log Informasi Normal (INFO)
[2026-11-05T01:10:00.000Z] [INFO]: CampusFind API server started successfully in production mode on port 3001
[2026-11-05T01:10:05.120Z] [INFO]: User login successful { Email: 'budi@campusfind.ac.id', Role: 'STUDENT' }

# Log Peringatan Keamanan (WARN)
[2026-11-05T01:10:12.330Z] [WARN]: Rate limit exceeded for IP 192.168.1.50 on endpoint /api/auth/login
[2026-11-05T01:10:15.890Z] [WARN]: Unauthorized access attempt to Admin route by User { Id: 'usr-123', Role: 'STUDENT' }

# Log Error Tersanitasi (ERROR)
[2026-11-05T01:10:20.450Z] [ERROR]: Database connection failed for url: mysql://campusfind:***@localhost:3306/campusfind
[2026-11-05T01:10:25.780Z] [ERROR]: Unhandled error at [POST] /api/reports: Validasi input gagal
```

---

## 4. Studi Kasus & Pemecahan Masalah (Troubleshooting Realistis)

Berikut adalah 7 studi kasus error realistis yang dapat ditemui selama siklus pengembangan, pengujian, atau deployment CampusFind:

---

### Kasus 1: Environment Variable Belum Diatur atau Tidak Valid

#### Gejala
Aplikasi backend gagal memulai (*crash on startup*) saat perintah `npm run dev` atau `npm start` dijalankan.

#### Penyebab
Variabel wajib seperti `DATABASE_URL` atau `JWT_SECRET` belum diset pada file `.env`, atau `JWT_SECRET` kurang dari 16 karakter, atau nilai secret bawaan yang tidak aman dipakai di mode production.

#### Contoh Log Aman
```text
[2026-11-05T01:15:00.120Z] [ERROR]: Environment validation failed:
 - DATABASE_URL: DATABASE_URL is required
 - JWT_SECRET: JWT_SECRET must be at least 16 characters long
```

#### Langkah Perbaikan
1. Periksa ketersediaan file `.env` di folder root (`campusfind/.env`).
2. Jika belum ada, salin dari template: `cp .env.example .env` (Linux/macOS) atau `copy .env.example .env` (Windows).
3. Isi nilai `DATABASE_URL` dengan string koneksi yang benar.
4. Buat nilai `JWT_SECRET` acak dan panjang minimal 16 karakter (misalnya: `openssl rand -hex 32`).

#### Cara Mencegahnya
Jalankan validasi skema environment terpusat (`src/utils/env.ts`) pada tahap inisialisasi aplikasi sebelum listener HTTP dijalankan.

---

### Kasus 2: Database Tidak Aktif atau Gagal Terkoneksi

#### Gejala
Server backend berjalan tetapi setiap request yang memerlukan akses basis data (misalnya register, list reports, stats) menghasilkan HTTP 500 atau timeout.

#### Penyebab
Container Docker MySQL belum dijalankan, port 3306 tidak dapat diakses, atau kredensial user/password basis data di `.env` salah.

#### Contoh Log Aman
```text
[2026-11-05T01:16:10.500Z] [ERROR]: Database connection refused at mysql://campusfind:***@localhost:3306/campusfind - Can't connect to MySQL server on 'localhost:3306' (10061)
```

#### Langkah Perbaikan
1. Periksa status container database Docker:
   ```bash
   docker compose ps
   ```
2. Jika kontainer mati, jalankan kembali:
   ```bash
   docker compose up -d
   ```
3. Tunggu hingga status kontainer menunjukkan *healthy* (`docker compose ps` menampilkan status `healthy`).
4. Uji koneksi port 3306 atau cek log Docker:
   ```bash
   docker compose logs db
   ```

#### Cara Mencegahnya
Gunakan container healthcheck pada `docker-compose.yml` dan konfigurasikan retry connection logic pada inisialisasi Prisma client.

---

### Kasus 3: Migration Database Belum Dijalankan

#### Gejala
Permintaan API menghasilkan error 500 dengan pesan `Operasi database gagal diproses`, atau Prisma melempar error code `P2021` (*The table does not exist in the current database*).

#### Penyebab
Database baru saja dibuat atau di-reset tetapi skema migrasi tabel Prisma belum diaplikasikan ke server MySQL.

#### Contoh Log Aman
```text
[2026-11-05T01:17:22.310Z] [ERROR]: Unhandled error at [GET] /api/reports: The table `campusfind.Report` does not exist in the current database
```

#### Langkah Perbaikan
1. Jalankan perintah migrasi Prisma:
   ```bash
   npm run db:migrate --workspace=@campusfind/api
   ```
2. Jika database kosong dan membutuhkan data awal (kategori & akun demo), jalankan seed:
   ```bash
   npm run db:seed --workspace=@campusfind/api
   ```

#### Cara Mencegahnya
Sertakan langkah migrasi otomatis pada deployment pipeline (`npx prisma migrate deploy`) sebelum proses rilis aplikasi aktif.

---

### Kasus 4: Port 3001 atau 5173 Sudah Digunakan (Port Conflict)

#### Gejala
Backend atau frontend gagal berjalan dengan error `EADDRINUSE: address already in use :::3001` atau Vite otomatis beralih ke port `5174`.

#### Penyebab
Proses Node.js sebelumnya belum dimatikan dengan sempurna atau ada aplikasi lain yang menduduki port default tersebut.

#### Contoh Log Aman
```text
[2026-11-05T01:18:05.100Z] [ERROR]: Server failed to start - Error: listen EADDRINUSE: address already in use :::3001
```

#### Langkah Perbaikan
1. Di Windows PowerShell, periksa PID yang memakai port 3001:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess
   Stop-Process -Id <PID> -Force
   ```
2. Di Linux / macOS:
   ```bash
   lsof -i :3001
   kill -9 <PID>
   ```
3. Atau ubah konfigurasi `PORT` di file `.env` (misalnya `PORT=3002`).

#### Cara Mencegahnya
Gunakan sinyal shutdown aman (`SIGINT`/`SIGTERM`) pada proses server express agar port dilepas seketika saat aplikasi dihentikan.

---

### Kasus 5: Login Gagal atau Token JWT Tidak Valid / Kedaluwarsa

#### Gejala
Pengguna menerima pesan `Akses ditolak: Token otentikasi tidak ditemukan`, `Token tidak valid`, atau `Sesi telah kedaluwarsa, silakan login kembali` (HTTP 401).

#### Penyebab
- Kredensial email atau password yang dimasukkan salah.
- Token JWT di `localStorage` sudah melewati batas masa aktif (`JWT_EXPIRES_IN`).
- `JWT_SECRET` di server telah diganti atau berbeda antar instance.

#### Contoh Log Aman
```text
[2026-11-05T01:19:30.820Z] [WARN]: Failed login attempt for email: 'student1@campusfind.ac.id' - Invalid credentials
[2026-11-05T01:19:45.100Z] [INFO]: Token verification failed: TokenExpiredError: jwt expired
```

#### Langkah Perbaikan
1. Pastikan pengguna memasukkan kombinasi email dan password yang tepat.
2. Untuk akun demo seed, gunakan akun resmi:
   - Admin: `admin@campusfind.ac.id` / `password123`
   - Mahasiswa: `student1@campusfind.ac.id` / `password123`
3. Jika token kedaluwarsa, lakukan logout dan login kembali untuk memperoleh token baru.

#### Cara Mencegahnya
Frontend mengimplementasikan interceptor Axios yang mendeteksi HTTP 401 untuk membersihkan token usang di `localStorage` dan mengarahkan pengguna ke halaman `/login`.

---

### Kasus 6: Upload Gambar Ditolak

#### Gejala
Formulir pembuatan laporan barang memunculkan notifikasi error HTTP 400 saat mengunggah berkas foto.

#### Penyebab
- Berkas yang diunggah bukan format gambar yang didukung (misalnya `.pdf`, `.exe`, `.docx`).
- Ukuran berkas melebihi batas yang ditentukan (misalnya berkas berukuran 8 MB sedangkan batas di `.env` adalah 5 MB).
- Nama berkas mengandung karakter terlarang atau path traversal (`..`).

#### Contoh Log Aman
```text
[2026-11-05T01:20:10.190Z] [WARN]: File upload rejected at [POST] /api/reports: Ukuran file melebihi batas maksimum (5MB)
[2026-11-05T01:20:15.420Z] [WARN]: File upload rejected at [POST] /api/reports: Ekstensi file tidak diizinkan. Hanya format JPG, JPEG, PNG, dan WebP yang diperbolehkan.
```

#### Langkah Perbaikan
1. Pastikan format berkas foto adalah JPG, JPEG, PNG, atau WebP.
2. Kompres ukuran berkas foto di bawah 5 MB sebelum diunggah.
3. Jika aplikasi membutuhkan batas ukuran lebih besar, sesuaikan nilai `MAX_FILE_SIZE_MB` di file `.env` dan restart server backend.

#### Cara Mencegahnya
Sediakan validasi sisi klien (client-side validation di `apps/web/src/utils/fileValidation.ts`) agar berkas tidak valid langsung dicegat sebelum dikirim melalui jaringan.

---

### Kasus 7: Build Frontend atau Backend Gagal (TypeScript / Vite Error)

#### Gejala
Perintah `npm run build` berhenti dengan status gagal (`exit code 1` atau `2`) pada salah satu workspace.

#### Penyebab
- Terdapat error kompilasi TypeScript (`tsc`) seperti ketidaksesuaian tipe antarmuka (interface mismatch).
- Import modul yang tidak ditemukan atau tidak diekspor dengan benar dari package `@campusfind/shared`.
- Konfigurasi environment build belum terpenuhi.

#### Contoh Log Aman
```text
[2026-11-05T01:21:00.000Z] [ERROR]: Build failed in workspace @campusfind/web:
error TS2304: Cannot find name 'InvalidTypeReference'.
```

#### Langkah Perbaikan
1. Jalankan linter dan type-checker untuk mendeteksi lokasi baris error:
   ```bash
   npm run lint
   ```
2. Pastikan paket shared sudah di-build terlebih dahulu jika dependensi antarmuka baru saja diubah:
   ```bash
   npm run build --workspace=@campusfind/shared
   ```
3. Perbaiki error kompilasi pada file sumber yang dilaporkan.

#### Cara Mencegahnya
Gunakan alur CI GitHub Actions yang otomatis memvalidasi linting, build, dan testing pada setiap pull request sebelum digabungkan ke branch utama.
