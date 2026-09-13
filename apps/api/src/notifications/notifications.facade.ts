import { Injectable } from '@nestjs/common';
import type {
  GetNotificationPreferencesResponse,
  ListNotificationsResponse,
  MarkNotificationReadResponse,
  RegisterDeviceRequest,
  RegisterDeviceResponse,
  UpdateNotificationPreferencesRequest,
} from '@saiyan/contracts';

import { NotificationsApplicationService } from './notifications.application.service.js';

/**
 * Cross-module façade for notification preferences, devices, intents, and inbox.
 */
@Injectable()
export class NotificationsFacade {
  constructor(private readonly notifications: NotificationsApplicationService) {}

  getPreferences(userId: string): Promise<GetNotificationPreferencesResponse> {
    return this.notifications.getPreferences(userId);
  }

  updatePreferences(
    userId: string,
    body: UpdateNotificationPreferencesRequest,
  ): Promise<GetNotificationPreferencesResponse> {
    return this.notifications.updatePreferences(userId, body);
  }

  registerDevice(
    userId: string,
    body: RegisterDeviceRequest,
  ): Promise<RegisterDeviceResponse> {
    return this.notifications.registerDevice(userId, body);
  }

  deactivateDevice(userId: string, deviceId: string) {
    return this.notifications.deactivateDevice(userId, deviceId);
  }

  listNotifications(userId: string): Promise<ListNotificationsResponse> {
    return this.notifications.listNotifications(userId);
  }

  markRead(
    userId: string,
    notificationId: string,
  ): Promise<MarkNotificationReadResponse> {
    return this.notifications.markRead(userId, notificationId);
  }

  processDueIntents(limit?: number) {
    return this.notifications.processDueIntents(limit);
  }
}
