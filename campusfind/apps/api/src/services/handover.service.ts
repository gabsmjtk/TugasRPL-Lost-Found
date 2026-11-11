import { prisma } from '../utils/prisma';
import { ClaimStatus, ReportStatus } from '@campusfind/shared';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface DecideClaimDTO {
  Status: 'APPROVED' | 'REJECTED';
  DecisionNote: string;
}

export interface RecordHandoverDTO {
  ReportId: string;
  ClaimId: string;
  RecipientName: string;
  HandoverLocation: string;
  Note?: string;
}

export class HandoverService {
  // US-04 AC 1: Proses klaim barang & perubahan status laporan menjadi CLAIMED
  async decideClaim(adminId: string, claimId: string, data: DecideClaimDTO) {
    if (!['APPROVED', 'REJECTED'].includes(data.Status)) {
      throw new BadRequestError('Status keputusan tidak valid');
    }
    if (!data.DecisionNote || !data.DecisionNote.trim()) {
      throw new BadRequestError('Catatan keputusan diperlukan');
    }

    const claim = await prisma.claim.findUnique({
      where: { Id: claimId },
      include: { Report: true },
    });

    if (!claim) {
      throw new NotFoundError('Klaim tidak ditemukan');
    }

    if (claim.Status !== ClaimStatus.PENDING) {
      throw new BadRequestError('Hanya klaim pending yang dapat diputuskan');
    }

    const updatedClaim = await prisma.claim.update({
      where: { Id: claimId },
      data: {
        Status: data.Status as ClaimStatus,
        DecisionNote: data.DecisionNote,
        DecidedById: adminId,
        DecidedAt: new Date(),
      },
      include: { Report: true, Claimant: true },
    });

    // US-04 AC 1: Status barang berubah menjadi CLAIMED saat klaim berhasil disetujui
    if (data.Status === 'APPROVED') {
      await prisma.report.update({
        where: { Id: claim.ReportId },
        data: { Status: ReportStatus.CLAIMED },
      });
    }

    return updatedClaim;
  }

  // US-04 AC 2: Proses handover barang (Hanya laporan dengan status valid yang dapat diproses handover-nya)
  async recordHandover(adminId: string, data: RecordHandoverDTO) {
    if (!data.ReportId || !data.ClaimId || !data.RecipientName || !data.HandoverLocation) {
      throw new BadRequestError('Data handover tidak lengkap');
    }

    const claim = await prisma.claim.findUnique({
      where: { Id: data.ClaimId },
    });

    if (!claim) {
      throw new NotFoundError('Klaim tidak ditemukan');
    }

    if (claim.Status !== ClaimStatus.APPROVED) {
      throw new BadRequestError('Klaim harus disetujui terlebih dahulu');
    }

    const report = await prisma.report.findUnique({
      where: { Id: data.ReportId },
    });

    if (!report) {
      throw new NotFoundError('Laporan tidak ditemukan');
    }

    // US-04 AC 2: Validasi status laporan. Hanya status valid (misal: CLAIMED, OPEN, MATCHED) yang dapat diproses.
    const validReportStatuses: ReportStatus[] = [
      ReportStatus.CLAIMED,
      ReportStatus.OPEN,
      ReportStatus.MATCHED,
    ];

    if (!validReportStatuses.includes(report.Status as ReportStatus)) {
      throw new BadRequestError('Status laporan tidak valid untuk diproses handover');
    }

    const handover = await prisma.handover.create({
      data: {
        ReportId: data.ReportId,
        ClaimId: data.ClaimId,
        AdminId: adminId,
        RecipientName: data.RecipientName,
        HandoverLocation: data.HandoverLocation,
        HandedOverAt: new Date(),
        Note: data.Note ?? null,
      },
    });

    // Update status report menjadi RETURNED dan claim menjadi COMPLETED
    await prisma.report.update({
      where: { Id: data.ReportId },
      data: { Status: ReportStatus.RETURNED },
    });

    await prisma.claim.update({
      where: { Id: data.ClaimId },
      data: { Status: ClaimStatus.COMPLETED },
    });

    return handover;
  }
}

export const handoverService = new HandoverService();
