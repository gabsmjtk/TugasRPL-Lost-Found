import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { ReportStatus, ClaimStatus } from '@campusfind/shared';

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
    ReporterName: r.Reporter?.Name ?? '',
    ReporterEmail: r.Reporter?.Email ?? '',
    ImageUrl: r.Images?.[0] ? `/uploads/${r.Images[0].FileName}` : undefined,
    ModeratorNote: r.ModeratorNote ?? null,
    VerifiedAt: r.VerifiedAt?.toISOString() ?? null,
    Brand: r.Brand ?? null,
    Color: r.Color ?? null,
    Description: r.Description,
  };
}

function toClaimSummary(c: any) {
  return {
    Id: c.Id,
    ReportId: c.ReportId,
    ReportTitle: c.Report?.Title ?? '',
    ClaimantId: c.ClaimantId,
    ClaimantName: c.Claimant?.Name ?? '',
    ClaimantEmail: c.Claimant?.Email ?? '',
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

async function logAudit(actorId: string, entityType: string, entityId: string, action: string, details?: object) {
  await prisma.auditLog.create({
    data: { ActorId: actorId, EntityType: entityType, EntityId: entityId, Action: action, Details: details ? JSON.stringify(details) : null },
  });
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export const dashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [pendingReports, openReports, pendingClaims, returnedItems, pendingReportList, pendingClaimList] =
      await Promise.all([
        prisma.report.count({ where: { Status: ReportStatus.PENDING } }),
        prisma.report.count({ where: { Status: ReportStatus.OPEN } }),
        prisma.claim.count({ where: { Status: ClaimStatus.PENDING } }),
        prisma.report.count({ where: { Status: ReportStatus.RETURNED } }),
        prisma.report.findMany({
          where: { Status: ReportStatus.PENDING },
          include: { Category: true, Images: { take: 1 }, Reporter: true },
          orderBy: { CreatedAt: 'desc' },
          take: 10,
        }),
        prisma.claim.findMany({
          where: { Status: ClaimStatus.PENDING },
          include: { Report: true, Claimant: true },
          orderBy: { CreatedAt: 'desc' },
          take: 10,
        }),
      ]);

    res.json({
      PendingReports: pendingReportList.map(toReportSummary),
      PendingClaims: pendingClaimList.map(toClaimSummary),
      Summary: {
        PendingReportsCount: pendingReports,
        OpenReportsCount: openReports,
        PendingClaimsCount: pendingClaims,
        ReturnedItemsCount: returnedItems,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Reports ────────────────────────────────────────────────────────────────────

export const listReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Search, Status, Type, Page = '1', PageSize = '20' } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(Page));
    const pageSize = Math.min(50, Math.max(1, parseInt(PageSize)));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (Status) where.Status = Status;
    if (Type) where.Type = Type;
    if (Search) {
      where.OR = [
        { Title: { contains: Search } },
        { Location: { contains: Search } },
        { Reporter: { Name: { contains: Search } } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: { Category: true, Images: { take: 1 }, Reporter: true },
        orderBy: { CreatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    res.json({ Data: reports.map(toReportSummary), Total: total, Page: page, PageSize: pageSize, TotalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    next(err);
  }
};

export const verifyReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { Status, ModeratorNote } = req.body as { Status: 'OPEN' | 'REJECTED'; ModeratorNote?: string };

    if (!['OPEN', 'REJECTED'].includes(Status))
      return res.status(400).json({ Message: 'Status tidak valid' });

    const report = await prisma.report.findUnique({ where: { Id: id } });
    if (!report) return res.status(404).json({ Message: 'Laporan tidak ditemukan' });
    if (report.Status !== ReportStatus.PENDING)
      return res.status(400).json({ Message: 'Hanya laporan pending yang dapat diverifikasi' });

    const updated = await prisma.report.update({
      where: { Id: id },
      data: {
        Status: Status as ReportStatus,
        VerifiedAt: new Date(),
        VerifiedById: admin.Id,
        ModeratorNote: ModeratorNote ?? null,
      },
      include: { Category: true, Images: { take: 1 }, Reporter: true },
    });

    await logAudit(admin.Id, 'Report', id, 'VERIFY', { Status, ModeratorNote });
    res.json(toReportSummary(updated));
  } catch (err) {
    next(err);
  }
};

export const changeReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { Status, ModeratorNote } = req.body as { Status: string; ModeratorNote?: string };

    const validStatuses = ['MATCHED', 'CLAIMED', 'RETURNED', 'REJECTED', 'ARCHIVED'];
    if (!validStatuses.includes(Status))
      return res.status(400).json({ Message: 'Status tidak valid' });

    const report = await prisma.report.findUnique({ where: { Id: id } });
    if (!report) return res.status(404).json({ Message: 'Laporan tidak ditemukan' });

    const updated = await prisma.report.update({
      where: { Id: id },
      data: { Status: Status as ReportStatus, ModeratorNote: ModeratorNote ?? report.ModeratorNote },
      include: { Category: true, Images: { take: 1 }, Reporter: true },
    });

    await logAudit(admin.Id, 'Report', id, 'CHANGE_STATUS', { Status, ModeratorNote });
    res.json(toReportSummary(updated));
  } catch (err) {
    next(err);
  }
};

// ── Claims ─────────────────────────────────────────────────────────────────────

export const listClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Status, Page = '1', PageSize = '20' } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(Page));
    const pageSize = Math.min(50, Math.max(1, parseInt(PageSize)));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (Status) where.Status = Status;

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: { Report: true, Claimant: true },
        orderBy: { CreatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.claim.count({ where }),
    ]);

    res.json({ Data: claims.map(toClaimSummary), Total: total, Page: page, PageSize: pageSize, TotalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    next(err);
  }
};

export const decideClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { Status, DecisionNote } = req.body as { Status: 'APPROVED' | 'REJECTED'; DecisionNote: string };

    if (!['APPROVED', 'REJECTED'].includes(Status))
      return res.status(400).json({ Message: 'Status tidak valid' });
    if (!DecisionNote) return res.status(400).json({ Message: 'Catatan keputusan diperlukan' });

    const claim = await prisma.claim.findUnique({ where: { Id: id } });
    if (!claim) return res.status(404).json({ Message: 'Klaim tidak ditemukan' });
    if (claim.Status !== ClaimStatus.PENDING)
      return res.status(400).json({ Message: 'Hanya klaim pending yang dapat diputuskan' });

    const [updated] = await prisma.$transaction(async (tx) => {
      const updatedClaim = await tx.claim.update({
        where: { Id: id },
        data: {
          Status: Status as ClaimStatus,
          DecisionNote,
          DecidedById: admin.Id,
          DecidedAt: new Date(),
        },
        include: { Report: true, Claimant: true },
      });

      if (Status === 'APPROVED') {
        await tx.report.update({
          where: { Id: claim.ReportId },
          data: { Status: ReportStatus.CLAIMED },
        });
      }

      return [updatedClaim];
    });

    await logAudit(admin.Id, 'Claim', id, 'DECIDE', { Status, DecisionNote });
    res.json(toClaimSummary(updated));
  } catch (err) {
    next(err);
  }
};

