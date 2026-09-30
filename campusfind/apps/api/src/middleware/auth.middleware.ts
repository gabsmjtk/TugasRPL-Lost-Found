import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserSummary } from '@campusfind/shared';

declare global {
  namespace Express {
    interface Request {
      user?: UserSummary;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ Message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ Message: 'Invalid token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.Role !== 'ADMIN') {
    return res.status(403).json({ Message: 'Forbidden: Admins only' });
  }
  next();
};
