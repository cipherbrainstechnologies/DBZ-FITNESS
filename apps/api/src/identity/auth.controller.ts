import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  type LoginRequest,
  type RegisterRequest,
} from '@saiyan/contracts';
import type { Request, Response } from 'express';

import type { Env } from '../config/env.js';
import { ENV } from '../config/tokens.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { wantsCookieAuth } from './auth-mode.js';
import { AuthService } from './auth.service.js';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.types.js';

/** Stricter than the global default — brute-force / credential stuffing surface. */
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterRequestSchema)) body: RegisterRequest,
    @Headers('accept') accept: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(body);
    return this.respondWithAuth(result, accept, res);
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(LoginRequestSchema)) body: LoginRequest,
    @Headers('accept') accept: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(body);
    return this.respondWithAuth(result, accept, res);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { refreshToken?: string } | undefined,
  ) {
    const refreshToken =
      body?.refreshToken ??
      (typeof req.cookies?.[REFRESH_COOKIE] === 'string'
        ? req.cookies[REFRESH_COOKIE]
        : undefined);

    if (!refreshToken) {
      // Still clear cookies if present; treat as idempotent success when nothing to revoke.
      this.clearAuthCookies(res);
      return { ok: true };
    }

    await this.auth.logout(refreshToken);
    this.clearAuthCookies(res);
    return { ok: true };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Headers('accept') accept: string | undefined,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { refreshToken?: string } | undefined,
  ) {
    const refreshToken =
      body?.refreshToken ??
      (typeof req.cookies?.[REFRESH_COOKIE] === 'string'
        ? req.cookies[REFRESH_COOKIE]
        : undefined);

    if (!refreshToken) {
      throw new UnauthorizedException({
        code: 'REFRESH_REQUIRED',
        message: 'Refresh token is required',
        retryable: false,
      });
    }

    const result = await this.auth.refresh(refreshToken);
    return this.respondWithAuth(result, accept, res);
  }

  private respondWithAuth(
    result: Awaited<ReturnType<AuthService['login']>>,
    accept: string | undefined,
    res: Response,
  ) {
    const sessionUser = {
      id: result.user.id,
      email: result.user.email,
      displayName: result.user.displayName,
      status: result.user.status,
      locale: result.user.locale,
      currentTimeZone: result.user.currentTimeZone,
      roles: result.user.roles,
    };

    if (wantsCookieAuth(accept)) {
      this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
      return {
        user: sessionUser,
        profile: result.profile,
        authMode: 'cookie' as const,
      };
    }

    return {
      user: sessionUser,
      profile: result.profile,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      expiresIn: result.tokens.expiresIn,
      tokenType: result.tokens.tokenType,
      authMode: 'bearer' as const,
    };
  }

  private cookieBase() {
    const secure =
      this.env.COOKIE_SECURE ?? this.env.APP_ENV === 'production';
    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const common = this.cookieBase();

    res.cookie(ACCESS_COOKIE, accessToken, {
      ...common,
      maxAge: this.env.ACCESS_TOKEN_TTL_SECONDS * 1000,
    });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      ...common,
      maxAge: this.env.REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  private clearAuthCookies(res: Response): void {
    // Must match set options or browsers may keep stale auth cookies.
    const common = this.cookieBase();
    res.clearCookie(ACCESS_COOKIE, common);
    res.clearCookie(REFRESH_COOKIE, common);
  }
}
