import { prisma } from '../utils/prisma';
import { ReportType, ReportStatus } from '@campusfind/shared';
import { BadRequestError, NotFoundError } from '../utils/errors';

export interface CreateReportDTO {
  Title: string;
  Description: string;
  Location: string;
  Type: ReportType;
  CategoryId: string;
  Brand?: string;
  Color?: string;
  EventAt: string | Date;
  Images?: Array<{
    FileName: string;
    FilePath: string;
    MimeType: string;
    SortOrder?: number;
  }>;
}

export class ReportService {
  async createReport(reporterId: string, data: CreateReportDTO) {
    if (!reporterId) {
      throw new BadRequestError('Reporter ID is required');
    }

    // US-02 AC 1: Data mandatory (judul, deskripsi, lokasi) harus terisi
    if (!data.Title || !data.Title.trim()) {
      throw new BadRequestError('Judul laporan harus diisi');
    }
    if (!data.Description || !data.Description.trim()) {
      throw new BadRequestError('Deskripsi laporan harus diisi');
    }
    if (!data.Location || !data.Location.trim()) {
      throw new BadRequestError('Lokasi kejadian harus diisi');
    }
    if (!data.CategoryId) {
      throw new BadRequestError('Kategori harus diisi');
    }
    if (!data.Type || !Object.values(ReportType).includes(data.Type)) {
      throw new BadRequestError('Tipe laporan tidak valid');
    }

    const category = await prisma.category.findFirst({
      where: { Id: data.CategoryId, IsActive: true },
    });
    if (!category) {
      throw new NotFoundError('Kategori tidak ditemukan atau tidak aktif');
    }

    // US-02 AC 2: Status default laporan otomatis diset menjadi PENDING
    const report = await prisma.report.create({
      data: {
        ReporterId: reporterId,
        CategoryId: data.CategoryId,
        Type: data.Type,
        Title: data.Title.trim(),
        Description: data.Description.trim(),
        Location: data.Location.trim(),
        Brand: data.Brand?.trim() || null,
        Color: data.Color?.trim() || null,
        EventAt: new Date(data.EventAt || Date.now()),
        Status: ReportStatus.PENDING, // Default status
        Images: data.Images && data.Images.length > 0 ? {
          create: data.Images.map((f, i) => ({
            FileName: f.FileName,
            FilePath: f.FilePath,
            MimeType: f.MimeType,
            SortOrder: f.SortOrder ?? i,
          })),
        } : undefined,
      },
      include: {
        Category: true,
        Images: true,
        Reporter: true,
      },
    });

    return report;
  }

  async getReportById(id: string) {
    const report = await prisma.report.findFirst({
      where: { Id: id },
      include: {
        Category: true,
        Images: { orderBy: { SortOrder: 'asc' } },
        Reporter: true,
      },
    });

    if (!report) {
      throw new NotFoundError('Laporan tidak ditemukan');
    }

    return report;
  }
}

export const reportService = new ReportService();
