import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  refresh,
  registerUser,
} from '@/modules/auth/auth.controller.js';
import { validate } from '@/middleware/validate.js';
import { loginSchema, registerSchema } from '@/schemas/auth.schemas.js';
import { loginLimiter, registerLimiter } from '@/middleware/rateLimit.js';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  registerUser,
);
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.post('/refresh', refresh);
router.post('/logout', logoutUser);

export default router;
