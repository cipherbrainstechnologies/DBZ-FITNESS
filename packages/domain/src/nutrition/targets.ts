/**
 * Optional energy / macro draft estimates (docs/05).
 * Never claimed as calorie guarantees. HABIT_ONLY has no targets.
 */

/** Keep in sync with `policy.ts` — local so strip-types unit tests stay self-contained. */
const POLICY_VERSION = 'nutrition-policy-v1';

export type NutritionMode =
  | 'HABIT_ONLY'
  | 'ESTIMATED_TARGET'
  | 'PROFESSIONAL_TARGET';

/** Published Mifflin–St Jeor sex-specific coefficients — not gender identity. */
export type MifflinSexCoefficient = 'MALE_EQUATION' | 'FEMALE_EQUATION';

export type TargetGoalAdjustment = 'MAINTENANCE' | 'MUSCLE_GAIN' | 'FAT_LOSS';

export type PreviewNutritionTargetInput = {
  mode: NutritionMode;
  weightKg?: number | null;
  heightCm?: number | null;
  ageYears?: number | null;
  mifflinSexCoefficient?: MifflinSexCoefficient | null;
  activityFactor?: number | null;
  goalAdjustment?: TargetGoalAdjustment | null;
  professionalEnergyKcal?: number | null;
  professionalProteinG?: number | null;
  professionalFatG?: number | null;
  professionalCarbohydrateG?: number | null;
  blocksAutomatedTargets?: boolean;
};

export type NutrientTotals = {
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbohydrateG: number | null;
};

export type NutritionTargetPreviewResult = {
  mode: NutritionMode;
  policyVersion: string;
  status: 'OK' | 'REVIEW_REQUIRED' | 'HABIT_ONLY' | 'INELIGIBLE';
  targets: NutrientTotals;
  explanationCodes: string[];
  warnings: string[];
  disclaimers: string[];
  calculationInputs: Record<string, unknown> | null;
};

const PROTEIN_G_PER_KG = 1.6;
const FAT_ENERGY_FRACTION = 0.3;
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;

const ACTIVITY_FACTOR_MIN = 1.2;
const ACTIVITY_FACTOR_MAX = 1.9;
const ENERGY_FLOOR_KCAL = 1200;
const ENERGY_CEILING_KCAL = 4500;

export function mifflinStJeorRestingKcal(input: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sexCoefficient: MifflinSexCoefficient;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  return input.sexCoefficient === 'MALE_EQUATION' ? base + 5 : base - 161;
}

function goalMultiplier(goal: TargetGoalAdjustment): number {
  switch (goal) {
    case 'MAINTENANCE':
      return 1;
    case 'MUSCLE_GAIN':
      return 1.05;
    case 'FAT_LOSS':
      return 0.9;
    default: {
      const _exhaustive: never = goal;
      return _exhaustive;
    }
  }
}

function allocateMacros(
  energyKcal: number,
  weightKg: number,
): { proteinG: number; fatG: number; carbohydrateG: number } {
  const proteinG = PROTEIN_G_PER_KG * weightKg;
  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  const fatKcal = energyKcal * FAT_ENERGY_FRACTION;
  const fatG = fatKcal / KCAL_PER_G_FAT;
  const carbKcal = energyKcal - proteinKcal - fatKcal;
  const carbohydrateG = carbKcal / KCAL_PER_G_CARB;
  return { proteinG, fatG, carbohydrateG };
}

