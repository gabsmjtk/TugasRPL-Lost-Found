import { prisma } from '../utils/prisma';
import { ReportStatus, ReportType } from '@campusfind/shared';

export interface SearchFilterParams {
  keyword?: string;
  categoryId?: string;
  status?: ReportStatus | string;
  type?: ReportType | string;
  location?: string;
  page?: number;
  pageSize?: number;
  sort?: 'newest' | 'oldest';
}

export class SearchService {
  async searchReports(params: SearchFilterParams = {}) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // US-03 AC 2: Filter barang berdasarkan status
    if (params.status) {
      where.Status = params.status;
    }

    // US-03 AC 2: Filter barang berdasarkan category
    if (params.categoryId) {
      where.CategoryId = params.categoryId;
    }

    if (params.type) {
      where.Type = params.type;
    }

    if (params.location) {
      where.Location = { contains: params.location };
    }

    // US-03 AC 1: Pencarian berdasarkan keyword pada judul atau deskripsi
    if (params.keyword && params.keyword.trim()) {
      const keyword = params.keyword.trim();
      where.OR = [
        { Title: { contains: keyword } },
        { Description: { contains: keyword } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          Category: true,
          Images: { take: 1, orderBy: { SortOrder: 'asc' } },
          Reporter: true,
        },
        orderBy: {
          CreatedAt: params.sort === 'oldest' ? 'asc' : 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      Data: items,
      Total: total,
      Page: page,
      PageSize: pageSize,
      TotalPages: Math.ceil(total / pageSize) || 1,
    };
  }
}

export const searchService = new SearchService();