// ── Handover ───────────────────────────────────────────────────────────────────

export const recordHandover = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.user!;
    const { ReportId, ClaimId, RecipientName, HandoverLocation, Note } = req.body;

    if (!ReportId || !ClaimId || !RecipientName || !HandoverLocation)
      return res.status(400).json({ Message: 'Data handover tidak lengkap' });

    const claim = await prisma.claim.findUnique({ where: { Id: ClaimId } });
    if (!claim || claim.Status !== ClaimStatus.APPROVED)
      return res.status(400).json({ Message: 'Klaim harus disetujui terlebih dahulu' });

    const handover = await prisma.$transaction(async (tx) => {
      const h = await tx.handover.create({
        data: {
          ReportId,
          ClaimId,
          AdminId: admin.Id,
          RecipientName,
          HandoverLocation,
          HandedOverAt: new Date(),
          Note: Note ?? null,
        },
      });

      await tx.report.update({ where: { Id: ReportId }, data: { Status: ReportStatus.RETURNED } });
      await tx.claim.update({ where: { Id: ClaimId }, data: { Status: ClaimStatus.COMPLETED } });

      return h;
    });

    await logAudit(admin.Id, 'Handover', handover.Id, 'RECORD', { ReportId, ClaimId });

    res.status(201).json({
      Id: handover.Id,
      ReportId: handover.ReportId,
      ClaimId: handover.ClaimId,
      AdminId: handover.AdminId,
      RecipientName: handover.RecipientName,
      HandoverLocation: handover.HandoverLocation,
      HandedOverAt: handover.HandedOverAt.toISOString(),
      Note: handover.Note,
      CorrectionNote: handover.CorrectionNote,
      CreatedAt: handover.CreatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

// ── Categories ─────────────────────────────────────────────────────────────────

export const listCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await prisma.category.findMany({ orderBy: { Name: 'asc' } });
    res.json(cats.map(c => ({ ...c, CreatedAt: c.CreatedAt.toISOString(), UpdatedAt: c.UpdatedAt.toISOString() })));
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Name, Description } = req.body;
    if (!Name) return res.status(400).json({ Message: 'Nama kategori diperlukan' });

    const existing = await prisma.category.findUnique({ where: { Name } });
    if (existing) return res.status(400).json({ Message: 'Nama kategori sudah ada' });

    const cat = await prisma.category.create({ data: { Name, Description: Description ?? null } });
    res.status(201).json({ ...cat, CreatedAt: cat.CreatedAt.toISOString(), UpdatedAt: cat.UpdatedAt.toISOString() });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { Name, Description } = req.body;

    const cat = await prisma.category.update({
      where: { Id: id },
      data: { Name, Description: Description ?? null },
    });
    res.json({ ...cat, CreatedAt: cat.CreatedAt.toISOString(), UpdatedAt: cat.UpdatedAt.toISOString() });
  } catch (err) {
    next(err);
  }
};

