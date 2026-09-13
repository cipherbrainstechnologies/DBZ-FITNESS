import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '@/src/auth/tokenStorage';

export const API_URL =
  (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL
    ? process.env.EXPO_PUBLIC_API_URL
    : 'http://localhost:3001/api/v1'
  ).replace(/\/$/, '');

export type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
  status: string;
  locale: string;
  currentTimeZone: string;
  roles: string[];
};

export type MeResponse = {
  user: SessionUser;
  profile: unknown;
};

export type AuthResponse = {
  user: SessionUser;
  profile: unknown;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
  authMode?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryable: boolean;

  constructor(message: string, status: number, code?: string, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

type Json = Record<string, unknown>;

async function parseBody(response: Response): Promise<Json> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Json;
  } catch {
    return { raw: text };
  }
}

function messageFromBody(body: Json, fallback: string): string {
  if (typeof body['message'] === 'string') return body['message'];
  if (Array.isArray(body['message'])) {
    return body['message'].map(String).join(', ');
  }
  return fallback;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return null;
  }

  const body = await parseBody(response);
  if (!response.ok) {
    await clearTokens();
    return null;
  }

  const accessToken = body['accessToken'];
  const nextRefresh = body['refreshToken'];
  if (typeof accessToken !== 'string' || typeof nextRefresh !== 'string') {
    await clearTokens();
    return null;
  }

  await saveTokens(accessToken, nextRefresh);
  return accessToken;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; retry?: boolean } = {},
): Promise<T> {
  const { auth = false, retry = true } = options;
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('NETWORK_ERROR', 0, 'NETWORK_ERROR', true);
  }

  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, init, { auth, retry: false });
    }
  }

  const body = await parseBody(response);
  if (!response.ok) {
    throw new ApiError(
      messageFromBody(body, `Request failed (${response.status})`),
      response.status,
      typeof body['code'] === 'string' ? body['code'] : undefined,
      Boolean(body['retryable']),
    );
  }

  return body as T;
}

export async function register(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
  } catch {
    // Logout is best-effort; local tokens are cleared regardless.
  } finally {
    await clearTokens();
  }
}

export async function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/me', { method: 'GET' }, { auth: true });
}
