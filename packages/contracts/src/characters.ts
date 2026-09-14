import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const ContentPackModeSchema = z.enum(['ORIGINAL', 'DBZ_LICENSED']);

export const PublicationStatusSchema = z.enum([
  'DRAFT',
  'UNAVAILABLE',
  'PUBLISHED',
  'WITHDRAWN',
]);

export const CharacterPresentationSummarySchema = z.object({
  id: UuidSchema,
  archetypeKey: z.string().min(1),
  approvedName: z.string().min(1),
  emphasis: z.string().min(1),
  tone: z.string().min(1),
  coachingStyleKey: z.string().nullable(),
  artworkKey: z.string().nullable(),
  /** Absolute URL to original product artwork, or null when none is published. */
  artworkUrl: z.string().nullable(),
  /** Training-emphasis inspiration label — not a licensed character identity. */
  inspiredByLabel: z.string().nullable(),
  contentPackMode: ContentPackModeSchema,
  publicationStatus: PublicationStatusSchema,
  sortOrder: z.number().int(),
});

export const ListCharactersResponseSchema = z.object({
  contentMode: ContentPackModeSchema,
  presentations: z.array(CharacterPresentationSummarySchema),
  /** True when active mode has no deliverable presentations (e.g. DRAFT licensed pack). */
  unavailable: z.boolean(),
  message: z.string().optional(),
});

export const SelectCharacterRequestSchema = z
  .object({
    presentationId: UuidSchema,
  })
  .strict();

export const CharacterSelectionSchema = z.object({
  userId: UuidSchema,
  presentationId: UuidSchema,
  selectedAt: IsoDateTimeSchema,
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
export type CharacterPresentationSummary = z.infer<typeof CharacterPresentationSummarySchema>;
export type ListCharactersResponse = z.infer<typeof ListCharactersResponseSchema>;
export type SelectCharacterRequest = z.infer<typeof SelectCharacterRequestSchema>;
export type CharacterSelection = z.infer<typeof CharacterSelectionSchema>;
