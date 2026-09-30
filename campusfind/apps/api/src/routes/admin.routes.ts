import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { 
  dashboard, listReports, verifyReport, changeReportStatus, 
  listClaims, decideClaim, recordHandover, 
  listCategories, createCategory, updateCategory, activateCategory,
  listUsers, activateUser 
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', dashboard);

router.get('/reports', listReports);
router.patch('/reports/:id/verify', verifyReport);
router.patch('/reports/:id/status', changeReportStatus);

router.get('/claims', listClaims);
router.patch('/claims/:id/decision', decideClaim);

router.post('/handovers', recordHandover);

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.patch('/categories/:id/active', activateCategory);

router.get('/users', listUsers);
router.patch('/users/:id/active', activateUser);

export default router;
