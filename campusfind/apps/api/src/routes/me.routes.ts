import { Router } from 'express';
import { 
  createReport, 
  updateReport, 
  deleteReport, 
  markFound, 
  submitClaim, 
  cancelClaim, 
  myReports, 
  myClaims, 
  myDashboard 
} from '../controllers/me.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/reports', upload.array('images', 3), createReport);
router.put('/reports/:id', updateReport);
router.delete('/reports/:id', deleteReport);
router.post('/reports/:id/mark-found', markFound);

router.post('/reports/:id/claims', submitClaim);
router.post('/claims/:id/cancel', cancelClaim);

router.get('/reports', myReports);
router.get('/claims', myClaims);
router.get('/dashboard', myDashboard);

export default router;
