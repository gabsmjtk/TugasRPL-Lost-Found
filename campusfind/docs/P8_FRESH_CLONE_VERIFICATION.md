# Laporan Verifikasi Fresh Clone - Milestone P8

Tanggal: 2026-11-05 / 2026-11-09  
Aplikasi: CampusFind (Monorepo)  
Branch: `p8-security-quality`

---

## 1. Lingkungan & Versi Tooling

- **Sistem Operasi**: Windows 11 Home Single Language (x64)
- **Node.js**: v24.19.0
- **npm**: 11.17.0
- **Git**: 2.54.0.windows.1
- **Working Directory Asli**: `D:\gabsm\Semester 3\RPL\campusfind` (Git root: `D:\gabsm\Semester 3\RPL`)

---

## 2. Prosedur dan Hasil Uji Lingkungan Bersih (Fresh Clone)

Pengujian dilakukan dari clone lokal bersih ke direktori temporary terisolasi (`%TEMP%\campusfind-fresh-verify`).

| No | Langkah Pengujian | Perintah yang Dijalankan | Hasil | Catatan |
|---|---|---|---|---|
| 1 | Clone repository bersih | `git clone "D:\gabsm\Semester 3\RPL" <temp_dir>` | **PASS** | Repository terklon sempurna tanpa dependensi `node_modules` lama |
| 2 | Checkout target branch | `git checkout p8-security-quality` | **PASS** | Berpindah ke branch P8 |
| 3 | Install dependencies bersih | `npm install` | **PASS** | 697 paket terinstall di monorepo root |
| 4 | Setup Environment file | `Copy-Item .env.example .env` & `apps/web/.env.example apps/web/.env` | **PASS** | File `.env` terkonfigurasi dengan safe defaults |
| 5 | Compile paket shared | `npm run build --workspace=@campusfind/shared` | **PASS** | Distribusi TypeScript `@campusfind/shared/dist` siap dikonsumsi |
| 6 | Prisma client generator | `npx prisma generate --schema=apps/api/prisma/schema.prisma` | **PASS** | Prisma Client ter-generate |
| 7 | Lint check monorepo | `npm run lint` | **PASS** | 0 error, 0 warning di seluruh workspace (`shared`, `api`, `web`) |
| 8 | Automated unit & security test | `npm test` | **PASS** | **57 test PASS (100%)**: 50 test di `@campusfind/api` (termasuk 23 security integration tests) & 7 test di `@campusfind/web` |
| 9 | Production build | `npm run build` | **PASS** | API TypeScript dist siap; Web Vite production bundle 308 kB siap |
| 10 | Dependency security audit | `npm audit` | **PASS** | 0 vulnerability tingkat kritis pada paket runtime |
| 11 | Smoke test API runtime | `node apps/api/dist/index.js` & `curl http://localhost:5000/api/health` | **PASS** | HTTP 200 OK: `{"status":"ok","timestamp":"..."}` |

---

## 3. Ringkasan Hasil Uji

- **Unit & Security Tests**: 8 test suites, 57 total tests passed.
- **Linter**: 3 packages passed (`@campusfind/shared`, `@campusfind/api`, `@campusfind/web`).
- **Production Build**: 
  - `@campusfind/shared`: Sukses compile TypeScript declaration & JS (`dist/`).
  - `@campusfind/api`: Sukses compile TypeScript ke CommonJS/ESM (`dist/`).
  - `@campusfind/web`: Sukses bundle Vite production distribution (`dist/`).

---

## 4. Batasan Pengujian & Catatan Deployment

1. **Database & Migrasi Langsung**:
   - Docker daemon / MySQL lokal port 3306 tidak aktif saat verifikasi sandbox.
   - Perintah migrasi (`npx prisma migrate deploy`) dan seeding (`npm run seed`) divalidasi secara sintaks dan schema, namun eksekusi langsung ke MySQL memerlukan instance database aktif di environment staging/production.
2. **Kredensial Layanan Eksternal**:
   - Untuk deployment production (misalnya Vercel/Railway), environment variables rahasia (`DATABASE_URL`, `JWT_SECRET`) harus diisi manual di dashboard hosting dan tidak boleh di-commit ke Git.
