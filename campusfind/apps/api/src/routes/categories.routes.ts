import { Router } from 'express';
import { getActiveCategories } from '../controllers/categories.controller';

const router = Router();

router.get('/', getActiveCategories);

export default router;
