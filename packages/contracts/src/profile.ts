import { z } from 'zod';

import { IsoDateTimeSchema, UuidSchema } from './common.js';

/** Basic profile fields for Milestone 1 (docs/09 ProfileVersion subset). */
export const ProfileBasicsSchema = z.object({
  userId: UuidSchema,
  version: z.number().int().positive(),
  goals: z.array(z.string().min(1).max(64)).max(20).optional(),
  experience: z
    .enum(['BEGINNER', 'RETURNING', 'INTERMEDIATE', 'ADVANCED'])
    .optional(),
  weeklyAvailabilityMinutes: z.number().int().nonnegative().max(7 * 24 * 60).optional(),
  equipment: z.array(z.string().min(1).max(64)).max(40).optional(),
  accessPreferences: z.record(z.string(), z.unknown()).optional(),
  effectiveAt: IsoDateTimeSchema,
});

export const UpdateProfileBasicsSchema = ProfileBasicsSchema.omit({
  userId: true,
  version: true,
  effectiveAt: true,
}).partial();

export type ProfileBasics = z.infer<typeof ProfileBasicsSchema>;
export type UpdateProfileBasics = z.infer<typeof UpdateProfileBasicsSchema>;
