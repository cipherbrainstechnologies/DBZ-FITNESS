import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  RegisterDeviceRequestSchema,
  UpdateNotificationPreferencesRequestSchema,
  type RegisterDeviceRequest,
  type UpdateNotificationPreferencesRequest,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { NotificationsFacade } from './notifications.facade.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsFacade) {}

  @Get('notification-preferences')
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.getPreferences(user.id);
  }

  @Put('notification-preferences')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateNotificationPreferencesRequestSchema))
    body: UpdateNotificationPreferencesRequest,
  ) {
    return this.notifications.updatePreferences(user.id, body);
  }

  @Post('devices')
  registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(RegisterDeviceRequestSchema))
    body: RegisterDeviceRequest,
  ) {
    return this.notifications.registerDevice(user.id, body);
  }

  @Delete('devices/:id')
  deactivateDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notifications.deactivateDevice(user.id, id);
  }

  @Get('notifications')
  listNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.listNotifications(user.id);
  }

  @Post('notifications/:id/read')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notifications.markRead(user.id, id);
  }
}
