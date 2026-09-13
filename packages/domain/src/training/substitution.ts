/**
 * Exercise substitution eligibility (docs/04).
 * Hard exclusions remain hard; character preference is soft only.
 */

export type SubstitutionCandidate = {
  id: string;
  movementPattern: string;
  equipment: readonly string[];
  difficulty: string;
  restrictions: readonly string[];
  preferenceTags: readonly string[];
  experienceMin?: string | null;
};

export type SubstitutionContext = {
  memberEquipment: readonly string[];
  screeningRestrictions: readonly string[];
  experience: string | null;
  timeBudgetMinutes: number | null;
  candidateEstimatedMinutes: number | null;
  characterPreferenceTags: readonly string[];
};

export type SubstitutionEligibilityResult = {
  eligible: boolean;
  reasons: string[];
  softPreferenceMatch: boolean;
};

const EXPERIENCE_RANK: Record<string, number> = {
  BEGINNER: 1,
  RETURNING: 2,
  INTERMEDIATE: 3,
  ADVANCED: 4,
};

function hasEquipment(
  memberEquipment: readonly string[],
  required: readonly string[],
): boolean {
  const owned = new Set(memberEquipment.map((e) => e.toUpperCase()));
  owned.add('BODYWEIGHT');
  return required.every((item) => owned.has(item.toUpperCase()));
}

/**
 * Whether a candidate may substitute for a prescribed exercise under constraints.
 * Does not invent substitutes — caller supplies reviewed catalogue candidates.
 */
export function isSubstitutionEligible(
  original: SubstitutionCandidate,
  candidate: SubstitutionCandidate,
  context: SubstitutionContext,
): SubstitutionEligibilityResult {
  const reasons: string[] = [];

  if (original.movementPattern !== candidate.movementPattern) {
    reasons.push('MOVEMENT_PATTERN_MISMATCH');
  }

  if (!hasEquipment(context.memberEquipment, candidate.equipment)) {
    reasons.push('EQUIPMENT_UNAVAILABLE');
  }

  const blocked = candidate.restrictions.some((code) =>
    context.screeningRestrictions.includes(code),
  );
  if (blocked) {
    reasons.push('SCREENING_RESTRICTION');
  }

  if (candidate.experienceMin && context.experience) {
    const need = EXPERIENCE_RANK[candidate.experienceMin] ?? 0;
    const have = EXPERIENCE_RANK[context.experience] ?? 0;
    if (have < need) {
      reasons.push('EXPERIENCE_TOO_LOW');
    }
  }

  if (
    context.timeBudgetMinutes !== null &&
    context.candidateEstimatedMinutes !== null &&
    context.candidateEstimatedMinutes > context.timeBudgetMinutes
  ) {
    reasons.push('EXCEEDS_TIME_BUDGET');
  }

  const softPreferenceMatch =
    context.characterPreferenceTags.length > 0 &&
    candidate.preferenceTags.some((tag) =>
      context.characterPreferenceTags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()),
    );

  // Soft preference never overrides hard failures.
  if (reasons.length > 0) {
    return { eligible: false, reasons, softPreferenceMatch: false };
  }

  if (softPreferenceMatch) {
    reasons.push('CHARACTER_PREFERENCE_SOFT_MATCH');
  }

  return { eligible: true, reasons, softPreferenceMatch };
}
