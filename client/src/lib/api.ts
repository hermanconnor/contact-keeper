import axios, { type InternalAxiosRequestConfig } from 'axios';
import { tokenResponseSchema } from '@/features/auth/auth.schemas';
import { env } from './env';
import { tokenStore } from './tokenStore';

export const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
  timeout: 30_000,
});

export const isUnauthorized = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401;

// ------------------------------------------------------------------
// Session expiry: the interceptor can't touch React, so AuthProvider registers a callback
// ------------------------------------------------------------------
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredHandler = (
  handler: (() => void) | null,
): void => {
  onSessionExpired = handler;
};

// ------------------------------------------------------------------
// Refresh (single flight)
// ------------------------------------------------------------------
let refreshInFlight: Promise<string> | null = null;

async function requestNewAccessToken(): Promise<string> {
  const { data } = await api.post<unknown>('/auth/refresh'); // no body; the cookie is the credential
  const { accessToken } = tokenResponseSchema.parse(data);

  tokenStore.set(accessToken);

  return accessToken;
}

/**
 * Exchanges the refresh cookie for a new access token. Concurrent callers share one request
 * (several calls failing at once, or React StrictMode running an effect twice), so the
 * server only ever sees a single rotation.
 */
export function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= requestNewAccessToken().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

// ------------------------------------------------------------------
// Interceptors
// ------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.config) throw error;

  const request: RetriableRequest = error.config;

  // Only an expired access token on a normal request is worth a refresh. /auth/* endpoints
  // are excluded: a 401 from login means "wrong password", and one from refresh means the
  // session is over. Each request is retried at most once.
  const isAuthRoute = request.url?.startsWith('/auth/') ?? false;

  if (error.response?.status !== 401 || isAuthRoute || request._retry)
    throw error;

  request._retry = true;

  let token: string;

  try {
    token = await refreshAccessToken();
  } catch (refreshError) {
    // Only a 401 means the session is really gone. A network error or a 500 says nothing
    // about it, so the user stays logged in and the original error is surfaced.
    if (isUnauthorized(refreshError)) {
      tokenStore.set(null);
      onSessionExpired?.();
    }

    throw error;
  }

  request.headers.set('Authorization', `Bearer ${token}`);

  return api(request);
});
