import { Injectable } from '@nestjs/common';
import type { Prisma } from '@saiyan/database';
import {
  applyXpAward,
  computeGameLevel,
  XP_CATEGORY_CAPS,
  XP_DAILY_MAXIMUM,
  XP_EVENT_CATEGORY,
  XP_PER_LEVEL,
  XP_POLICY_VERSION,
  isEligibleXpEventType,
  type EligibleXpEventType,
  type XpCategory,
} from '@saiyan/domain';

import { CharacterFacade } from '../characters/character.facade.js';
import { PrismaService } from '../database/prisma.service.js';

export type AwardIfEligibleInput = {
  userId: string;
  eventType: EligibleXpEventType;
  sourceEntityId: string;
  localDate: string;
  timeZone: string;
  reason?: string;
  requestedDelta?: number;
  policyVersion?: number;
};

export type AwardIfEligibleResult = {
  status: 'AWARDED' | 'ALREADY_AWARDED' | 'CAPPED_TO_ZERO' | 'REJECTED_INELIGIBLE';
  awarded: number;
  category: XpCategory | null;
  eventType: string;
  sourceEntityId: string;
  policyVersion: number;
  ledgerEntryId: string | null;
  reason: string;
};

type TxClient = Prisma.TransactionClient;

type MilestoneDefinition = {
  id: string;
  requiredLevel?: number;
  requiredXp?: number;
};

/**
 * Owns XpLedgerEntry, DailyXpCategory, MilestoneUnlock.
 * Other modules must use ProgressionFacade — not these Prisma models directly.
 */
