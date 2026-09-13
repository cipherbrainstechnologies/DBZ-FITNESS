import { z } from 'zod';

/** Stable UUID string (RFC 4122 shape). */
export const UuidSchema = z.string().uuid();

/** ISO-8601 date-time string (UTC preferred at boundaries). */
export const IsoDateTimeSchema = z.string().datetime({ offset: true });

/** Structured API error payload (docs/09). */
export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  fieldErrors: z
    .record(z.string(), z.array(z.string()))
    .optional(),
  requestId: z.string().min(1).optional(),
  retryable: z.boolean().optional(),
});

export type Uuid = z.infer<typeof UuidSchema>;
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
