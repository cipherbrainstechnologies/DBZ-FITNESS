/**
 * Busy-day session shortening (docs/04).
 * Preserve warm-up / CORE work; drop OPTIONAL; never compress rest unsafely.
 */

export type ShortenExerciseSlot = {
  exerciseId: string;
  sortOrder: number;
  priority: 'CORE' | 'OPTIONAL';
  sets: number;
  repMin: number;
  repMax: number;
  restSeconds: number;
  estimatedMinutes: number;
};

export type ShortenSessionInput = {
  durationBudgetMinutes: number;
  targetDurationMinutes: number;
  exercises: readonly ShortenExerciseSlot[];
};

export type ShortenSessionResult = {
  durationBudgetMinutes: number;
  exercises: ShortenExerciseSlot[];
  removedExerciseIds: string[];
  explanationCodes: string[];
  /** False when target is longer than or equal to current budget (no-op). */
  shortened: boolean;
};

const MIN_BUSY_DAY_MINUTES = 10;

/**
 * Shorten a planned session to a busy-day duration.
 * Drops OPTIONAL exercises first (highest sortOrder first), then trims
 * trailing CORE only if still over budget — never below one CORE movement
 * when any CORE exists.
 */
export function shortenBusyDaySession(input: ShortenSessionInput): ShortenSessionResult {
  const explanationCodes: string[] = [];
  const target = Math.max(MIN_BUSY_DAY_MINUTES, Math.floor(input.targetDurationMinutes));

  if (target >= input.durationBudgetMinutes) {
    return {
      durationBudgetMinutes: input.durationBudgetMinutes,
      exercises: [...input.exercises].sort((a, b) => a.sortOrder - b.sortOrder),
      removedExerciseIds: [],
      explanationCodes: ['BUSY_DAY_NO_SHORTEN_NEEDED'],
      shortened: false,
    };
  }

  explanationCodes.push('BUSY_DAY_SHORTEN_APPLIED');

  let remaining = [...input.exercises].sort((a, b) => a.sortOrder - b.sortOrder);
  const removedExerciseIds: string[] = [];

  const totalMinutes = (slots: ShortenExerciseSlot[]) =>
    slots.reduce((sum, e) => sum + e.estimatedMinutes, 0);

  // Drop OPTIONAL from the end.
  while (totalMinutes(remaining) > target) {
    const optionalIdx = [...remaining]
      .map((e, i) => ({ e, i }))
      .reverse()
      .find((x) => x.e.priority === 'OPTIONAL');
    if (!optionalIdx) {
      break;
    }
    removedExerciseIds.push(optionalIdx.e.exerciseId);
    remaining = remaining.filter((_, i) => i !== optionalIdx.i);
    explanationCodes.push('BUSY_DAY_DROPPED_OPTIONAL');
  }

  // If still over, reduce OPTIONAL already gone — trim lowest-priority CORE
  // (highest sortOrder) but keep at least one CORE if present.
  while (totalMinutes(remaining) > target) {
    const coreSlots = remaining.filter((e) => e.priority === 'CORE');
    if (coreSlots.length <= 1) {
      explanationCodes.push('BUSY_DAY_KEPT_MINIMUM_CORE');
      break;
    }
    const drop = [...remaining]
      .map((e, i) => ({ e, i }))
      .reverse()
      .find((x) => x.e.priority === 'CORE');
    if (!drop) {
      break;
    }
    removedExerciseIds.push(drop.e.exerciseId);
    remaining = remaining.filter((_, i) => i !== drop.i);
    explanationCodes.push('BUSY_DAY_TRIMMED_CORE');
  }

  // Do not compress rest intervals — keep prescribed restSeconds unchanged.
  explanationCodes.push('BUSY_DAY_REST_PRESERVED');

  const durationBudgetMinutes = Math.min(
    target,
    Math.max(totalMinutes(remaining), MIN_BUSY_DAY_MINUTES),
  );

  return {
    durationBudgetMinutes,
    exercises: remaining,
    removedExerciseIds,
    explanationCodes: [...new Set(explanationCodes)],
    shortened: true,
  };
}
