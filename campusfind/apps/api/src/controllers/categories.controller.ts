import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export const getActiveCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { IsActive: true },
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};
