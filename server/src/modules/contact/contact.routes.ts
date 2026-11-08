import { Router } from 'express';
import {
  addContact,
  getContacts,
  updateContact,
  deleteContact,
} from '@/modules/contact/contact.controller.js';

const router = Router();

router.get('/', getContacts);
router.post('/', addContact);
router.put('/:id', updateContact);
router.put('/:id', deleteContact);

export default router;
