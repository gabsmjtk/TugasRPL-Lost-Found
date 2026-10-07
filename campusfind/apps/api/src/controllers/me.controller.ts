import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { ReportType, ReportStatus, ClaimStatus, ReportSummary, ClaimSummary, StudentDashboardResponse } from '@campusfind/shared';

const createReportSchema = z.object({
  Title: z.string().min(1, 'Title is required'),
  Type: z.enum(['LOST', 'FOUND']),
  CategoryId: z.string().min(1, 'Category is required'),
  Brand: z.string().optional(),
  Color: z.string().optional(),
  Description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  Location: z.string().min(1, 'Location is required'),
  EventAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'EventAt must be a valid date',
  })
});

const submitClaimSchema = z.object({
  ProofAnswer: z.string().min(1, 'Proof answer is required'),
  OwnershipDescription: z.string().min(1, 'Ownership description is required'),
  ContactPhone: z.string().min(1, 'Contact phone is required')
});

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createReportSchema.parse(req.body);
    const files = req.files as Express.Multer.File[];

    const report = await prisma.report.create({
      data: {
        ReporterId: req.user!.Id,
        CategoryId: data.CategoryId,
        Type: data.Type,
        Status: ReportStatus.PENDING,
        Title: data.Title,
        Brand: data.Brand,
        Color: data.Color,
        Description: data.Description,
        Location: data.Location,
        EventAt: new Date(data.EventAt),
      }
    });

    if (files && files.length > 0) {
      const imageCreates = files.slice(0, 3).map((f, idx) => ({
        ReportId: report.Id,
        FileName: f.filename,
        FilePath: `/uploads/${f.filename}`,
        MimeType: f.mimetype,
        SortOrder: idx
      }));
      await prisma.reportImage.createMany({ data: imageCreates });
    }

    res.status(201).json({ Message: 'Report created successfully', Id: report.Id });
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = createReportSchema.partial().parse(req.body);
    
    const report = await prisma.report.findUnique({ where: { Id: id } });
    if (!report) return res.status(404).json({ Message: 'Report not found' });
    if (report.ReporterId !== req.user!.Id) return res.status(403).json({ Message: 'Forbidden' });
    if (report.Status !== 'PENDING' && report.Status !== 'OPEN') {
      return res.status(400).json({ Message: 'Cannot edit report in current status' });
    }

    await prisma.report.update({
      where: { Id: id },
      data: {
        ...data,
        EventAt: data.EventAt ? new Date(data.EventAt) : undefined,
      }
    });

    res.json({ Message: 'Report updated' });
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.findUnique({ where: { Id: id } });
    
    if (!report) return res.status(404).json({ Message: 'Report not found' });
    if (report.ReporterId !== req.user!.Id) return res.status(403).json({ Message: 'Forbidden' });
    if (report.Status !== 'PENDING' && report.Status !== 'OPEN') {
      return res.status(400).json({ Message: 'Cannot delete report in current status' });
    }

    await prisma.report.delete({ where: { Id: id } });
    res.json({ Message: 'Report deleted' });
  } catch (error) {
    next(error);
  }
};

export const markFound = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.findUnique({ where: { Id: id } });
    
    if (!report) return res.status(404).json({ Message: 'Report not found' });
    if (report.ReporterId !== req.user!.Id) return res.status(403).json({ Message: 'Forbidden' });
    if (report.Type !== 'LOST' || report.Status !== 'OPEN') {
      return res.status(400).json({ Message: 'Invalid report type or status for this action' });
    }

    await prisma.report.update({
      where: { Id: id },
      data: { Status: ReportStatus.MATCHED }
    });

    res.json({ Message: 'Report marked as found/matched' });
  } catch (error) {
    next(error);
  }
};

