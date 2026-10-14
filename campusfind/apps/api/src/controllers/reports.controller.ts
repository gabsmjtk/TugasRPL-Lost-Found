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

import { searchService } from '../services/search.service';
import { reportService } from '../services/report.service';

export const getPublicReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      Search, Type, CategoryId, Location, Status,
      Sort = 'newest',
      Page = '1', PageSize = '10',
    } = req.query as Record<string, string>;

    const page = Math.max(1, parseInt(Page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(PageSize) || 10));

    const result = await searchService.searchReports({
      keyword: Search,
      type: Type as any,
      categoryId: CategoryId,
      location: Location,
      status: Status as any,
      sort: Sort as 'newest' | 'oldest',
      page,
      pageSize,
    });

    res.json({
      Data: result.Data.map(toReportSummary),
      Total: result.Total,
      Page: result.Page,
      PageSize: result.PageSize,
      TotalPages: result.TotalPages,
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
