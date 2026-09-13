import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { ACCESS_COOKIE } from './auth.types.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedUser } from './auth.types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthenticatedUser }
    >();
    const token = this.extractAccessToken(request);
    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        retryable: false,
      });
    }

    request.user = await this.auth.authenticateAccessToken(token);
    return true;
  }

  private extractAccessToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const value = header.slice('Bearer '.length).trim();
      if (value.length > 0) {
        return value;
      }
    }

    const cookieToken = request.cookies?.[ACCESS_COOKIE];
    if (typeof cookieToken === 'string' && cookieToken.length > 0) {
      return cookieToken;
    }

    return undefined;
  }
}
