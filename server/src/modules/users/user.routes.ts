import { Router } from 'express';
import {
  deleteUser,
  getMe,
  updateUser,
} from '@/modules/users/user.controller.js';

const router = Router();

router.get('/', getMe);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
