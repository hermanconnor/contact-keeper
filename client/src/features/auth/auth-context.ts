import { createContext } from 'react';
import type { LoginInput, RegisterInput } from './auth.schemas';
import type { AuthState } from './auth.types';

export interface AuthActions {
  login: (values: LoginInput) => Promise<void>;
  register: (values: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  retrySessionRestore: () => void;
}

export type AuthContextValue = AuthState & AuthActions;

export const AuthContext = createContext<AuthContextValue | null>(null);
