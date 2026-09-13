import { Injectable } from '@nestjs/common';
import type { Prisma } from '@saiyan/database';
import type { EligibleXpEventType } from '@saiyan/domain';

import {
  ProgressionApplicationService,
  type AwardIfEligibleInput,
  type AwardIfEligibleResult,
} from './progression.application.service.js';

/**
 * Cross-module façade for XP ledger, daily caps, and cosmetic milestone unlocks.
 * Training and other modules must depend on this — not XpLedger Prisma models.
 * Character switching must not clear ledger or unlock history.
 */
@Injectable()
export class ProgressionFacade {
  constructor(private readonly progression: ProgressionApplicationService) {}

  awardIfEligible(
    input: AwardIfEligibleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AwardIfEligibleResult> {
    return this.progression.awardIfEligible(input, tx);
  }

  getAwardForSource(
    userId: string,
    eventType: EligibleXpEventType,
    sourceEntityId: string,
  ): Promise<AwardIfEligibleResult | null> {
    return this.progression.getAwardForSource(userId, eventType, sourceEntityId);
  }

  getSummary(userId: string) {
    return this.progression.getSummary(userId);
  }

  getXpLedger(userId: string, limit?: number) {
    return this.progression.getXpLedger(userId, limit);
  }

  getHistory(userId: string, limitDays?: number) {
    return this.progression.getHistory(userId, limitDays);
  }
}
