import type { Role } from '@saiyan/contracts';

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string | null;
  status: 'ACTIVE' | 'DISABLED' | 'PENDING_VERIFICATION';
  locale: string;
  currentTimeZone: string;
  roles: Role[];
  sessionId: string;
};

export type AccessTokenPayload = {
  sub: string;
  sid: string;
  email: string;
  roles: Role[];
};

export const ACCESS_COOKIE = 'sa_access';
export const REFRESH_COOKIE = 'sa_refresh';
