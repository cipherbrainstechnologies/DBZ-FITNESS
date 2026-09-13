import {
  Body,
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  AbandonWorkoutSessionRequestSchema,
  CompleteWorkoutSessionRequestSchema,
  StartWorkoutSessionRequestSchema,
  UpdateWorkoutSetRequestSchema,
  type AbandonWorkoutSessionRequest,
  type CompleteWorkoutSessionRequest,
  type StartWorkoutSessionRequest,
  type UpdateWorkoutSetRequest,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { TrainingFacade } from './training.facade.js';

@Controller('workout-sessions')
@UseGuards(JwtAuthGuard)
export class WorkoutSessionsController {
  constructor(private readonly training: TrainingFacade) {}

  @Post()
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(StartWorkoutSessionRequestSchema))
    body: StartWorkoutSessionRequest,
  ) {
    return this.training.startWorkout(user.id, body);
  }

  @Put(':id/sets/:setId')
  updateSet(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('setId', ParseUUIDPipe) setId: string,
    @Body(new ZodValidationPipe(UpdateWorkoutSetRequestSchema))
    body: UpdateWorkoutSetRequest,
  ) {
    return this.training.updateSet(user.id, id, setId, body);
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(CompleteWorkoutSessionRequestSchema))
    body: CompleteWorkoutSessionRequest,
  ) {
    return this.training.completeWorkout(user.id, id, body, idempotencyKey);
  }

  @Post(':id/abandon')
  abandon(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(AbandonWorkoutSessionRequestSchema))
    _body: AbandonWorkoutSessionRequest,
  ) {
    return this.training.abandonWorkout(user.id, id);
  }
}
