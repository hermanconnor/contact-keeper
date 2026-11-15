import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry.js';
// Each of these registers its endpoints on the shared registry as a side effect.
import './paths/health.paths.js';
import './paths/auth.paths.js';
import './paths/users.paths.js';
import './paths/contacts.paths.js';

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Contact Keeper API',
      version: '1.0.0',
      description: [
        'REST API for managing your own contacts. Every user only ever sees their own data.',
        '',
        '**Authenticating in this page:** call `POST /auth/login`, copy the `accessToken` from the',
        'response, click **Authorize**, and paste it (without the word "Bearer"). Access tokens last',
        '15 minutes; `POST /auth/refresh` returns a new one using the refresh cookie the browser',
        'already holds.',
      ].join('\n'),
    },
    // Relative, so "Try it out" always calls whichever host is serving these docs.
    servers: [{ url: '/api/v1' }],
    tags: [
      { name: 'Auth', description: 'Register, log in, refresh and log out' },
      { name: 'Users', description: 'The current user (self-service)' },
      { name: 'Contacts', description: 'Your contacts' },
      { name: 'Health', description: 'Liveness and readiness probes' },
    ],
  });
}
