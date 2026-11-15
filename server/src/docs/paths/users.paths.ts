import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from '@/schemas/user.schemas.js';
import {
  AccessTokenResponse,
  MessageResponse,
  UserResponse,
  bearerAuth,
  errorResponses,
  json,
  registry,
} from '../registry.js';

registry.registerPath({
  method: 'get',
  path: '/users/me',
  tags: ['Users'],
  summary: 'Get the current user',
  security: bearerAuth,
  responses: {
    200: { description: 'The authenticated user', content: json(UserResponse) },
    ...errorResponses(401),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/users/me',
  tags: ['Users'],
  summary: 'Update the current user',
  description: 'Send `name`, `email`, or both. At least one is required.',
  security: bearerAuth,
  request: {
    body: {
      required: true,
      content: json(updateProfileSchema.shape.body, { name: 'Jane Smith' }),
    },
  },
  responses: {
    200: { description: 'Updated user', content: json(UserResponse) },
    ...errorResponses(400, 401, 409),
  },
});

registry.registerPath({
  method: 'put',
  path: '/users/me/password',
  tags: ['Users'],
  summary: 'Change the password',
  description:
    'Verifies the current password, then signs out every session and starts a new one for this device: the response carries a fresh access token and sets a new refresh cookie. A wrong current password is a 400 (not 401), so clients do not mistake it for an expired token. Failed attempts are rate limited per IP.',
  security: bearerAuth,
  request: {
    body: {
      required: true,
      content: json(changePasswordSchema.shape.body, {
        currentPassword: 'correct-horse-battery',
        newPassword: 'a-brand-new-passphrase',
      }),
    },
  },
  responses: {
    200: {
      description: 'Password changed',
      content: json(AccessTokenResponse),
    },
    ...errorResponses(400, 401, 429),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/users/me',
  tags: ['Users'],
  summary: 'Delete the account',
  description:
    'Permanently deletes the user, their contacts and all their sessions. Requires the current password in the request body. A wrong password is a 400. Failed attempts are rate limited per IP.',
  security: bearerAuth,
  request: {
    body: {
      required: true,
      content: json(deleteAccountSchema.shape.body, {
        password: 'correct-horse-battery',
      }),
    },
  },
  responses: {
    200: { description: 'Account deleted', content: json(MessageResponse) },
    ...errorResponses(400, 401, 429),
  },
});
