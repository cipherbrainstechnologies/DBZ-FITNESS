import { z } from 'zod';

/** Authorisation roles (docs/08). Server is authoritative. */
export const RoleSchema = z.enum([
  'MEMBER',
  'SUPPORT',
  'CONTENT_EDITOR',
  'FITNESS_REVIEWER',
  'NUTRITION_REVIEWER',
  'ADMIN',
]);

export type Role = z.infer<typeof RoleSchema>;

export const ROLES = RoleSchema.options;
