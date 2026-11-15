import { loginSchema, registerSchema } from '@/schemas/auth.schemas.js';
import {
  AccessTokenResponse,
  AuthResponse,
  MessageResponse,
  errorResponses,
  json,
  refreshCookieAuth,
  registry,
} from '../registry.js';

const COOKIE_NOTE =
  'The refresh token is set as an httpOnly cookie (Secure, SameSite=None, Partitioned, path /api/v1/auth); the access token is in the response body.';

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Create an account',
  description: `Creates the user and starts a session. ${COOKIE_NOTE}`,
  request: {
    body: {
      required: true,
      content: json(registerSchema.shape.body, {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'correct-horse-battery',
      }),
    },
  },
  responses: {
    201: { description: 'Account created', content: json(AuthResponse) },
    ...errorResponses(400, 409, 429),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Log in',
  description: `Starts a session. ${COOKIE_NOTE} Failed attempts are rate limited per IP.`,
  request: {
    body: {
      required: true,
      content: json(loginSchema.shape.body, {
        email: 'jane@example.com',
        password: 'correct-horse-battery',
      }),
    },
  },
  responses: {
    200: { description: 'Logged in', content: json(AuthResponse) },
    ...errorResponses(400, 401, 429),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth'],
  summary: 'Get a new access token',
  description:
    'Reads the refresh cookie and returns a new access token. Each refresh token is single-use: it is rotated and the new one is set as a cookie. Replaying an already-used token ends the whole session (401). A second request carrying a token rotated less than 10 seconds ago (parallel tabs) only receives a fresh access token. The session has a fixed lifetime: rotation never extends it. Takes no body.',
  security: refreshCookieAuth,
  responses: {
    200: { description: 'Token refreshed', content: json(AccessTokenResponse) },
    ...errorResponses(401, 429),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Log out',
  description:
    'Revokes the session the refresh cookie belongs to and clears the cookie. Always 200, even without a cookie. Takes no body.',
  security: refreshCookieAuth,
  responses: {
    200: { description: 'Logged out', content: json(MessageResponse) },
  },
});
