/**
 * Versioned nutrition calculation / planning policy (docs/05).
 * Bump when eligibility bounds, factors, or hard filtering rules change.
 */
export const NUTRITION_POLICY_VERSION = 'nutrition-policy-v1';

export const NUTRITION_MODES = [
  'HABIT_ONLY',
  'ESTIMATED_TARGET',
  'PROFESSIONAL_TARGET',
] as const;

export type NutritionMode = (typeof NUTRITION_MODES)[number];

/** Soft target tolerances for meal-plan proximity ranking — not calorie guarantees. */
export const ENERGY_PROXIMITY_TOLERANCE_FRACTION = 0.2;
export const PROTEIN_PROXIMITY_TOLERANCE_FRACTION = 0.25;
