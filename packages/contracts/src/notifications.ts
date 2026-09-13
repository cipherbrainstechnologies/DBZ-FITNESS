import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const NotificationCategorySchema = z.enum([
  'WORKOUT_REMINDER',
  'MEAL_REMINDER',
  'WEEKLY_REVIEW',
  'MOVEMENT_BREAK',
  'MOTIVATION',
  'ACCOUNT_SECURITY',
]);

export const CategoriesEnabledSchema = z
  .object({
    WORKOUT_REMINDER: z.boolean().optional(),
    MEAL_REMINDER: z.boolean().optional(),
    WEEKLY_REVIEW: z.boolean().optional(),
    MOVEMENT_BREAK: z.boolean().optional(),
    MOTIVATION: z.boolean().optional(),
    ACCOUNT_SECURITY: z.boolean().optional(),
  })
  .strict();

const HhMmSchema = z.string().regex(/^([01]?\d|2[0-3]):([0-5]\d)$/);

export const NotificationPreferenceSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  categoriesEnabled: CategoriesEnabledSchema,
  preferredWorkoutReminderLocalTime: HhMmSchema.nullable(),
  mealRemindersEnabled: z.boolean(),
  movementBreaksEnabled: z.boolean(),
  weeklyReviewEnabled: z.boolean(),
  tone: z.string().nullable(),
  quietHoursStartLocal: HhMmSchema,
  quietHoursEndLocal: HhMmSchema,
  sleepWindowStartLocal: HhMmSchema.nullable(),
  sleepWindowEndLocal: HhMmSchema.nullable(),
  workWindowStartLocal: HhMmSchema.nullable(),
  workWindowEndLocal: HhMmSchema.nullable(),
  timeZone: z.string().min(1),
  dailyReminderCap: z.number().int().min(0).max(20),
  pauseUntil: IsoDateTimeSchema.nullable(),
  sensitiveLockScreenSafe: z.boolean(),
  version: z.number().int().positive(),
  updatedAt: IsoDateTimeSchema,
});

export const GetNotificationPreferencesResponseSchema = z.object({
  preference: NotificationPreferenceSchema,
});

export const UpdateNotificationPreferencesRequestSchema = z
  .object({
    categoriesEnabled: CategoriesEnabledSchema.optional(),
    preferredWorkoutReminderLocalTime: HhMmSchema.nullable().optional(),
    mealRemindersEnabled: z.boolean().optional(),
    movementBreaksEnabled: z.boolean().optional(),
    weeklyReviewEnabled: z.boolean().optional(),
    tone: z.string().max(64).nullable().optional(),
    quietHoursStartLocal: HhMmSchema.optional(),
    quietHoursEndLocal: HhMmSchema.optional(),
    sleepWindowStartLocal: HhMmSchema.nullable().optional(),
    sleepWindowEndLocal: HhMmSchema.nullable().optional(),
    workWindowStartLocal: HhMmSchema.nullable().optional(),
    workWindowEndLocal: HhMmSchema.nullable().optional(),
    timeZone: z.string().min(1).max(64).optional(),
    dailyReminderCap: z.number().int().min(0).max(20).optional(),
    pauseUntil: IsoDateTimeSchema.nullable().optional(),
    sensitiveLockScreenSafe: z.boolean().optional(),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const DeviceRegistrationSchema = z.object({
  id: UuidSchema,
  platform: z.string().min(1),
  label: z.string().nullable(),
  pushEnabled: z.boolean(),
  preferred: z.boolean(),
  lastSeenAt: IsoDateTimeSchema,
  /** Push delivery remains SIMULATED until FCM/APNs configured. */
  deliveryMode: z.literal('SIMULATED'),
});

export const RegisterDeviceRequestSchema = z
  .object({
    deviceToken: z.string().min(8).max(512),
    platform: z.enum(['ios', 'android', 'web', 'fixture']),
    label: z.string().max(128).optional(),
    preferred: z.boolean().optional(),
  })
  .strict();

export const RegisterDeviceResponseSchema = z.object({
  device: DeviceRegistrationSchema,
  note: z.string().min(1),
});

export const InAppNotificationSchema = z.object({
  id: UuidSchema,
  category: NotificationCategorySchema,
  title: z.string().min(1),
  body: z.string().min(1),
  deliveryMode: z.literal('SIMULATED'),
  readAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
});

export const ListNotificationsResponseSchema = z.object({
  notifications: z.array(InAppNotificationSchema),
  note: z.string().min(1),
});

export const MarkNotificationReadResponseSchema = z.object({
  notification: InAppNotificationSchema,
});

export type NotificationCategory = z.infer<typeof NotificationCategorySchema>;
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
export type GetNotificationPreferencesResponse = z.infer<
  typeof GetNotificationPreferencesResponseSchema
>;
export type UpdateNotificationPreferencesRequest = z.infer<
  typeof UpdateNotificationPreferencesRequestSchema
>;
export type DeviceRegistration = z.infer<typeof DeviceRegistrationSchema>;
export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequestSchema>;
export type RegisterDeviceResponse = z.infer<typeof RegisterDeviceResponseSchema>;
export type InAppNotification = z.infer<typeof InAppNotificationSchema>;
export type ListNotificationsResponse = z.infer<typeof ListNotificationsResponseSchema>;
export type MarkNotificationReadResponse = z.infer<
  typeof MarkNotificationReadResponseSchema
>;
