import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  PostCoachMessageRequestSchema,
  UpsertCoachMemoryRequestSchema,
  type PostCoachMessageRequest,
  type UpsertCoachMemoryRequest,
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

  @Get('context')
  getContext(@CurrentUser() user: AuthenticatedUser) {
    return this.coaching.getContext(user.id, user.currentTimeZone);
  }

  @Get('briefing')
  getBriefing(@CurrentUser() user: AuthenticatedUser) {
    return this.coaching.getBriefing(user.id, user.currentTimeZone);
  }

  @Get('memory')
  listMemory(@CurrentUser() user: AuthenticatedUser) {
    return this.coaching.listMemory(user.id);
  }

  @Put('memory')
  upsertMemory(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpsertCoachMemoryRequestSchema))
    body: UpsertCoachMemoryRequest,
  ) {
    return this.coaching.upsertMemory(user.id, body);
  }

  @Delete('memory/:id')
  deleteMemory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coaching.deleteMemory(user.id, id);
  }

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
