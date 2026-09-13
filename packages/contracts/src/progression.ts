import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const XpAwardCategorySchema = z.enum([
  'MAIN_MISSION',
  'MEAL_REFLECTION',
  'RECOVERY_CHECK_IN',
  'WELLBEING_HABIT',
]);

export const XpLedgerEventTypeSchema = z.enum([
  'WORKOUT_COMPLETE',
  'REST_MISSION',
  'CONSISTENCY_CHECK_IN',
  'MEAL_REFLECTION',
  'RECOVERY_CHECK_IN',
  'WELLBEING_HABIT',
  'COMPENSATING_CORRECTION',
]);

export const XpAwardOutcomeSchema = z.object({
  status: z.enum([
    'AWARDED',
    'ALREADY_AWARDED',
    'CAPPED_TO_ZERO',
    'REJECTED_INELIGIBLE',
  ]),
  awarded: z.number().int(),
  category: XpAwardCategorySchema.nullable(),
  eventType: z.string(),
  sourceEntityId: z.string(),
  policyVersion: z.number().int(),
  ledgerEntryId: UuidSchema.nullable(),
  reason: z.string(),
});

export const ProgressSummaryResponseSchema = z.object({
  totalXp: z.number().int().nonnegative(),
  gameLevel: z.number().int().positive(),
  xpTowardNextLevel: z.number().int().nonnegative(),
  xpPerLevel: z.number().int().positive(),
  policyVersion: z.number().int(),
  /** Honest disclaimer: cosmetic game level is not a health outcome. */
  gameLevelIsNotHealth: z.literal(true),
  todayLocalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1),
  todayByCategory: z.array(
    z.object({
      category: XpAwardCategorySchema,
      awardedAmount: z.number().int().nonnegative(),
      categoryCap: z.number().int().nonnegative(),
    }),
  ),
  todayTotal: z.number().int().nonnegative(),
  dailyMaximum: z.number().int().positive(),
  milestoneUnlocks: z.array(
    z.object({
      milestoneDefinitionId: z.string().min(1),
      unlockedAt: IsoDateTimeSchema,
      levelAtUnlock: z.number().int().nullable(),
      totalXpAtUnlock: z.number().int().nullable(),
    }),
  ),
});

export const XpLedgerEntrySchema = z.object({
  id: UuidSchema,
  eventType: XpLedgerEventTypeSchema,
  sourceEntityId: z.string().min(1),
  delta: z.number().int(),
  category: XpAwardCategorySchema,
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1),
  policyVersion: z.number().int(),
  reason: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
});

export const ProgressXpLedgerResponseSchema = z.object({
  entries: z.array(XpLedgerEntrySchema),
  policyVersion: z.number().int(),
  gameLevelIsNotHealth: z.literal(true),
});

export const ProgressHistoryItemSchema = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalDelta: z.number().int(),
  entryCount: z.number().int().nonnegative(),
  categories: z.array(
    z.object({
      category: XpAwardCategorySchema,
      delta: z.number().int(),
    }),
  ),
});

export const ProgressHistoryResponseSchema = z.object({
  days: z.array(ProgressHistoryItemSchema),
  gameLevelIsNotHealth: z.literal(true),
});

export type XpAwardCategory = z.infer<typeof XpAwardCategorySchema>;
export type XpLedgerEventType = z.infer<typeof XpLedgerEventTypeSchema>;
export type XpAwardOutcome = z.infer<typeof XpAwardOutcomeSchema>;
export type ProgressSummaryResponse = z.infer<typeof ProgressSummaryResponseSchema>;
export type XpLedgerEntry = z.infer<typeof XpLedgerEntrySchema>;
export type ProgressXpLedgerResponse = z.infer<typeof ProgressXpLedgerResponseSchema>;
export type ProgressHistoryItem = z.infer<typeof ProgressHistoryItemSchema>;
export type ProgressHistoryResponse = z.infer<typeof ProgressHistoryResponseSchema>;
