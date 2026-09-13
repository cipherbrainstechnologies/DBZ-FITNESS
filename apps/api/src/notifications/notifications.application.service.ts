import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  DeviceRegistration,
  GetNotificationPreferencesResponse,
  InAppNotification,
  ListNotificationsResponse,
  MarkNotificationReadResponse,
  RegisterDeviceRequest,
  RegisterDeviceResponse,
  UpdateNotificationPreferencesRequest,
} from '@saiyan/contracts';
import {
  DEFAULT_DAILY_MOTIVATIONAL_CAP,
  DEFAULT_QUIET_HOURS_END,
  DEFAULT_QUIET_HOURS_START,
  CAP_COUNTED_CATEGORIES,
  evaluateDispatchEligibility,
  localDateInTimeZone,
  type NotificationCategoryValue,
} from '@saiyan/domain';
import type { Prisma } from '@saiyan/database';

import { PrismaService } from '../database/prisma.service.js';

const DEFAULT_CATEGORIES: Record<NotificationCategoryValue, boolean> = {
  WORKOUT_REMINDER: true,
  MEAL_REMINDER: false,
  WEEKLY_REVIEW: true,
  MOVEMENT_BREAK: false,
  MOTIVATION: true,
  ACCOUNT_SECURITY: true,
};

const SIMULATED_NOTE =
  'Delivery mode is SIMULATED — not real FCM/APNs/email. Push provider status: PENDING.';

/**
 * Owns NotificationPreference, DeviceRegistration, NotificationIntent, InAppNotification.
 */
