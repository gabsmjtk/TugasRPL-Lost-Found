import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { ReportType, ReportStatus, ClaimStatus } from '@campusfind/shared';

// ── helpers ──────────────────────────────────────────────────────────────────

function toReportSummary(r: any) {
  return {
    Id: r.Id,
    Type: r.Type,
    Status: r.Status,
    Title: r.Title,
    CategoryId: r.CategoryId,
    CategoryName: r.Category?.Name ?? '',
    Location: r.Location,
    EventAt: r.EventAt.toISOString(),
    CreatedAt: r.CreatedAt.toISOString(),
    UpdatedAt: r.UpdatedAt.toISOString(),
    ReporterId: r.ReporterId,
    ReporterName: r.Reporter
      ? r.Reporter.Name.split(' ')[0] + ' ' + (r.Reporter.Name.split(' ')[1]?.[0] ?? '') + '.'
      : '',
    ImageUrl: r.Images?.[0]
      ? `/uploads/${r.Images[0].FileName}`
      : undefined,
  };
}

function toClaimSummary(c: any) {
  return {
    Id: c.Id,
    ReportId: c.ReportId,
    ReportTitle: c.Report?.Title ?? '',
    ClaimantId: c.ClaimantId,
    ClaimantName: c.Claimant?.Name ?? '',
    ProofAnswer: c.ProofAnswer,
    OwnershipDescription: c.OwnershipDescription,
    ContactPhone: c.ContactPhone,
    Status: c.Status,
    DecisionNote: c.DecisionNote ?? null,
    DecidedAt: c.DecidedAt?.toISOString() ?? null,
    CreatedAt: c.CreatedAt.toISOString(),
    UpdatedAt: c.UpdatedAt.toISOString(),
  };
}

// ── schemas ───────────────────────────────────────────────────────────────────

const createReportSchema = z.object({
  Title: z.string().min(1, 'Judul diperlukan'),
  Type: z.nativeEnum(ReportType),
  CategoryId: z.string().min(1, 'Kategori diperlukan'),
  Brand: z.string().optional(),
  Color: z.string().optional(),
  Description: z.string().min(20, 'Deskripsi minimal 20 karakter').max(1000),
  Location: z.string().min(1, 'Lokasi diperlukan'),
  EventAt: z.string().min(1, 'Tanggal kejadian diperlukan'),
});

const updateReportSchema = z.object({
  Title: z.string().min(1).optional(),
  CategoryId: z.string().optional(),
  Brand: z.string().optional(),
  Color: z.string().optional(),
  Description: z.string().min(20).max(1000).optional(),
  Location: z.string().optional(),
  EventAt: z.string().optional(),
});

const claimSchema = z.object({
  ProofAnswer: z.string().min(1, 'Jawaban bukti diperlukan'),
  OwnershipDescription: z.string().min(1, 'Deskripsi kepemilikan diperlukan'),
  ContactPhone: z.string().min(1, 'Nomor telepon diperlukan'),
});

// ── controllers ───────────────────────────────────────────────────────────────

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const data = createReportSchema.parse(req.body);
    const files = (req.files as Express.Multer.File[]) ?? [];

    const category = await prisma.category.findFirst({
      where: { Id: data.CategoryId, IsActive: true },
    });
    if (!category) return res.status(404).json({ Message: 'Kategori tidak ditemukan' });

    const report = await prisma.report.create({
      data: {
        ReporterId: user.Id,
        CategoryId: data.CategoryId,
        Type: data.Type,
        Title: data.Title,
        Brand: data.Brand,
        Color: data.Color,
        Description: data.Description,
        Location: data.Location,
        EventAt: new Date(data.EventAt),
        Images: {
          create: files.map((f, i) => ({
            FileName: f.filename,
            FilePath: f.path,
            MimeType: f.mimetype,
            SortOrder: i,
          })),
        },
      },
      include: { Category: true, Images: true, Reporter: true },
    });

    res.status(201).json(toReportSummary(report));
  } catch (err) {
    next(err);
  }
};

export const updateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const data = updateReportSchema.parse(req.body);

    const report = await prisma.report.findUnique({ where: { Id: id } });
    if (!report) return res.status(404).json({ Message: 'Laporan tidak ditemukan' });
    if (report.ReporterId !== user.Id)
      return res.status(403).json({ Message: 'Tidak diizinkan' });
    if (![ReportStatus.PENDING, ReportStatus.OPEN].includes(report.Status as ReportStatus))
      return res.status(400).json({ Message: 'Laporan tidak dapat diedit pada status ini' });

    const updated = await prisma.report.update({
      where: { Id: id },
      data: {
        ...data,
        EventAt: data.EventAt ? new Date(data.EventAt) : undefined,
      },
      include: { Category: true, Images: true, Reporter: true },
    });

    res.json(toReportSummary(updated));
  } catch (err) {
    next(err);
  }
};

