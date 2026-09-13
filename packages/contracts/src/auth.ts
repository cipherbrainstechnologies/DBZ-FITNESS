import { z } from 'zod';

import { UuidSchema } from './common.js';
import { RoleSchema } from './roles.js';

export const RegisterRequestSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(10).max(128),
  displayName: z.string().trim().min(1).max(80).optional(),
  locale: z.string().min(2).max(35).optional(),
  currentTimeZone: z.string().min(1).max(64).optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
});

export const SessionUserSchema = z.object({
  id: UuidSchema,
  email: z.string().email(),
  displayName: z.string().nullable(),
  status: z.enum(['ACTIVE', 'DISABLED', 'PENDING_VERIFICATION']),
  locale: z.string(),
  currentTimeZone: z.string(),
  roles: z.array(RoleSchema),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SessionUser = z.infer<typeof SessionUserSchema>;
