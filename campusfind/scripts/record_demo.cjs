const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function run() {
  console.log('--- Memulai Otomasi Perekaman E2E Demo CampusFind (2.5 Menit) ---');
  
  const recordingsDir = path.resolve(__dirname, '../recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  try {
    // ── 1. Landing Page (0:00 - 0:12) ─────────────────────────────────────────
    console.log('[1/6] Membuka Landing Page & Overview Statistik...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
    await page.waitForTimeout(3500);
    await page.evaluate(() => window.scrollBy({ top: -450, behavior: 'smooth' }));
    await page.waitForTimeout(2000);

    // ── 2. Login Flow & Error Handling (0:12 - 0:40) ─────────────────────────
    console.log('[2/6] Membuka Halaman Login & Menunjukkan Error State...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Test input salah (Error state handling)
    console.log('  -> Menampilkan error state saat kredensial salah...');
    await page.fill('input[type="email"]', 'student2@campusfind.ac.id');
    await page.fill('input[type="password"]', 'passwordsalah123');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3500); // Tampilkan alert error merah di layar

    // Login sukses Mahasiswa (Siti Aminah)
    console.log('  -> Melakukan login sukses Mahasiswa...');
    await page.fill('input[type="email"]', 'student2@campusfind.ac.id');
    await page.fill('input[type="password"]', 'password123');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // Diarahkan ke dashboard

    // ── 3. Pembuatan Laporan Barang Temuan (0:40 - 1:15) ──────────────────────
    console.log('[3/6] Mengisi Form Pembuatan Laporan Barang Temuan...');
    // Klik navigasi "Buat Laporan"
    const createNav = page.locator('a[href="/reports/create"]').first();
    await createNav.click();
    await page.waitForTimeout(2500);

    // Pilih tipe: Barang Ditemukan (klik label radio)
    console.log('  -> Memilih tipe: Barang Ditemukan...');
    await page.locator('label:has-text("Barang Ditemukan")').first().click();
    await page.waitForTimeout(1200);

    // Judul
    await page.fill('input[name="Title"]', 'Tumbler Corkcicle Putih 500ml');
    await page.waitForTimeout(1000);

    // Kategori
    const categorySelect = page.locator('select[name="CategoryId"]');
    await categorySelect.waitFor();
    await categorySelect.selectOption({ index: 2 }); // Pilih kategori ke-2
    await page.waitForTimeout(1000);

    // Brand & Color
    await page.fill('input[name="Brand"]', 'Corkcicle');
    await page.waitForTimeout(800);
    await page.fill('input[name="Color"]', 'Putih');
    await page.waitForTimeout(800);

    // Deskripsi (> 20 karakter)
    await page.fill('textarea[name="Description"]', 'Ditemukan tumbler minum stainless warna putih tertinggal di perpustakaan lantai 2 meja 14.');
    await page.waitForTimeout(1200);

    // Lokasi
    await page.fill('input[name="Location"]', 'Perpustakaan Lt. 2 Meja 14');
    await page.waitForTimeout(1000);

    // Tanggal kejadian
    await page.fill('input[name="EventAt"]', '2026-10-28T09:00');
    await page.waitForTimeout(2000);

    // Submit form (loading state -> success screen)
    console.log('  -> Menyimpan laporan dan menampilkan loading & status sukses...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000); // Tampilkan "Laporan Terkirim!"

    // Logout Mahasiswa
    console.log('  -> Logout dari akun mahasiswa...');
    await page.evaluate(() => { localStorage.clear(); window.location.href = '/login'; });
    await page.waitForTimeout(2500);

    // ── 4. Moderasi Admin (1:15 - 1:50) ──────────────────────────────────────
    console.log('[4/6] Login Admin dan Memoderasi Laporan (US-05)...');
    await page.fill('input[type="email"]', 'admin@campusfind.ac.id');
    await page.fill('input[type="password"]', 'password123');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3500); // Masuk ke panel /admin

    // Scroll dashboard admin
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await page.waitForTimeout(2500);

    // Cari tombol Verifikasi pada laporan pending
    const verifyButtons = page.locator('button:has-text("Verifikasi")');
    const verifyCount = await verifyButtons.count();
    if (verifyCount > 0) {
      console.log('  -> Menyetujui laporan pending menjadi OPEN...');
      await verifyButtons.first().click();
      await page.waitForTimeout(2000);

      // Isi catatan moderator di modal
      await page.fill('textarea[placeholder="Catatan untuk pelapor..."]', 'Barang fisik telah diamankan oleh satpam di pos keamanan utama.');
      await page.waitForTimeout(1500);
      await page.locator('button:has-text("Simpan")').first().click();
      await page.waitForTimeout(3500);
    }

    // Tampilkan tab Laporan di panel Admin
    console.log('  -> Membuka tab daftar laporan pada Panel Admin...');
    await page.locator('button:has-text("Laporan")').first().click();
    await page.waitForTimeout(4000);

    // Logout Admin
    console.log('  -> Logout dari akun admin...');
    await page.evaluate(() => { localStorage.clear(); window.location.href = '/login'; });
    await page.waitForTimeout(2500);

    // ── 5. Pencarian, Filter & Empty State (1:50 - 2:20) ──────────────────────
    console.log('[5/6] Demonstrasi Pencarian Keyword, Filter, dan Empty State (US-03)...');
    // Login sebagai Mahasiswa 1 (Budi Santoso)
    await page.fill('input[type="email"]', 'student1@campusfind.ac.id');
    await page.fill('input[type="password"]', 'password123');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Buka katalog barang
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // 5a. Cari kata kunci
    console.log('  -> Pencarian kata kunci "Corkcicle"...');
    await page.fill('input[placeholder="Cari judul, deskripsi, lokasi..."]', 'Corkcicle');
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Cari")').first().click();
    await page.waitForTimeout(3500);

    // 5b. Uji Empty State dengan keyword yang tidak cocok
    console.log('  -> Pengujian Empty State dengan kata kunci acak...');
    await page.fill('input[placeholder="Cari judul, deskripsi, lokasi..."]', 'BarangUnik9988YangTidakPernahAda');
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Cari")').first().click();
    await page.waitForTimeout(4000); // Tunjukkan Empty State di layar

    // Reset pencarian ke "Corkcicle"
    console.log('  -> Reset kembali ke laporan Corkcicle...');
    await page.fill('input[placeholder="Cari judul, deskripsi, lokasi..."]', 'Corkcicle');
    await page.waitForTimeout(800);
    await page.locator('button:has-text("Cari")').first().click();
    await page.waitForTimeout(3000);

    // ── 6. Proses Klaim & Handover (2:20 - 2:50) ─────────────────────────────
    console.log('[6/6] Membuka Detail Laporan dan Mengajukan Klaim (US-04)...');
    // Klik kartu barang pertama
    const reportCard = page.locator('a[href^="/reports/"]').first();
    await reportCard.click();
    await page.waitForTimeout(3500);

    // Klik tombol Ajukan Klaim
    const claimBtn = page.locator('button:has-text("Ajukan Klaim")');
    if (await claimBtn.isVisible()) {
      console.log('  -> Mengisi formulir klaim kepemilikan...');
      await claimBtn.click();
      await page.waitForTimeout(2000);

      await page.fill('textarea[placeholder="Jelaskan ciri khusus yang membuktikan barang ini milik Anda..."]', 'Terdapat stiker inisial B dan goresan kecil di tutup botol.');
      await page.waitForTimeout(1000);
      await page.fill('textarea[placeholder="Ceritakan bagaimana atau di mana barang ini hilang..."]', 'Tumbler hadiah ulang tahun saya yang tertinggal saat belajar kelompok.');
      await page.waitForTimeout(1000);
      await page.fill('input[placeholder="08xxxxxxxxxx"]', '081234567890');
      await page.waitForTimeout(1500);

      console.log('  -> Mengirim klaim kepemilikan...');
      await page.locator('button:has-text("Kirim Pengajuan Klaim")').first().click();
      await page.waitForTimeout(4000); // Tampilkan alert sukses klaim
    }

    // Logout Mahasiswa 1
    await page.evaluate(() => { localStorage.clear(); window.location.href = '/login'; });
    await page.waitForTimeout(2500);

    // Login Admin untuk menyelesaikan klaim & handover
    console.log('  -> Login Admin untuk Menyetujui Klaim & Melakukan Handover...');
    await page.fill('input[type="email"]', 'admin@campusfind.ac.id');
    await page.fill('input[type="password"]', 'password123');
    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3500);

    // Buka tab Klaim
    await page.locator('button:has-text("Klaim")').first().click();
    await page.waitForTimeout(3500);

    // Klik tombol Putuskan klaim
    const decideButtons = page.locator('button:has-text("Putuskan")');
    if (await decideButtons.count() > 0) {
      console.log('  -> Membuka modal keputusan klaim dan menyetujui...');
      await decideButtons.first().click();
      await page.waitForTimeout(2000);

      // Isi catatan keputusan
      await page.fill('textarea[placeholder="Alasan keputusan Anda..."]', 'Bukti stiker dan ciri khusus sangat cocok dengan fisik barang.');
      await page.waitForTimeout(1500);
      await page.locator('button:has-text("Simpan")').first().click();
      await page.waitForTimeout(4000);
    }

    // Catat Handover jika tombol "Handover" muncul
    const handoverButtons = page.locator('button:has-text("Handover")');
    if (await handoverButtons.count() > 0) {
      console.log('  -> Mencatat serah terima (handover) fisik barang...');
      await handoverButtons.first().click();
      await page.waitForTimeout(2000);

      await page.fill('input[placeholder="Nama lengkap penerima"]', 'Budi Santoso');
      await page.waitForTimeout(800);
      await page.fill('input[placeholder="cth. Ruang Satpam Gedung Utama"]', 'Pos Satpam Gedung Utama');
      await page.waitForTimeout(800);
      await page.fill('input[placeholder="Catatan tambahan..."]', 'Pengambilan barang sukses dengan verifikasi identitas KTM asli.');
      await page.waitForTimeout(1500);

      await page.locator('button:has-text("Catat Serah Terima")').first().click();
      await page.waitForTimeout(4000);
    }

    // Tampilkan hasil akhir di Dashboard Admin
    console.log('  -> Menampilkan status akhir laporan & dashboard...');
    await page.locator('button:has-text("Dashboard")').first().click();
    await page.waitForTimeout(5000);

    console.log('--- Skenario E2E Selesai dengan Sukses ---');
  } catch (err) {
    console.error('Terjadi error saat perekaman:', err);
  } finally {
    const videoObj = page.video();
    await page.close();
    await context.close();
    await browser.close();

    if (videoObj) {
      const videoPath = await videoObj.path();
      console.log(`Video mentah tersimpan di: ${videoPath}`);
      return videoPath;
    }
  }
}

run().then(async (recordedPath) => {
  if (!recordedPath || !fs.existsSync(recordedPath)) {
    console.error('File video rekaman tidak ditemukan.');
    process.exit(1);
  }

  const ffmpegExe = "C:\\Users\\gabsm\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.1-essentials_build\\bin\\ffmpeg.exe";
  const outputPath = path.resolve(__dirname, '../demo.mp4');

  console.log(`\nMengonversi video ke MP4 menggunakan FFmpeg...`);
  console.log(`Input: ${recordedPath}`);
  console.log(`Output: ${outputPath}`);

  try {
    const cmd = `"${ffmpegExe}" -y -i "${recordedPath}" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p "${outputPath}"`;
    execSync(cmd, { stdio: 'inherit' });

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`\n========================================`);
      console.log(`BERHASIL: demo.mp4 telah dibuat!`);
      console.log(`Ukuran file: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Lokasi: ${outputPath}`);
      console.log(`========================================\n`);
    } else {
      console.error('Gagal: demo.mp4 tidak ditemukan setelah konversi.');
      process.exit(1);
    }
  } catch (convErr) {
    console.error('Gagal saat konversi FFmpeg:', convErr);
    process.exit(1);
  }
});
