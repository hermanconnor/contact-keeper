import type { User } from './auth.schemas';

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated'; user: null }
  | { status: 'error'; user: null };

export type AuthAction =
  | { type: 'RESTORE_STARTED' }
  | { type: 'RESTORE_FAILED' }
  | { type: 'AUTHENTICATED'; user: User }
  | { type: 'UNAUTHENTICATED' };
