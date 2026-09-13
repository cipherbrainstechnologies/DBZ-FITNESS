import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';
import { PublicationStatusSchema } from './characters.js';

export const MediaAssetTypeSchema = z.enum(['IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT']);
export const QuoteKindSchema = z.enum([
  'ORIGINAL_COPY',
  'VERIFIED_LICENSED_QUOTE',
  'LICENSED_AUDIO_DIALOGUE',
]);

export const QuoteSummarySchema = z.object({
  id: UuidSchema,
  key: z.string().min(1),
  text: z.string().min(1),
  kind: QuoteKindSchema,
  /** Honest attribution — ORIGINAL_COPY is never authentic DBZ dialogue. */
  attribution: z.string().min(1),
  locale: z.string().min(1),
  contextTags: z.array(z.string()).nullable(),
  isAuthenticLicensedDialogue: z.literal(false),
});

export const MediaAssetSummarySchema = z.object({
  id: UuidSchema,
  key: z.string().min(1),
  type: MediaAssetTypeSchema,
  mimeType: z.string().min(1),
  altText: z.string().nullable(),
  durationSeconds: z.number().int().nullable(),
  publicationStatus: PublicationStatusSchema,
  /** Delivery is fixture/simulated until object storage is configured. */
  deliveryMode: z.enum(['FIXTURE_SIMULATED', 'SIGNED_URL_STUB']),
});

export const ContentTodayResponseSchema = z.object({
  quotes: z.array(QuoteSummarySchema),
  media: z.array(MediaAssetSummarySchema),
  contentMode: z.literal('ORIGINAL'),
  note: z.string().min(1),
});

export const ListMediaResponseSchema = z.object({
  assets: z.array(MediaAssetSummarySchema),
  note: z.string().min(1),
});

export const MediaAccessRequestSchema = z
  .object({
    purpose: z.enum(['IN_APP_DISPLAY', 'IN_APP_PLAYBACK']).default('IN_APP_DISPLAY'),
    platform: z.string().min(1).optional(),
    territory: z.string().min(1).optional(),
  })
  .default({ purpose: 'IN_APP_DISPLAY' });

export const MediaAccessResponseSchema = z.object({
  mediaAssetId: UuidSchema,
  /** Fixture or stub URL — never claim real CDN delivery without storage. */
  url: z.string().min(1),
  deliveryMode: z.enum(['FIXTURE_SIMULATED', 'SIGNED_URL_STUB']),
  expiresAt: IsoDateTimeSchema.nullable(),
  label: z.string().min(1),
  eligible: z.boolean(),
  reasons: z.array(z.string()),
});

export type MediaAssetType = z.infer<typeof MediaAssetTypeSchema>;
export type QuoteKind = z.infer<typeof QuoteKindSchema>;
export type QuoteSummary = z.infer<typeof QuoteSummarySchema>;
export type MediaAssetSummary = z.infer<typeof MediaAssetSummarySchema>;
export type ContentTodayResponse = z.infer<typeof ContentTodayResponseSchema>;
export type ListMediaResponse = z.infer<typeof ListMediaResponseSchema>;
export type MediaAccessRequest = z.infer<typeof MediaAccessRequestSchema>;
export type MediaAccessResponse = z.infer<typeof MediaAccessResponseSchema>;
