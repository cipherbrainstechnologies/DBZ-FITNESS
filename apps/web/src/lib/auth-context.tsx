'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LoginRequest, RegisterRequest, SessionUser } from '@saiyan/contracts';

import { api, ApiClientError } from './api';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

type AuthContextValue = {
  status: AuthStatus;
  user: SessionUser | null;
  error: string | null;
  refresh: () => Promise<void>;
  login: (input: LoginRequest) => Promise<SessionUser>;
  register: (input: RegisterRequest) => Promise<SessionUser>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await api.me();
      setUser(result.user);
      setStatus('authenticated');
      setError(null);
    } catch (err) {
      setUser(null);
      setStatus('anonymous');
      if (err instanceof ApiClientError && err.status === 0) {
        setError(err.message);
      } else {
        setError(null);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (input: LoginRequest) => {
    const result = await api.login(input);
    setUser(result.user);
    setStatus('authenticated');
    setError(null);
    return result.user;
  }, []);

  const register = useCallback(async (input: RegisterRequest) => {
    const result = await api.register(input);
    setUser(result.user);
    setStatus('authenticated');
    setError(null);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      status,
      user,
      error,
      refresh,
      login,
      register,
      logout,
      clearError,
    }),
    [status, user, error, refresh, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function isAdmin(user: SessionUser | null): boolean {
  return Boolean(user?.roles.includes('ADMIN'));
}
