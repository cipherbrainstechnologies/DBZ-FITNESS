import { z } from 'zod';

import { PublicationStatusSchema } from './characters.js';
import { IsoDateTimeSchema, UuidSchema } from './common.js';
import { ScreeningOutcomeSchema } from './onboarding.js';

export const TrainingEligibilityStatusSchema = z.enum([
  'GENERAL_PROGRAMME_ELIGIBLE',
  'ADAPTED_CONTENT_REQUIRED',
  'PROFESSIONAL_GUIDANCE_REQUIRED',
  'TEMPORARY_TRAINING_PAUSE',
]);

export const ContentReviewStatusSchema = z.enum([
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
]);

export const PlannedSessionStatusSchema = z.enum([
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'SHORTENED',
  'ABANDONED',
  'CANCELLED',
]);

export const WorkoutSessionStatusSchema = z.enum([
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
]);

export const ExerciseSummarySchema = z.object({
  id: UuidSchema,
  key: z.string().min(1),
  name: z.string().min(1),
  movementPattern: z.string().min(1),
  equipment: z.array(z.string()),
  difficulty: z.string().min(1),
  instructions: z.string(),
  restrictions: z.array(z.string()),
  adaptations: z.array(z.string()).nullable().optional(),
  preferenceTags: z.array(z.string()).nullable().optional(),
  reviewStatus: ContentReviewStatusSchema,
  publicationStatus: PublicationStatusSchema,
});

export const ListExercisesResponseSchema = z.object({
  exercises: z.array(ExerciseSummarySchema),
});

export const PreviewExerciseSlotSchema = z.object({
  exerciseId: UuidSchema,
  sortOrder: z.number().int().nonnegative(),
  priority: z.enum(['CORE', 'OPTIONAL']),
  sets: z.number().int().positive(),
  repMin: z.number().int().positive(),
  repMax: z.number().int().positive(),
  restSeconds: z.number().int().nonnegative(),
  estimatedMinutes: z.number().positive(),
});

export const PreviewSessionSchema = z.object({
  templateSessionId: UuidSchema,
  dayPattern: z.string().min(1),
  estimatedDuration: z.number().int().positive(),
  sortOrder: z.number().int().nonnegative(),
  exercises: z.array(PreviewExerciseSlotSchema),
});

export const CandidatePlanSchema = z.object({
  templateId: UuidSchema,
  templateKey: z.string().min(1),
  templateVersion: z.number().int().positive(),
  templateName: z.string().min(1),
  weeklySessions: z.array(PreviewSessionSchema),
  estimatedWeeklyMinutes: z.number().int().nonnegative(),
});

export const PreviewTrainingPlanRequestSchema = z
  .object({
    profileVersionId: UuidSchema,
    screeningRecordId: UuidSchema,
    characterArchetypeId: UuidSchema.optional().nullable(),
    programmePreference: z.string().min(1).max(64).optional().nullable(),
    startLocalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timeZone: z.string().min(1).max(64),
  })
  .strict();

export const PreviewTrainingPlanResponseSchema = z.object({
  eligibilityStatus: TrainingEligibilityStatusSchema,
  candidatePlan: CandidatePlanSchema.nullable(),
  explanationCodes: z.array(z.string()),
  warnings: z.array(z.string()),
  policyVersion: z.string().min(1),
  previewToken: z.string().min(1).nullable(),
  expiresAt: IsoDateTimeSchema.nullable(),
  screeningOutcome: ScreeningOutcomeSchema,
});

export const ActivateTrainingPlanRequestSchema = z
  .object({
    previewToken: z.string().min(1).max(128),
  })
  .strict();

export const TrainingPlanSummarySchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  version: z.number().int().positive(),
  templateId: UuidSchema,
  templateKey: z.string().min(1),
  templateVersion: z.number().int().positive(),
  policyVersion: z.string().min(1),
  explanationCodes: z.array(z.string()),
  effectiveFrom: IsoDateTimeSchema,
  status: z.enum(['ACTIVE', 'SUPERSEDED', 'CANCELLED']),
});

export const ActivateTrainingPlanResponseSchema = z.object({
  plan: TrainingPlanSummarySchema,
  plannedSessions: z.array(
    z.object({
      id: UuidSchema,
      localDate: z.string(),
      timeZone: z.string(),
      durationBudget: z.number().int().positive(),
      status: PlannedSessionStatusSchema,
    }),
  ),
});

export const PlannedSessionSchema = z.object({
  id: UuidSchema,
  planId: UuidSchema,
  localDate: z.string(),
  timeZone: z.string(),
  durationBudget: z.number().int().positive(),
  status: PlannedSessionStatusSchema,
  shortenedFromDuration: z.number().int().positive().nullable().optional(),
  explanationCodes: z.array(z.string()).nullable().optional(),
  prescriptionSnapshot: z.unknown(),
});

export const ListPlannedSessionsResponseSchema = z.object({
  sessions: z.array(PlannedSessionSchema),
});

export const ShortenPlannedSessionRequestSchema = z
  .object({
    targetDurationMinutes: z.number().int().min(10).max(180),
  })
  .strict();

export const ShortenPlannedSessionResponseSchema = z.object({
  session: PlannedSessionSchema,
});

