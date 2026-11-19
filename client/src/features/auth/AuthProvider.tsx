import { useEffect, useReducer, useState } from 'react';
import { AuthContext } from './auth-context';
import type { AuthAction, AuthState } from './auth.types';
import { authReducer } from './auth.reducer';
import {
  isUnauthorized,
  refreshAccessToken,
  setSessionExpiredHandler,
} from '@/lib/api';
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
} from './auth.api';
import { tokenStore } from '@/lib/tokenStore';
import { broadcastAuthEvent, subscribeToAuthEvents } from '@/lib/authChannel';
import type { LoginInput, RegisterInput } from './auth.schemas';

/**
 * Asks the server whether a session exists: swaps the httpOnly refresh cookie for an access
 * token, then loads the user. Used on page load and when another tab logs in.
 */
async function restoreSession(): Promise<AuthAction> {
  try {
    await refreshAccessToken();
    const currentUser = await fetchCurrentUser();

    return { type: 'AUTHENTICATED', user: currentUser };
  } catch (error) {
    // 401 means "no session" (no cookie, expired, revoked): a normal logged-out visit.
    // Anything else (offline, server waking up) says nothing about the session, so don't
    // pretend the user is logged out and bounce them to the login page.
    return isUnauthorized(error)
      ? { type: 'UNAUTHENTICATED' }
      : { type: 'RESTORE_FAILED' };
  }
}

export const initialAuthState: AuthState = { status: 'loading', user: null };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const [restoreAttempt, setRestoreAttempt] = useState<number>(0);

  // Page-load (and retry) session restore.
  useEffect(() => {
    let ignore = false;

    restoreSession().then((action) => {
      if (ignore) return;

      if (action.type !== 'AUTHENTICATED') {
        tokenStore.set(null);
      }

      dispatch(action);
    });

    // StrictMode runs effects twice in development; the refresh is single-flight, so both
    // runs share one request and only the latest result is applied.
    return () => {
      ignore = true;
    };
  }, [restoreAttempt]);

  // The axios interceptor can't use React, so it calls this when a refresh proves the
  // session is gone (revoked elsewhere, expired, password changed on another device).
  useEffect(() => {
    setSessionExpiredHandler(() => {
      dispatch({ type: 'UNAUTHENTICATED' });
      broadcastAuthEvent({ type: 'LOGGED_OUT' }); // every tab shares this session
    });

    return () => {
      setSessionExpiredHandler(null);
    };
  }, []);

  // Other tabs. Handlers here never broadcast again, so tabs can't echo each other forever.
  useEffect(() => {
    return subscribeToAuthEvents((message) => {
      if (message.type === 'LOGGED_OUT') {
        tokenStore.set(null);
        dispatch({ type: 'UNAUTHENTICATED' });
        return;
      }

      // LOGGED_IN: another tab just started a session, and the cookie it set is shared.
      // Pick it up (this also corrects a tab still showing a previous user). Only a success
      // is applied: no spinner, and a hiccup can never knock this tab out of a good session.
      restoreSession().then((action) => {
        if (action.type === 'AUTHENTICATED') {
          dispatch(action);
        }
      });
    });
  }, []);

  async function register(values: RegisterInput) {
    const { accessToken, user } = await registerRequest(values);

    tokenStore.set(accessToken);
    dispatch({ type: 'AUTHENTICATED', user });
    broadcastAuthEvent({ type: 'LOGGED_IN' });
  }

  async function login(values: LoginInput) {
    const { accessToken, user } = await loginRequest(values);

    tokenStore.set(accessToken);
    dispatch({ type: 'AUTHENTICATED', user });
    broadcastAuthEvent({ type: 'LOGGED_IN' });
  }

  async function logout() {
    // Not swallowed on purpose: if the server never heard about it the refresh cookie is
    // still valid, and the next page load would quietly log the user back in.
    await logoutRequest();

    tokenStore.set(null);
    dispatch({ type: 'UNAUTHENTICATED' });
    broadcastAuthEvent({ type: 'LOGGED_OUT' });
  }

  function retrySessionRestore() {
    dispatch({ type: 'RESTORE_STARTED' });
    setRestoreAttempt((attempt) => attempt + 1);
  }

  return (
    <AuthContext
      value={{ ...state, login, register, logout, retrySessionRestore }}
    >
      {children}
    </AuthContext>
  );
};
