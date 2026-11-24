import { getReportById } from '../src/controllers/reports.controller';
import { prisma } from '../src/utils/prisma';
import { ReportStatus, ReportType } from '@campusfind/shared';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    report: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

describe('Public Reports Visibility Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReport = {
    Id: 'rep-pending-01',
    ReporterId: 'usr-owner',
    Status: ReportStatus.PENDING,
    Type: ReportType.LOST,
    Title: 'KTM Hilang',
    Description: 'KTM atas nama Budi',
    Location: 'Gedung C',
    EventAt: new Date(),
    CreatedAt: new Date(),
    UpdatedAt: new Date(),
    Category: { Id: 'cat-1', Name: 'Kartu' },
    Images: [],
    Reporter: { Id: 'usr-owner', Name: 'Budi' },
  };

  it('harus mengembalikan 404 jika pengguna anonymous mencoba mengakses laporan berstatus PENDING', async () => {
    (prisma.report.findFirst as jest.Mock).mockResolvedValue(mockReport);

    const req: any = {
      params: { id: 'rep-pending-01' },
      user: undefined,
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await getReportById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ Message: 'Laporan tidak ditemukan' });
  });

  it('harus mengizinkan pemilik laporan mengakses detail laporan miliknya yang berstatus PENDING', async () => {
    (prisma.report.findFirst as jest.Mock).mockResolvedValue(mockReport);

    const req: any = {
      params: { id: 'rep-pending-01' },
      user: { Id: 'usr-owner', Role: 'STUDENT' },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await getReportById(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ Id: 'rep-pending-01' }));
  });

  it('harus mengizinkan Admin mengakses detail laporan berstatus PENDING', async () => {
    (prisma.report.findFirst as jest.Mock).mockResolvedValue(mockReport);

    const req: any = {
      params: { id: 'rep-pending-01' },
      user: { Id: 'usr-admin', Role: 'ADMIN' },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await getReportById(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ Id: 'rep-pending-01' }));
  });

  it('harus mengizinkan publik mengakses laporan berstatus OPEN', async () => {
    const openReport = { ...mockReport, Status: ReportStatus.OPEN };
    (prisma.report.findFirst as jest.Mock).mockResolvedValue(openReport);

    const req: any = {
      params: { id: 'rep-open-01' },
      user: undefined,
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await getReportById(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ Id: 'rep-pending-01' }));
  });
});
