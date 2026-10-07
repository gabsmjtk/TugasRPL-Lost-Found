import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import reportsRoutes from './routes/reports.routes';
import categoriesRoutes from './routes/categories.routes';
import meRoutes from './routes/me.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/me', meRoutes);
app.use('/api/admin', adminRoutes);

// Claim direct route for /api/claims/:id/cancel
app.post('/api/claims/:id/cancel', (req, res, next) => {
  req.url = `/claims/${req.params.id}/cancel`;
  meRoutes(req, res, next);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

export default app;
