import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { NotificationsApplicationService } from './notifications.application.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsFacade } from './notifications.facade.js';

@Module({
  imports: [IdentityModule],
  controllers: [NotificationsController],
  providers: [NotificationsApplicationService, NotificationsFacade],
  exports: [NotificationsFacade],
})
export class NotificationsModule {}
