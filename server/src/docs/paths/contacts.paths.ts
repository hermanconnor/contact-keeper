import {
  contactIdSchema,
  createContactSchema,
  listContactsSchema,
  updateContactSchema,
} from '@/schemas/contact.schema.js';
import {
  ContactListResponse,
  ContactResponse,
  MessageResponse,
  bearerAuth,
  errorResponses,
  json,
  registry,
} from '../registry.js';

// A contact is only visible to its owner: someone else's contact is a 404, same as a missing one.
const OWNER_NOTE =
  'Only your own contacts are visible; anyone else\u2019s is a 404.';

registry.registerPath({
  method: 'post',
  path: '/contacts',
  tags: ['Contacts'],
  summary: 'Create a contact',
  security: bearerAuth,
  request: {
    body: {
      required: true,
      content: json(createContactSchema.shape.body, {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        phone: '555-0123',
        type: 'professional',
      }),
    },
  },
  responses: {
    201: { description: 'Contact created', content: json(ContactResponse) },
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: 'get',
  path: '/contacts',
  tags: ['Contacts'],
  summary: 'List contacts',
  description:
    'Paginated. `search` is a case-insensitive match on name, email and phone. Ties in the sort order are broken by id, so pages are stable.',
  security: bearerAuth,
  request: { query: listContactsSchema.shape.query },
  responses: {
    200: {
      description: 'A page of contacts',
      content: json(ContactListResponse),
    },
    ...errorResponses(400, 401),
  },
});

registry.registerPath({
  method: 'get',
  path: '/contacts/{id}',
  tags: ['Contacts'],
  summary: 'Get a contact',
  description: OWNER_NOTE,
  security: bearerAuth,
  request: { params: contactIdSchema.shape.params },
  responses: {
    200: { description: 'The contact', content: json(ContactResponse) },
    ...errorResponses(400, 401, 404),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/contacts/{id}',
  tags: ['Contacts'],
  summary: 'Update a contact',
  description: `Send any of the fields; omitted fields are left alone, and \`email\` / \`phone\` can be set to \`null\` to clear them. At least one field is required. ${OWNER_NOTE}`,
  security: bearerAuth,
  request: {
    params: updateContactSchema.shape.params,
    body: {
      required: true,
      content: json(updateContactSchema.shape.body, {
        phone: null,
        type: 'personal',
      }),
    },
  },
  responses: {
    200: { description: 'Updated contact', content: json(ContactResponse) },
    ...errorResponses(400, 401, 404),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/contacts/{id}',
  tags: ['Contacts'],
  summary: 'Delete a contact',
  description: OWNER_NOTE,
  security: bearerAuth,
  request: { params: contactIdSchema.shape.params },
  responses: {
    200: { description: 'Contact deleted', content: json(MessageResponse) },
    ...errorResponses(400, 401, 404),
  },
});
