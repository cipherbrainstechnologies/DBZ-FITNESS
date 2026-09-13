import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const CoachActionTypeSchema = z.enum([
  'RESCHEDULE_SESSION',
  'SELECT_SHORT_SESSION',
  'SWAP_MEAL',
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
