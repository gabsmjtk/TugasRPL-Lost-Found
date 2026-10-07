import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { AdminDashboardResponse, ReportSummary, ClaimSummary, ReportType, ReportStatus, ClaimStatus } from '@campusfind/shared';

export const dashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [pendingReportsCount, openReportsCount, pendingClaimsCount, returnedItemsCount, pendingReports, pendingClaims] = await Promise.all([
      prisma.report.count({ where: { Status: 'PENDING' } }),
      prisma.report.count({ where: { Status: 'OPEN' } }),
      prisma.claim.count({ where: { Status: 'PENDING' } }),
      prisma.report.count({ where: { Status: 'RETURNED' } }),
      prisma.report.findMany({ where: { Status: 'PENDING' }, include: { Category: true, Images: { take: 1 } }, take: 10, orderBy: { CreatedAt: 'asc' } }),
      prisma.claim.findMany({
        where: { Status: 'PENDING' },
        include: { Report: true, Claimant: true },
        take: 10,
        orderBy: { CreatedAt: 'asc' }
      }),
    ]);

    const resPendingReports: ReportSummary[] = pendingReports.map(r => ({
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

    const resPendingClaims: ClaimSummary[] = pendingClaims.map(c => ({
      Id: c.Id,
      ReportId: c.ReportId,
      ReportTitle: c.Report.Title,
      ClaimantId: c.ClaimantId,
      ClaimantName: c.Claimant?.Name || 'Mahasiswa',
      ProofAnswer: c.ProofAnswer,
      OwnershipDescription: c.OwnershipDescription,
      ContactPhone: c.ContactPhone,
      Status: c.Status as ClaimStatus,
      DecisionNote: c.DecisionNote,
      DecidedAt: c.DecidedAt?.toISOString() || null,
      CreatedAt: c.CreatedAt.toISOString(),
      UpdatedAt: c.UpdatedAt.toISOString(),
    }));

    const response: AdminDashboardResponse = {
      PendingReports: resPendingReports,
      PendingClaims: resPendingClaims,
      Summary: {
        PendingReportsCount: pendingReportsCount,
        OpenReportsCount: openReportsCount,
        PendingClaimsCount: pendingClaimsCount,
        ReturnedItemsCount: returnedItemsCount
      }
    };
    res.json(response);
  } catch (error) { next(error); }
};

export const listReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        Category: true,
        Reporter: {
          select: { Id: true, Name: true, Email: true, StudentNumber: true }
        },
        Images: true
      },
      orderBy: { CreatedAt: 'desc' }
    });
    res.json(reports);
  } catch (error) { next(error); }
};

export const verifyReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { Status, ModeratorNote } = z.object({
      Status: z.enum(['OPEN', 'REJECTED']),
      ModeratorNote: z.string().optional()
    }).parse(req.body);

    const report = await prisma.report.findUnique({ where: { Id: id } });
    if (!report || report.Status !== 'PENDING') return res.status(400).json({ Message: 'Invalid report' });

    await prisma.report.update({
      where: { Id: id },
      data: {
        Status,
        ModeratorNote,
        VerifiedAt: new Date(),
        VerifiedById: req.user!.Id
      }
    });

    await prisma.auditLog.create({
      data: {
        ActorId: req.user!.Id,
        EntityType: 'Report',
        EntityId: id,
        Action: 'VerifyReport',
        Details: JSON.stringify({ Status, ModeratorNote })
      }
    });

    res.json({ Message: 'Report verified' });
  } catch (error) { next(error); }
};

export const changeReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { Status, ModeratorNote } = z.object({
      Status: z.enum(['MATCHED', 'CLAIMED', 'RETURNED', 'REJECTED', 'ARCHIVED']),
      ModeratorNote: z.string().optional()
    }).parse(req.body);

    await prisma.report.update({
      where: { Id: id },
      data: { Status, ModeratorNote }
    });

    await prisma.auditLog.create({
      data: {
        ActorId: req.user!.Id,
        EntityType: 'Report',
        EntityId: id,
        Action: 'ChangeReportStatus',
        Details: JSON.stringify({ Status, ModeratorNote })
      }
    });

    res.json({ Message: 'Report status updated' });
  } catch (error) { next(error); }
};

