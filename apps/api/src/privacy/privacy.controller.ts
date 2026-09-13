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
  CreateDataExportRequestSchema,
  CreateDeletionRequestSchema,
  type CreateDataExportRequest,
  type CreateDeletionRequest,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { PrivacyFacade } from './privacy.facade.js';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacy: PrivacyFacade) {}

  @Post('export')
  createExport(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(CreateDataExportRequestSchema.default({})))
    body: CreateDataExportRequest,
  ) {
    return this.privacy.createExport(user.id, body, idempotencyKey);
  }

  @Get('export/:id')
  getExport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.privacy.getExport(user.id, id);
  }

  @Post('deletion-request')
  createDeletion(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(CreateDeletionRequestSchema))
    body: CreateDeletionRequest,
  ) {
    return this.privacy.createDeletionRequest(user.id, body, idempotencyKey);
  }

  @Get('deletion-status')
  deletionStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.privacy.getDeletionStatus(user.id);
  }
}
