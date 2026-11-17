import type { AuthAction, AuthState } from './auth.types';

export function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_STARTED':
      return { status: 'loading', user: null };
    case 'RESTORE_FAILED':
      return { status: 'error', user: null };
    case 'AUTHENTICATED':
      return { status: 'authenticated', user: action.user };
    case 'UNAUTHENTICATED':
      return { status: 'unauthenticated', user: null };
    default:
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
  }
}
