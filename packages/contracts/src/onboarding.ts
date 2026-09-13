import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';

/** Onboarding steps aligned with packages/domain (docs/02). */
export const OnboardingStepSchema = z.enum([
  'WELCOME',
  'GOALS',
  'EXPERIENCE',
  'AVAILABILITY',
  'SCREENING',
  'DIET',
  'MEASUREMENTS',
  'CHARACTER',
  'NOTIFICATIONS',
  'PLAN_PREVIEW',
  'CONFIRM',
]);

export const ScreeningOutcomeSchema = z.enum([
  'CLEAR',
  'ADAPTATIONS_REQUIRED',
  'SPECIALIST_SUPPORT',
  'TEMPORARY_TRAINING_PAUSE',
]);

export const ConsentPurposeSchema = z.enum([
  'TERMS_OF_SERVICE',
  'PRIVACY_POLICY',
  'HEALTH_DATA_PROCESSING',
  'MARKETING',
  'ANALYTICS',
]);

export const DietaryPatternSchema = z.enum([
  'VEGETARIAN',
  'EGGETARIAN',
  'NON_VEGETARIAN',
  'VEGAN',
]);

const WelcomePayloadSchema = z
  .object({
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    consents: z
      .array(
        z.object({
          purpose: ConsentPurposeSchema,
          policyVersion: z.string().min(1).max(64),
          granted: z.literal(true),
        }),
      )
      .min(1)
      .max(10),
  })
  .strict();

const GoalsPayloadSchema = z
  .object({
    goals: z.array(z.string().min(1).max(64)).min(1).max(20),
    motivation: z.string().trim().max(500).optional(),
  })
  .strict();

const ExperiencePayloadSchema = z
  .object({
    experience: z.enum(['BEGINNER', 'RETURNING', 'INTERMEDIATE', 'ADVANCED']),
    currentActivityNotes: z.string().trim().max(500).optional(),
  })
  .strict();

const AvailabilityPayloadSchema = z
  .object({
    weeklyAvailabilityMinutes: z.number().int().nonnegative().max(7 * 24 * 60),
    availableDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).max(7),
    sessionDurationMinutes: z.number().int().positive().max(180).optional(),
    equipment: z.array(z.string().min(1).max(64)).max(40),
    accessPreferences: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

/** Member-reported screening signals — not a diagnosis. */
const ScreeningPayloadSchema = z
  .object({
    questionnaireVersion: z.string().min(1).max(64).default('screening-v1'),
    reportsUrgentSymptoms: z.boolean().optional(),
    reportsChestPain: z.boolean().optional(),
    reportsFainting: z.boolean().optional(),
    reportsSevereBreathingDifficulty: z.boolean().optional(),
    reportsActiveInjuryAffectingExercise: z.boolean().optional(),
    reportsClinicianRestriction: z.boolean().optional(),
    requiresMovementAdaptations: z.boolean().optional(),
    requiresTemporaryPause: z.boolean().optional(),
  })
  .strict();

const DietPayloadSchema = z
  .object({
    pattern: DietaryPatternSchema,
    ingredientExclusions: z.array(z.string().min(1).max(64)).max(40).optional(),
    allergyRestrictions: z.array(z.string().min(1).max(64)).max(40).optional(),
    cuisinePreferences: z.array(z.string().min(1).max(64)).max(20).optional(),
    budgetPreference: z.string().min(1).max(64).optional(),
    preparationConstraints: z.array(z.string().min(1).max(64)).max(20).optional(),
  })
  .strict();

const MeasurementsPayloadSchema = z
  .object({
    skip: z.boolean().optional(),
    heightCm: z.number().positive().max(300).optional(),
    weightKg: z.number().positive().max(500).optional(),
    nutritionCalculationPreference: z
      .enum(['HABIT_ONLY', 'TARGETS_WHEN_ELIGIBLE', 'SKIP'])
      .optional(),
  })
  .strict();

const CharacterPayloadSchema = z
  .object({
    presentationId: UuidSchema,
  })
  .strict();

const NotificationsPayloadSchema = z
  .object({
    enablePush: z.boolean(),
    enableEmail: z.boolean().optional(),
    quietHoursLocal: z
      .object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
      })
      .optional(),
  })
  .strict();

const PlanPreviewPayloadSchema = z
  .object({
    acknowledgedExplanation: z.literal(true),
  })
  .strict();

const ConfirmPayloadSchema = z
  .object({
    confirm: z.literal(true),
  })
  .strict();

export const SaveOnboardingStepSchema = z.discriminatedUnion('step', [
  z.object({ step: z.literal('WELCOME'), payload: WelcomePayloadSchema }),
  z.object({ step: z.literal('GOALS'), payload: GoalsPayloadSchema }),
  z.object({ step: z.literal('EXPERIENCE'), payload: ExperiencePayloadSchema }),
  z.object({ step: z.literal('AVAILABILITY'), payload: AvailabilityPayloadSchema }),
  z.object({ step: z.literal('SCREENING'), payload: ScreeningPayloadSchema }),
  z.object({ step: z.literal('DIET'), payload: DietPayloadSchema }),
  z.object({ step: z.literal('MEASUREMENTS'), payload: MeasurementsPayloadSchema }),
  z.object({ step: z.literal('CHARACTER'), payload: CharacterPayloadSchema }),
  z.object({ step: z.literal('NOTIFICATIONS'), payload: NotificationsPayloadSchema }),
  z.object({ step: z.literal('PLAN_PREVIEW'), payload: PlanPreviewPayloadSchema }),
  z.object({ step: z.literal('CONFIRM'), payload: ConfirmPayloadSchema }),
]);

export const OnboardingProgressSchema = z.object({
  userId: UuidSchema,
  currentStep: OnboardingStepSchema,
  completedSteps: z.array(OnboardingStepSchema),
  completedAt: IsoDateTimeSchema.nullable(),
  updatedAt: IsoDateTimeSchema,
  screeningOutcome: ScreeningOutcomeSchema.nullable(),
  screeningRestrictions: z.array(z.string()).nullable(),
  /** Latest screening row id — required for training plan preview. */
  screeningRecordId: UuidSchema.nullable(),
  hasDietPreference: z.boolean(),
  hasCharacterSelection: z.boolean(),
  contentMode: z.enum(['ORIGINAL', 'DBZ_LICENSED']),
});

export const CompleteOnboardingResponseSchema = z.object({
  progress: OnboardingProgressSchema,
  completed: z.literal(true),
});

export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;
export type ScreeningOutcome = z.infer<typeof ScreeningOutcomeSchema>;
export type SaveOnboardingStep = z.infer<typeof SaveOnboardingStepSchema>;
export type OnboardingProgress = z.infer<typeof OnboardingProgressSchema>;
export type CompleteOnboardingResponse = z.infer<typeof CompleteOnboardingResponseSchema>;
