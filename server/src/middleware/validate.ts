import type { Request, RequestHandler } from 'express';
import type { z } from 'zod';

/** The request parts a schema can describe; anything else is stripped by Zod. */
interface RequestShape {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

/** `Output[Key]` when the schema validates that part, otherwise `unknown`. */
type Part<Output, Key extends keyof RequestShape> = Key extends keyof Output
  ? Output[Key]
  : unknown;

/**
 * An Express handler whose `req.body` / `req.query` / `req.params` come from the schema.
 * `query` and `params` are intersected with Express's defaults so the handler stays
 * assignable alongside plain `RequestHandler`s (e.g. `auth, validate(schema), controller`
 * would otherwise fail on coerced values such as `page: number`).
 */
type ValidatedHandler<Output> = RequestHandler<
  Request['params'] & Part<Output, 'params'>,
  any,
  Part<Output, 'body'>, // un-validated bodies stay `unknown`, not `any`
  Request['query'] & Part<Output, 'query'>
>;

/**
 * Validates `req.body`, `req.query` and `req.params` against a Zod schema and
 * replaces them with the parsed output (coerced, defaulted, unknown keys
 * stripped). Handlers after it get fully typed `req.body/query/params`.
 *
 * Failures are passed to `next(error)`; `errorHandler` formats the response.
 *
 * @example
 * const schema = z.object({
 *   params: z.object({ id: z.string() }),
 *   query: z.object({ page: z.coerce.number().default(1) }),
 *   body: z.object({ email: z.email() }),
 * });
 *
 * router.post('/:id', validate(schema), (req, res) => {
 *   req.query.page; // number
 * });
 */
export function validate<T extends z.ZodType<RequestShape>>(
  schema: T,
): ValidatedHandler<z.output<T>>;
export function validate(schema: z.ZodType<RequestShape>): RequestHandler {
  return async (req, _res, next) => {
    try {
      const result = await schema.safeParseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        next(result.error);
        return;
      }

      applyValidated(req, result.data);
    } catch (error) {
      next(error); // e.g. an async refinement threw
      return;
    }

    next(); // outside the try block, so downstream errors can't land in the catch
  };
}

function applyValidated(req: Request, data: RequestShape): void {
  if ('body' in data) req.body = data.body;
  if ('params' in data) req.params = data.params as Request['params'];
  if ('query' in data) {
    // Express 5 defines `req.query` as a getter-only property that re-parses the
    // query string on every read, so plain assignment throws. An own data
    // property shadows it (and means the string is parsed once, not per read).
    Object.defineProperty(req, 'query', {
      value: data.query,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
}
