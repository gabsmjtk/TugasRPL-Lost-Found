import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { ReportType, ReportStatus, PaginatedResponse, ReportSummary } from '@campusfind/shared';

const getReportsSchema = z.object({
  Search: z.string().optional(),
  Type: z.enum(['LOST', 'FOUND']).optional(),
  CategoryId: z.string().optional(),
  Location: z.string().optional(),
  Status: z.nativeEnum(ReportStatus).optional(),
  DateFrom: z.string().optional(),
  DateTo: z.string().optional(),
  Sort: z.enum(['newest', 'oldest']).default('newest'),
  Page: z.coerce.number().min(1).default(1),
  PageSize: z.coerce.number().min(1).max(50).default(10),
});

export const getPublicReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = getReportsSchema.parse(req.query);

    const where: any = {
      Status: {
        notIn: ['PENDING'] // Public can't see pending
      }
    };

    if (query.Status) {
      where.Status = query.Status;
    }
    if (query.Search) {
      where.OR = [
        { Title: { contains: query.Search } },
        { Description: { contains: query.Search } },
        { Location: { contains: query.Search } },
        { Category: { Name: { contains: query.Search } } }
      ];
    }
    if (query.Type) where.Type = query.Type;
    if (query.CategoryId) where.CategoryId = query.CategoryId;
    if (query.Location) where.Location = { contains: query.Location };
    if (query.DateFrom || query.DateTo) {
      where.EventAt = {};
      if (query.DateFrom) where.EventAt.gte = new Date(query.DateFrom);
      if (query.DateTo) where.EventAt.lte = new Date(query.DateTo);
    }

    const skip = (query.Page - 1) * query.PageSize;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          Category: true,
          Images: {
            take: 1,
            orderBy: { SortOrder: 'asc' }
          }
        },
        orderBy: {
          CreatedAt: query.Sort === 'newest' ? 'desc' : 'asc'
        },
        skip,
        take: query.PageSize,
      }),
      prisma.report.count({ where })
    ]);

    const data: ReportSummary[] = reports.map(r => ({
      Id: r.Id,
      Type: r.Type as ReportType,
      Status: r.Status as ReportStatus,
      Title: r.Title,
      CategoryId: r.CategoryId,
      CategoryName: r.Category.Name,
      Location: r.Location,
      EventAt: r.EventAt.toISOString(),
      CreatedAt: r.CreatedAt.toISOString(),
      UpdatedAt: r.UpdatedAt.toISOString(),
      ImageUrl: r.Images[0] ? `/uploads/${r.Images[0].FileName}` : undefined
    }));

    const response: PaginatedResponse<ReportSummary> = {
      Data: data,
      Total: total,
      Page: query.Page,
      PageSize: query.PageSize,
      TotalPages: Math.ceil(total / query.PageSize)
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { Id: id },
      include: {
        Category: true,
        Images: { orderBy: { SortOrder: 'asc' } },
        Reporter: true
      }
    });

    if (!report || report.Status === 'PENDING') {
      return res.status(404).json({ Message: 'Report not found' });
    }

    // Get similar reports
    const similar = await prisma.report.findMany({
      where: {
        CategoryId: report.CategoryId,
        Type: report.Type === 'LOST' ? 'FOUND' : 'LOST',
        Status: { notIn: ['PENDING', 'ARCHIVED', 'REJECTED'] },
        Id: { not: report.Id }
      },
      include: {
        Category: true,
        Images: { take: 1, orderBy: { SortOrder: 'asc' } }
      },
      orderBy: { EventAt: 'desc' },
      take: 3
    });

    const reporterName = report.Reporter.Name;
    const nameParts = reporterName.split(' ');
    const publicName = nameParts.length > 1 
      ? `${nameParts[0]} ${nameParts[1].charAt(0)}.` 
      : nameParts[0];

    const similarReports: ReportSummary[] = similar.map(r => ({
      Id: r.Id,
      Type: r.Type as ReportType,
      Status: r.Status as ReportStatus,
      Title: r.Title,
      CategoryId: r.CategoryId,
      CategoryName: r.Category.Name,
      Location: r.Location,
      EventAt: r.EventAt.toISOString(),
      CreatedAt: r.CreatedAt.toISOString(),
      UpdatedAt: r.UpdatedAt.toISOString(),
      ImageUrl: r.Images[0] ? `/uploads/${r.Images[0].FileName}` : undefined
    }));

    const detail = {
      Id: report.Id,
      ReporterId: report.ReporterId,
      ReporterName: publicName,
      CategoryId: report.CategoryId,
      CategoryName: report.Category.Name,
      Type: report.Type as ReportType,
      Status: report.Status as ReportStatus,
      Title: report.Title,
      Brand: report.Brand,
      Color: report.Color,
      Description: report.Description,
      Location: report.Location,
      EventAt: report.EventAt.toISOString(),
      VerifiedAt: report.VerifiedAt?.toISOString() || null,
      ModeratorNote: report.ModeratorNote,
      CreatedAt: report.CreatedAt.toISOString(),
      UpdatedAt: report.UpdatedAt.toISOString(),
      Images: report.Images.map(img => ({
        Id: img.Id,
        ReportId: img.ReportId,
        FileName: img.FileName,
        FilePath: `/uploads/${img.FileName}`,
        MimeType: img.MimeType,
        SortOrder: img.SortOrder,
        CreatedAt: img.CreatedAt.toISOString()
      })),
      SimilarReports: similarReports
    };

    res.json(detail);
  } catch (error) {
    next(error);
  }
};
