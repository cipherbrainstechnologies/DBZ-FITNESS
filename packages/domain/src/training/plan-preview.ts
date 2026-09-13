/**
 * Training programme engine (docs/04) — deterministic, constraint-first.
 * Character emphasis may bias preference tags only; never equipment, time, or screening.
 */

export const TRAINING_POLICY_VERSION = 'training-policy-v1';

export type ScreeningOutcomeForTraining =
  | 'CLEAR'
  | 'ADAPTATIONS_REQUIRED'
  | 'SPECIALIST_SUPPORT'
  | 'TEMPORARY_TRAINING_PAUSE';

export type TrainingEligibilityStatus =
  | 'GENERAL_PROGRAMME_ELIGIBLE'
  | 'ADAPTED_CONTENT_REQUIRED'
  | 'PROFESSIONAL_GUIDANCE_REQUIRED'
  | 'TEMPORARY_TRAINING_PAUSE';

export type ExerciseCandidate = {
  id: string;
  key: string;
  movementPattern: string;
  /** Required equipment tags; empty means bodyweight-only. */
  equipment: readonly string[];
  difficulty: string;
  restrictions: readonly string[];
  preferenceTags: readonly string[];
};

export type TemplateExerciseCandidate = {
  exerciseId: string;
  sortOrder: number;
  /** CORE exercises kept under busy-day shortening; OPTIONAL dropped first. */
  priority: 'CORE' | 'OPTIONAL';
  sets: number;
  repMin: number;
  repMax: number;
  restSeconds: number;
  estimatedMinutes: number;
};

export type TemplateSessionCandidate = {
  id: string;
  dayPattern: string;
  estimatedDuration: number;
  sortOrder: number;
  isOptional: boolean;
  exercises: TemplateExerciseCandidate[];
};

export type ProgrammeTemplateCandidate = {
  id: string;
  key: string;
  version: number;
  name: string;
  goalTags: readonly string[];
  preferenceTags: readonly string[];
  /** Equipment the template assumes (member must cover these). */
  requiredEquipment: readonly string[];
  /** Allowed experience levels. */
  experienceLevels: readonly string[];
  minDaysPerWeek: number;
  maxDaysPerWeek: number;
  maxSessionMinutes: number;
  sessions: TemplateSessionCandidate[];
};

export type PlanPreviewConstraints = {
  equipment: readonly string[];
  experience: string | null;
  sessionDurationMinutes: number | null;
  availableDaysCount: number | null;
  screeningOutcome: ScreeningOutcomeForTraining;
  screeningRestrictions: readonly string[];
  /** Character preference tags — soft bias only. */
  characterPreferenceTags: readonly string[];
  programmePreference?: string | null;
};

export type PreviewExerciseSlot = {
  exerciseId: string;
  sortOrder: number;
  priority: 'CORE' | 'OPTIONAL';
  sets: number;
  repMin: number;
  repMax: number;
  restSeconds: number;
  estimatedMinutes: number;
};

export type PreviewSession = {
  templateSessionId: string;
  dayPattern: string;
  estimatedDuration: number;
  sortOrder: number;
  exercises: PreviewExerciseSlot[];
};

export type CandidatePlan = {
  templateId: string;
  templateKey: string;
  templateVersion: number;
  templateName: string;
  weeklySessions: PreviewSession[];
  estimatedWeeklyMinutes: number;
};

export type PlanPreviewResult = {
  eligibilityStatus: TrainingEligibilityStatus;
  candidatePlan: CandidatePlan | null;
  explanationCodes: string[];
  warnings: string[];
  policyVersion: string;
  /** True when character tags influenced ranking but not hard filters. */
  characterBiasApplied: boolean;
};

function mapEligibility(
  outcome: ScreeningOutcomeForTraining,
): TrainingEligibilityStatus {
  switch (outcome) {
    case 'CLEAR':
      return 'GENERAL_PROGRAMME_ELIGIBLE';
    case 'ADAPTATIONS_REQUIRED':
      return 'ADAPTED_CONTENT_REQUIRED';
    case 'SPECIALIST_SUPPORT':
      return 'PROFESSIONAL_GUIDANCE_REQUIRED';
    case 'TEMPORARY_TRAINING_PAUSE':
      return 'TEMPORARY_TRAINING_PAUSE';
  }
}

function memberHasEquipment(
  memberEquipment: readonly string[],
  required: readonly string[],
): boolean {
  if (required.length === 0) {
    return true;
  }
  const owned = new Set(memberEquipment.map((e) => e.toUpperCase()));
  // BODYWEIGHT is always available.
  owned.add('BODYWEIGHT');
  return required.every((item) => owned.has(item.toUpperCase()));
}

/**
 * Hard rule: character preference tags must never add equipment the member lacks.
 */
