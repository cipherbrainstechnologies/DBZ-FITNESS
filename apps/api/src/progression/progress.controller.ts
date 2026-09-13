import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { ProgressionFacade } from './progression.facade.js';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progression: ProgressionFacade) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.progression.getSummary(user.id);
  }

  @Get('xp-ledger')
  getXpLedger(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limitRaw?: string,
  ) {
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    return this.progression.getXpLedger(
      user.id,
      Number.isFinite(limit) ? limit : undefined,
    );
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('days') daysRaw?: string,
  ) {
    const days = daysRaw ? Number.parseInt(daysRaw, 10) : undefined;
    return this.progression.getHistory(
      user.id,
      Number.isFinite(days) ? days : undefined,
    );
  }
}
