import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './openapi.js';

type SwaggerDocument = NonNullable<Parameters<typeof swaggerUi.setup>[0]>;

/**
 * Swagger UI at /docs and the raw OpenAPI document at /docs/openapi.json (importable into
 * Postman or a client generator). A function rather than a module-level router, so the
 * document is only generated when the docs are actually enabled.
 */
export function createDocsRouter(): Router {
  const router = Router();
  const document = buildOpenApiDocument();

  router.get('/openapi.json', (_req, res) => {
    res.json(document);
  });

  // Swagger UI links its assets relatively, so it must be served from /docs/ (trailing slash).
  router.get('/', (req, res, next) => {
    if (req.originalUrl.split('?')[0]?.endsWith('/')) {
      next();
      return;
    }

    res.redirect(`${req.baseUrl}/`);
  });

  router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(document as unknown as SwaggerDocument, {
      customSiteTitle: 'Contact Keeper API docs',
      swaggerOptions: {
        persistAuthorization: true, // keep the pasted access token across page reloads
        displayRequestDuration: true,
      },
    }),
  );

  return router;
}
