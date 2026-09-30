import { Router } from 'express';
import { getPublicReports, getReportById } from '../controllers/reports.controller';

const router = Router();

router.get('/', getPublicReports);
router.get('/:id', getReportById);

export default router;
