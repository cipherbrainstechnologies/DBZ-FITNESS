import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateProfileBasics } from '@saiyan/contracts';
import type { Prisma } from '@saiyan/database';

import { PrismaService } from '../database/prisma.service.js';

export type ProfileSummary = {
  id: string;
  userId: string;
  version: number;
  goals: string[] | null;
  experience: string | null;
  weeklyAvailabilityMinutes: number | null;
  sessionDurationMinutes: number | null;
  availableDays: string[] | null;
  equipment: string[] | null;
  accessPreferences: Record<string, unknown> | null;
  effectiveAt: string;
};

/**
 * Owns ProfileVersion persistence. Other modules must use ProfileFacade.
 */
@Injectable()
export class ProfileApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async createInitialVersion(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ProfileSummary> {
    const db = tx ?? this.prisma.client;
    const created = await db.profileVersion.create({
      data: {
        userId,
        version: 1,
        goals: [],
        equipment: [],
        accessPreferences: {},
      },
    });
    return this.toSummary(created);
  }

  async getLatestSummary(userId: string): Promise<ProfileSummary | null> {
    const row = await this.prisma.client.profileVersion.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
    return row ? this.toSummary(row) : null;
  }

  async requireLatestSummary(userId: string): Promise<ProfileSummary> {
    const summary = await this.getLatestSummary(userId);
    if (!summary) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found for user',
        retryable: false,
      });
    }
    return summary;
  }

  async getSummaryByIdForUser(
    userId: string,
    profileVersionId: string,
  ): Promise<ProfileSummary | null> {
    const row = await this.prisma.client.profileVersion.findFirst({
      where: { id: profileVersionId, userId },
    });
    return row ? this.toSummary(row) : null;
  }

  async requireSummaryByIdForUser(
    userId: string,
    profileVersionId: string,
  ): Promise<ProfileSummary> {
    const summary = await this.getSummaryByIdForUser(userId, profileVersionId);
    if (!summary) {
      throw new NotFoundException({
        code: 'PROFILE_VERSION_NOT_FOUND',
        message: 'Profile version not found for user',
        retryable: false,
      });
    }
    return summary;
  }

  /**
   * Updates the latest profile version in place for Milestone 1.
   * Later milestones may append immutable versions for eligibility snapshots.
   */
  async updateLatestBasics(
    userId: string,
    patch: UpdateProfileBasics,
  ): Promise<ProfileSummary> {
    const latest = await this.prisma.client.profileVersion.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
    if (!latest) {
      throw new NotFoundException({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found for user',
        retryable: false,
      });
    }

    const data: Prisma.ProfileVersionUpdateInput = {};
    if (patch.goals !== undefined) {
      data.goals = patch.goals;
    }
    if (patch.experience !== undefined) {
      data.experience = patch.experience;
    }
    if (patch.weeklyAvailabilityMinutes !== undefined) {
      const existing =
        latest.availability &&
        typeof latest.availability === 'object' &&
        !Array.isArray(latest.availability)
          ? (latest.availability as Record<string, unknown>)
          : {};
      data.availability = {
        ...existing,
        weeklyAvailabilityMinutes: patch.weeklyAvailabilityMinutes,
      };
    }
    if (patch.equipment !== undefined) {
      data.equipment = patch.equipment;
    }
    if (patch.accessPreferences !== undefined) {
      data.accessPreferences = patch.accessPreferences as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.client.profileVersion.update({
      where: { id: latest.id },
      data,
    });
    return this.toSummary(updated);
  }

  private toSummary(row: {
    id: string;
    userId: string;
    version: number;
    goals: Prisma.JsonValue;
    experience: string | null;
    availability: Prisma.JsonValue;
    equipment: Prisma.JsonValue;
    accessPreferences: Prisma.JsonValue;
    effectiveAt: Date;
  }): ProfileSummary {
    const availability =
      row.availability && typeof row.availability === 'object' && !Array.isArray(row.availability)
        ? (row.availability as Record<string, unknown>)
        : null;
    const access =
      row.accessPreferences &&
      typeof row.accessPreferences === 'object' &&
      !Array.isArray(row.accessPreferences)
        ? (row.accessPreferences as Record<string, unknown>)
        : null;
    const weekly =
      availability && typeof availability['weeklyAvailabilityMinutes'] === 'number'
        ? availability['weeklyAvailabilityMinutes']
        : null;
    const sessionDuration =
      (availability && typeof availability['sessionDurationMinutes'] === 'number'
        ? availability['sessionDurationMinutes']
        : null) ??
      (access && typeof access['sessionDurationMinutes'] === 'number'
        ? access['sessionDurationMinutes']
        : null);
    const availableDaysRaw =
      (availability && Array.isArray(availability['availableDays'])
        ? availability['availableDays']
        : null) ??
      (access && Array.isArray(access['availableDays']) ? access['availableDays'] : null);
    const availableDays = availableDaysRaw
      ? availableDaysRaw.filter((d): d is string => typeof d === 'string')
      : null;

    return {
      id: row.id,
      userId: row.userId,
      version: row.version,
      goals: Array.isArray(row.goals)
        ? row.goals.filter((g): g is string => typeof g === 'string')
        : null,
      experience: row.experience,
      weeklyAvailabilityMinutes: weekly,
      sessionDurationMinutes: sessionDuration,
      availableDays,
      equipment: Array.isArray(row.equipment)
        ? row.equipment.filter((g): g is string => typeof g === 'string')
        : null,
      accessPreferences: access,
      effectiveAt: row.effectiveAt.toISOString(),
    };
  }
}
