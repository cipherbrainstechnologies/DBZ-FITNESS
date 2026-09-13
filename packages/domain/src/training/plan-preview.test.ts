import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { shortenBusyDaySession } from './busy-day.ts';
import {
  characterCannotOverrideEquipment,
  previewTrainingPlan,
  TRAINING_POLICY_VERSION,
  type ExerciseCandidate,
  type ProgrammeTemplateCandidate,
} from './plan-preview.ts';
import { isSubstitutionEligible } from './substitution.ts';

const bodyweightSquat: ExerciseCandidate = {
  id: 'ex-bw-squat',
  key: 'bodyweight-squat',
  movementPattern: 'SQUAT',
  equipment: ['BODYWEIGHT'],
  difficulty: 'BEGINNER',
  restrictions: [],
  preferenceTags: ['general'],
};

const barbellBackSquat: ExerciseCandidate = {
  id: 'ex-bb-squat',
  key: 'barbell-back-squat',
  movementPattern: 'SQUAT',
  equipment: ['BARBELL', 'RACK'],
  difficulty: 'INTERMEDIATE',
  restrictions: [],
  preferenceTags: ['strength', 'hypertrophy'],
};

const homeTemplate: ProgrammeTemplateCandidate = {
  id: 'tmpl-home-1',
  key: 'beginner-home-bodyweight-2d',
  version: 1,
  name: 'Beginner home bodyweight (2 days)',
  goalTags: ['general_fitness'],
  preferenceTags: ['home', 'bodyweight'],
  requiredEquipment: ['BODYWEIGHT'],
  experienceLevels: ['BEGINNER', 'RETURNING'],
  minDaysPerWeek: 2,
  maxDaysPerWeek: 3,
  maxSessionMinutes: 30,
  sessions: [
    {
      id: 'sess-a',
      dayPattern: 'DAY_A',
      estimatedDuration: 25,
      sortOrder: 0,
      isOptional: false,
      exercises: [
        {
          exerciseId: 'ex-bw-squat',
          sortOrder: 0,
          priority: 'CORE',
          sets: 2,
          repMin: 8,
          repMax: 12,
          restSeconds: 60,
          estimatedMinutes: 8,
        },
      ],
    },
    {
      id: 'sess-b',
      dayPattern: 'DAY_B',
      estimatedDuration: 25,
      sortOrder: 1,
      isOptional: false,
      exercises: [
        {
          exerciseId: 'ex-bw-squat',
          sortOrder: 0,
          priority: 'CORE',
          sets: 2,
          repMin: 8,
          repMax: 12,
          restSeconds: 60,
          estimatedMinutes: 8,
        },
      ],
    },
  ],
};

const barbellTemplate: ProgrammeTemplateCandidate = {
  id: 'tmpl-bb-1',
  key: 'intermediate-barbell-strength',
  version: 1,
  name: 'Barbell strength',
  goalTags: ['strength'],
  preferenceTags: ['strength', 'hypertrophy', 'gym'],
  requiredEquipment: ['BARBELL', 'RACK'],
  experienceLevels: ['INTERMEDIATE', 'ADVANCED'],
  minDaysPerWeek: 2,
  maxDaysPerWeek: 4,
  maxSessionMinutes: 45,
  sessions: [
    {
      id: 'sess-bb',
      dayPattern: 'DAY_A',
      estimatedDuration: 40,
      sortOrder: 0,
      isOptional: false,
      exercises: [
        {
          exerciseId: 'ex-bb-squat',
          sortOrder: 0,
          priority: 'CORE',
          sets: 3,
          repMin: 5,
          repMax: 8,
          restSeconds: 120,
          estimatedMinutes: 15,
        },
      ],
    },
  ],
};

describe('characterCannotOverrideEquipment', () => {
  it('rejects barbell exercise when member only has bodyweight — even with strength character tags', () => {
    const gate = characterCannotOverrideEquipment({
      memberEquipment: ['BODYWEIGHT'],
      exerciseEquipment: ['BARBELL', 'RACK'],
      characterPreferenceTags: ['strength', 'hypertrophy', 'titan'],
    });
    assert.equal(gate.allowed, false);
    if (!gate.allowed) {
      assert.equal(gate.reason, 'CHARACTER_CANNOT_OVERRIDE_EQUIPMENT');
    }
  });

  it('allows bodyweight exercise regardless of character tags', () => {
    const gate = characterCannotOverrideEquipment({
      memberEquipment: ['BODYWEIGHT', 'DUMBBELL'],
      exerciseEquipment: ['BODYWEIGHT'],
      characterPreferenceTags: ['strength'],
    });
    assert.equal(gate.allowed, true);
  });
});

