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

    await prisma.reportImage.deleteMany({
      where: { ReportId: reportId },
    });

    await prisma.report.delete({
      where: { Id: reportId },
    });

    await prisma.auditLog.create({
      data: {
        ActorId: adminId,
        EntityType: 'Report',
        EntityId: reportId,
        Action: 'DELETE_REPORT',
        Details: JSON.stringify({ ReportId: reportId, Title: report.Title }),
      },
    }).catch(() => null);

    return { Message: 'Laporan berhasil dihapus oleh admin' };
  }
}

export const adminService = new AdminService();
