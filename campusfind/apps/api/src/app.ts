import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import reportsRoutes from './routes/reports.routes';
import meRoutes from './routes/me.routes';
import adminRoutes from './routes/admin.routes';
import categoriesRoutes from './routes/categories.routes';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

export const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean) as string[];

export const isOriginAllowed = (origin: string | undefined): boolean => {
  // Izinkan request tanpa origin (seperti curl, mobile app, postman, serverless invoke)
  if (!origin) return true;
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin tidak diizinkan oleh CORS'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve folder upload lokal atau /tmp di Vercel
const uploadStaticDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadStaticDir));

app.get('/api/health', (_req, res) => res.json({ Status: 'ok', timestamp: new Date().toISOString() }));
app.get('/health', (_req, res) => res.json({ Status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/me', meRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);

app.use(errorHandler);

export default app;
