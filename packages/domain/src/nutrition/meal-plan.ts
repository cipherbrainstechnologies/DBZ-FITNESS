/**
 * Seven-day meal plan generation with hard diet/allergy filters (docs/05).
 */

import {
  evaluateRecipeAgainstDiet,
  type DietFilterPreferences,
  type RecipeFilterCandidate,
} from './dietary-filter.js';
import { NUTRITION_POLICY_VERSION } from './policy.js';
import type { NutrientSnapshot } from './recipe-nutrients.js';

export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export type RecipePlanCandidate = RecipeFilterCandidate & {
  mealTypes: MealType[];
  nutrientsPerPortion: NutrientSnapshot | null;
  preparationTags: string[];
};

export type MealPlanSlot = {
  localDate: string;
  mealType: MealType;
  recipeId: string;
  recipeKey: string;
  recipeName: string;
  portions: number;
  nutrientSnapshot: NutrientSnapshot | null;
};

export type MealPlanPreviewResult = {
  policyVersion: string;
  isPartial: boolean;
  explanationCodes: string[];
  warnings: string[];
  days: MealPlanSlot[];
  eligibleRecipeCount: number;
};

function addDays(isoDate: string, days: number): string {
  const parts = isoDate.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function recipesForMealType(
  recipes: RecipePlanCandidate[],
  mealType: MealType,
): RecipePlanCandidate[] {
  return recipes.filter((r) => r.mealTypes.includes(mealType));
}

/**
 * Deterministic 7-day plan. Hard restrictions first; soft targets never override allergies.
 */
export function previewMealPlan(input: {
  startLocalDate: string;
  mealTypesPerDay: MealType[];
  prefs: DietFilterPreferences;
  recipes: RecipePlanCandidate[];
  /** Optional soft energy target for proximity ranking — not a guarantee. */
  softEnergyKcalPerDay?: number | null;
}): MealPlanPreviewResult {
  const explanationCodes: string[] = [];
  const warnings: string[] = [];
  const eligible = input.recipes.filter(
    (r) => evaluateRecipeAgainstDiet(r, input.prefs).eligible,
  );

  explanationCodes.push('DIET_AND_ALLERGY_HARD_FILTER_APPLIED');
  explanationCodes.push(`ELIGIBLE_RECIPES_${eligible.length}`);

  const mealTypes =
    input.mealTypesPerDay.length > 0
      ? input.mealTypesPerDay
      : (['BREAKFAST', 'LUNCH', 'DINNER'] as MealType[]);

  const days: MealPlanSlot[] = [];
  let missingSlots = 0;
  const recentRecipeIds: string[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const localDate = addDays(input.startLocalDate, dayIndex);
    for (const mealType of mealTypes) {
      const pool = recipesForMealType(eligible, mealType);
      if (pool.length === 0) {
        missingSlots += 1;
        continue;
      }

      // Prefer variety: avoid repeating the last few recipe IDs when alternatives exist.
      const ranked = [...pool].sort((a, b) => {
        const aRecent = recentRecipeIds.includes(a.id) ? 1 : 0;
        const bRecent = recentRecipeIds.includes(b.id) ? 1 : 0;
        if (aRecent !== bRecent) {
          return aRecent - bRecent;
        }
        // Soft energy proximity when a daily soft target exists (optional).
        if (input.softEnergyKcalPerDay != null && input.softEnergyKcalPerDay > 0) {
          const perMeal = input.softEnergyKcalPerDay / mealTypes.length;
          const aEnergy = a.nutrientsPerPortion?.energyKcal ?? Number.POSITIVE_INFINITY;
          const bEnergy = b.nutrientsPerPortion?.energyKcal ?? Number.POSITIVE_INFINITY;
          const aDist = Math.abs(aEnergy - perMeal);
          const bDist = Math.abs(bEnergy - perMeal);
          if (aDist !== bDist) {
            return aDist - bDist;
          }
        }
        return a.key.localeCompare(b.key);
      });

      const chosen = ranked[0]!;
      recentRecipeIds.push(chosen.id);
      if (recentRecipeIds.length > 6) {
        recentRecipeIds.shift();
      }

      days.push({
        localDate,
        mealType,
        recipeId: chosen.id,
        recipeKey: chosen.key,
        recipeName: chosen.name,
        portions: 1,
        nutrientSnapshot: chosen.nutrientsPerPortion,
      });
    }
  }

  const expectedSlots = 7 * mealTypes.length;
  const isPartial = days.length < expectedSlots || missingSlots > 0;
  if (isPartial) {
    explanationCodes.push('PARTIAL_PLAN_SAFE_MEALS_UNAVAILABLE');
    warnings.push('OFFER_MANUAL_SELECTION_OR_REQUEST_MORE_RECIPES');
  } else {
    explanationCodes.push('FULL_SEVEN_DAY_PLAN');
  }

  if (input.softEnergyKcalPerDay != null) {
    explanationCodes.push('SOFT_ENERGY_PROXIMITY_USED');
    warnings.push('SOFT_TARGETS_ARE_NOT_CALORIE_GUARANTEES');
  }

  return {
    policyVersion: NUTRITION_POLICY_VERSION,
    isPartial,
    explanationCodes,
    warnings,
    days,
    eligibleRecipeCount: eligible.length,
  };
}
