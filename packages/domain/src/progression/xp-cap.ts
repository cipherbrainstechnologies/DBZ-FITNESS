/**
 * XP policy version 1 (docs/03-character-and-progression.md).
 * Pure eligibility + caps — ledger uniqueness is also enforced at the DB boundary.
 *
 * Rewards sustainable actions only. Never awards starvation, calorie restriction,
 * pain tolerance, excess volume, or weight-loss events.
 */

export const XP_POLICY_VERSION = 1;

export const XP_DAILY_MAXIMUM = 100;

export const XP_CATEGORY_CAPS = {
  MAIN_MISSION: 50,
  MEAL_REFLECTION: 15,
  RECOVERY_CHECK_IN: 15,
  WELLBEING_HABIT: 20,
} as const;

export type XpCategory = keyof typeof XP_CATEGORY_CAPS;

/** XP required per game level step. Game level ≠ health outcome. */
export const XP_PER_LEVEL = 500;

export type ApplyCapInput = {
  /** XP already awarded in this category for the local date. */
  alreadyAwardedInCategory: number;
  /** XP already awarded across all categories for the local date. */
  alreadyAwardedDailyTotal: number;
  /** Requested award amount before caps. */
  requestedDelta: number;
  category: XpCategory;
};

export type ApplyCapResult = {
  awarded: number;
  remainingCategoryCapacity: number;
  remainingDailyCapacity: number;
  cappedBy: 'NONE' | 'CATEGORY' | 'DAILY' | 'BOTH' | 'ZERO_REQUEST';
};

/**
 * Apply category and daily XP caps. Never rewards starvation or excess volume.
 */
export function applyXpCap(input: ApplyCapInput): ApplyCapResult {
  const categoryCap = XP_CATEGORY_CAPS[input.category];
  const remainingCategoryCapacity = Math.max(
    0,
    categoryCap - input.alreadyAwardedInCategory,
  );
  const remainingDailyCapacity = Math.max(
    0,
    XP_DAILY_MAXIMUM - input.alreadyAwardedDailyTotal,
  );

  if (input.requestedDelta <= 0) {
    return {
      awarded: 0,
      remainingCategoryCapacity,
      remainingDailyCapacity,
      cappedBy: 'ZERO_REQUEST',
    };
  }

  const afterCategory = Math.min(input.requestedDelta, remainingCategoryCapacity);
  const awarded = Math.min(afterCategory, remainingDailyCapacity);

  let cappedBy: ApplyCapResult['cappedBy'] = 'NONE';
  if (awarded < input.requestedDelta) {
    const hitCategory =
      awarded === remainingCategoryCapacity &&
      remainingCategoryCapacity < remainingDailyCapacity;
    const hitDaily =
      awarded === remainingDailyCapacity &&
      remainingDailyCapacity <= remainingCategoryCapacity;
    if (hitCategory && hitDaily) {
      cappedBy = 'BOTH';
    } else if (remainingCategoryCapacity <= remainingDailyCapacity) {
      cappedBy = 'CATEGORY';
    } else {
      cappedBy = 'DAILY';
    }
  }

  return {
    awarded,
    remainingCategoryCapacity: remainingCategoryCapacity - awarded,
    remainingDailyCapacity: remainingDailyCapacity - awarded,
    cappedBy,
  };
}

export const ELIGIBLE_XP_EVENT_TYPES = [
  'WORKOUT_COMPLETE',
  'REST_MISSION',
  'CONSISTENCY_CHECK_IN',
  'MEAL_REFLECTION',
  'RECOVERY_CHECK_IN',
  'WELLBEING_HABIT',
] as const;

export type EligibleXpEventType = (typeof ELIGIBLE_XP_EVENT_TYPES)[number];

/** Explicitly rejected event types — never award XP for these. */
export const INELIGIBLE_XP_EVENT_TYPES = [
  'STARVATION',
  'CALORIE_RESTRICTION',
  'PAIN_TOLERANCE',
  'EXCESS_VOLUME',
  'WEIGHT_LOSS',
  'EXERCISE_THROUGH_PAIN',
] as const;

export type IneligibleXpEventType = (typeof INELIGIBLE_XP_EVENT_TYPES)[number];

export const XP_EVENT_CATEGORY: Record<EligibleXpEventType, XpCategory> = {
  WORKOUT_COMPLETE: 'MAIN_MISSION',
  REST_MISSION: 'MAIN_MISSION',
  CONSISTENCY_CHECK_IN: 'MAIN_MISSION',
  MEAL_REFLECTION: 'MEAL_REFLECTION',
  RECOVERY_CHECK_IN: 'RECOVERY_CHECK_IN',
  WELLBEING_HABIT: 'WELLBEING_HABIT',
};

