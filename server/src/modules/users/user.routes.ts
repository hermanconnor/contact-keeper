import { Router } from 'express';
import {
  changeMyPassword,
  deleteMe,
  getMe,
  updateMe,
} from '@/modules/users/user.controller.js';
import { protect } from '@/middleware/auth.js';
import { validate } from '@/middleware/validate.js';
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from '@/schemas/user.schemas.js';

const router = Router();

// Self-service only: every route acts on the authenticated user (taken from the access
// token), so there is no :id parameter to tamper with.
router.use(protect);

router
  .route('/me')
  .get(getMe)
  .patch(validate(updateProfileSchema), updateMe)
  .delete(validate(deleteAccountSchema), deleteMe);

router.put('/me/password', validate(changePasswordSchema), changeMyPassword);

export default router;
