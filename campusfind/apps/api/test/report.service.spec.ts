import { reportService, CreateReportDTO } from '../src/services/report.service';
import { prisma } from '../src/utils/prisma';
import { ReportType, ReportStatus } from '@campusfind/shared';
import { BadRequestError, NotFoundError } from '../src/utils/errors';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    category: {
      findFirst: jest.fn(),
    },
    report: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe('US-02: Pelaporan Barang Hilang/Ditemukan (ReportService)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validReportData: CreateReportDTO = {
    Title: 'Kunci Motor Honda',
    Description: 'Kunci motor beat warna hitam dengan gantungan boneka',
    Location: 'Kantin Gedung B Lantai 1',
    Type: ReportType.LOST,
    CategoryId: 'cat-kunci',
    EventAt: '2026-10-14T10:00:00.000Z',
  };

  describe('AC 1: Laporan berhasil disimpan jika data mandatory (judul, deskripsi, lokasi) terisi', () => {
    it('harus berhasil menyimpan laporan jika judul, deskripsi, dan lokasi terisi lengkap', async () => {
      const mockCategory = { Id: 'cat-kunci', Name: 'Kunci', IsActive: true };
      const mockCreatedReport = {
        Id: 'rep-001',
        ReporterId: 'usr-123',
        CategoryId: 'cat-kunci',
        Type: ReportType.LOST,
        Title: 'Kunci Motor Honda',
        Description: 'Kunci motor beat warna hitam dengan gantungan boneka',
        Location: 'Kantin Gedung B Lantai 1',
        Status: ReportStatus.PENDING,
        EventAt: new Date(validReportData.EventAt),
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
        Category: mockCategory,
        Images: [],
        Reporter: { Id: 'usr-123', Name: 'Budi' },
      };

      (prisma.category.findFirst as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.report.create as jest.Mock).mockResolvedValue(mockCreatedReport);

      const result = await reportService.createReport('usr-123', validReportData);

      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: { Id: 'cat-kunci', IsActive: true },
      });

      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ReporterId: 'usr-123',
            CategoryId: 'cat-kunci',
            Title: 'Kunci Motor Honda',
            Description: 'Kunci motor beat warna hitam dengan gantungan boneka',
            Location: 'Kantin Gedung B Lantai 1',
          }),
        })
      );

      expect(result).toEqual(mockCreatedReport);
      expect(result.Id).toBe('rep-001');
    });

    it('harus menolak penyimpanan jika data mandatory judul tidak diisi', async () => {
      const invalidData = { ...validReportData, Title: '   ' };

      await expect(
        reportService.createReport('usr-123', invalidData)
      ).rejects.toThrow(BadRequestError);

      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('harus menolak penyimpanan jika data mandatory deskripsi tidak diisi', async () => {
      const invalidData = { ...validReportData, Description: '' };

      await expect(
        reportService.createReport('usr-123', invalidData)
      ).rejects.toThrow(BadRequestError);

      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('harus menolak penyimpanan jika data mandatory lokasi tidak diisi', async () => {
      const invalidData = { ...validReportData, Location: '   ' };

      await expect(
        reportService.createReport('usr-123', invalidData)
      ).rejects.toThrow(BadRequestError);

      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('harus menolak penyimpanan jika kategori tidak ditemukan', async () => {
      (prisma.category.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        reportService.createReport('usr-123', validReportData)
      ).rejects.toThrow(NotFoundError);

      expect(prisma.report.create).not.toHaveBeenCalled();
    });
  });

  describe('AC 2: Status default laporan otomatis diset menjadi PENDING atau OPEN', () => {
    it('harus mengeset status default laporan baru menjadi PENDING', async () => {
      const mockCategory = { Id: 'cat-kunci', Name: 'Kunci', IsActive: true };
      (prisma.category.findFirst as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.report.create as jest.Mock).mockImplementation(async (args) => {
        return {
          Id: 'rep-pending-01',
          ...args.data,
        };
      });

      const result = await reportService.createReport('usr-123', validReportData);

      expect(prisma.report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            Status: ReportStatus.PENDING,
          }),
        })
      );
      expect(result.Status).toBe(ReportStatus.PENDING);
    });
  });
});