export const XP_EVENT_BASE_DELTA: Record<EligibleXpEventType, number> = {
  WORKOUT_COMPLETE: 50,
  REST_MISSION: 50,
  CONSISTENCY_CHECK_IN: 50,
  MEAL_REFLECTION: 15,
  RECOVERY_CHECK_IN: 15,
  WELLBEING_HABIT: 20,
};

export function isEligibleXpEventType(eventType: string): eventType is EligibleXpEventType {
  return (ELIGIBLE_XP_EVENT_TYPES as readonly string[]).includes(eventType);
}

export function isIneligibleXpEventType(eventType: string): eventType is IneligibleXpEventType {
  return (INELIGIBLE_XP_EVENT_TYPES as readonly string[]).includes(eventType);
}

/**
 * Game / cosmetic level from total eligible XP.
 * This is not a health prediction or body-transformation claim.
 */
export function computeGameLevel(totalEligibleXp: number): number {
  const xp = Number.isFinite(totalEligibleXp) ? Math.max(0, Math.floor(totalEligibleXp)) : 0;
  return 1 + Math.floor(xp / XP_PER_LEVEL);
}

export type ApplyXpAwardInput = {
  eventType: string;
  sourceEntityId: string;
  /**
   * True when a ledger row already exists for
   * userId + eventType + sourceEntityId + policyVersion.
   */
  existingSourceAwarded: boolean;
  alreadyAwardedInCategory: number;
  alreadyAwardedDailyTotal: number;
  /** Override base delta; defaults from event type policy. */
  requestedDelta?: number;
  policyVersion?: number;
};

export type ApplyXpAwardStatus =
  | 'AWARDED'
  | 'REJECTED_DUPLICATE_SOURCE'
  | 'REJECTED_INELIGIBLE_EVENT'
  | 'CAPPED_TO_ZERO';

export type ApplyXpAwardResult = {
  status: ApplyXpAwardStatus;
  awarded: number;
  category: XpCategory | null;
  eventType: string;
  sourceEntityId: string;
  policyVersion: number;
  requestedDelta: number;
  cap: ApplyCapResult | null;
  reason: string;
};

/**
 * Decide an XP award for an eligible sustainable event, applying daily caps.
 * Duplicate source rejection is evaluated here so callers can short-circuit before write.
 */
export function applyXpAward(input: ApplyXpAwardInput): ApplyXpAwardResult {
  const policyVersion = input.policyVersion ?? XP_POLICY_VERSION;
  const sourceEntityId = input.sourceEntityId.trim();

  if (!sourceEntityId) {
    return {
      status: 'REJECTED_INELIGIBLE_EVENT',
      awarded: 0,
      category: null,
      eventType: input.eventType,
      sourceEntityId: input.sourceEntityId,
      policyVersion,
      requestedDelta: 0,
      cap: null,
      reason: 'SOURCE_ENTITY_REQUIRED',
    };
  }

  if (isIneligibleXpEventType(input.eventType) || !isEligibleXpEventType(input.eventType)) {
    return {
      status: 'REJECTED_INELIGIBLE_EVENT',
      awarded: 0,
      category: null,
      eventType: input.eventType,
      sourceEntityId,
      policyVersion,
      requestedDelta: 0,
      cap: null,
      reason: isIneligibleXpEventType(input.eventType)
        ? 'INELIGIBLE_EVENT_TYPE'
        : 'UNKNOWN_EVENT_TYPE',
    };
  }

  if (input.existingSourceAwarded) {
    return {
      status: 'REJECTED_DUPLICATE_SOURCE',
      awarded: 0,
      category: XP_EVENT_CATEGORY[input.eventType],
      eventType: input.eventType,
      sourceEntityId,
      policyVersion,
      requestedDelta: 0,
      cap: null,
      reason: 'DUPLICATE_SOURCE_EVENT',
    };
  }

  const category = XP_EVENT_CATEGORY[input.eventType];
  const requestedDelta = input.requestedDelta ?? XP_EVENT_BASE_DELTA[input.eventType];

  const cap = applyXpCap({
    category,
    alreadyAwardedInCategory: input.alreadyAwardedInCategory,
    alreadyAwardedDailyTotal: input.alreadyAwardedDailyTotal,
    requestedDelta,
  });

  if (cap.awarded <= 0) {
    return {
      status: 'CAPPED_TO_ZERO',
      awarded: 0,
      category,
      eventType: input.eventType,
      sourceEntityId,
      policyVersion,
      requestedDelta,
      cap,
      reason: cap.cappedBy === 'ZERO_REQUEST' ? 'ZERO_REQUEST' : 'DAILY_OR_CATEGORY_CAP',
    };
  }

  return {
    status: 'AWARDED',
    awarded: cap.awarded,
    category,
    eventType: input.eventType,
    sourceEntityId,
    policyVersion,
    requestedDelta,
    cap,
    reason: 'ELIGIBLE_AWARD',
  };
}
