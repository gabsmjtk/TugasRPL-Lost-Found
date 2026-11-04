import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './utils/env';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';

import authRoutes from './routes/auth.routes';
import reportsRoutes from './routes/reports.routes';
import meRoutes from './routes/me.routes';
import adminRoutes from './routes/admin.routes';
import categoriesRoutes from './routes/categories.routes';

const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Parse allowed CORS origins safely
const allowedOrigins = env.CLIENT_URL.split(',').map((url) => url.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, server-to-server, unit tests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS error: Asal permintaan '${origin}' tidak diizinkan`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static uploads directory with safe headers
const uploadPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
app.use(
  '/uploads',
  express.static(uploadPath, {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

app.get('/api/health', (_req, res) => res.json({ Status: 'ok', Timestamp: new Date().toISOString() }));

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/me', meRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);

app.use(errorHandler);

export default app;
