import { Router } from 'express';
import { getHealth } from '@/modules/health/health.controller.js';

const router = Router();

router.get('/', getHealth);

export default router;
