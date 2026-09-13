import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ActivateTrainingPlanRequestSchema,
  PreviewTrainingPlanRequestSchema,
  ShortenPlannedSessionRequestSchema,
  type ActivateTrainingPlanRequest,
  type PreviewTrainingPlanRequest,
  type ShortenPlannedSessionRequest,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { TrainingFacade } from './training.facade.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class TrainingPlansController {
  constructor(private readonly training: TrainingFacade) {}

  @Post('training-plans/preview')
  preview(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(PreviewTrainingPlanRequestSchema))
    body: PreviewTrainingPlanRequest,
  ) {
    return this.training.previewPlan(user.id, body);
  }

  @Post('training-plans')
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(ActivateTrainingPlanRequestSchema))
    body: ActivateTrainingPlanRequest,
  ) {
    return this.training.activatePlan(user.id, body, idempotencyKey);
  }

  @Get('training-plans/current')
  current(@CurrentUser() user: AuthenticatedUser) {
    return this.training.getCurrentPlan(user.id);
  }

  @Get('planned-sessions')
  listPlanned(@CurrentUser() user: AuthenticatedUser) {
    return this.training.listPlannedSessions(user.id);
  }

  @Post('planned-sessions/:id/shorten')
  shorten(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(ShortenPlannedSessionRequestSchema))
    body: ShortenPlannedSessionRequest,
  ) {
    return this.training.shortenPlannedSession(user.id, id, body);
  }
}
