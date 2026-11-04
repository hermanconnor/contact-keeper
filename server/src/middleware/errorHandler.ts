import { STATUS_CODES } from 'node:http';
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/utils/AppError.js';
import logger from '@/utils/logger.js';
import { env } from '@/config/env.js';

export interface FieldErrors {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
}

export interface ErrorResponseBody {
  success: false;
  message: string;
  errors?: FieldErrors;
  stack?: string;
}

export interface NormalizedError {
  statusCode: number;
  message: string;
  errors?: FieldErrors;
}

const GENERIC_MESSAGE = 'Internal Server Error';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const { statusCode, message, errors } = normalizeError(err);

  if (statusCode >= 500) {
    logger.error(err);
  }

  const body: ErrorResponseBody = { success: false, message };

  if (errors) {
    body.errors = errors;
  }

  if (env.NODE_ENV === 'development' && err instanceof Error && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

/**
 * Maps any thrown value to a status code and a client-safe message. Only errors
 * we recognise expose their message; everything else is treated as a bug and
 * becomes a generic 500 so internals never leak.
 */
export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message };
  }
  // Every ZodError reaching here is treated as a client error. If you also parse
  // *internal* data with Zod, catch those and throw an AppError(…, 500) instead.
  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: fromZod(err),
    };
  }
  if (isMongooseValidationError(err)) {
    return {
      statusCode: 400,
      message: 'Database validation failed',
      errors: fromMongoose(err.errors),
    };
  }
  if (isMongoDuplicateKeyError(err)) {
    const fields = isRecord(err.keyValue) ? Object.keys(err.keyValue) : [];
    const label = capitalize(fields.join(', ') || 'Value');
    return { statusCode: 409, message: `${label} already exists` };
  }
  if (isMongooseCastError(err)) {
    return { statusCode: 400, message: `Invalid value for "${err.path}"` }; // don't echo the raw value
  }
  if (isHttpError(err)) {
    // e.g. body-parser: malformed JSON (400), payload too large (413)
    const message = err.expose
      ? err.message
      : (STATUS_CODES[err.status] ?? GENERIC_MESSAGE);
    return { statusCode: err.status, message };
  }
  return { statusCode: 500, message: GENERIC_MESSAGE };
}

// ------------------------------------------------------------------
// Formatters
// ------------------------------------------------------------------
function fromZod(error: ZodError): FieldErrors {
  const result: FieldErrors = { formErrors: [], fieldErrors: {} };

  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      result.formErrors.push(issue.message);
    } else {
      (result.fieldErrors[issue.path.map(String).join('.')] ??= []).push(
        issue.message,
      );
    }
  }

  return result;
}

function fromMongoose(errors: Record<string, unknown>): FieldErrors {
  const result: FieldErrors = { formErrors: [], fieldErrors: {} };

  for (const [path, error] of Object.entries(errors)) {
    const hasMessage = isRecord(error) && typeof error.message === 'string';

    result.fieldErrors[path] = [
      hasMessage ? String(error.message) : 'Invalid value',
    ];
  }

  return result;
}

const capitalize = (s: string): string => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// ---------------------------------------------------------
// Type guards: each one only claims what it actually checks
// ---------------------------------------------------------
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function isMongooseValidationError(
  err: unknown,
): err is { errors: Record<string, unknown> } {
  return (
    isRecord(err) && err.name === 'ValidationError' && isRecord(err.errors)
  );
}

function isMongoDuplicateKeyError(err: unknown): err is { keyValue?: unknown } {
  return isRecord(err) && err.code === 11000;
}

function isMongooseCastError(err: unknown): err is { path: string } {
  return (
    isRecord(err) && err.name === 'CastError' && typeof err.path === 'string'
  );
}

interface HttpError extends Error {
  status: number;
  expose?: boolean;
}

function isHttpError(err: unknown): err is HttpError {
  return (
    err instanceof Error &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 600
  );
}
