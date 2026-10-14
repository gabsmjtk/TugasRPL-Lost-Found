import { searchService } from '../src/services/search.service';
import { prisma } from '../src/utils/prisma';
import { ReportStatus, ReportType } from '@campusfind/shared';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    report: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('US-03: Pencarian dan Filter Barang (SearchService)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const sampleReports = [
    {
      Id: 'rep-01',
      Title: 'Laptop Asus ROG Hitam',
      Description: 'Tertinggal di laboratorium komputer gedung C',
      Location: 'Lab Komputer C',
      Status: ReportStatus.OPEN,
      CategoryId: 'cat-elektronik',
      Type: ReportType.LOST,
      CreatedAt: new Date('2026-10-10'),
    },
    {
      Id: 'rep-02',
      Title: 'Botol Minum Tupperware Biru',
      Description: 'Ditemukan di perpustakaan lantai 2 meja pojok laptop',
      Location: 'Perpustakaan Lt 2',
      Status: ReportStatus.OPEN,
      CategoryId: 'cat-aksesoris',
      Type: ReportType.FOUND,
      CreatedAt: new Date('2026-10-11'),
    },
  ];

  describe('AC 1: Sistem dapat mengembalikan daftar barang yang judul/deskripsinya cocok dengan keyword', () => {
    it('harus memfilter laporan menggunakan query OR pada Title dan Description saat keyword diberikan', async () => {
      (prisma.report.findMany as jest.Mock).mockResolvedValue([sampleReports[0]]);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      const keyword = 'Asus';
      const result = await searchService.searchReports({ keyword });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { Title: { contains: keyword } },
              { Description: { contains: keyword } },
            ],
          }),
        })
      );

      expect(result.Data).toHaveLength(1);
      expect(result.Data[0].Title).toContain('Asus');
      expect(result.Total).toBe(1);
    });

    it('harus mengembalikan daftar barang yang deskripsinya cocok dengan keyword', async () => {
      (prisma.report.findMany as jest.Mock).mockResolvedValue([sampleReports[1]]);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      const keyword = 'perpustakaan';
      const result = await searchService.searchReports({ keyword });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { Title: { contains: keyword } },
              { Description: { contains: keyword } },
            ],
          }),
        })
      );
      expect(result.Data[0].Description).toContain('perpustakaan');
    });
  });

  describe('AC 2: Sistem dapat memfilter barang berdasarkan category atau status', () => {
    it('harus memfilter barang berdasarkan categoryId', async () => {
      (prisma.report.findMany as jest.Mock).mockResolvedValue([sampleReports[0]]);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      const categoryId = 'cat-elektronik';
      const result = await searchService.searchReports({ categoryId });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            CategoryId: categoryId,
          }),
        })
      );
      expect(result.Data).toHaveLength(1);
      expect(result.Data[0].CategoryId).toBe(categoryId);
    });

    it('harus memfilter barang berdasarkan status', async () => {
      (prisma.report.findMany as jest.Mock).mockResolvedValue(sampleReports);
      (prisma.report.count as jest.Mock).mockResolvedValue(2);

      const status = ReportStatus.OPEN;
      const result = await searchService.searchReports({ status });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            Status: status,
          }),
        })
      );
      expect(result.Data).toHaveLength(2);
      expect(result.Data.every((r: any) => r.Status === ReportStatus.OPEN)).toBe(true);
    });

    it('harus dapat memfilter kombinasi keyword, category, dan status sekaligus', async () => {
      (prisma.report.findMany as jest.Mock).mockResolvedValue([sampleReports[0]]);
      (prisma.report.count as jest.Mock).mockResolvedValue(1);

      await searchService.searchReports({
        keyword: 'Laptop',
        categoryId: 'cat-elektronik',
        status: ReportStatus.OPEN,
      });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            CategoryId: 'cat-elektronik',
            Status: ReportStatus.OPEN,
            OR: [
              { Title: { contains: 'Laptop' } },
              { Description: { contains: 'Laptop' } },
            ],
          },
        })
      );
    });
  });
});