export function characterCannotOverrideEquipment(input: {
  memberEquipment: readonly string[];
  exerciseEquipment: readonly string[];
  characterPreferenceTags: readonly string[];
}): { allowed: true } | { allowed: false; reason: 'CHARACTER_CANNOT_OVERRIDE_EQUIPMENT' } {
  const hasEquipment = memberHasEquipment(input.memberEquipment, input.exerciseEquipment);
  if (!hasEquipment) {
    // Even if character strongly prefers this exercise, equipment wins.
    return { allowed: false, reason: 'CHARACTER_CANNOT_OVERRIDE_EQUIPMENT' };
  }
  // Preference tags are irrelevant to the hard gate when equipment matches.
  void input.characterPreferenceTags;
  return { allowed: true };
}

function templateMatchesHardConstraints(
  template: ProgrammeTemplateCandidate,
  constraints: PlanPreviewConstraints,
): { ok: true } | { ok: false; code: string } {
  if (!memberHasEquipment(constraints.equipment, template.requiredEquipment)) {
    return { ok: false, code: 'TEMPLATE_EQUIPMENT_MISMATCH' };
  }

  if (
    constraints.experience &&
    template.experienceLevels.length > 0 &&
    !template.experienceLevels.includes(constraints.experience)
  ) {
    return { ok: false, code: 'TEMPLATE_EXPERIENCE_MISMATCH' };
  }

  if (
    constraints.availableDaysCount !== null &&
    constraints.availableDaysCount < template.minDaysPerWeek
  ) {
    return { ok: false, code: 'TEMPLATE_DAYS_INSUFFICIENT' };
  }

  if (
    constraints.sessionDurationMinutes !== null &&
    constraints.sessionDurationMinutes < 10
  ) {
    return { ok: false, code: 'SESSION_DURATION_TOO_SHORT' };
  }

  if (
    constraints.sessionDurationMinutes !== null &&
    template.maxSessionMinutes > constraints.sessionDurationMinutes + 5
  ) {
    // Allow small buffer; reject templates clearly longer than budget.
    const longest = Math.max(...template.sessions.map((s) => s.estimatedDuration), 0);
    if (longest > constraints.sessionDurationMinutes) {
      return { ok: false, code: 'TEMPLATE_DURATION_EXCEEDS_BUDGET' };
    }
  }

  return { ok: true };
}

function preferenceOverlapScore(
  templateTags: readonly string[],
  characterTags: readonly string[],
  programmePreference: string | null | undefined,
): number {
  let score = 0;
  const preferred = new Set([
    ...characterTags.map((t) => t.toLowerCase()),
    ...(programmePreference ? [programmePreference.toLowerCase()] : []),
  ]);
  for (const tag of templateTags) {
    if (preferred.has(tag.toLowerCase())) {
      score += 1;
    }
  }
  return score;
}

function filterSessionExercises(
  session: TemplateSessionCandidate,
  exerciseById: Map<string, ExerciseCandidate>,
  constraints: PlanPreviewConstraints,
): { exercises: PreviewExerciseSlot[]; dropped: string[] } {
  const exercises: PreviewExerciseSlot[] = [];
  const dropped: string[] = [];

  for (const slot of [...session.exercises].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const exercise = exerciseById.get(slot.exerciseId);
    if (!exercise) {
      dropped.push('EXERCISE_MISSING');
      continue;
    }

    const equipmentGate = characterCannotOverrideEquipment({
      memberEquipment: constraints.equipment,
      exerciseEquipment: exercise.equipment,
      characterPreferenceTags: constraints.characterPreferenceTags,
    });
    if (!equipmentGate.allowed) {
      dropped.push('EXERCISE_EQUIPMENT_EXCLUDED');
      continue;
    }

    // Screening hard exclusions on exercise restriction codes.
    const blocked = exercise.restrictions.some((code) =>
      constraints.screeningRestrictions.includes(code),
    );
    if (blocked) {
      dropped.push('EXERCISE_SCREENING_EXCLUDED');
      continue;
    }

    exercises.push({
      exerciseId: slot.exerciseId,
      sortOrder: slot.sortOrder,
      priority: slot.priority,
      sets: slot.sets,
      repMin: slot.repMin,
      repMax: slot.repMax,
      restSeconds: slot.restSeconds,
      estimatedMinutes: slot.estimatedMinutes,
    });
  }

  return { exercises, dropped };
}

/**
 * Deterministic plan preview from profile + screening constraints.
 * Character tags only affect ranking among eligible templates.
 */
