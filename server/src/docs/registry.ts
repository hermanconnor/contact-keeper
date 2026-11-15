import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { REFRESH_COOKIE } from '@/utils/cookies.js';
import { ACCESS_TTL_SECONDS } from '@/utils/tokens.js';

// Adds `.openapi()` to Zod schemas. registry.register() calls it internally, so this must run
// before the first register() below. It patches Zod once for the whole process.
extendZodWithOpenApi(z);

/**
 * Everything the docs know about lives in this registry. Request schemas are imported
 * from `@/schemas` (the same Zod objects that validate requests, so they can't drift);
 * response schemas are described here because nothing validates them at runtime.
 */
export const registry = new OpenAPIRegistry();

// ------------------------------------------------------------------
// Security schemes
// ------------------------------------------------------------------
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: `Access token from /auth/login, /auth/register or /auth/refresh. Valid for ${ACCESS_TTL_SECONDS / 60} minutes.`,
});

registry.registerComponent('securitySchemes', 'refreshCookie', {
  type: 'apiKey',
  in: 'cookie',
  name: REFRESH_COOKIE,
  description:
    'httpOnly refresh-token cookie set by login, register, refresh and change-password. The browser sends it automatically to /api/v1/auth; it cannot be pasted into Swagger UI.',
});

export const bearerAuth = [{ bearerAuth: [] }];
export const refreshCookieAuth = [{ refreshCookie: [] }];

// ------------------------------------------------------------------
// Response schemas
// ------------------------------------------------------------------
const objectId = z
  .string()
  .regex(/^[0-9a-f]{24}$/)
  .meta({ example: '665f1c2e8b1e4a0012a3b4c5' });

export const PublicUser = registry.register(
  'PublicUser',
  z.object({
    _id: objectId,
    name: z.string(),
    email: z.email(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  }),
);

export const Contact = registry.register(
  'Contact',
  z.object({
    _id: objectId,
    name: z.string(),
    email: z.email().optional(),
    phone: z.string().optional(),
    type: z.enum(['personal', 'professional']),
    date: z.iso.datetime(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  }),
);

export const Pagination = registry.register(
  'Pagination',
  z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
);

// Shared by the access-token and auth responses (kept as a plain shape so each registered
// schema is built fresh rather than derived from another).
const accessTokenShape = {
  success: z.literal(true),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().meta({ example: ACCESS_TTL_SECONDS }),
  accessToken: z.string(),
  message: z.string().optional(),
};

export const AccessTokenResponse = registry.register(
  'AccessTokenResponse',
  z.object(accessTokenShape),
);

export const AuthResponse = registry.register(
  'AuthResponse',
  z.object({ ...accessTokenShape, user: PublicUser }),
);

export const MessageResponse = registry.register(
  'MessageResponse',
  z.object({ success: z.literal(true), message: z.string() }),
);

export const UserResponse = registry.register(
  'UserResponse',
  z.object({ success: z.literal(true), user: PublicUser }),
);

export const ContactResponse = registry.register(
  'ContactResponse',
  z.object({ success: z.literal(true), contact: Contact }),
);

export const ContactListResponse = registry.register(
  'ContactListResponse',
  z.object({
    success: z.literal(true),
    contacts: z.array(Contact),
    pagination: Pagination,
  }),
);

// ------------------------------------------------------------------
// Error responses (the shapes errorHandler produces)
// ------------------------------------------------------------------
const ErrorResponse = registry.register(
  'ErrorResponse',
  z.object({ success: z.literal(false), message: z.string() }),
);

const ValidationErrorResponse = registry.register(
  'ValidationErrorResponse',
  z.object({
    success: z.literal(false),
    message: z.string().meta({ example: 'Validation failed' }),
    errors: z.object({
      formErrors: z.array(z.string()),
      fieldErrors: z
        .record(z.string(), z.array(z.string()))
        .meta({
          example: { 'body.email': ['Please provide a valid email address'] },
        }),
    }),
  }),
);

/** A `content` object for application/json, with an optional example payload. */
export const json = (schema: z.ZodType, example?: unknown) => ({
  'application/json': {
    schema,
    ...(example === undefined ? {} : { example }),
  },
});

type ErrorStatus = 400 | 401 | 404 | 409 | 429;

const ERRORS: Record<
  ErrorStatus,
  { description: string; content: ReturnType<typeof json> }
> = {
  400: {
    description: 'Validation failed (or a wrong current password where noted)',
    content: json(ValidationErrorResponse),
  },
  401: {
    description: 'Missing, invalid or expired token, or invalid credentials',
    content: json(ErrorResponse),
  },
  404: { description: 'Not found', content: json(ErrorResponse) },
  409: {
    description: 'Conflict (already exists)',
    content: json(ErrorResponse),
  },
  429: {
    description:
      'Rate limit exceeded. The Retry-After header says how many seconds to wait.',
    content: json(ErrorResponse),
  },
};

/** Picks standard error responses by status code: `...errorResponses(400, 401)`. */
export const errorResponses = (...statuses: ErrorStatus[]) =>
  Object.fromEntries(statuses.map((status) => [status, ERRORS[status]]));