@Injectable()
export class ProgressionApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly characters: CharacterFacade,
  ) {}

  /**
   * Idempotent XP award. Safe to call inside an outer DB transaction.
   */
  async awardIfEligible(
    input: AwardIfEligibleInput,
    tx?: TxClient,
  ): Promise<AwardIfEligibleResult> {
    const db = tx ?? this.prisma.client;
    const policyVersion = input.policyVersion ?? XP_POLICY_VERSION;

    if (!isEligibleXpEventType(input.eventType)) {
      return {
        status: 'REJECTED_INELIGIBLE',
        awarded: 0,
        category: null,
        eventType: input.eventType,
        sourceEntityId: input.sourceEntityId,
        policyVersion,
        ledgerEntryId: null,
        reason: 'UNKNOWN_EVENT_TYPE',
      };
    }

    const existing = await db.xpLedgerEntry.findUnique({
      where: {
        userId_eventType_sourceEntityId_policyVersion: {
          userId: input.userId,
          eventType: input.eventType,
          sourceEntityId: input.sourceEntityId,
          policyVersion,
        },
      },
    });

    if (existing) {
      return {
        status: 'ALREADY_AWARDED',
        awarded: 0,
        category: existing.category as XpCategory,
        eventType: existing.eventType,
        sourceEntityId: existing.sourceEntityId,
        policyVersion: existing.policyVersion,
        ledgerEntryId: existing.id,
        reason: 'DUPLICATE_SOURCE_EVENT',
      };
    }

    const category = XP_EVENT_CATEGORY[input.eventType];
    const dailyRows = await db.dailyXpCategory.findMany({
      where: {
        userId: input.userId,
        localDate: input.localDate,
        policyVersion,
      },
    });

    const alreadyAwardedDailyTotal = dailyRows.reduce(
      (sum, row) => sum + row.awardedAmount,
      0,
    );
    const alreadyAwardedInCategory =
      dailyRows.find((row) => row.category === category)?.awardedAmount ?? 0;

    const decision = applyXpAward({
      eventType: input.eventType,
      sourceEntityId: input.sourceEntityId,
      existingSourceAwarded: false,
      alreadyAwardedInCategory,
      alreadyAwardedDailyTotal,
      requestedDelta: input.requestedDelta,
      policyVersion,
    });

    if (decision.status === 'REJECTED_DUPLICATE_SOURCE') {
      return {
        status: 'ALREADY_AWARDED',
        awarded: 0,
        category: decision.category,
        eventType: input.eventType,
        sourceEntityId: input.sourceEntityId,
        policyVersion,
        ledgerEntryId: null,
        reason: decision.reason,
      };
    }

    if (decision.status === 'REJECTED_INELIGIBLE_EVENT') {
      return {
        status: 'REJECTED_INELIGIBLE',
        awarded: 0,
        category: null,
        eventType: input.eventType,
        sourceEntityId: input.sourceEntityId,
        policyVersion,
        ledgerEntryId: null,
        reason: decision.reason,
      };
    }

    if (decision.status === 'CAPPED_TO_ZERO' || decision.awarded <= 0 || !decision.category) {
      return {
        status: 'CAPPED_TO_ZERO',
        awarded: 0,
        category: decision.category,
        eventType: input.eventType,
        sourceEntityId: input.sourceEntityId,
        policyVersion,
        ledgerEntryId: null,
        reason: decision.reason,
      };
    }

    try {
      const entry = await db.xpLedgerEntry.create({
        data: {
          userId: input.userId,
          eventType: input.eventType,
          sourceEntityId: input.sourceEntityId,
          delta: decision.awarded,
          category: decision.category,
          localDate: input.localDate,
          timeZone: input.timeZone,
          policyVersion,
          reason: input.reason ?? decision.reason,
        },
      });

      await db.dailyXpCategory.upsert({
        where: {
          userId_localDate_category_policyVersion: {
            userId: input.userId,
            localDate: input.localDate,
            category: decision.category,
            policyVersion,
          },
        },
        create: {
          userId: input.userId,
          localDate: input.localDate,
          category: decision.category,
          awardedAmount: decision.awarded,
          policyVersion,
        },
        update: {
          awardedAmount: { increment: decision.awarded },
        },
      });

      await this.unlockEligibleMilestones(input.userId, db);

      return {
        status: 'AWARDED',
        awarded: decision.awarded,
        category: decision.category,
        eventType: input.eventType,
        sourceEntityId: input.sourceEntityId,
        policyVersion,
        ledgerEntryId: entry.id,
        reason: decision.reason,
      };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const raced = await db.xpLedgerEntry.findUnique({
          where: {
            userId_eventType_sourceEntityId_policyVersion: {
              userId: input.userId,
              eventType: input.eventType,
              sourceEntityId: input.sourceEntityId,
              policyVersion,
            },
          },
        });
        if (raced) {
          return {
            status: 'ALREADY_AWARDED',
            awarded: 0,
            category: raced.category as XpCategory,
            eventType: raced.eventType,
            sourceEntityId: raced.sourceEntityId,
            policyVersion: raced.policyVersion,
            ledgerEntryId: raced.id,
            reason: 'DUPLICATE_SOURCE_EVENT',
          };
        }
      }
      throw error;
    }
  }

  async getAwardForSource(
    userId: string,
    eventType: EligibleXpEventType,
    sourceEntityId: string,
    policyVersion: number = XP_POLICY_VERSION,
  ): Promise<AwardIfEligibleResult | null> {
    const existing = await this.prisma.client.xpLedgerEntry.findUnique({
      where: {
        userId_eventType_sourceEntityId_policyVersion: {
          userId,
          eventType,
          sourceEntityId,
          policyVersion,
        },
      },
    });
    if (!existing) {
      return null;
    }
    return {
      status: 'ALREADY_AWARDED',
      awarded: 0,
      category: existing.category as XpCategory,
      eventType: existing.eventType,
      sourceEntityId: existing.sourceEntityId,
      policyVersion: existing.policyVersion,
      ledgerEntryId: existing.id,
      reason: 'DUPLICATE_SOURCE_EVENT',
    };
  }

  async getSummary(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { currentTimeZone: true },
    });
    const timeZone = user?.currentTimeZone ?? 'UTC';
    const todayLocalDate = this.localDateInTimeZone(new Date(), timeZone);
    const policyVersion = XP_POLICY_VERSION;

    const [ledgerAgg, todayRows, unlocks] = await Promise.all([
      this.prisma.client.xpLedgerEntry.aggregate({
        where: { userId, policyVersion },
        _sum: { delta: true },
      }),
      this.prisma.client.dailyXpCategory.findMany({
        where: { userId, localDate: todayLocalDate, policyVersion },
      }),
      this.prisma.client.milestoneUnlock.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'asc' },
      }),
    ]);

    const totalXp = ledgerAgg._sum.delta ?? 0;
    const gameLevel = computeGameLevel(totalXp);
    const xpTowardNextLevel = totalXp % XP_PER_LEVEL;
    const todayTotal = todayRows.reduce((sum, row) => sum + row.awardedAmount, 0);

    const categories = Object.keys(XP_CATEGORY_CAPS) as XpCategory[];
    const todayByCategory = categories.map((category) => ({
      category,
      awardedAmount:
        todayRows.find((row) => row.category === category)?.awardedAmount ?? 0,
      categoryCap: XP_CATEGORY_CAPS[category],
    }));

    return {
      totalXp,
      gameLevel,
      xpTowardNextLevel,
      xpPerLevel: XP_PER_LEVEL,
      policyVersion,
      gameLevelIsNotHealth: true as const,
      todayLocalDate,
      timeZone,
      todayByCategory,
      todayTotal,
      dailyMaximum: XP_DAILY_MAXIMUM,
      milestoneUnlocks: unlocks.map((row) => ({
        milestoneDefinitionId: row.milestoneDefinitionId,
        unlockedAt: row.unlockedAt.toISOString(),
        levelAtUnlock: row.levelAtUnlock,
        totalXpAtUnlock: row.totalXpAtUnlock,
      })),
    };
  }

  async getXpLedger(userId: string, limit = 50) {
    const policyVersion = XP_POLICY_VERSION;
    const entries = await this.prisma.client.xpLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    });

    return {
      entries: entries.map((row) => ({
        id: row.id,
        eventType: row.eventType,
        sourceEntityId: row.sourceEntityId,
        delta: row.delta,
        category: row.category,
        localDate: row.localDate,
        timeZone: row.timeZone,
        policyVersion: row.policyVersion,
        reason: row.reason,
        createdAt: row.createdAt.toISOString(),
      })),
      policyVersion,
      gameLevelIsNotHealth: true as const,
    };
  }

  async getHistory(userId: string, limitDays = 30) {
    const take = Math.min(Math.max(limitDays, 1), 90);
    const entries = await this.prisma.client.xpLedgerEntry.findMany({
      where: { userId },
      orderBy: [{ localDate: 'desc' }, { createdAt: 'desc' }],
      take: take * 20,
    });

    const byDate = new Map<
      string,
      { totalDelta: number; entryCount: number; categories: Map<string, number> }
    >();

    for (const entry of entries) {
      let bucket = byDate.get(entry.localDate);
      if (!bucket) {
        bucket = { totalDelta: 0, entryCount: 0, categories: new Map() };
        byDate.set(entry.localDate, bucket);
      }
      bucket.totalDelta += entry.delta;
      bucket.entryCount += 1;
      bucket.categories.set(
        entry.category,
        (bucket.categories.get(entry.category) ?? 0) + entry.delta,
      );
    }

    const days = [...byDate.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, take)
      .map(([localDate, bucket]) => ({
        localDate,
        totalDelta: bucket.totalDelta,
        entryCount: bucket.entryCount,
        categories: [...bucket.categories.entries()].map(([cat, delta]) => ({
          category: cat as XpCategory,
          delta,
        })),
      }));

    return {
      days,
      gameLevelIsNotHealth: true as const,
    };
  }

  private async unlockEligibleMilestones(userId: string, db: TxClient): Promise<void> {
    const totalXpAgg = await db.xpLedgerEntry.aggregate({
      where: { userId, policyVersion: XP_POLICY_VERSION },
      _sum: { delta: true },
    });
    const totalXp = totalXpAgg._sum.delta ?? 0;
    const level = computeGameLevel(totalXp);

    const selection = await this.characters.getSelection(userId);
    const definitions = this.parseMilestoneDefinitions(
      selection
        ? await this.loadPresentationMilestones(selection.presentationId)
        : null,
    );

    for (const def of definitions) {
      const requiredLevel = def.requiredLevel ?? 0;
      const requiredXp = def.requiredXp ?? 0;
      if (requiredLevel <= 0 && requiredXp <= 0) {
        continue;
      }
      const levelMet = requiredLevel > 0 && level >= requiredLevel;
      const xpMet = requiredXp > 0 && totalXp >= requiredXp;
      if (!levelMet && !xpMet) {
        continue;
      }

      await db.milestoneUnlock.upsert({
        where: {
          userId_milestoneDefinitionId: {
            userId,
            milestoneDefinitionId: def.id,
          },
        },
        create: {
          userId,
          milestoneDefinitionId: def.id,
          levelAtUnlock: level,
          totalXpAtUnlock: totalXp,
        },
        update: {},
      });
    }
  }

  private async loadPresentationMilestones(presentationId: string): Promise<unknown> {
    const row = await this.prisma.client.characterPresentation.findUnique({
      where: { id: presentationId },
      select: { milestoneDefinitions: true },
    });
    return row?.milestoneDefinitions ?? null;
  }

  private parseMilestoneDefinitions(raw: unknown): MilestoneDefinition[] {
    if (!raw || typeof raw !== 'object') {
      return [];
    }
    const unlocks = (raw as { unlocks?: unknown }).unlocks;
    if (!Array.isArray(unlocks)) {
      return [];
    }
    const out: MilestoneDefinition[] = [];
    for (const item of unlocks) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const id = (item as { id?: unknown }).id;
      if (typeof id !== 'string' || id.length === 0) {
        continue;
      }
      const requiredLevel = (item as { requiredLevel?: unknown }).requiredLevel;
      const requiredXp = (item as { requiredXp?: unknown }).requiredXp;
      out.push({
        id,
        requiredLevel: typeof requiredLevel === 'number' ? requiredLevel : undefined,
        requiredXp: typeof requiredXp === 'number' ? requiredXp : undefined,
      });
    }
    return out;
  }

  private localDateInTimeZone(now: Date, timeZone: string): string {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);
      const year = parts.find((p) => p.type === 'year')?.value;
      const month = parts.find((p) => p.type === 'month')?.value;
      const day = parts.find((p) => p.type === 'day')?.value;
      if (year && month && day) {
        return `${year}-${month}-${day}`;
      }
    } catch {
      // fall through to UTC date
    }
    return now.toISOString().slice(0, 10);
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    );
  }
}
