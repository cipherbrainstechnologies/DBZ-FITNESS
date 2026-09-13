/**
 * Screening outcome helpers (docs/04 + Milestone 2 API naming).
 * Character selection must never override these outcomes.
 */

export const SCREENING_OUTCOMES = [
  'CLEAR',
  'ADAPTATIONS_REQUIRED',
  'SPECIALIST_SUPPORT',
  'TEMPORARY_TRAINING_PAUSE',
] as const;

export type ScreeningOutcome = (typeof SCREENING_OUTCOMES)[number];

export const SCREENING_QUESTIONNAIRE_VERSION = 'screening-v1';

/** Restriction codes persisted on ScreeningRecord.restrictions (string[]). */
export const SCREENING_RESTRICTION_CODES = [
  'ADAPTATIONS_REQUIRED',
  'SPECIALIST_SUPPORT_REQUIRED',
  'TEMPORARY_TRAINING_PAUSE',
  'CHEST_PAIN_REPORTED',
  'FAINTING_REPORTED',
  'SEVERE_BREATHING_DIFFICULTY',
  'ACTIVE_INJURY_AFFECTING_EXERCISE',
  'CLINICIAN_RESTRICTION',
] as const;

export type ScreeningRestrictionCode = (typeof SCREENING_RESTRICTION_CODES)[number];

export type ScreeningSignalInput = {
  /** Potentially urgent symptoms — stop automated exercise coaching. */
  reportsUrgentSymptoms?: boolean;
  reportsChestPain?: boolean;
  reportsFainting?: boolean;
  reportsSevereBreathingDifficulty?: boolean;
  /** Active injury affecting exercise. */
  reportsActiveInjuryAffectingExercise?: boolean;
  /** Member reports clinician/coach restrictions. */
  reportsClinicianRestriction?: boolean;
  /** Access or movement adaptations needed (non-urgent). */
  requiresMovementAdaptations?: boolean;
  /** Explicit temporary pause request / acute symptom window. */
  requiresTemporaryPause?: boolean;
};

export type ResolvedScreening = {
  outcome: ScreeningOutcome;
  restrictions: ScreeningRestrictionCode[];
};

function isScreeningOutcome(value: string): value is ScreeningOutcome {
  return (SCREENING_OUTCOMES as readonly string[]).includes(value);
}

/**
 * Deterministic outcome from member-reported signals.
 * Does not diagnose; maps flags to programme eligibility status only.
 */
export function resolveScreeningOutcome(input: ScreeningSignalInput): ResolvedScreening {
  const restrictions: ScreeningRestrictionCode[] = [];

  if (input.reportsChestPain) {
    restrictions.push('CHEST_PAIN_REPORTED');
  }
  if (input.reportsFainting) {
    restrictions.push('FAINTING_REPORTED');
  }
  if (input.reportsSevereBreathingDifficulty) {
    restrictions.push('SEVERE_BREATHING_DIFFICULTY');
  }
  if (
    input.reportsUrgentSymptoms ||
    input.reportsChestPain ||
    input.reportsFainting ||
    input.reportsSevereBreathingDifficulty
  ) {
    restrictions.push('SPECIALIST_SUPPORT_REQUIRED');
    return { outcome: 'SPECIALIST_SUPPORT', restrictions: unique(restrictions) };
  }

  if (input.reportsClinicianRestriction) {
    restrictions.push('CLINICIAN_RESTRICTION', 'SPECIALIST_SUPPORT_REQUIRED');
    return { outcome: 'SPECIALIST_SUPPORT', restrictions: unique(restrictions) };
  }

  if (input.requiresTemporaryPause) {
    restrictions.push('TEMPORARY_TRAINING_PAUSE');
    return { outcome: 'TEMPORARY_TRAINING_PAUSE', restrictions: unique(restrictions) };
  }

  if (input.reportsActiveInjuryAffectingExercise) {
    restrictions.push('ACTIVE_INJURY_AFFECTING_EXERCISE', 'ADAPTATIONS_REQUIRED');
    return { outcome: 'ADAPTATIONS_REQUIRED', restrictions: unique(restrictions) };
  }

  if (input.requiresMovementAdaptations) {
    restrictions.push('ADAPTATIONS_REQUIRED');
    return { outcome: 'ADAPTATIONS_REQUIRED', restrictions: unique(restrictions) };
  }

  return { outcome: 'CLEAR', restrictions: [] };
}

/** Whether automated general programme guidance may run without specialist review. */
export function allowsAutomatedProgrammeGuidance(outcome: ScreeningOutcome): boolean {
  return outcome === 'CLEAR' || outcome === 'ADAPTATIONS_REQUIRED';
}

/** Whether character emphasis may bias training style within screening limits. */
export function characterMayBiasTrainingEmphasis(outcome: ScreeningOutcome): boolean {
  return outcome === 'CLEAR' || outcome === 'ADAPTATIONS_REQUIRED';
}

/**
 * Character selection is cosmetic / coaching-tone only when screening blocks
 * automated emphasis. Never treat character as overriding restrictions.
 */
export function assertCharacterCannotOverrideScreening(
  outcome: ScreeningOutcome,
  proposedRestrictionRemoval: readonly string[],
): { allowed: true } | { allowed: false; reason: 'CHARACTER_CANNOT_OVERRIDE_SCREENING' } {
  if (!isScreeningOutcome(outcome)) {
    return { allowed: false, reason: 'CHARACTER_CANNOT_OVERRIDE_SCREENING' };
  }
  if (proposedRestrictionRemoval.length > 0) {
    return { allowed: false, reason: 'CHARACTER_CANNOT_OVERRIDE_SCREENING' };
  }
  return { allowed: true };
}

function unique<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}