export const submitClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = submitClaimSchema.parse(req.body);
    const userId = req.user!.Id;

    const report = await prisma.report.findUnique({ where: { Id: id } });
    if (!report || report.Status !== 'OPEN' || report.Type !== 'FOUND') {
      return res.status(400).json({ Message: 'Report is not available for claiming' });
    }
    if (report.ReporterId === userId) {
      return res.status(400).json({ Message: 'Cannot claim your own report' });
    }

    const existingClaim = await prisma.claim.findFirst({
      where: {
        ReportId: id,
        ClaimantId: userId,
        Status: { notIn: ['CANCELLED', 'REJECTED'] }
      }
    });
    if (existingClaim) {
      return res.status(400).json({ Message: 'You already have an active claim for this report' });
    }

    const claim = await prisma.claim.create({
      data: {
        ReportId: id,
        ClaimantId: userId,
        ProofAnswer: data.ProofAnswer,
        OwnershipDescription: data.OwnershipDescription,
        ContactPhone: data.ContactPhone,
      }
    });

    res.status(201).json({ Message: 'Claim submitted successfully', Id: claim.Id });
  } catch (error) {
    next(error);
  }
};

export const cancelClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const claim = await prisma.claim.findUnique({ where: { Id: id } });
    
    if (!claim) return res.status(404).json({ Message: 'Claim not found' });
    if (claim.ClaimantId !== req.user!.Id) return res.status(403).json({ Message: 'Forbidden' });
    if (claim.Status !== 'PENDING') return res.status(400).json({ Message: 'Only pending claims can be cancelled' });

    await prisma.claim.update({
      where: { Id: id },
      data: { Status: ClaimStatus.CANCELLED }
    });

    res.json({ Message: 'Claim cancelled' });
  } catch (error) {
    next(error);
  }
};

export const myReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.report.findMany({
      where: { ReporterId: req.user!.Id },
      include: { Category: true, Images: { take: 1 } },
      orderBy: { UpdatedAt: 'desc' }
    });

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

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const myClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { ClaimantId: req.user!.Id },
      include: { Report: true },
      orderBy: { UpdatedAt: 'desc' }
    });

    const data: ClaimSummary[] = claims.map(c => ({
      Id: c.Id,
      ReportId: c.ReportId,
      ReportTitle: c.Report.Title,
      ClaimantId: c.ClaimantId,
      ClaimantName: req.user!.Name,
      ProofAnswer: c.ProofAnswer,
      OwnershipDescription: c.OwnershipDescription,
      ContactPhone: c.ContactPhone,
      Status: c.Status as ClaimStatus,
      DecisionNote: c.DecisionNote,
      DecidedAt: c.DecidedAt?.toISOString() || null,
      CreatedAt: c.CreatedAt.toISOString(),
      UpdatedAt: c.UpdatedAt.toISOString(),
    }));

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const myDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.Id;

    const [reports, claims, reportsCount, activeClaimsCount, returnedCount] = await Promise.all([
      prisma.report.findMany({
        where: { ReporterId: userId },
        include: { Category: true, Images: { take: 1 } },
        orderBy: { UpdatedAt: 'desc' },
        take: 5
      }),
      prisma.claim.findMany({
        where: { ClaimantId: userId },
        include: { Report: true },
        orderBy: { UpdatedAt: 'desc' },
        take: 5
      }),
      prisma.report.count({ where: { ReporterId: userId } }),
      prisma.claim.count({ where: { ClaimantId: userId, Status: { in: ['PENDING', 'APPROVED'] } } }),
      prisma.report.count({ where: { ReporterId: userId, Status: 'RETURNED' } })
    ]);

    const MyReports = reports.map(r => ({
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
    }));

    const MyClaims = claims.map(c => ({
      Id: c.Id,
      ReportId: c.ReportId,
      ReportTitle: c.Report.Title,
      ClaimantId: c.ClaimantId,
      ClaimantName: req.user!.Name,
      ProofAnswer: c.ProofAnswer,
      OwnershipDescription: c.OwnershipDescription,
      ContactPhone: c.ContactPhone,
      Status: c.Status as ClaimStatus,
      DecisionNote: c.DecisionNote,
      DecidedAt: c.DecidedAt?.toISOString() || null,
      CreatedAt: c.CreatedAt.toISOString(),
      UpdatedAt: c.UpdatedAt.toISOString(),
    }));

    const response: StudentDashboardResponse = {
      MyReports,
      MyClaims,
      Summary: {
        MyReportsCount: reportsCount,
        ActiveClaimsCount: activeClaimsCount,
        ReturnedItemsCount: returnedCount
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