@Injectable()
export class NotificationsApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string): Promise<GetNotificationPreferencesResponse> {
    const preference = await this.ensurePreference(userId);
    return { preference: this.toPreferenceView(preference) };
  }

  async updatePreferences(
    userId: string,
    body: UpdateNotificationPreferencesRequest,
  ): Promise<GetNotificationPreferencesResponse> {
    const existing = await this.ensurePreference(userId);

    if (
      body.expectedVersion != null &&
      body.expectedVersion !== existing.version
    ) {
      throw new ConflictException({
        code: 'NOTIFICATION_PREFERENCE_VERSION_CONFLICT',
        message: 'Notification preference version conflict',
      });
    }

    const categoriesEnabled = {
      ...asCategoryMap(existing.categoriesEnabled),
      ...(body.categoriesEnabled ?? {}),
    };

    const updated = await this.prisma.client.notificationPreference.update({
      where: { userId },
      data: {
        categoriesEnabled,
        preferredWorkoutReminderLocalTime:
          body.preferredWorkoutReminderLocalTime !== undefined
            ? body.preferredWorkoutReminderLocalTime
            : existing.preferredWorkoutReminderLocalTime,
        mealRemindersEnabled:
          body.mealRemindersEnabled ?? existing.mealRemindersEnabled,
        movementBreaksEnabled:
          body.movementBreaksEnabled ?? existing.movementBreaksEnabled,
        weeklyReviewEnabled:
          body.weeklyReviewEnabled ?? existing.weeklyReviewEnabled,
        tone: body.tone !== undefined ? body.tone : existing.tone,
        quietHoursStartLocal:
          body.quietHoursStartLocal ?? existing.quietHoursStartLocal,
        quietHoursEndLocal:
          body.quietHoursEndLocal ?? existing.quietHoursEndLocal,
        sleepWindowStartLocal:
          body.sleepWindowStartLocal !== undefined
            ? body.sleepWindowStartLocal
            : existing.sleepWindowStartLocal,
        sleepWindowEndLocal:
          body.sleepWindowEndLocal !== undefined
            ? body.sleepWindowEndLocal
            : existing.sleepWindowEndLocal,
        workWindowStartLocal:
          body.workWindowStartLocal !== undefined
            ? body.workWindowStartLocal
            : existing.workWindowStartLocal,
        workWindowEndLocal:
          body.workWindowEndLocal !== undefined
            ? body.workWindowEndLocal
            : existing.workWindowEndLocal,
        timeZone: body.timeZone ?? existing.timeZone,
        dailyReminderCap: body.dailyReminderCap ?? existing.dailyReminderCap,
        pauseUntil:
          body.pauseUntil !== undefined
            ? body.pauseUntil
              ? new Date(body.pauseUntil)
              : null
            : existing.pauseUntil,
        sensitiveLockScreenSafe:
          body.sensitiveLockScreenSafe ?? existing.sensitiveLockScreenSafe,
        version: existing.version + 1,
      },
    });

    return { preference: this.toPreferenceView(updated) };
  }

  async registerDevice(
    userId: string,
    body: RegisterDeviceRequest,
  ): Promise<RegisterDeviceResponse> {
    const row = await this.prisma.client.deviceRegistration.upsert({
      where: {
        userId_deviceToken: {
          userId,
          deviceToken: body.deviceToken,
        },
      },
      create: {
        userId,
        deviceToken: body.deviceToken,
        platform: body.platform,
        label: body.label ?? null,
        preferred: body.preferred ?? false,
        pushEnabled: true,
        deactivatedAt: null,
        lastSeenAt: new Date(),
      },
      update: {
        platform: body.platform,
        label: body.label ?? undefined,
        preferred: body.preferred ?? undefined,
        pushEnabled: true,
        deactivatedAt: null,
        lastSeenAt: new Date(),
      },
    });

    return {
      device: this.toDeviceView(row),
      note: SIMULATED_NOTE,
    };
  }

  async deactivateDevice(userId: string, deviceId: string): Promise<{ ok: true }> {
    const row = await this.prisma.client.deviceRegistration.findFirst({
      where: { id: deviceId, userId },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'DEVICE_NOT_FOUND',
        message: 'Device registration not found',
      });
    }
    await this.prisma.client.deviceRegistration.update({
      where: { id: deviceId },
      data: { deactivatedAt: new Date(), pushEnabled: false },
    });
    return { ok: true };
  }

  async listNotifications(userId: string): Promise<ListNotificationsResponse> {
    const rows = await this.prisma.client.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      notifications: rows.map((r) => this.toInAppView(r)),
      note: SIMULATED_NOTE,
    };
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<MarkNotificationReadResponse> {
    const row = await this.prisma.client.inAppNotification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'In-app notification not found',
      });
    }
    const updated =
      row.readAt != null
        ? row
        : await this.prisma.client.inAppNotification.update({
            where: { id: notificationId },
            data: { readAt: new Date() },
          });
    return { notification: this.toInAppView(updated) };
  }

  /**
   * Claim + process due intents in SIMULATED delivery mode.
   * Used by the worker — does not call FCM/APNs.
   */
  async processDueIntents(limit = 20): Promise<{
    processed: number;
    delivered: number;
    suppressed: number;
    failed: number;
    deliveryMode: 'SIMULATED';
  }> {
    const now = new Date();
    const due = await this.prisma.client.notificationIntent.findMany({
      where: {
        status: 'PENDING',
        scheduledAtUtc: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { scheduledAtUtc: 'asc' },
      take: limit,
    });

    let delivered = 0;
    let suppressed = 0;
    let failed = 0;

    for (const intent of due) {
      const claimExpires = new Date(now.getTime() + 60_000);
      const claimed = await this.prisma.client.notificationIntent.updateMany({
        where: { id: intent.id, status: 'PENDING' },
        data: {
          status: 'CLAIMED',
          claimedAt: now,
          claimExpiresAt: claimExpires,
        },
      });
      if (claimed.count !== 1) continue;

      try {
        const preference = await this.ensurePreference(intent.userId);
        const localDate = localDateInTimeZone(preference.timeZone, now);
        const sentToday = await this.prisma.client.inAppNotification.count({
          where: {
            userId: intent.userId,
            createdAt: {
              gte: startOfLocalDayApproxUtc(localDate, preference.timeZone),
            },
            category: {
              in: [...CAP_COUNTED_CATEGORIES] as NotificationCategoryValue[],
            },
          },
        });

        const eligibility = evaluateDispatchEligibility({
          category: intent.category as NotificationCategoryValue,
          categoriesEnabled: asCategoryMap(preference.categoriesEnabled),
          pauseUntil: preference.pauseUntil,
          quietHoursStartLocal: preference.quietHoursStartLocal,
          quietHoursEndLocal: preference.quietHoursEndLocal,
          sleepWindowStartLocal: preference.sleepWindowStartLocal,
          sleepWindowEndLocal: preference.sleepWindowEndLocal,
          timeZone: preference.timeZone,
          alreadySentMotivationalToday: sentToday,
          dailyReminderCap: preference.dailyReminderCap,
          expiresAt: intent.expiresAt,
          now,
        });

        if (!eligibility.eligible) {
          await this.prisma.client.notificationIntent.update({
            where: { id: intent.id },
            data: {
              status: 'SUPPRESSED',
              processedAt: now,
              failureReason: eligibility.reasons.join(','),
              deliveryMode: 'SIMULATED',
            },
          });
          suppressed += 1;
          continue;
        }

        await this.prisma.client.$transaction(async (tx) => {
          await tx.inAppNotification.create({
            data: {
              userId: intent.userId,
              intentId: intent.id,
              category: intent.category,
              title: intent.title,
              body: intent.body,
              ...(intent.payload != null ? { payload: intent.payload } : {}),
              deliveryMode: 'SIMULATED',
            },
          });
          await tx.notificationIntent.update({
            where: { id: intent.id },
            data: {
              status: 'DELIVERED_SIMULATED',
              processedAt: now,
              deliveryMode: 'SIMULATED',
            },
          });
        });
        delivered += 1;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'SIMULATED_DISPATCH_FAILED';
        await this.prisma.client.notificationIntent.update({
          where: { id: intent.id },
          data: {
            status: 'FAILED',
            processedAt: now,
            failureReason: message,
            deliveryMode: 'SIMULATED',
          },
        });
        failed += 1;
      }
    }

    return {
      processed: due.length,
      delivered,
      suppressed,
      failed,
      deliveryMode: 'SIMULATED',
    };
  }

  private async ensurePreference(userId: string) {
    const existing = await this.prisma.client.notificationPreference.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { currentTimeZone: true },
    });

    return this.prisma.client.notificationPreference.create({
      data: {
        userId,
        categoriesEnabled: DEFAULT_CATEGORIES,
        quietHoursStartLocal: DEFAULT_QUIET_HOURS_START,
        quietHoursEndLocal: DEFAULT_QUIET_HOURS_END,
        timeZone: user?.currentTimeZone || 'UTC',
        dailyReminderCap: DEFAULT_DAILY_MOTIVATIONAL_CAP,
        mealRemindersEnabled: false,
        movementBreaksEnabled: false,
        weeklyReviewEnabled: true,
        sensitiveLockScreenSafe: true,
      },
    });
  }

  private toPreferenceView(row: {
    id: string;
    userId: string;
    categoriesEnabled: Prisma.JsonValue;
    preferredWorkoutReminderLocalTime: string | null;
    mealRemindersEnabled: boolean;
    movementBreaksEnabled: boolean;
    weeklyReviewEnabled: boolean;
    tone: string | null;
    quietHoursStartLocal: string;
    quietHoursEndLocal: string;
    sleepWindowStartLocal: string | null;
    sleepWindowEndLocal: string | null;
    workWindowStartLocal: string | null;
    workWindowEndLocal: string | null;
    timeZone: string;
    dailyReminderCap: number;
    pauseUntil: Date | null;
    sensitiveLockScreenSafe: boolean;
    version: number;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      categoriesEnabled: asCategoryMap(row.categoriesEnabled),
      preferredWorkoutReminderLocalTime: row.preferredWorkoutReminderLocalTime,
      mealRemindersEnabled: row.mealRemindersEnabled,
      movementBreaksEnabled: row.movementBreaksEnabled,
      weeklyReviewEnabled: row.weeklyReviewEnabled,
      tone: row.tone,
      quietHoursStartLocal: row.quietHoursStartLocal,
      quietHoursEndLocal: row.quietHoursEndLocal,
      sleepWindowStartLocal: row.sleepWindowStartLocal,
      sleepWindowEndLocal: row.sleepWindowEndLocal,
      workWindowStartLocal: row.workWindowStartLocal,
      workWindowEndLocal: row.workWindowEndLocal,
      timeZone: row.timeZone,
      dailyReminderCap: row.dailyReminderCap,
      pauseUntil: row.pauseUntil?.toISOString() ?? null,
      sensitiveLockScreenSafe: row.sensitiveLockScreenSafe,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toDeviceView(row: {
    id: string;
    platform: string;
    label: string | null;
    pushEnabled: boolean;
    preferred: boolean;
    lastSeenAt: Date;
  }): DeviceRegistration {
    return {
      id: row.id,
      platform: row.platform,
      label: row.label,
      pushEnabled: row.pushEnabled,
      preferred: row.preferred,
      lastSeenAt: row.lastSeenAt.toISOString(),
      deliveryMode: 'SIMULATED',
    };
  }

  private toInAppView(row: {
    id: string;
    category: NotificationCategoryValue | string;
    title: string;
    body: string;
    readAt: Date | null;
    createdAt: Date;
  }): InAppNotification {
    return {
      id: row.id,
      category: row.category as InAppNotification['category'],
      title: row.title,
      body: row.body,
      deliveryMode: 'SIMULATED',
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

function asCategoryMap(
  value: Prisma.JsonValue,
): Partial<Record<NotificationCategoryValue, boolean>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_CATEGORIES };
  }
  return value as Partial<Record<NotificationCategoryValue, boolean>>;
}

/** Approximate UTC lower bound for a local calendar date (generous window). */
function startOfLocalDayApproxUtc(localDate: string, _timeZone: string): Date {
  return new Date(`${localDate}T00:00:00.000Z`);
}
