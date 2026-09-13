import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';

export const DataExportJobStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'READY_FIXTURE',
  'FAILED',
  'EXPIRED',
]);

export const CreateDataExportRequestSchema = z
  .object({
    /** Optional scope hint; fixture export always packages a dry-run manifest. */
    scope: z.enum(['FULL_ACCOUNT', 'PROFILE_ONLY']).optional().default('FULL_ACCOUNT'),
  })
  .strict();

export const DataExportJobSchema = z.object({
  id: UuidSchema,
  status: DataExportJobStatusSchema,
  scope: z.enum(['FULL_ACCOUNT', 'PROFILE_ONLY']),
  requestedAt: IsoDateTimeSchema,
  completedAt: IsoDateTimeSchema.nullable(),
  expiresAt: IsoDateTimeSchema.nullable(),
  /** Fixture dry-run URL only until object storage is configured. */
  downloadUrl: z.string().nullable(),
  downloadMode: z.literal('FIXTURE_DRY_RUN'),
  failureReason: z.string().nullable(),
  note: z.string().min(1),
});

export const CreateDataExportResponseSchema = z.object({
  job: DataExportJobSchema,
});

export const GetDataExportResponseSchema = z.object({
  job: DataExportJobSchema,
});

export const AccountDeletionStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'SCHEDULED_FIXTURE',
  'CANCELLED',
  'COMPLETED_FIXTURE',
  'FAILED',
]);

export const CreateDeletionRequestSchema = z
  .object({
    /** Re-auth password required — never logged. */
    password: z.string().min(8).max(128),
    reason: z.string().max(500).optional(),
  })
  .strict();

export const AccountDeletionRequestSchema = z.object({
  id: UuidSchema,
  status: AccountDeletionStatusSchema,
  requestedAt: IsoDateTimeSchema,
  scheduledFor: IsoDateTimeSchema.nullable(),
  processedAt: IsoDateTimeSchema.nullable(),
  /** Always true until production wipe path is authorised and storage-ready. */
  dryRun: z.literal(true),
  failureReason: z.string().nullable(),
  note: z.string().min(1),
});

export const CreateDeletionResponseSchema = z.object({
  request: AccountDeletionRequestSchema,
});

export const GetDeletionStatusResponseSchema = z.object({
  request: AccountDeletionRequestSchema.nullable(),
  note: z.string().min(1),
});

export type DataExportJobStatus = z.infer<typeof DataExportJobStatusSchema>;
export type CreateDataExportRequest = z.infer<typeof CreateDataExportRequestSchema>;
export type DataExportJob = z.infer<typeof DataExportJobSchema>;
export type CreateDataExportResponse = z.infer<typeof CreateDataExportResponseSchema>;
export type GetDataExportResponse = z.infer<typeof GetDataExportResponseSchema>;
export type AccountDeletionStatus = z.infer<typeof AccountDeletionStatusSchema>;
export type CreateDeletionRequest = z.infer<typeof CreateDeletionRequestSchema>;
export type AccountDeletionRequest = z.infer<typeof AccountDeletionRequestSchema>;
export type CreateDeletionResponse = z.infer<typeof CreateDeletionResponseSchema>;
export type GetDeletionStatusResponse = z.infer<typeof GetDeletionStatusResponseSchema>;
