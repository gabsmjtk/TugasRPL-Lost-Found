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

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (seperti curl, mobile app, postman, atau internal serverless invoke)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    // Jika origin berupa subdomain vercel.app milik deployment sendiri
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // fallback permissive untuk kenyamanan preview / production deployment
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
