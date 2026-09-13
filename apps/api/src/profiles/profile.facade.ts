import { Injectable } from '@nestjs/common';
import type { UpdateProfileBasics } from '@saiyan/contracts';
import type { Prisma } from '@saiyan/database';

import {
  ProfileApplicationService,
  type ProfileSummary,
} from './profile.application.service.js';

/**
 * Cross-module façade for profile reads/writes.
 * Identity and future modules must depend on this, not ProfileVersion queries.
 */
@Injectable()
export class ProfileFacade {
  constructor(private readonly profiles: ProfileApplicationService) {}

  createInitialVersion(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ProfileSummary> {
    return this.profiles.createInitialVersion(userId, tx);
  }

  getLatestSummary(userId: string): Promise<ProfileSummary | null> {
    return this.profiles.getLatestSummary(userId);
  }

  requireLatestSummary(userId: string): Promise<ProfileSummary> {
    return this.profiles.requireLatestSummary(userId);
  }

  getSummaryByIdForUser(
    userId: string,
    profileVersionId: string,
  ): Promise<ProfileSummary | null> {
    return this.profiles.getSummaryByIdForUser(userId, profileVersionId);
  }

  requireSummaryByIdForUser(
    userId: string,
    profileVersionId: string,
  ): Promise<ProfileSummary> {
    return this.profiles.requireSummaryByIdForUser(userId, profileVersionId);
  }

  updateLatestBasics(
    userId: string,
    patch: UpdateProfileBasics,
  ): Promise<ProfileSummary> {
    return this.profiles.updateLatestBasics(userId, patch);
  }
}
