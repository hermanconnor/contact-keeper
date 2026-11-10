import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  refresh,
  registerUser,
} from '@/modules/auth/auth.controller.js';
import { validate } from '@/middleware/validate.js';
import { loginSchema, registerSchema } from '@/schemas/auth.schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/refresh', refresh);
router.post('/logout', logoutUser);

export default router;