export function previewTrainingPlan(input: {
  constraints: PlanPreviewConstraints;
  templates: readonly ProgrammeTemplateCandidate[];
  exercises: readonly ExerciseCandidate[];
}): PlanPreviewResult {
  const eligibilityStatus = mapEligibility(input.constraints.screeningOutcome);
  const explanationCodes: string[] = [];
  const warnings: string[] = [];
  const policyVersion = TRAINING_POLICY_VERSION;

  if (
    input.constraints.screeningOutcome === 'SPECIALIST_SUPPORT' ||
    input.constraints.screeningOutcome === 'TEMPORARY_TRAINING_PAUSE'
  ) {
    explanationCodes.push('SCREENING_BLOCKS_AUTOMATED_PLAN');
    return {
      eligibilityStatus,
      candidatePlan: null,
      explanationCodes,
      warnings: [
        input.constraints.screeningOutcome === 'TEMPORARY_TRAINING_PAUSE'
          ? 'Automated training plans are paused based on your screening responses.'
          : 'Automated training plans require professional guidance based on your screening responses.',
      ],
      policyVersion,
      characterBiasApplied: false,
    };
  }

  if (input.constraints.screeningOutcome === 'ADAPTATIONS_REQUIRED') {
    explanationCodes.push('ADAPTED_CONTENT_REQUIRED');
    warnings.push(
      'Your screening indicates adapted content is required; only templates that respect your restrictions are considered.',
    );
  }

  const exerciseById = new Map(input.exercises.map((e) => [e.id, e]));
  type Ranked = {
    template: ProgrammeTemplateCandidate;
    score: number;
    sessions: PreviewSession[];
    dropCodes: string[];
  };

  const ranked: Ranked[] = [];

  for (const template of input.templates) {
    const hard = templateMatchesHardConstraints(template, input.constraints);
    if (!hard.ok) {
      continue;
    }

    const sessions: PreviewSession[] = [];
    const dropCodes: string[] = [];
    for (const session of [...template.sessions].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const filtered = filterSessionExercises(session, exerciseById, input.constraints);
      dropCodes.push(...filtered.dropped);
      if (filtered.exercises.length === 0) {
        continue;
      }
      const duration = Math.max(
        session.estimatedDuration,
        filtered.exercises.reduce((sum, e) => sum + e.estimatedMinutes, 0),
      );
      sessions.push({
        templateSessionId: session.id,
        dayPattern: session.dayPattern,
        estimatedDuration: duration,
        sortOrder: session.sortOrder,
        exercises: filtered.exercises,
      });
    }

    if (sessions.length === 0) {
      continue;
    }

    const softScore = preferenceOverlapScore(
      [...template.preferenceTags, ...template.goalTags],
      input.constraints.characterPreferenceTags,
      input.constraints.programmePreference,
    );

    ranked.push({ template, score: softScore, sessions, dropCodes });
  }

  // Deterministic sort: score desc, then key asc, then version desc.
  ranked.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.template.key !== b.template.key) {
      return a.template.key.localeCompare(b.template.key);
    }
    return b.template.version - a.template.version;
  });

  const best = ranked[0];
  if (!best) {
    explanationCodes.push('NO_ELIGIBLE_TEMPLATE');
    return {
      eligibilityStatus,
      candidatePlan: null,
      explanationCodes,
      warnings: [
        ...warnings,
        'No programme template matched your equipment, time, experience, and screening constraints.',
      ],
      policyVersion,
      characterBiasApplied: false,
    };
  }

  explanationCodes.push('TEMPLATE_SELECTED');
  explanationCodes.push(`TEMPLATE_KEY:${best.template.key}`);
  if (best.dropCodes.includes('EXERCISE_EQUIPMENT_EXCLUDED')) {
    explanationCodes.push('SOME_EXERCISES_EXCLUDED_FOR_EQUIPMENT');
  }
  if (best.dropCodes.includes('EXERCISE_SCREENING_EXCLUDED')) {
    explanationCodes.push('SOME_EXERCISES_EXCLUDED_FOR_SCREENING');
  }

  const characterBiasApplied =
    input.constraints.characterPreferenceTags.length > 0 && best.score > 0;
  if (characterBiasApplied) {
    explanationCodes.push('CHARACTER_EMPHASIS_BIAS_ONLY');
  }
  explanationCodes.push('CHARACTER_CANNOT_OVERRIDE_CONSTRAINTS');

  const estimatedWeeklyMinutes = best.sessions.reduce(
    (sum, s) => sum + s.estimatedDuration,
    0,
  );

  return {
    eligibilityStatus,
    candidatePlan: {
      templateId: best.template.id,
      templateKey: best.template.key,
      templateVersion: best.template.version,
      templateName: best.template.name,
      weeklySessions: best.sessions,
      estimatedWeeklyMinutes,
    },
    explanationCodes,
    warnings,
    policyVersion,
    characterBiasApplied,
  };
}
