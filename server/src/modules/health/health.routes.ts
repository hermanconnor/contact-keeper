import { Router } from 'express';
import { getHealth, getReadiness } from '@/modules/health/health.controller.js';

const router = Router();

router.get('/', getHealth);
router.get('/ready', getReadiness);

export default router;
