import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedUser } from './auth.types.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

/**
 * PATCH /me/profile — display fields live on User; training basics on ProfileVersion.
 * Extends @saiyan/contracts UpdateProfileBasics with identity display fields.
 */
const PatchMeProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    locale: z.string().min(2).max(35).optional(),
    currentTimeZone: z.string().min(1).max(64).optional(),
    goals: z.array(z.string().min(1).max(64)).max(20).optional(),
    experience: z
      .enum(['BEGINNER', 'RETURNING', 'INTERMEDIATE', 'ADVANCED'])
      .optional(),
    weeklyAvailabilityMinutes: z
      .number()
      .int()
      .nonnegative()
      .max(7 * 24 * 60)
      .optional(),
    equipment: z.array(z.string().min(1).max(64)).max(40).optional(),
    accessPreferences: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

type PatchMeProfile = z.infer<typeof PatchMeProfileSchema>;

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.auth.getMe(user.id, user.sessionId);
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        status: result.user.status,
        locale: result.user.locale,
        currentTimeZone: result.user.currentTimeZone,
        roles: result.user.roles,
      },
      profile: result.profile,
    };
  }

  @Patch('profile')
  async patchProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(PatchMeProfileSchema)) body: PatchMeProfile,
  ) {
    const patch: Parameters<AuthService['updateMeProfile']>[2] = {};
    if (body.displayName !== undefined) patch.displayName = body.displayName;
    if (body.locale !== undefined) patch.locale = body.locale;
    if (body.currentTimeZone !== undefined) patch.currentTimeZone = body.currentTimeZone;
    if (body.goals !== undefined) patch.goals = body.goals;
    if (body.experience !== undefined) patch.experience = body.experience;
    if (body.weeklyAvailabilityMinutes !== undefined) {
      patch.weeklyAvailabilityMinutes = body.weeklyAvailabilityMinutes;
    }
    if (body.equipment !== undefined) patch.equipment = body.equipment;
    if (body.accessPreferences !== undefined) {
      patch.accessPreferences = body.accessPreferences;
    }

    const result = await this.auth.updateMeProfile(user.id, user.sessionId, patch);
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        status: result.user.status,
        locale: result.user.locale,
        currentTimeZone: result.user.currentTimeZone,
        roles: result.user.roles,
      },
      profile: result.profile,
    };
  }
}
