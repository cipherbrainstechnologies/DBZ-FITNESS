import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { PrismaService } from '../database/prisma.service.js';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  live() {
    return { status: 'ok', check: 'live' };
  }

  @Get('ready')
  async ready() {
    await this.prisma.client.$queryRaw`SELECT 1`;
    return { status: 'ok', check: 'ready' };
  }
}
