import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ApiError,
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  type SessionUser,
} from '@/src/api/client';
import {
  clearTokens,
  getAccessToken,
  saveTokens,
} from '@/src/auth/tokenStorage';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

type AuthContextValue = {
  status: AuthStatus;
  user: SessionUser | null;
  error: string | null;
  success: string | null;
  clearFeedback: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') return 'NETWORK_ERROR';
    if (error.code === 'INVALID_CREDENTIALS') return 'INVALID_CREDENTIALS';
    if (error.code === 'EMAIL_IN_USE') return 'EMAIL_IN_USE';
    if (error.code === 'VALIDATION_ERROR') return 'VALIDATION_ERROR';
    // Never surface raw English API messages to the UI — map via i18n codes.
    return 'UNKNOWN_ERROR';
  }
  if (error instanceof Error) return 'UNKNOWN_ERROR';
  return 'UNKNOWN_ERROR';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    try {
      const token = await getAccessToken();
      if (!token) {
        setUser(null);
        setStatus('anonymous');
        return;
      }
      const me = await fetchMe();
      setUser(me.user);
      setStatus('authenticated');
    } catch (err) {
      // Network blips must not wipe SecureStore refresh tokens.
      const network =
        err instanceof ApiError &&
        (err.status === 0 || err.code === 'NETWORK_ERROR');
      if (!network) {
        await clearTokens();
      }
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    clearFeedback();
    try {
      const result = await apiLogin({ email, password });
      await saveTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      setStatus('authenticated');
      setSuccess('LOGIN_SUCCESS');
      return true;
    } catch (err) {
      setError(toUserMessage(err));
      setStatus('anonymous');
      setUser(null);
      return false;
    }
  }, [clearFeedback]);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      clearFeedback();
      try {
        const result = await apiRegister({
          email,
          password,
          ...(displayName ? { displayName } : {}),
        });
        await saveTokens(result.accessToken, result.refreshToken);
        setUser(result.user);
        setStatus('authenticated');
        setSuccess('REGISTER_SUCCESS');
        return true;
      } catch (err) {
        setError(toUserMessage(err));
        setStatus('anonymous');
        setUser(null);
        return false;
      }
    },
    [clearFeedback],
  );

  const logout = useCallback(async () => {
    clearFeedback();
    try {
      await apiLogout();
      setSuccess('LOGOUT_SUCCESS');
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, [clearFeedback]);

  const refreshMe = useCallback(async () => {
    const me = await fetchMe();
    setUser(me.user);
    setStatus('authenticated');
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      error,
      success,
      clearFeedback,
      login,
      register,
      logout,
      refreshMe,
    }),
    [status, user, error, success, clearFeedback, login, register, logout, refreshMe],
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
