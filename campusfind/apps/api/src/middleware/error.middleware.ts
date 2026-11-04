import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { env } from '../utils/env';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  // Safe logging
  logger.error(`Unhandled error at [${req.method}] ${req.originalUrl}: ${err.message || 'Unknown error'}`, err);

  // 1. Zod validation error
  if (err instanceof ZodError || err.name === 'ZodError') {
    return res.status(400).json({
      Message: 'Validasi input gagal',
      Errors: err.errors.map((e: any) => ({
        Field: e.path.join('.'),
        Message: e.message,
      })),
    });
  }

  // 2. Multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        Message: `Ukuran file melebihi batas maksimum (${env.MAX_FILE_SIZE_MB}MB)`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        Message: 'Jumlah file melebihi batas yang diizinkan',
      });
    }
    return res.status(400).json({ Message: `Kesalahan upload: ${err.message}` });
  }

  // 3. Custom file filter errors
  if (
    err.message?.includes('Ekstensi file') ||
    err.message?.includes('Tipe MIME') ||
    err.message?.includes('Invalid file type') ||
    err.message?.includes('Nama file tidak valid')
  ) {
    return res.status(400).json({ Message: err.message });
  }

  // 4. JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ Message: 'Token tidak valid' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ Message: 'Sesi telah kedaluwarsa, silakan login kembali' });
  }

  // 5. Prisma ORM errors (prevent database query/schema leakage)
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      return res.status(409).json({ Message: 'Data dengan nilai unik tersebut sudah terdaftar' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ Message: 'Data yang diminta tidak ditemukan' });
    }
    return res.status(400).json({ Message: 'Operasi database gagal diproses' });
  }

  // 6. Application domain errors (AppError and subclasses)
  if (err.statusCode && typeof err.statusCode === 'number') {
    return res.status(err.statusCode).json({ Message: err.message });
  }

  // 7. Generic Internal Server Error (Never leak stack trace or internal info)
  return res.status(500).json({ Message: 'Terjadi kesalahan internal pada server' });
};
