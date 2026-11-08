import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from '@/modules/auth/auth.controller.js';
import { validate } from '@/middleware/validate.js';
import { loginSchema, registerSchema } from '@/schemas/auth.schema.js';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

export default router;