export const listClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Status } = req.query;
    const where: any = {};
    if (Status && typeof Status === 'string') {
      where.Status = Status;
    }
    const claims = await prisma.claim.findMany({
      where,
      include: { Report: true, Claimant: true },
      orderBy: { CreatedAt: 'desc' }
    });
    res.json(claims);
  } catch (error) { next(error); }
};

export const decideClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { Status, DecisionNote } = z.object({
      Status: z.enum(['APPROVED', 'REJECTED']),
      DecisionNote: z.string()
    }).parse(req.body);

    const claim = await prisma.claim.findUnique({ where: { Id: id } });
    if (!claim || claim.Status !== 'PENDING') return res.status(400).json({ Message: 'Invalid claim' });

    await prisma.$transaction(async (tx) => {
      await tx.claim.update({
        where: { Id: id },
        data: {
          Status,
          DecisionNote,
          DecidedById: req.user!.Id,
          DecidedAt: new Date()
        }
      });

      if (Status === 'APPROVED') {
        await tx.report.update({
          where: { Id: claim.ReportId },
          data: { Status: 'CLAIMED' }
        });
      }

      await tx.auditLog.create({
        data: {
          ActorId: req.user!.Id,
          EntityType: 'Claim',
          EntityId: id,
          Action: 'DecideClaim',
          Details: JSON.stringify({ Status, DecisionNote })
        }
      });
    });

    res.json({ Message: 'Claim decided' });
  } catch (error) { next(error); }
};

export const recordHandover = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = z.object({
      ReportId: z.string(),
      ClaimId: z.string(),
      RecipientName: z.string(),
      HandoverLocation: z.string(),
      Note: z.string().optional()
    }).parse(req.body);

    const claim = await prisma.claim.findUnique({ where: { Id: data.ClaimId } });
    if (!claim || claim.Status !== 'APPROVED') return res.status(400).json({ Message: 'Claim must be approved to record handover' });

    await prisma.$transaction(async (tx) => {
      await tx.handover.create({
        data: {
          ReportId: data.ReportId,
          ClaimId: data.ClaimId,
          AdminId: req.user!.Id,
          RecipientName: data.RecipientName,
          HandoverLocation: data.HandoverLocation,
          HandedOverAt: new Date(),
          Note: data.Note
        }
      });

      await tx.report.update({ where: { Id: data.ReportId }, data: { Status: 'RETURNED' } });
      await tx.claim.update({ where: { Id: data.ClaimId }, data: { Status: 'COMPLETED' } });

      await tx.auditLog.create({
        data: {
          ActorId: req.user!.Id,
          EntityType: 'Handover',
          EntityId: data.ClaimId, // Or a new UUID for handover
          Action: 'RecordHandover',
          Details: JSON.stringify(data)
        }
      });
    });

    res.json({ Message: 'Handover recorded' });
  } catch (error) { next(error); }
};

export const listCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) { next(error); }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Name, Description } = z.object({ Name: z.string(), Description: z.string().optional() }).parse(req.body);
    const category = await prisma.category.create({ data: { Name, Description } });
    res.json(category);
  } catch (error) { next(error); }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { Name, Description } = z.object({ Name: z.string().optional(), Description: z.string().optional() }).parse(req.body);
    const category = await prisma.category.update({ where: { Id: id }, data: { Name, Description } });
    res.json(category);
  } catch (error) { next(error); }
};

export const activateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { IsActive } = z.object({ IsActive: z.boolean() }).parse(req.body);
    const category = await prisma.category.update({ where: { Id: id }, data: { IsActive } });
    res.json(category);
  } catch (error) { next(error); }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { Id: true, Name: true, Email: true, StudentNumber: true, Role: true, IsActive: true, CreatedAt: true }
    });
    res.json(users);
  } catch (error) { next(error); }
};

export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { IsActive } = z.object({ IsActive: z.boolean() }).parse(req.body);
    
    await prisma.user.update({ where: { Id: id }, data: { IsActive } });
    
    await prisma.auditLog.create({
      data: {
        ActorId: req.user!.Id,
        EntityType: 'User',
        EntityId: id,
        Action: 'ChangeUserActivation',
        Details: JSON.stringify({ IsActive })
      }
    });

    res.json({ Message: 'User activation status updated' });
  } catch (error) { next(error); }
};
