import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const ContentPackModeSchema = z.enum(['ORIGINAL', 'DBZ_LICENSED']);

export const PublicationStatusSchema = z.enum([
  'DRAFT',
  'UNAVAILABLE',
  'PUBLISHED',
  'WITHDRAWN',
]);

export const CoachingToneSchema = z.enum(['GENTLE', 'BALANCED', 'DIRECT']);

export const CharacterPresentationSummarySchema = z.object({
  id: UuidSchema,
  archetypeKey: z.string().min(1),
  personaKey: z.string().min(1),
  approvedName: z.string().min(1),
  emphasis: z.string().min(1),
  tone: z.string().min(1),
  coachingStyleKey: z.string().nullable(),
  coachingDescription: z.string().min(1),
  sampleGreeting: z.string().min(1),
  artworkKey: z.string().nullable(),
  /** Absolute URL to original product artwork, or null when none is published. */
  artworkUrl: z.string().nullable(),
  mediaFallback: z.boolean(),
  contentPackMode: ContentPackModeSchema,
  publicationStatus: PublicationStatusSchema,
  sortOrder: z.number().int(),
});

export const ListCharactersResponseSchema = z.object({
  presentations: z.array(CharacterPresentationSummarySchema),
  /** True when the selectable coach catalogue is empty. */
  unavailable: z.boolean(),
  retryable: z.boolean(),
});

export const ContentReadinessResponseSchema = z.object({
  contentMode: ContentPackModeSchema,
  locale: z.string().min(1),
  packFound: z.boolean(),
  packKey: z.string().nullable(),
  packPublicationStatus: PublicationStatusSchema.nullable(),
  publishedPresentationCount: z.number().int().nonnegative(),
  missingDependencies: z.array(z.string().min(1)),
  diagnosticCode: z.string().nullable(),
  repairAction: z.string().min(1),
  memberCatalogueAvailable: z.boolean(),
});

export const SelectCharacterRequestSchema = z
  .object({
    presentationId: UuidSchema,
    coachingTone: CoachingToneSchema.optional(),
  })
  .strict();

export const CharacterSelectionSchema = z.object({
  userId: UuidSchema,
  presentationId: UuidSchema,
  selectedAt: IsoDateTimeSchema,
  personaVersion: z.number().int().positive(),
  coachingTone: CoachingToneSchema.nullable(),
  replacementRequired: z.boolean(),
  presentation: CharacterPresentationSummarySchema,
  /** Screening still governs programme eligibility; character never overrides. */
  screeningOutcome: z
    .enum([
      'CLEAR',
      'ADAPTATIONS_REQUIRED',
      'SPECIALIST_SUPPORT',
      'TEMPORARY_TRAINING_PAUSE',
    ])
    .nullable(),
  characterMayBiasTrainingEmphasis: z.boolean(),
});

export type ContentPackMode = z.infer<typeof ContentPackModeSchema>;
export type PublicationStatus = z.infer<typeof PublicationStatusSchema>;
export type CoachingTone = z.infer<typeof CoachingToneSchema>;
export type CharacterPresentationSummary = z.infer<typeof CharacterPresentationSummarySchema>;
export type ListCharactersResponse = z.infer<typeof ListCharactersResponseSchema>;
export type ContentReadinessResponse = z.infer<typeof ContentReadinessResponseSchema>;
export type SelectCharacterRequest = z.infer<typeof SelectCharacterRequestSchema>;
export type CharacterSelection = z.infer<typeof CharacterSelectionSchema>;
