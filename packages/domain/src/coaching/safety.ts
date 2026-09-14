/**
 * Coach action-proposal safety (docs/10).
 * Reject proposals that would bypass screening or diet hard rules.
 *
 * Kept free of cross-folder .js imports so node --experimental-strip-types
 * unit tests can load this module from src/ (same pattern as other domain tests).
 */

export const COACH_ALLOWED_ACTION_TYPES = [
  'START_WORKOUT',
  'PREVIEW_SHORTER_SESSION',
  'SELECT_SHORT_SESSION',
  'RESCHEDULE_SESSION',
  'PREVIEW_MEAL_SWAP',
  'SWAP_MEAL',
  'LOG_CHECK_IN',
  'REVIEW_WEEK',
  'PROPOSE_FUTURE_PLAN_ADJUSTMENT',
  'UPDATE_NEXT_WEEK_AVAILABILITY',
] as const;

export type CoachAllowedActionType = (typeof COACH_ALLOWED_ACTION_TYPES)[number];

/** Explicitly unsafe action types (must always fail safety). */
export const COACH_UNSAFE_ACTION_TYPES = [
  'OVERRIDE_SCREENING',
  'CLEAR_SCREENING_RESTRICTIONS',
  'REMOVE_ALLERGIES',
  'IGNORE_DIET_PATTERN',
  'INCREASE_DESPITE_PAIN',
  'INVENT_NUTRITION_TARGETS',
  'FORCE_PROGRAMME_DESPITE_PAUSE',
] as const;

export type CoachUnsafeActionType = (typeof COACH_UNSAFE_ACTION_TYPES)[number];

export type CoachScreeningOutcome =
  | 'CLEAR'
  | 'ADAPTATIONS_REQUIRED'
  | 'SPECIALIST_SUPPORT'
  | 'TEMPORARY_TRAINING_PAUSE';

export type CoachProposalSafetyInput = {
  actionType: string;
  payload: Record<string, unknown>;
  screeningOutcome: CoachScreeningOutcome | null;
  allergies: readonly string[];
  dietaryPattern: string | null;
};

export type CoachProposalSafetyResult =
  | { allowed: true; reasons: [] }
  | { allowed: false; reasons: string[] };

function isAllowedActionType(value: string): value is CoachAllowedActionType {
  return (COACH_ALLOWED_ACTION_TYPES as readonly string[]).includes(value);
}

function isUnsafeActionType(value: string): value is CoachUnsafeActionType {
  return (COACH_UNSAFE_ACTION_TYPES as readonly string[]).includes(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/** Mirrors screening.allowsAutomatedProgrammeGuidance without a cross-import. */
function allowsAutomatedTrainingAction(outcome: CoachScreeningOutcome): boolean {
  return outcome === 'CLEAR' || outcome === 'ADAPTATIONS_REQUIRED';
}

/**
 * Domain gate before confirming a coach action proposal.
 * Character / coach tone never overrides screening or allergy hard rules.
 */
export function evaluateCoachProposalSafety(
  input: CoachProposalSafetyInput,
): CoachProposalSafetyResult {
  const reasons: string[] = [];

  if (isUnsafeActionType(input.actionType)) {
    reasons.push('UNSAFE_ACTION_TYPE');
  }

  if (!isAllowedActionType(input.actionType) && !isUnsafeActionType(input.actionType)) {
    reasons.push('UNKNOWN_ACTION_TYPE');
  }

  const payload = input.payload ?? {};

  // Screening bypass signals in payload.
  if (
    payload.overrideScreening === true ||
    payload.ignoreScreening === true ||
    payload.clearRestrictions === true ||
    payload.bypassScreening === true
  ) {
    reasons.push('SCREENING_BYPASS_REJECTED');
  }

  const removeRestrictions = asStringArray(payload.removeRestrictions);
  if (removeRestrictions.length > 0) {
    reasons.push('SCREENING_RESTRICTION_REMOVAL_REJECTED');
  }

  if (
    input.screeningOutcome &&
    !allowsAutomatedTrainingAction(input.screeningOutcome) &&
    (input.actionType === 'SELECT_SHORT_SESSION' ||
      input.actionType === 'PREVIEW_SHORTER_SESSION' ||
      input.actionType === 'START_WORKOUT' ||
      input.actionType === 'RESCHEDULE_SESSION' ||
      payload.forceTraining === true)
  ) {
    reasons.push('SCREENING_BLOCKS_AUTOMATED_TRAINING_ACTION');
  }

  // Diet / allergy hard rules — coach may never remove declared allergies.
  const removeAllergies = asStringArray(payload.removeAllergies);
  if (removeAllergies.length > 0) {
    reasons.push('ALLERGY_REMOVAL_REJECTED');
  }
  if (payload.ignoreAllergies === true || payload.bypassAllergies === true) {
    reasons.push('ALLERGY_BYPASS_REJECTED');
  }
  if (input.allergies.length > 0 && payload.treatAllergiesAsOptional === true) {
    reasons.push('ALLERGY_HARD_RULE_BYPASS_REJECTED');
  }
  if (payload.ignoreDietPattern === true || payload.bypassDietPattern === true) {
    reasons.push('DIET_PATTERN_BYPASS_REJECTED');
  }
  if (
    typeof payload.replaceDietaryPattern === 'string' &&
    input.dietaryPattern &&
    payload.replaceDietaryPattern !== input.dietaryPattern
  ) {
    reasons.push('DIET_PATTERN_OVERRIDE_REJECTED');
  }

  // Invented nutrition numbers in payload.
  if (
    payload.inventNutrition === true ||
    payload.fabricatedKcal != null ||
    payload.fabricatedProteinG != null ||
    payload.inventedMacros != null
  ) {
    reasons.push('INVENTED_NUTRITION_REJECTED');
  }

  if (payload.increaseDespitePain === true || payload.ignorePain === true) {
    reasons.push('PAIN_OVERRIDE_REJECTED');
  }

  if (reasons.length > 0) {
    return { allowed: false, reasons };
  }
  return { allowed: true, reasons: [] };
}