export function previewNutritionTarget(
  input: PreviewNutritionTargetInput,
): NutritionTargetPreviewResult {
  const disclaimers = [
    'NO_CALORIE_GUARANTEE',
    'ESTIMATES_ARE_NOT_PERSONALISED_PRESCRIPTION',
  ];
  const warnings: string[] = [];
  const explanationCodes: string[] = [];

  if (input.mode === 'HABIT_ONLY') {
    return {
      mode: 'HABIT_ONLY',
      policyVersion: POLICY_VERSION,
      status: 'HABIT_ONLY',
      targets: {
        energyKcal: null,
        proteinG: null,
        fatG: null,
        carbohydrateG: null,
      },
      explanationCodes: ['HABIT_ONLY_NO_ENERGY_TARGET'],
      warnings,
      disclaimers,
      calculationInputs: { mode: 'HABIT_ONLY' },
    };
  }

  if (input.blocksAutomatedTargets && input.mode === 'ESTIMATED_TARGET') {
    return {
      mode: input.mode,
      policyVersion: POLICY_VERSION,
      status: 'INELIGIBLE',
      targets: {
        energyKcal: null,
        proteinG: null,
        fatG: null,
        carbohydrateG: null,
      },
      explanationCodes: ['AUTOMATED_TARGETS_BLOCKED_BY_SCREENING'],
      warnings: ['USE_HABIT_ONLY_OR_PROFESSIONAL_TARGET'],
      disclaimers,
      calculationInputs: null,
    };
  }

  if (input.mode === 'PROFESSIONAL_TARGET') {
    const energy = input.professionalEnergyKcal ?? null;
    const protein = input.professionalProteinG ?? null;
    const fat = input.professionalFatG ?? null;
    const carb = input.professionalCarbohydrateG ?? null;
    if (energy === null || protein === null || fat === null || carb === null) {
      return {
        mode: 'PROFESSIONAL_TARGET',
        policyVersion: POLICY_VERSION,
        status: 'REVIEW_REQUIRED',
        targets: {
          energyKcal: energy,
          proteinG: protein,
          fatG: fat,
          carbohydrateG: carb,
        },
        explanationCodes: ['PROFESSIONAL_TARGET_INCOMPLETE'],
        warnings,
        disclaimers,
        calculationInputs: { mode: 'PROFESSIONAL_TARGET', source: 'MEMBER_SUPPLIED' },
      };
    }
    explanationCodes.push('PROFESSIONAL_TARGET_MEMBER_SUPPLIED');
    return {
      mode: 'PROFESSIONAL_TARGET',
      policyVersion: POLICY_VERSION,
      status: 'OK',
      targets: {
        energyKcal: energy,
        proteinG: protein,
        fatG: fat,
        carbohydrateG: carb,
      },
      explanationCodes,
      warnings,
      disclaimers,
      calculationInputs: { mode: 'PROFESSIONAL_TARGET', source: 'MEMBER_SUPPLIED' },
    };
  }

  const weightKg = input.weightKg ?? null;
  const heightCm = input.heightCm ?? null;
  const ageYears = input.ageYears ?? null;
  const sex = input.mifflinSexCoefficient ?? null;
  const activity = input.activityFactor ?? null;
  const goal = input.goalAdjustment ?? 'MAINTENANCE';

  if (
    weightKg === null ||
    heightCm === null ||
    ageYears === null ||
    sex === null ||
    activity === null
  ) {
    explanationCodes.push('ESTIMATE_INPUTS_INCOMPLETE');
    if (sex === null) {
      explanationCodes.push('MIFFLIN_SEX_COEFFICIENT_NOT_SELECTED');
      warnings.push('DO_NOT_SILENTLY_CHOOSE_EQUATION_COEFFICIENT');
    }
    return {
      mode: 'ESTIMATED_TARGET',
      policyVersion: POLICY_VERSION,
      status: 'REVIEW_REQUIRED',
      targets: {
        energyKcal: null,
        proteinG: null,
        fatG: null,
        carbohydrateG: null,
      },
      explanationCodes,
      warnings,
      disclaimers,
      calculationInputs: {
        mode: 'ESTIMATED_TARGET',
        weightKg,
        heightCm,
        ageYears,
        mifflinSexCoefficient: sex,
        activityFactor: activity,
        goalAdjustment: goal,
      },
    };
  }

  if (activity < ACTIVITY_FACTOR_MIN || activity > ACTIVITY_FACTOR_MAX) {
    return {
      mode: 'ESTIMATED_TARGET',
      policyVersion: POLICY_VERSION,
      status: 'REVIEW_REQUIRED',
      targets: {
        energyKcal: null,
        proteinG: null,
        fatG: null,
        carbohydrateG: null,
      },
      explanationCodes: ['ACTIVITY_FACTOR_OUT_OF_POLICY_BOUNDS'],
      warnings,
      disclaimers,
      calculationInputs: { activityFactor: activity },
    };
  }

  if (goal === 'FAT_LOSS' && input.blocksAutomatedTargets) {
    return {
      mode: 'ESTIMATED_TARGET',
      policyVersion: POLICY_VERSION,
      status: 'INELIGIBLE',
      targets: {
        energyKcal: null,
        proteinG: null,
        fatG: null,
        carbohydrateG: null,
      },
      explanationCodes: ['FAT_LOSS_BLOCKED_BY_SCREENING'],
      warnings: ['USE_HABIT_ONLY_OR_PROFESSIONAL_TARGET'],
      disclaimers,
      calculationInputs: null,
    };
  }

  const resting = mifflinStJeorRestingKcal({
    weightKg,
    heightCm,
    ageYears,
    sexCoefficient: sex,
  });
  const maintenance = resting * activity;
  const energyKcal = maintenance * goalMultiplier(goal);
  const macros = allocateMacros(energyKcal, weightKg);

  let status: NutritionTargetPreviewResult['status'] = 'OK';
  if (energyKcal < ENERGY_FLOOR_KCAL || energyKcal > ENERGY_CEILING_KCAL) {
    status = 'REVIEW_REQUIRED';
    explanationCodes.push('ENERGY_OUTSIDE_POLICY_BOUNDS');
  }
  if (macros.carbohydrateG < 0) {
    status = 'REVIEW_REQUIRED';
    explanationCodes.push('IMPOSSIBLE_MACRO_COMBINATION');
  }

  explanationCodes.push('MIFFLIN_ST_JEOR_DRAFT_ESTIMATE');
  explanationCodes.push(`GOAL_${goal}`);
  warnings.push('DRAFT_ESTIMATE_REQUIRES_POLICY_REVIEW_FOR_PUBLIC_AUTOMATION');

  return {
    mode: 'ESTIMATED_TARGET',
    policyVersion: POLICY_VERSION,
    status,
    targets: {
      energyKcal,
      proteinG: macros.proteinG,
      fatG: macros.fatG,
      carbohydrateG: macros.carbohydrateG,
    },
    explanationCodes,
    warnings,
    disclaimers,
    calculationInputs: {
      mode: 'ESTIMATED_TARGET',
      weightKg,
      heightCm,
      ageYears,
      mifflinSexCoefficient: sex,
      activityFactor: activity,
      goalAdjustment: goal,
      restingKcal: resting,
      maintenanceKcal: maintenance,
      policyVersion: POLICY_VERSION,
    },
  };
}
