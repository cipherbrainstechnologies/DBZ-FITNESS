import {
  Body,
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  PostCoachMessageRequestSchema,
  type PostCoachMessageRequest,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { CoachingFacade } from './coaching.facade.js';

@Controller('coach')
@UseGuards(JwtAuthGuard)
export class CoachingController {
  constructor(private readonly coaching: CoachingFacade) {}

  @Post('messages')
  postMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(PostCoachMessageRequestSchema))
    body: PostCoachMessageRequest,
  ) {
    return this.coaching.postMessage(user.id, body);
  }

  @Post('action-proposals/:id/confirm')
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    return this.coaching.confirmProposal(user.id, id, idempotencyKey);
  }

  @Post('action-proposals/:id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coaching.rejectProposal(user.id, id);
  }
}