describe('previewTrainingPlan', () => {
  it('does not select barbell template when equipment is bodyweight-only despite character strength bias', () => {
    const result = previewTrainingPlan({
      constraints: {
        equipment: ['BODYWEIGHT'],
        experience: 'BEGINNER',
        sessionDurationMinutes: 30,
        availableDaysCount: 2,
        screeningOutcome: 'CLEAR',
        screeningRestrictions: [],
        characterPreferenceTags: ['strength', 'hypertrophy'],
        programmePreference: 'strength',
      },
      templates: [barbellTemplate, homeTemplate],
      exercises: [bodyweightSquat, barbellBackSquat],
    });

    assert.equal(result.policyVersion, TRAINING_POLICY_VERSION);
    assert.ok(result.candidatePlan);
    assert.equal(result.candidatePlan?.templateKey, 'beginner-home-bodyweight-2d');
    assert.ok(result.explanationCodes.includes('CHARACTER_CANNOT_OVERRIDE_CONSTRAINTS'));
    assert.equal(result.candidatePlan?.templateKey !== 'intermediate-barbell-strength', true);
  });

  it('blocks automated plan when screening requires professional guidance', () => {
    const result = previewTrainingPlan({
      constraints: {
        equipment: ['BODYWEIGHT'],
        experience: 'BEGINNER',
        sessionDurationMinutes: 30,
        availableDaysCount: 2,
        screeningOutcome: 'SPECIALIST_SUPPORT',
        screeningRestrictions: ['SPECIALIST_SUPPORT_REQUIRED'],
        characterPreferenceTags: ['strength'],
      },
      templates: [homeTemplate],
      exercises: [bodyweightSquat],
    });
    assert.equal(result.candidatePlan, null);
    assert.equal(result.eligibilityStatus, 'PROFESSIONAL_GUIDANCE_REQUIRED');
  });
});

describe('shortenBusyDaySession', () => {
  it('drops optional work first and preserves rest prescriptions', () => {
    const result = shortenBusyDaySession({
      durationBudgetMinutes: 30,
      targetDurationMinutes: 15,
      exercises: [
        {
          exerciseId: 'a',
          sortOrder: 0,
          priority: 'CORE',
          sets: 2,
          repMin: 8,
          repMax: 12,
          restSeconds: 60,
          estimatedMinutes: 10,
        },
        {
          exerciseId: 'b',
          sortOrder: 1,
          priority: 'OPTIONAL',
          sets: 2,
          repMin: 8,
          repMax: 12,
          restSeconds: 60,
          estimatedMinutes: 10,
        },
        {
          exerciseId: 'c',
          sortOrder: 2,
          priority: 'OPTIONAL',
          sets: 2,
          repMin: 8,
          repMax: 12,
          restSeconds: 45,
          estimatedMinutes: 8,
        },
      ],
    });
    assert.equal(result.shortened, true);
    assert.deepEqual(result.removedExerciseIds.sort(), ['b', 'c'].sort());
    assert.equal(result.exercises.length, 1);
    assert.equal(result.exercises[0]?.restSeconds, 60);
    assert.ok(result.explanationCodes.includes('BUSY_DAY_REST_PRESERVED'));
  });
});

describe('isSubstitutionEligible', () => {
  it('rejects substitute that needs unavailable equipment', () => {
    const result = isSubstitutionEligible(
      bodyweightSquat,
      barbellBackSquat,
      {
        memberEquipment: ['BODYWEIGHT'],
        screeningRestrictions: [],
        experience: 'BEGINNER',
        timeBudgetMinutes: 30,
        candidateEstimatedMinutes: 15,
        characterPreferenceTags: ['strength'],
      },
    );
    assert.equal(result.eligible, false);
    assert.ok(result.reasons.includes('EQUIPMENT_UNAVAILABLE'));
  });
});
