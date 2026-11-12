import { Router } from 'express';
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} from '@/modules/contacts/contact.controller.js';
import { protect } from '@/middleware/auth.js';
import { validate } from '@/middleware/validate.js';
import {
  contactIdSchema,
  createContactSchema,
  listContactsSchema,
  updateContactSchema,
} from '@/schemas/contact.schema.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(validate(listContactsSchema), listContacts)
  .post(validate(createContactSchema), createContact);

router
  .route('/:id')
  .get(validate(contactIdSchema), getContact)
  .patch(validate(updateContactSchema), updateContact)
  .delete(validate(contactIdSchema), deleteContact);

export default router;