export const activateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { IsActive } = req.body;

    const cat = await prisma.category.update({ where: { Id: id }, data: { IsActive: Boolean(IsActive) } });
    res.json({ ...cat, CreatedAt: cat.CreatedAt.toISOString(), UpdatedAt: cat.UpdatedAt.toISOString() });
  } catch (err) {
    next(err);
  }
};

// ── Users ──────────────────────────────────────────────────────────────────────

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Search, Role, Page = '1', PageSize = '20' } = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(Page));
    const pageSize = Math.min(50, Math.max(1, parseInt(PageSize)));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (Role) where.Role = Role;
    if (Search) {
      where.OR = [
        { Name: { contains: Search } },
        { Email: { contains: Search } },
        { StudentNumber: { contains: Search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { Id: true, Name: true, Email: true, StudentNumber: true, Role: true, IsActive: true, CreatedAt: true, UpdatedAt: true },
        orderBy: { CreatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      Data: users.map(u => ({ ...u, CreatedAt: u.CreatedAt.toISOString(), UpdatedAt: u.UpdatedAt.toISOString() })),
      Total: total, Page: page, PageSize: pageSize, TotalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
};

export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { IsActive } = req.body;

    const user = await prisma.user.update({
      where: { Id: id },
      data: { IsActive: Boolean(IsActive) },
      select: { Id: true, Name: true, Email: true, StudentNumber: true, Role: true, IsActive: true, CreatedAt: true, UpdatedAt: true },
    });

    await logAudit(admin.Id, 'User', id, 'CHANGE_ACTIVE', { IsActive });

    res.json({ ...user, CreatedAt: user.CreatedAt.toISOString(), UpdatedAt: user.UpdatedAt.toISOString() });
  } catch (err) {
    next(err);
  }
};
