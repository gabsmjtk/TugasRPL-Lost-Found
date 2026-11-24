import { prisma } from '../utils/prisma';
import { ReportStatus, Role } from '@campusfind/shared';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

export class AdminService {
  // US-05 AC 2: Pengguna non-admin akan menerima error 403 Forbidden jika mencoba melakukan akses ini
  private validateAdmin(userRole?: string) {
    if (userRole !== Role.ADMIN && userRole !== 'ADMIN') {
      throw new ForbiddenError('Akses ditolak: Hanya admin yang diizinkan');
    }
  }

  // US-05 AC 1 & AC 2: Admin dapat mengubah status laporan
  async changeReportStatus(
    userRole: string | undefined,
    adminId: string,
    reportId: string,
    newStatus: ReportStatus,
    moderatorNote?: string
  ) {
    this.validateAdmin(userRole);

    const validStatuses = Object.values(ReportStatus);
    if (!validStatuses.includes(newStatus)) {
      throw new BadRequestError('Status laporan tidak valid');
    }

    const report = await prisma.report.findUnique({
      where: { Id: reportId },
    });

    if (!report) {
      throw new NotFoundError('Laporan tidak ditemukan');
    }

    const updated = await prisma.report.update({
      where: { Id: reportId },
      data: {
        Status: newStatus,
        ModeratorNote: moderatorNote !== undefined ? moderatorNote : report.ModeratorNote,
      },
      include: {
        Category: true,
        Images: true,
        Reporter: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        ActorId: adminId,
        EntityType: 'Report',
        EntityId: reportId,
        Action: 'CHANGE_STATUS',
        Details: JSON.stringify({ Status: newStatus, ModeratorNote: moderatorNote }),
      },
    }).catch(() => null);

    return updated;
  }

  // US-05 AC 1 & AC 2: Admin dapat menghapus laporan
  async deleteReport(
    userRole: string | undefined,
    adminId: string,
    reportId: string
  ) {
    this.validateAdmin(userRole);

    const report = await prisma.report.findUnique({
      where: { Id: reportId },
    });

    if (!report) {
      throw new NotFoundError('Laporan tidak ditemukan');
    }

    const existingClaim = await prisma.claim.findFirst({ where: { ReportId: reportId } });
    if (existingClaim) {
      throw new BadRequestError('Laporan tidak dapat dihapus karena sudah memiliki klaim terkait');
    }

    const existingHandover = await prisma.handover.findFirst({ where: { ReportId: reportId } });
    if (existingHandover) {
      throw new BadRequestError('Laporan tidak dapat dihapus karena memiliki riwayat serah terima');
    }

    await prisma.$transaction([
      prisma.reportImage.deleteMany({
        where: { ReportId: reportId },
      }),
      prisma.report.delete({
        where: { Id: reportId },
      }),
      prisma.auditLog.create({
        data: {
          ActorId: adminId,
          EntityType: 'Report',
          EntityId: reportId,
          Action: 'DELETE_REPORT',
          Details: JSON.stringify({ ReportId: reportId, Title: report.Title }),
        },
      }),
    ]);

    return { Message: 'Laporan berhasil dihapus oleh admin' };
  }
}

export const adminService = new AdminService();
