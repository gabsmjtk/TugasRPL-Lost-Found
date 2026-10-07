import { Router } from 'express';
import { getPublicReports, getReportById, getPublicStats } from '../controllers/reports.controller';
import { createReport, updateReport, deleteReport, markFound, submitClaim } from '../controllers/me.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/stats', getPublicStats);
router.get('/', getPublicReports);
router.get('/:id', getReportById);

// Student report and claim operations according to requirement-web.md
router.post('/', authenticate, upload.array('images', 3), createReport);
router.put('/:id', authenticate, updateReport);
router.delete('/:id', authenticate, deleteReport);
router.post('/:id/mark-found', authenticate, markFound);
router.post('/:id/claims', authenticate, submitClaim);

export default router;
