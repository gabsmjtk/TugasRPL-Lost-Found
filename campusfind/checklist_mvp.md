# Checklist Ketercapaian MVP - CampusFind (Pertemuan 7)

Dokumen ini memvalidasi pemenuhan seluruh kriteria Minimum Viable Product (MVP) proyek **CampusFind**, mencakup integrasi frontend ke backend, penanganan status loading dan error, serta keterpenuhan automated unit test.

---

## Tabel Checklist Pemenuhan 5 Fitur Inti MVP

| No | Nama Fitur / User Story | Status Integrasi UI & API | Status Error & Loading Handling | Status Unit Test |
| :---: | :--- | :---: | :---: | :---: |
| **1** | **US-01: Autentikasi Pengguna (Auth)**<br>• Login Mahasiswa & Admin<br>• Penyimpanan JWT & Pengalihan Role | [x] Done | [x] Done | **PASSED** |
| **2** | **US-02: Pelaporan Barang (Create Report)**<br>• Form Laporan Barang Hilang (*Lost*) & Temuan (*Found*)<br>• Validasi field wajib & status default `PENDING` | [x] Done | [x] Done | **PASSED** |
| **3** | **US-03: Pencarian dan Filter Barang**<br>• Search bar keyword (judul/deskripsi)<br>• Filter kategori, tipe, status, & empty state | [x] Done | [x] Done | **PASSED** |
| **4** | **US-04: Proses Klaim & Handover Barang**<br>• Formulir pengajuan klaim kepemilikan barang temuan<br>• Persetujuan klaim (status `CLAIMED`) & pencatatan handover (`RETURNED`) | [x] Done | [x] Done | **PASSED** |
| **5** | **US-05: Validasi & Moderasi Admin**<br>• Verifikasi laporan pending (`OPEN` / `REJECTED`)<br>• Perubahan status laporan & penghapusan laporan oleh Admin | [x] Done | [x] Done | **PASSED** |

---

## Ringkasan Verifikasi Unit Testing Backend (Jest)

```text
PASS test/search.service.spec.ts
PASS test/handover.service.spec.ts
PASS test/admin.service.spec.ts
PASS test/report.service.spec.ts
PASS test/auth.service.spec.ts

Test Suites: 5 passed, 5 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Result:      ALL PASSED
```

---

## Catatan Tambahan Kesiapan MVP:
1. **Empty States**: Seluruh katalog, daftar laporan pribadi, dan antrean klaim admin telah dilengkapi indikator saat data kosong.
2. **Loading States**: Indikator *spinner* dan tombol *disabled* aktif selama transaksi async ke API berlangsung.
3. **Error Handling**: Pesan *toast* / *banner error* ditampilkan ketika respon API gagal atau input tidak memenuhi validasi.