export const StartWorkoutSessionRequestSchema = z
  .object({
    plannedSessionId: UuidSchema,
  })
  .strict();

export const WorkoutSetSchema = z.object({
  id: UuidSchema,
  exerciseId: UuidSchema,
  setIndex: z.number().int().nonnegative(),
  repetitions: z.number().int().nonnegative().nullable().optional(),
  resistanceKg: z.number().nonnegative().nullable().optional(),
  durationSeconds: z.number().int().nonnegative().nullable().optional(),
  effort: z.string().max(32).nullable().optional(),
  completed: z.boolean(),
  version: z.number().int().positive(),
});

export const WorkoutSessionSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  plannedSessionId: UuidSchema,
  planVersion: z.number().int().positive(),
  status: WorkoutSessionStatusSchema,
  startedAt: IsoDateTimeSchema,
  finishedAt: IsoDateTimeSchema.nullable(),
  actualDuration: z.number().int().nonnegative().nullable(),
  version: z.number().int().positive(),
  sets: z.array(WorkoutSetSchema),
});

export const StartWorkoutSessionResponseSchema = z.object({
  session: WorkoutSessionSchema,
});

export const UpdateWorkoutSetRequestSchema = z
  .object({
    repetitions: z.number().int().nonnegative().optional(),
    resistanceKg: z.number().nonnegative().max(1000).optional(),
    durationSeconds: z.number().int().nonnegative().max(86_400).optional(),
    effort: z.string().min(1).max(32).optional(),
    completed: z.boolean().optional(),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.repetitions !== undefined ||
      v.resistanceKg !== undefined ||
      v.durationSeconds !== undefined ||
      v.effort !== undefined ||
      v.completed !== undefined,
    { message: 'At least one set field must be provided' },
  );

export const UpdateWorkoutSetResponseSchema = z.object({
  set: WorkoutSetSchema,
});

export const CompleteWorkoutSessionRequestSchema = z
  .object({
    actualDurationMinutes: z.number().int().positive().max(600).optional(),
  })
  .strict()
  .default({});

export const CompleteWorkoutSessionResponseSchema = z.object({
  session: WorkoutSessionSchema,
  xpAward: z.object({
    status: z.enum([
      'AWARDED',
      'ALREADY_AWARDED',
      'CAPPED_TO_ZERO',
      'REJECTED_INELIGIBLE',
    ]),
    awarded: z.number().int(),
    category: z
      .enum([
        'MAIN_MISSION',
        'MEAL_REFLECTION',
        'RECOVERY_CHECK_IN',
        'WELLBEING_HABIT',
      ])
      .nullable(),
    eventType: z.string(),
    sourceEntityId: z.string(),
    policyVersion: z.number().int(),
    ledgerEntryId: z.string().uuid().nullable(),
    reason: z.string(),
  }),
});

export const AbandonWorkoutSessionRequestSchema = z
  .object({
    reason: z.string().max(200).optional(),
  })
  .strict()
  .default({});

export const AbandonWorkoutSessionResponseSchema = z.object({
  session: WorkoutSessionSchema,
});

export const CurrentTrainingPlanResponseSchema = z.object({
  plan: TrainingPlanSummarySchema.nullable(),
});

export type PreviewTrainingPlanRequest = z.infer<typeof PreviewTrainingPlanRequestSchema>;
export type PreviewTrainingPlanResponse = z.infer<typeof PreviewTrainingPlanResponseSchema>;
export type ActivateTrainingPlanRequest = z.infer<typeof ActivateTrainingPlanRequestSchema>;
export type ActivateTrainingPlanResponse = z.infer<typeof ActivateTrainingPlanResponseSchema>;
export type CurrentTrainingPlanResponse = z.infer<typeof CurrentTrainingPlanResponseSchema>;
export type ShortenPlannedSessionRequest = z.infer<typeof ShortenPlannedSessionRequestSchema>;
export type ShortenPlannedSessionResponse = z.infer<typeof ShortenPlannedSessionResponseSchema>;
export type StartWorkoutSessionRequest = z.infer<typeof StartWorkoutSessionRequestSchema>;
export type StartWorkoutSessionResponse = z.infer<typeof StartWorkoutSessionResponseSchema>;
export type UpdateWorkoutSetRequest = z.infer<typeof UpdateWorkoutSetRequestSchema>;
export type UpdateWorkoutSetResponse = z.infer<typeof UpdateWorkoutSetResponseSchema>;
export type CompleteWorkoutSessionRequest = z.infer<typeof CompleteWorkoutSessionRequestSchema>;
export type CompleteWorkoutSessionResponse = z.infer<typeof CompleteWorkoutSessionResponseSchema>;
export type AbandonWorkoutSessionRequest = z.infer<typeof AbandonWorkoutSessionRequestSchema>;
export type AbandonWorkoutSessionResponse = z.infer<typeof AbandonWorkoutSessionResponseSchema>;
export type ExerciseSummary = z.infer<typeof ExerciseSummarySchema>;
export type TrainingPlanSummary = z.infer<typeof TrainingPlanSummarySchema>;
export type PlannedSession = z.infer<typeof PlannedSessionSchema>;
export type ListPlannedSessionsResponse = z.infer<typeof ListPlannedSessionsResponseSchema>;
export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>;
export type WorkoutSet = z.infer<typeof WorkoutSetSchema>;
