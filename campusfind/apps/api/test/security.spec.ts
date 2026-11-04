import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/utils/prisma';
import { generateToken } from '../src/utils/jwt';
import { sanitizeLogData } from '../src/utils/logger';
import { Role, ReportStatus, ReportType, ClaimStatus } from '@campusfind/shared';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    report: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    reportImage: {
      deleteMany: jest.fn(),
    },
    claim: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

describe('P8 Security & Quality Verification Suite', () => {
  const studentUser = {
    Id: 'student-user-1',
    Name: 'Budi Santoso',
    Email: 'budi@campusfind.ac.id',
    StudentNumber: '11223344',
    Role: Role.STUDENT,
    IsActive: true,
  };

  const otherStudentUser = {
    Id: 'student-user-2',
    Name: 'Siti Aminah',
    Email: 'siti@campusfind.ac.id',
    StudentNumber: '22334455',
    Role: Role.STUDENT,
    IsActive: true,
  };

  const adminUser = {
    Id: 'admin-user-1',
    Name: 'Admin Kampus',
    Email: 'admin@campusfind.ac.id',
    StudentNumber: null,
    Role: Role.ADMIN,
    IsActive: true,
  };

  const inactiveUser = {
    Id: 'inactive-user-1',
    Name: 'Inactive User',
    Email: 'inactive@campusfind.ac.id',
    Role: Role.STUDENT,
    IsActive: false,
  };

  const studentToken = generateToken(studentUser);
  const otherStudentToken = generateToken(otherStudentUser);
  const adminToken = generateToken(adminUser);
  const inactiveToken = generateToken(inactiveUser);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Security Headers & Server Hardening', () => {
    it('harus memuat header Helmet (X-Content-Type-Options: nosniff) dan menyembunyikan X-Powered-By', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('harus memblokir request CORS dengan origin yang tidak diizinkan', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://hacker-site.malicious.com');
      // Either error or CORS header not echoing unauthorized origin
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('2. Safe Logging & Data Sanitization', () => {
    it('harus menyamarkan password, token JWT, dan kredensial koneksi database', () => {
      const sensitivePayload = {
        Email: 'test@campusfind.ac.id',
        Password: 'MySecretPassword123!',
        PasswordHash: '$2a$10$abcdefghijk',
        Token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        database_url: 'mysql://root:secretpass@localhost:3306/campusfind',
        SafeInfo: 'Informasi Publik',
      };

      const sanitized = sanitizeLogData(sensitivePayload);
      expect(sanitized.Password).toBe('***REDACTED***');
      expect(sanitized.PasswordHash).toBe('***REDACTED***');
      expect(sanitized.Token).toBe('***REDACTED***');
      expect(sanitized.database_url).toBe('***REDACTED***');
      expect(sanitized.SafeInfo).toBe('Informasi Publik');
    });

    it('harus menyamarkan string connection URL database langsung', () => {
      const rawConn = 'mysql://admin:SuperPassword99@db.campusfind.local:3306/prod_db';
      const sanitized = sanitizeLogData(rawConn);
      expect(sanitized).toBe('mysql://admin:***@db.campusfind.local:3306/prod_db');
      expect(sanitized).not.toContain('SuperPassword99');
    });

    it('harus menyamarkan Bearer token dalam authorization header string', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
      const sanitized = sanitizeLogData(authHeader);
      expect(sanitized).toBe('Bearer ***');
    });
  });

  describe('3. Autentikasi, Token & Akses Akun Non-aktif', () => {
    it('harus menolak request tanpa token ke rute terproteksi (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/me/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.Message).toContain('Token otentikasi tidak ditemukan');
    });

    it('harus menolak token dari pengguna yang telah dinonaktifkan (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/me/dashboard')
        .set('Authorization', `Bearer ${inactiveToken}`);
      expect(res.status).toBe(401);
      expect(res.body.Message).toContain('dinonaktifkan');
    });

    it('harus menolak token dengan tanda tangan (signature) yang salah (401)', async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9.invalidsignature';
      const res = await request(app)
        .get('/api/me/dashboard')
        .set('Authorization', `Bearer ${fakeToken}`);
      expect(res.status).toBe(401);
      expect(res.body.Message).toContain('Token tidak valid');
    });
  });

  describe('4. Otorisasi Berbasis Peran (Admin vs Mahasiswa)', () => {
    it('harus menolak Mahasiswa mengakses rute admin (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.Message).toContain('Hanya administrator');
    });

    it('harus mengizinkan Admin mengakses rute admin (200 OK)', async () => {
      (prisma.report.count as jest.Mock).mockResolvedValue(0);
      (prisma.claim.count as jest.Mock).mockResolvedValue(0);
      (prisma.report.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.claim.findMany as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('Summary');
    });
  });

  describe('5. Isolasi Data Antar Mahasiswa (Cross-User Access Control)', () => {
    it('harus menolak mahasiswa A mengubah laporan milik mahasiswa B (403 Forbidden)', async () => {
      // Mock report belongs to otherStudentUser
      (prisma.report.findUnique as jest.Mock).mockResolvedValue({
        Id: 'report-belonging-to-siti',
        ReporterId: otherStudentUser.Id,
        Status: ReportStatus.OPEN,
      });

      const res = await request(app)
        .put('/api/me/reports/report-belonging-to-siti')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ Title: 'Judul Diubah Peretas' });

      expect(res.status).toBe(403);
      expect(res.body.Message).toBe('Tidak diizinkan');
    });

    it('harus menolak mahasiswa A menghapus laporan milik mahasiswa B (403 Forbidden)', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue({
        Id: 'report-belonging-to-siti',
        ReporterId: otherStudentUser.Id,
        Status: ReportStatus.OPEN,
      });

      const res = await request(app)
        .delete('/api/me/reports/report-belonging-to-siti')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.Message).toBe('Tidak diizinkan');
    });

    it('harus menolak mahasiswa mengklaim laporan barang yang dilaporkan dirinya sendiri (400 Bad Request)', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue({
        Id: 'report-my-own-found-item',
        ReporterId: studentUser.Id,
        Type: ReportType.FOUND,
        Status: ReportStatus.OPEN,
      });

      const res = await request(app)
        .post('/api/me/reports/report-my-own-found-item/claims')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          ProofAnswer: 'Ini barang saya',
          OwnershipDescription: 'Warna hitam',
          ContactPhone: '08123456789',
        });

      expect(res.status).toBe(400);
      expect(res.body.Message).toContain('Tidak dapat mengklaim laporan sendiri');
    });

    it('harus menolak mahasiswa A membatalkan klaim milik mahasiswa B (403 Forbidden)', async () => {
      (prisma.claim.findUnique as jest.Mock).mockResolvedValue({
        Id: 'claim-belonging-to-siti',
        ClaimantId: otherStudentUser.Id,
        Status: ClaimStatus.PENDING,
      });

      const res = await request(app)
        .post('/api/me/claims/claim-belonging-to-siti/cancel')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.Message).toBe('Tidak diizinkan');
    });
  });

  describe('6. Proteksi Visibilitas Laporan Pending & Rejected', () => {
    it('harus menolak publik/pengguna lain melihat detail laporan status PENDING (404 Not Found)', async () => {
      (prisma.report.findFirst as jest.Mock).mockResolvedValue({
        Id: 'pending-rep-1',
        Title: 'Laptop Belum Diverifikasi',
        ReporterId: studentUser.Id,
        Status: ReportStatus.PENDING,
        Type: ReportType.LOST,
        EventAt: new Date(),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
        Images: [],
      });

      // Anonymous / Unauthenticated request
      const anonRes = await request(app).get('/api/reports/pending-rep-1');
      expect(anonRes.status).toBe(404);

      // Other student request
      const otherRes = await request(app)
        .get('/api/reports/pending-rep-1')
        .set('Authorization', `Bearer ${otherStudentToken}`);
      expect(otherRes.status).toBe(404);
    });

    it('harus mengizinkan pembuat laporan atau admin melihat laporan berstatus PENDING', async () => {
      (prisma.report.findFirst as jest.Mock).mockResolvedValue({
        Id: 'pending-rep-1',
        Title: 'Laptop Belum Diverifikasi',
        ReporterId: studentUser.Id,
        Status: ReportStatus.PENDING,
        Type: ReportType.LOST,
        EventAt: new Date(),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
        Images: [],
      });
      (prisma.report.findMany as jest.Mock).mockResolvedValue([]);

      // Creator
      const ownerRes = await request(app)
        .get('/api/reports/pending-rep-1')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(ownerRes.status).toBe(200);

      // Admin
      const adminRes = await request(app)
        .get('/api/reports/pending-rep-1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
    });
  });

  describe('7. Validasi Input & Pencegahan Self-Lockout Admin', () => {
    it('harus menolak admin menonaktifkan akun admin dirinya sendiri (400 Bad Request)', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser.Id}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ IsActive: false });

      expect(res.status).toBe(400);
      expect(res.body.Message).toContain('tidak dapat menonaktifkan akun admin Anda sendiri');
    });

    it('harus menolak input kategori tanpa Nama yang valid (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ Name: '', Description: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.Message).toContain('Validasi');
    });

    it('harus menolak keputusan klaim jika status tidak valid (400 Bad Request)', async () => {
      const res = await request(app)
        .patch('/api/admin/claims/claim-123/decision')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ Status: 'UNKNOWN_STATUS', DecisionNote: 'Note' });

      expect(res.status).toBe(400);
      expect(res.body.Message).toContain('Validasi');
    });
  });

  describe('8. Proteksi Keamanan Upload File', () => {
    it('harus menolak upload file dengan ekstensi executable atau selain gambar (.exe/.php)', async () => {
      (prisma.category.findFirst as jest.Mock).mockResolvedValue({ Id: 'cat-1', IsActive: true });

      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('Title', 'Kehilangan Dompet')
        .field('Description', 'Dompet hitam jatuh di halte')
        .field('Location', 'Halte Kampus')
        .field('Type', 'LOST')
        .field('CategoryId', 'cat-1')
        .field('EventAt', new Date().toISOString())
        .attach('images', Buffer.from('malicious payload'), 'exploit.php');

      expect(res.status).toBe(400);
      expect(res.body.Message).toContain('Ekstensi file tidak diizinkan');
    });

    it('harus menolak upload file dengan MIME type bukan gambar atau ekstensi tidak diizinkan (.sh)', async () => {
      (prisma.category.findFirst as jest.Mock).mockResolvedValue({ Id: 'cat-1', IsActive: true });

      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('Title', 'Kehilangan Dompet')
        .field('Description', 'Dompet hitam jatuh di halte')
        .field('Location', 'Halte Kampus')
        .field('Type', 'LOST')
        .field('CategoryId', 'cat-1')
        .field('EventAt', new Date().toISOString())
        .attach('images', Buffer.from('shell script'), { filename: 'script.sh', contentType: 'application/x-sh' });

      expect(res.status).toBe(400);
      expect(res.body.Message).toContain('Ekstensi file tidak diizinkan');
    });
  });

  describe('9. Penanganan Error Bersih Tanpa Kebocoran Informasi (No Stack Trace / DB Leak)', () => {
    it('harus menyembunyikan query database internal saat terjadi kesalahan Prisma P2002', async () => {
      (prisma.category.findUnique as jest.Mock).mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint failed on the fields: (`Name`)',
      });

      const res = await request(app)
        .post('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ Name: 'Elektronik Baru' });

      expect(res.status).toBe(409);
      expect(res.body.Message).toContain('sudah terdaftar');
      expect(res.body.stack).toBeUndefined();
      expect(res.body.query).toBeUndefined();
    });

    it('harus mengembalikan pesan kesalahan umum 500 tanpa stack trace untuk error yang tak terduga', async () => {
      (prisma.category.findMany as jest.Mock).mockRejectedValue(
        new Error('Unexpected fatal database network drop at 10.0.0.1:3306')
      );

      const res = await request(app)
        .get('/api/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
      expect(res.body.Message).toBe('Terjadi kesalahan internal pada server');
      expect(res.body.stack).toBeUndefined();
      expect(res.text).not.toContain('10.0.0.1');
    });
  });
});
