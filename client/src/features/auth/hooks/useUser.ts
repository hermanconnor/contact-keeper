import { useAuth } from './useAuth';
import type { User } from '../auth.schemas';

/** The logged-in user, for components that only render behind <ProtectedRoute>. */
export function useUser(): User {
  const auth = useAuth();

  if (auth.status !== 'authenticated') {
    throw new Error('useUser was used outside a protected route');
  }

  return auth.user;
}
