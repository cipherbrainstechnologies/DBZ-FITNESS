import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const CoachActionTypeSchema = z.enum([
  'START_WORKOUT',
  'PREVIEW_SHORTER_SESSION',
  'SELECT_SHORT_SESSION',
  'RESCHEDULE_SESSION',
  'PREVIEW_MEAL_SWAP',
  'SWAP_MEAL',
  'LOG_CHECK_IN',
  'REVIEW_WEEK',
  'PROPOSE_FUTURE_PLAN_ADJUSTMENT',
  'UPDATE_NEXT_WEEK_AVAILABILITY',
]);

export const CoachSafetyStatusSchema = z.enum(['SAFE', 'REFUSED', 'FALLBACK']);

export const CoachProviderModeSchema = z.enum(['fixture', 'openai']);

export const CoachProposedActionSchema = z.object({
  actionType: CoachActionTypeSchema,
  payload: z.record(z.string(), z.unknown()),
});

export const CoachStructuredResponseSchema = z.object({
  messageText: z.string().min(1),
  tone: z.string().min(1),
  referencedExerciseIds: z.array(z.string().min(1)),
  referencedRecipeIds: z.array(z.string().min(1)),
  referencedPlanVersion: z.string().nullable(),
  proposedAction: CoachProposedActionSchema.nullable(),
  safetyStatus: CoachSafetyStatusSchema,
  limitations: z.array(z.string().min(1)),
  providerMode: CoachProviderModeSchema,
  inventsNutritionNumbers: z.literal(false),
});

export const PostCoachMessageRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(4000),
    conversationId: UuidSchema.optional(),
    tone: z.string().max(64).optional(),
  })
  .strict();

export const CoachActionProposalSchema = z.object({
  id: UuidSchema,
  actionType: CoachActionTypeSchema,
  status: z.enum(['PENDING', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'FAILED_SAFETY']),
  validatedPayload: z.record(z.string(), z.unknown()),
  safetyStatus: CoachSafetyStatusSchema,
  expiresAt: IsoDateTimeSchema,
  rejectionReason: z.string().nullable(),
  createdAt: IsoDateTimeSchema,
});

export const PostCoachMessageResponseSchema = z.object({
  conversationId: UuidSchema,
  messageId: UuidSchema,
  response: CoachStructuredResponseSchema,
  proposal: CoachActionProposalSchema.nullable(),
  note: z.string().min(1),
});

export const ConfirmCoachActionResponseSchema = z.object({
  proposal: CoachActionProposalSchema,
  applied: z.boolean(),
  note: z.string().min(1),
});

export const RejectCoachActionResponseSchema = z.object({
  proposal: CoachActionProposalSchema,
  note: z.string().min(1),
});

export const CoachContextPersonaSchema = z.object({
  presentationId: UuidSchema,
  archetypeKey: z.string().min(1),
  personaKey: z.string().min(1),
  displayName: z.string().min(1),
  personaVersion: z.number().int().positive(),
  coachingTone: z.enum(['GENTLE', 'BALANCED', 'DIRECT']),
  artworkUrl: z.string().nullable(),
  mediaFallback: z.boolean(),
});

export const CoachMemberContextViewSchema = z.object({
  persona: CoachContextPersonaSchema.nullable(),
  primaryGoals: z.array(z.string()),
  experience: z.string().nullable(),
  equipment: z.array(z.string()),
  availableMinutes: z.number().int().nullable(),
  foodPattern: z.string().nullable(),
  allergies: z.array(z.string()),
  ingredientExclusions: z.array(z.string()),
  screeningOutcome: z.string().nullable(),
  screeningRestrictions: z.array(z.string()),
  timeZone: z.string().min(1),
  notificationConsent: z.boolean().nullable(),
  dataFreshness: z.object({
    hasPlan: z.boolean(),
    hasMealPlan: z.boolean(),
    hasRecentWorkoutLog: z.boolean(),
    hasRecentMealLog: z.boolean(),
    unknownInputs: z.array(z.string()),
  }),
});

export const CoachBriefingActionSchema = z.object({
  actionType: CoachActionTypeSchema,
  label: z.string().min(1),
  href: z.string().min(1),
  appliedClaim: z.literal(false),
  payload: z.record(z.string(), z.unknown()),
});

export const CoachBriefingResponseSchema = z.object({
  persona: CoachContextPersonaSchema,
  messageText: z.string().min(1),
  situation: z.string().min(1),
  action: CoachBriefingActionSchema.nullable(),
  limitations: z.array(z.string().min(1)),
  providerMode: CoachProviderModeSchema,
});

export const CoachMemoryEntrySchema = z.object({
  id: UuidSchema,
  key: z.string().min(1),
  valueText: z.string().min(1),
  sourceRef: z.string().nullable(),
  occurredAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ListCoachMemoryResponseSchema = z.object({
  entries: z.array(CoachMemoryEntrySchema),
});

export const UpsertCoachMemoryRequestSchema = z
  .object({
    key: z.string().trim().min(1).max(64),
    valueText: z.string().trim().min(1).max(500),
    sourceRef: z.string().trim().max(128).optional(),
  })
  .strict();

export type CoachActionType = z.infer<typeof CoachActionTypeSchema>;
export type CoachSafetyStatus = z.infer<typeof CoachSafetyStatusSchema>;
export type CoachProviderMode = z.infer<typeof CoachProviderModeSchema>;
export type CoachProposedAction = z.infer<typeof CoachProposedActionSchema>;
export type CoachStructuredResponse = z.infer<typeof CoachStructuredResponseSchema>;
export type PostCoachMessageRequest = z.infer<typeof PostCoachMessageRequestSchema>;
export type CoachActionProposal = z.infer<typeof CoachActionProposalSchema>;
export type PostCoachMessageResponse = z.infer<typeof PostCoachMessageResponseSchema>;
export type ConfirmCoachActionResponse = z.infer<typeof ConfirmCoachActionResponseSchema>;
export type RejectCoachActionResponse = z.infer<typeof RejectCoachActionResponseSchema>;
export type CoachMemberContextView = z.infer<typeof CoachMemberContextViewSchema>;
export type CoachBriefingResponse = z.infer<typeof CoachBriefingResponseSchema>;
export type CoachMemoryEntry = z.infer<typeof CoachMemoryEntrySchema>;
export type ListCoachMemoryResponse = z.infer<typeof ListCoachMemoryResponseSchema>;
export type UpsertCoachMemoryRequest = z.infer<typeof UpsertCoachMemoryRequestSchema>;
