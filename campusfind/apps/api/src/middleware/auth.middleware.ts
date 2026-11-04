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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ Message: 'Akses ditolak: Token otentikasi tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token) as UserSummary;
    if (decoded && decoded.IsActive === false) {
      return res.status(401).json({ Message: 'Akun Anda telah dinonaktifkan' });
    }
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ Message: 'Sesi telah kedaluwarsa, silakan login kembali' });
    }
    return res.status(401).json({ Message: 'Token tidak valid' });
  }
};

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token) as UserSummary;
      if (decoded && decoded.IsActive !== false) {
        req.user = decoded;
      }
    } catch {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.Role !== 'ADMIN') {
    return res.status(403).json({ Message: 'Akses ditolak: Hanya administrator yang diizinkan' });
  }
  next();
};
