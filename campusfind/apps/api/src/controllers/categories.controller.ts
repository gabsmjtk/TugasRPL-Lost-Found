import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { IsActive: true },
      orderBy: { Name: 'asc' },
    });
    res.json(categories.map(c => ({
      ...c,
      CreatedAt: c.CreatedAt.toISOString(),
      UpdatedAt: c.UpdatedAt.toISOString(),
    })));
  } catch (err) {
    next(err);
  }
};