export const deleteReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const report = await prisma.report.findUnique({ where: { Id: id } });
    if (!report) return res.status(404).json({ Message: 'Laporan tidak ditemukan' });
    if (report.ReporterId !== user.Id)
      return res.status(403).json({ Message: 'Tidak diizinkan' });
    if (![ReportStatus.PENDING, ReportStatus.OPEN].includes(report.Status as ReportStatus))
      return res.status(400).json({ Message: 'Laporan tidak dapat dihapus pada status ini' });

    await prisma.reportImage.deleteMany({ where: { ReportId: id } });
    await prisma.report.delete({ where: { Id: id } });

    res.json({ Message: 'Laporan berhasil dihapus' });
  } catch (err) {
    next(err);
  }
};

export const markFound = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const report = await prisma.report.findUnique({ where: { Id: id } });
    if (!report) return res.status(404).json({ Message: 'Laporan tidak ditemukan' });
    if (report.ReporterId !== user.Id)
      return res.status(403).json({ Message: 'Tidak diizinkan' });
    if (report.Type !== ReportType.LOST || report.Status !== ReportStatus.OPEN)
      return res.status(400).json({ Message: 'Hanya laporan barang hilang yang terbuka yang dapat ditandai' });

    const updated = await prisma.report.update({
      where: { Id: id },
      data: { Status: ReportStatus.MATCHED },
      include: { Category: true, Images: true, Reporter: true },
    });

    res.json(toReportSummary(updated));
  } catch (err) {
    next(err);
  }
};

export const submitClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id: reportId } = req.params;
    const data = claimSchema.parse(req.body);

    const report = await prisma.report.findUnique({ where: { Id: reportId } });
    if (!report) return res.status(404).json({ Message: 'Laporan tidak ditemukan' });
    if (report.ReporterId === user.Id)
      return res.status(400).json({ Message: 'Tidak dapat mengklaim laporan sendiri' });
    if (report.Type !== ReportType.FOUND || report.Status !== ReportStatus.OPEN)
      return res.status(400).json({ Message: 'Hanya laporan barang ditemukan yang terbuka yang dapat diklaim' });

    const existing = await prisma.claim.findFirst({
      where: { ReportId: reportId, ClaimantId: user.Id, Status: { in: [ClaimStatus.PENDING, ClaimStatus.APPROVED] } },
    });
    if (existing) return res.status(400).json({ Message: 'Anda sudah memiliki klaim aktif untuk laporan ini' });

    const claim = await prisma.claim.create({
      data: {
        ReportId: reportId,
        ClaimantId: user.Id,
        ProofAnswer: data.ProofAnswer,
        OwnershipDescription: data.OwnershipDescription,
        ContactPhone: data.ContactPhone,
      },
      include: { Report: true, Claimant: true },
    });

    res.status(201).json(toClaimSummary(claim));
  } catch (err) {
    next(err);
  }
};

export const cancelClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const claim = await prisma.claim.findUnique({ where: { Id: id }, include: { Report: true } });
    if (!claim) return res.status(404).json({ Message: 'Klaim tidak ditemukan' });
    if (claim.ClaimantId !== user.Id)
      return res.status(403).json({ Message: 'Tidak diizinkan' });
    if (claim.Status !== ClaimStatus.PENDING)
      return res.status(400).json({ Message: 'Hanya klaim yang menunggu yang dapat dibatalkan' });

    const updated = await prisma.claim.update({
      where: { Id: id },
      data: { Status: ClaimStatus.CANCELLED },
      include: { Report: true, Claimant: true },
    });

    res.json(toClaimSummary(updated));
  } catch (err) {
    next(err);
  }
};

export const myReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const reports = await prisma.report.findMany({
      where: { ReporterId: user.Id },
      include: { Category: true, Images: { take: 1 }, Reporter: true },
      orderBy: { CreatedAt: 'desc' },
    });
    res.json(reports.map(toReportSummary));
  } catch (err) {
    next(err);
  }
};

export const myClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const claims = await prisma.claim.findMany({
      where: { ClaimantId: user.Id },
      include: { Report: true, Claimant: true },
      orderBy: { CreatedAt: 'desc' },
    });
    res.json(claims.map(toClaimSummary));
  } catch (err) {
    next(err);
  }
};

export const myDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const [reports, claims, returnedCount] = await Promise.all([
      prisma.report.findMany({
        where: { ReporterId: user.Id },
        include: { Category: true, Images: { take: 1 }, Reporter: true },
        orderBy: { UpdatedAt: 'desc' },
        take: 5,
      }),
      prisma.claim.findMany({
        where: { ClaimantId: user.Id },
        include: { Report: true, Claimant: true },
        orderBy: { UpdatedAt: 'desc' },
        take: 5,
      }),
      prisma.report.count({
        where: { ReporterId: user.Id, Status: ReportStatus.RETURNED },
      }),
    ]);

    const allReportsCount = await prisma.report.count({ where: { ReporterId: user.Id } });
    const activeClaimsCount = await prisma.claim.count({
      where: { ClaimantId: user.Id, Status: { in: [ClaimStatus.PENDING, ClaimStatus.APPROVED] } },
    });

    res.json({
      MyReports: reports.map(toReportSummary),
      MyClaims: claims.map(toClaimSummary),
      Summary: {
        MyReportsCount: allReportsCount,
        ActiveClaimsCount: activeClaimsCount,
        ReturnedItemsCount: returnedCount,
      },
    });
  } catch (err) {
    next(err);
  }
};
