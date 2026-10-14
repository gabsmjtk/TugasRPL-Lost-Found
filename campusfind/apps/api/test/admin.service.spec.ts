import { adminService } from '../src/services/admin.service';
import { prisma } from '../src/utils/prisma';
import { ReportStatus, Role } from '@campusfind/shared';
import { ForbiddenError, NotFoundError } from '../src/utils/errors';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    report: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reportImage: {
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

describe('US-05: Validasi Admin / Moderasi (AdminService)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReport = {
    Id: 'rep-mod-01',
    Title: 'Jaket Hoodie Hitam Polos',
    Description: 'Tertinggal di kelas 301',
    Status: ReportStatus.PENDING,
    Location: 'Kelas 301 Gedung A',
    ReporterId: 'usr-student-01',
    ModeratorNote: null,
  };

  describe('AC 1: Pengguna dengan role Admin dapat mengubah status laporan atau menghapusnya', () => {
    it('harus mengizinkan Admin untuk mengubah status laporan', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
      (prisma.report.update as jest.Mock).mockResolvedValue({
        ...mockReport,
        Status: ReportStatus.OPEN,
        ModeratorNote: 'Laporan telah diverifikasi oleh admin',
      });

      const result = await adminService.changeReportStatus(
        Role.ADMIN,
        'adm-001',
        'rep-mod-01',
        ReportStatus.OPEN,
        'Laporan telah diverifikasi oleh admin'
      );

      expect(prisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { Id: 'rep-mod-01' },
          data: expect.objectContaining({
            Status: ReportStatus.OPEN,
            ModeratorNote: 'Laporan telah diverifikasi oleh admin',
          }),
        })
      );
      expect(result.Status).toBe(ReportStatus.OPEN);
    });

    it('harus mengizinkan Admin untuk menghapus laporan', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
      (prisma.reportImage.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.report.delete as jest.Mock).mockResolvedValue(mockReport);

      const result = await adminService.deleteReport(Role.ADMIN, 'adm-001', 'rep-mod-01');

      expect(prisma.reportImage.deleteMany).toHaveBeenCalledWith({
        where: { ReportId: 'rep-mod-01' },
      });
      expect(prisma.report.delete).toHaveBeenCalledWith({
        where: { Id: 'rep-mod-01' },
      });
      expect(result).toHaveProperty('Message', 'Laporan berhasil dihapus oleh admin');
    });

    it('harus melempar NotFoundError jika laporan yang akan dihapus tidak ditemukan', async () => {
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        adminService.deleteReport(Role.ADMIN, 'adm-001', 'non-existent-id')
      ).rejects.toThrow(NotFoundError);

      expect(prisma.report.delete).not.toHaveBeenCalled();
    });
  });

  describe('AC 2: Pengguna non-admin akan menerima error 403 Forbidden jika mencoba melakukan akses ini', () => {
    it('harus melempar ForbiddenError (403) saat pengguna STUDENT mencoba mengubah status laporan', async () => {
      await expect(
        adminService.changeReportStatus(
          Role.STUDENT,
          'usr-student-01',
          'rep-mod-01',
          ReportStatus.REJECTED
        )
      ).rejects.toThrow(ForbiddenError);

      try {
        await adminService.changeReportStatus(
          Role.STUDENT,
          'usr-student-01',
          'rep-mod-01',
          ReportStatus.REJECTED
        );
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain('Akses ditolak: Hanya admin yang diizinkan');
      }

      expect(prisma.report.update).not.toHaveBeenCalled();
    });

    it('harus melempar ForbiddenError (403) saat pengguna STUDENT mencoba menghapus laporan', async () => {
      await expect(
        adminService.deleteReport(Role.STUDENT, 'usr-student-01', 'rep-mod-01')
      ).rejects.toThrow(ForbiddenError);

      try {
        await adminService.deleteReport(Role.STUDENT, 'usr-student-01', 'rep-mod-01');
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain('Akses ditolak: Hanya admin yang diizinkan');
      }

      expect(prisma.report.delete).not.toHaveBeenCalled();
    });

    it('harus melempar ForbiddenError (403) jika role undefined atau null', async () => {
      await expect(
        adminService.changeReportStatus(
          undefined,
          'anonymous',
          'rep-mod-01',
          ReportStatus.OPEN
        )
      ).rejects.toThrow(ForbiddenError);

      await expect(
        adminService.deleteReport(undefined, 'anonymous', 'rep-mod-01')
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
