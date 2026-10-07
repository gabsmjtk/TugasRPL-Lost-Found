import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { ReportType, ReportStatus, ClaimStatus } from '@campusfind/shared';

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
    ImageUrl: r.Images?.[0] ? `/uploads/${r.Images[0].FileName}` : undefined,
    Images: r.Images?.map((img: any) => ({
      Id: img.Id,
      FileName: img.FileName,
      FilePath: img.FilePath,
      MimeType: img.MimeType,
      SortOrder: img.SortOrder,
      CreatedAt: img.CreatedAt.toISOString(),
    })),
    ModeratorNote: r.ModeratorNote ?? null,
    Brand: r.Brand ?? null,
    Color: r.Color ?? null,
    Description: r.Description,
    VerifiedAt: r.VerifiedAt?.toISOString() ?? null,
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

// ── Public reports controller ─────────────────────────────────────────────────

export const getPublicReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      Search, Type, CategoryId, Location, Status,
      DateFrom, DateTo, Sort = 'newest',
      Page = '1', PageSize = '10',
    } = req.query as Record<string, string>;

    const page = Math.max(1, parseInt(Page));
    const pageSize = Math.min(50, Math.max(1, parseInt(PageSize)));
    const skip = (page - 1) * pageSize;

    const where: any = {
      Status: Status
        ? Status
        : { in: [ReportStatus.OPEN, ReportStatus.MATCHED, ReportStatus.CLAIMED, ReportStatus.RETURNED] },
    };

    if (Type) where.Type = Type;
    if (CategoryId) where.CategoryId = CategoryId;
    if (Location) where.Location = { contains: Location };
    if (Search) {
      where.OR = [
        { Title: { contains: Search } },
        { Description: { contains: Search } },
        { Location: { contains: Search } },
        { Category: { Name: { contains: Search } } },
      ];
    }
    if (DateFrom || DateTo) {
      where.EventAt = {};
      if (DateFrom) where.EventAt.gte = new Date(DateFrom);
      if (DateTo) where.EventAt.lte = new Date(DateTo);
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: { Category: true, Images: { take: 1, orderBy: { SortOrder: 'asc' } }, Reporter: true },
        orderBy: { CreatedAt: Sort === 'oldest' ? 'asc' : 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      Data: reports.map(toReportSummary),
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
};

export const getReportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.findFirst({
      where: { Id: id },
      include: {
        Category: true,
        Images: { orderBy: { SortOrder: 'asc' } },
        Reporter: true,
      },
    });

    if (!report) return res.status(404).json({ Message: 'Laporan tidak ditemukan' });

    const similar = await prisma.report.findMany({
      where: {
        CategoryId: report.CategoryId,
        Type: report.Type === ReportType.LOST ? ReportType.FOUND : ReportType.LOST,
        Status: { in: [ReportStatus.OPEN, ReportStatus.MATCHED] },
        Id: { not: report.Id },
      },
      include: { Category: true, Images: { take: 1 }, Reporter: true },
      orderBy: { EventAt: 'asc' },
      take: 3,
    });

    const detail = {
      ...toReportSummary(report),
      SimilarReports: similar.map(toReportSummary),
    };

    res.json(detail);
  } catch (err) {
    next(err);
  }
};

export const getPublicStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [openLost, openFound, returned] = await Promise.all([
      prisma.report.count({ where: { Type: ReportType.LOST, Status: ReportStatus.OPEN } }),
      prisma.report.count({ where: { Type: ReportType.FOUND, Status: ReportStatus.OPEN } }),
      prisma.report.count({ where: { Status: ReportStatus.RETURNED } }),
    ]);
    res.json({ OpenLostReports: openLost, OpenFoundReports: openFound, CompletedHandovers: returned });
  } catch (err) {
    next(err);
  }
};
