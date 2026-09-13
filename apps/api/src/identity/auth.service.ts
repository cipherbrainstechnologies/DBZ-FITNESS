import { createHash, randomBytes } from 'node:crypto';

import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  type LoginRequest,
  type RegisterRequest,
  type Role,
} from '@saiyan/contracts';
import * as argon2 from 'argon2';

import type { Env } from '../config/env.js';
import { ENV } from '../config/tokens.js';
import { PrismaService } from '../database/prisma.service.js';
import { ProfileFacade } from '../profiles/profile.facade.js';
import type { ProfileSummary } from '../profiles/profile.application.service.js';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from './auth.types.js';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
};

export type AuthSuccess = {
  user: AuthenticatedUser;
  tokens: AuthTokens;
  profile: ProfileSummary;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly profiles: ProfileFacade,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async register(input: RegisterRequest): Promise<AuthSuccess> {
    const data = RegisterRequestSchema.parse(input);
    const email = data.email.trim().toLowerCase();
    const existing = await this.prisma.client.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_IN_USE',
        message: 'An account with this email already exists',
        retryable: false,
      });
    }

    // Never log passwords. Hash with argon2id before persistence.
    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
    });

    const displayName =
      data.displayName?.trim() ||
      email.split('@')[0] ||
      'Member';

    const user = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          displayName,
          // M1: email verification deferred — activate immediately for local auth.
          status: 'ACTIVE',
          locale: data.locale ?? 'en',
          currentTimeZone: data.currentTimeZone ?? 'UTC',
          credential: {
            create: { passwordHash },
          },
          roles: {
            create: { role: 'MEMBER' },
          },
        },
        include: { roles: true },
      });

      await this.profiles.createInitialVersion(created.id, tx);
      return created;
    });

    return this.issueSession(user.id);
  }

  async login(input: LoginRequest): Promise<AuthSuccess> {
    const data = LoginRequestSchema.parse(input);
    const email = data.email.trim().toLowerCase();

    const user = await this.prisma.client.user.findUnique({
      where: { email },
      include: {
        credential: true,
        roles: true,
      },
    });

    // Constant-ish failure message to reduce account enumeration.
    const invalid = () =>
      new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        retryable: false,
      });

    if (!user?.credential || user.status === 'DISABLED') {
      throw invalid();
    }

    const ok = await argon2.verify(user.credential.passwordHash, data.password);
    if (!ok) {
      throw invalid();
    }

    return this.issueSession(user.id);
  }

  /**
   * Re-authenticate with password for sensitive actions (e.g. account deletion).
   * Never logs the password. Throws INVALID_CREDENTIALS on failure.
   */
  async verifyPasswordForReauth(userId: string, password: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { credential: true },
    });
    const invalid = () =>
      new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Password confirmation failed',
        retryable: false,
      });
    if (!user?.credential || user.status === 'DISABLED') {
      throw invalid();
    }
    const ok = await argon2.verify(user.credential.passwordHash, password);
    if (!ok) {
      throw invalid();
    }
  }

  async logout(refreshToken: string | undefined, sessionId?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.client.authSession.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
      return;
    }

    if (sessionId) {
      await this.prisma.client.authSession.updateMany({
        where: {
          id: sessionId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }
  }

  async refresh(refreshToken: string): Promise<AuthSuccess> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.client.authSession.findUnique({
      where: { tokenHash },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'Refresh session is invalid or expired',
        retryable: false,
      });
    }

    // Rotate refresh token.
    await this.prisma.client.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(session.userId);
  }

  async getMe(userId: string, sessionId: string): Promise<{
    user: AuthenticatedUser;
    profile: ProfileSummary;
  }> {
    const user = await this.loadAuthenticatedUser(userId, sessionId);
    const profile = await this.profiles.requireLatestSummary(userId);
    return { user, profile };
  }

  async updateMeProfile(
    userId: string,
    sessionId: string,
    patch: {
      displayName?: string;
      locale?: string;
      currentTimeZone?: string;
      goals?: string[];
      experience?: 'BEGINNER' | 'RETURNING' | 'INTERMEDIATE' | 'ADVANCED';
      weeklyAvailabilityMinutes?: number;
      equipment?: string[];
      accessPreferences?: Record<string, unknown>;
    },
  ): Promise<{ user: AuthenticatedUser; profile: ProfileSummary }> {
    await this.prisma.client.$transaction(async (tx) => {
      const userData: {
        displayName?: string;
        locale?: string;
        currentTimeZone?: string;
      } = {};
      if (patch.displayName !== undefined) {
        userData.displayName = patch.displayName;
      }
      if (patch.locale !== undefined) {
        userData.locale = patch.locale;
      }
      if (patch.currentTimeZone !== undefined) {
        userData.currentTimeZone = patch.currentTimeZone;
      }
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userData,
        });
      }
    });

    const profilePatch: {
      goals?: string[];
      experience?: 'BEGINNER' | 'RETURNING' | 'INTERMEDIATE' | 'ADVANCED';
      weeklyAvailabilityMinutes?: number;
      equipment?: string[];
      accessPreferences?: Record<string, unknown>;
    } = {};
    if (patch.goals !== undefined) profilePatch.goals = patch.goals;
    if (patch.experience !== undefined) profilePatch.experience = patch.experience;
    if (patch.weeklyAvailabilityMinutes !== undefined) {
      profilePatch.weeklyAvailabilityMinutes = patch.weeklyAvailabilityMinutes;
    }
    if (patch.equipment !== undefined) profilePatch.equipment = patch.equipment;
    if (patch.accessPreferences !== undefined) {
      profilePatch.accessPreferences = patch.accessPreferences;
    }
    if (Object.keys(profilePatch).length > 0) {
      await this.profiles.updateLatestBasics(userId, profilePatch);
    }

    return this.getMe(userId, sessionId);
  }

  async authenticateAccessToken(token: string): Promise<AuthenticatedUser> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.env.JWT_SECRET,
        issuer: this.env.AUTH_ISSUER,
        audience: this.env.AUTH_AUDIENCE,
      });
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Access token is invalid or expired',
        retryable: false,
      });
    }

    const session = await this.prisma.client.authSession.findUnique({
      where: { id: payload.sid },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({
        code: 'SESSION_REVOKED',
        message: 'Session is no longer valid',
        retryable: false,
      });
    }

    return this.loadAuthenticatedUser(payload.sub, payload.sid);
  }

  private async issueSession(userId: string): Promise<AuthSuccess> {
    const refreshToken = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.env.REFRESH_TOKEN_TTL_SECONDS * 1000,
    );

    const session = await this.prisma.client.authSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    const user = await this.loadAuthenticatedUser(userId, session.id);
    const profile = await this.profiles.requireLatestSummary(userId);

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      sid: session.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.env.JWT_SECRET,
      expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS,
      issuer: this.env.AUTH_ISSUER,
      audience: this.env.AUTH_AUDIENCE,
    });

    return {
      user,
      profile,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS,
        tokenType: 'Bearer',
      },
    };
  }

  private async loadAuthenticatedUser(
    userId: string,
    sessionId: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user || user.status === 'DISABLED') {
      throw new UnauthorizedException({
        code: 'USER_DISABLED',
        message: 'User is not permitted to authenticate',
        retryable: false,
      });
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      locale: user.locale,
      currentTimeZone: user.currentTimeZone,
      roles: user.roles.map((r) => r.role as Role),
      sessionId,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
