import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { env } from '../utils/env';

const isTest = env.NODE_ENV === 'test';

const noopMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Rate limiter for sensitive authentication endpoints (Login, Register).
 * Limit: 10 attempts per 15 minutes per IP.
 */
export const authLimiter = isTest
  ? noopMiddleware
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        Message: 'Terlalu banyak permintaan autentikasi. Silakan coba lagi setelah 15 menit.',
      },
    });

/**
 * General API rate limiter.
 * Limit: 300 requests per 15 minutes per IP.
 */
export const apiLimiter = isTest
  ? noopMiddleware
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        Message: 'Terlalu banyak permintaan ke API. Silakan coba lagi beberapa saat lagi.',
      },
    });
