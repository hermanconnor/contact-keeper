import { isAxiosError } from 'axios';
import { z } from 'zod';

// The shape produced by the API's errorHandler middleware.
const apiErrorBodySchema = z.object({
  message: z.string().trim().min(1),
  errors: z
    .object({
      fieldErrors: z.record(z.string(), z.array(z.string().min(1))),
    })
    .optional(),
});

export interface ApiErrorInfo {
  status: number | undefined;
  /** Safe to display directly in UI toasts or banners. */
  message: string;
  /** First non-empty message per field, keyed by normalized field name. */
  fieldErrors: Record<string, string>;
}

const CANCELED_MESSAGE = 'The request was canceled.';
const NETWORK_MESSAGE =
  'Could not reach the server. Check your connection and try again.';
const SERVER_MESSAGE =
  'The server had a problem. Please try again in a moment.';
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

function extractFieldErrors(
  rawFieldErrors: Record<string, string[]> | undefined,
): Record<string, string> {
  if (!rawFieldErrors) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  for (const [path, messages] of Object.entries(rawFieldErrors)) {
    const first = messages.find((msg) => msg.trim().length > 0);
    if (first) {
      // Strip leading request-location prefix like "body." or "query."
      const normalizedKey = path.replace(/^(body|query|params)\./, '');
      fieldErrors[normalizedKey] = first;
    }
  }

  return fieldErrors;
}

export function parseApiError(error: unknown): ApiErrorInfo {
  if (!isAxiosError(error)) {
    return { status: undefined, message: FALLBACK_MESSAGE, fieldErrors: {} };
  }

  if (error.code === 'ERR_CANCELED') {
    return { status: undefined, message: CANCELED_MESSAGE, fieldErrors: {} };
  }

  // No response: offline, timeout, DNS failure, or CORS block.
  if (!error.response) {
    return { status: undefined, message: NETWORK_MESSAGE, fieldErrors: {} };
  }

  const { status, data } = error.response;

  if (typeof status === 'number' && status >= 500) {
    return { status, message: SERVER_MESSAGE, fieldErrors: {} };
  }

  const parsed = apiErrorBodySchema.safeParse(data);

  if (!parsed.success) {
    return { status, message: FALLBACK_MESSAGE, fieldErrors: {} };
  }

  return {
    status,
    message: parsed.data.message,
    fieldErrors: extractFieldErrors(parsed.data.errors?.fieldErrors),
  };
}
