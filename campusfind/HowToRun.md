# Panduan Menjalankan Proyek CampusFind (HowToRun.md)

Dokumen ini berisi panduan langkah demi langkah untuk menjalankan aplikasi **CampusFind** (Sistem Informasi Kehilangan dan Penemuan Barang Kampus) di lingkungan lokal (*development environment*).

---

## 1. Prasyarat Sistem (Prerequisites)

Pastikan perangkat Anda telah terpasang:
- **Node.js**: Versi `v18.x` atau `v20.x` LTS (disarankan).
- **NPM**: Versi `9.x` atau yang lebih baru (mendukung fitur *NPM Workspaces*).
- **Database**:
  - MySQL versi 8.x (Lokal / Docker), **ATAU**
  - Supabase / Neon / PostgreSQL (jika Anda menggunakan *cloud database*, sesuaikan `provider` di `prisma/schema.prisma`).
- **Git** (untuk *clone* repositori).

---

## 2. Kloning Repositori & Instalasi Dependensi

1. **Clone repository:**
   ```bash
   git clone https://github.com/gabsmjtk/TugasRPL-Lost-Found.git
   cd TugasRPL-Lost-Found
   ```

2. **Instal seluruh dependensi monorepo:**
   Jalankan perintah ini di root folder proyek:
   ```bash
   npm install
   ```
   *Perintah ini akan secara otomatis menginstal modul pada root, `apps/api`, `apps/web`, dan `packages/shared`.*

---

## 3. Konfigurasi Lingkungan (`.env`)

### a. Backend (`apps/api/.env`)
Salin file `.env.example` ke `apps/api/.env` atau buat file baru di `apps/api/.env`:

```env
# Database Connection (Contoh MySQL lokal atau Docker)
DATABASE_URL="mysql://campusfind:campusfind@localhost:3306/campusfind"

# JWT Auth Configuration
JWT_SECRET="rahasia-super-aman-kunci-jwt-campusfind-2026"
JWT_EXPIRES_IN="1d"

# Server & Client Port
PORT=3001
CLIENT_URL="http://localhost:5173"

# Upload Configuration
UPLOAD_DIR="uploads"
MAX_FILE_SIZE_MB=5
```

> **Catatan jika menggunakan Supabase / Cloud Database:**
> Ubah nilai `DATABASE_URL` dengan *Connection Pooling URI* atau *Direct URI* dari dashboard database Anda.

---

## 4. Setup Database & Seeding Data

Jalankan perintah database melalui root atau langsung di workspace API:

1. **Generate Prisma Client:**
   ```bash
   npm run db:generate --workspace=@campusfind/api
   ```

2. **Sinkronisasi / Migrasi Skema Database:**
   ```bash
   # Opsi 1: Menggunakan Prisma Migrate
   npm run db:migrate --workspace=@campusfind/api

   # Opsi 2: Push skema langsung (jika menggunakan database baru/cloud)
   npx prisma db push --schema=apps/api/prisma/schema.prisma
   ```

3. **Seeding Data Awal (Kategori, Akun Default, Sample Laporan):**
   ```bash
   npm run db:seed --workspace=@campusfind/api
   ```

---

## 5. Menjalankan Aplikasi

Anda dapat menjalankan backend dan frontend secara bersamaan atau di dua terminal terpisah:

### Menjalankan Bersama (Dari Root)
```bash
npm run dev
```

### ATAU Menjalankan di Dua Terminal Terpisah:

- **Terminal 1: Backend API (Port 3001)**
  ```bash
  npm run dev --workspace=@campusfind/api
  ```
  *Backend akan berjalan di: `http://localhost:3001`*
  *Health check: `http://localhost:3001/api/health`*

- **Terminal 2: Frontend Web (Port 5173)**
  ```bash
  npm run dev --workspace=@campusfind/web
  ```
  *Frontend akan berjalan di: `http://localhost:5173`*

---

## 6. Kredensial Default Login

Data berikut telah disiapkan otomatis melalui proses database seeding (`prisma/seed.ts`):

| Role | Nama Akun | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Administrator | `admin@campusfind.ac.id` | `password123` | Akses penuh dashboard `/admin` (Moderasi, Verifikasi, Handover) |
| **Mahasiswa** | Budi Santoso | `student1@campusfind.ac.id` | `password123` | NIM: 11223344 (Pelapor & Pengaju Klaim) |
| **Mahasiswa** | Siti Aminah | `student2@campusfind.ac.id` | `password123` | NIM: 22334455 (Pelapor Barang Ditemukan) |
| **Mahasiswa** | Joko Widodo | `student3@campusfind.ac.id` | `password123` | NIM: 33445566 (Mahasiswa Reguler) |

---

## 7. Menjalankan Automated Unit Test

Untuk memverifikasi seluruh aturan bisnis (*Business Rules*) pada backend:
```bash
npm test --workspace=@campusfind/api
```
Hasil yang diharapkan: **5 Test Suites, 27 Tests PASSED**.
