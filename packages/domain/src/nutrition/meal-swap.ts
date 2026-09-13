/**
 * Meal swap candidates — search only eligible recipes (docs/05).
 */

import {
  evaluateRecipeAgainstDiet,
  type DietFilterPreferences,
} from './dietary-filter.js';
import type { MealType, RecipePlanCandidate } from './meal-plan.js';
import type { NutrientSnapshot } from './recipe-nutrients.js';
import { scalePortion } from './recipe-nutrients.js';

export type SwapCandidate = {
  recipeId: string;
  recipeKey: string;
  recipeName: string;
  portions: number;
  nutrientSnapshot: NutrientSnapshot | null;
  score: number;
  dailyEnergyDeltaKcal: number | null;
  dailyProteinDeltaG: number | null;
};

export type SwapPreviewResult = {
  current: {
    recipeId: string;
    portions: number;
    nutrientSnapshot: NutrientSnapshot | null;
  };
  candidates: SwapCandidate[];
  explanationCodes: string[];
};

function snapshotOrZero(s: NutrientSnapshot | null | undefined): NutrientSnapshot {
  return (
    s ?? {
      energyKcal: 0,
      proteinG: 0,
      fatG: 0,
      carbohydrateG: 0,
    }
  );
}

/**
 * Rank eligible swap candidates by meal type, restrictions (already filtered),
 * energy/protein proximity, and variety.
 */
export function previewMealSwap(input: {
  mealType: MealType;
  currentRecipeId: string;
  currentPortions: number;
  currentNutrients: NutrientSnapshot | null;
  /** Other planned meals on the same local date (excluding the one being swapped). */
  sameDayOtherMeals: Array<{ nutrientSnapshot: NutrientSnapshot | null; portions: number }>;
  prefs: DietFilterPreferences;
  recipes: RecipePlanCandidate[];
  softEnergyKcalPerDay?: number | null;
  softProteinGPerDay?: number | null;
}): SwapPreviewResult {
  const explanationCodes = ['SWAP_ELIGIBLE_CANDIDATES_ONLY', 'ALLERGY_HARD_RULE'];
  const eligible = input.recipes.filter(
    (r) =>
      r.id !== input.currentRecipeId &&
      r.mealTypes.includes(input.mealType) &&
      evaluateRecipeAgainstDiet(r, input.prefs).eligible,
  );

  const otherDay = input.sameDayOtherMeals.reduce(
    (acc, m) => {
      const n = snapshotOrZero(m.nutrientSnapshot);
      return {
        energyKcal: acc.energyKcal + n.energyKcal * m.portions,
        proteinG: acc.proteinG + n.proteinG * m.portions,
        fatG: acc.fatG + n.fatG * m.portions,
        carbohydrateG: acc.carbohydrateG + n.carbohydrateG * m.portions,
      };
    },
    { energyKcal: 0, proteinG: 0, fatG: 0, carbohydrateG: 0 },
  );

  const currentScaled = scalePortion(
    snapshotOrZero(input.currentNutrients),
    input.currentPortions,
  );

  const candidates: SwapCandidate[] = eligible.map((recipe) => {
    const nutrients = recipe.nutrientsPerPortion;
    const scaled = scalePortion(snapshotOrZero(nutrients), input.currentPortions);
    const newDayEnergy = otherDay.energyKcal + scaled.energyKcal;
    const newDayProtein = otherDay.proteinG + scaled.proteinG;
    const oldDayEnergy = otherDay.energyKcal + currentScaled.energyKcal;
    const oldDayProtein = otherDay.proteinG + currentScaled.proteinG;

    let score = 0;
    if (input.softEnergyKcalPerDay != null && input.softEnergyKcalPerDay > 0) {
      const oldDist = Math.abs(oldDayEnergy - input.softEnergyKcalPerDay);
      const newDist = Math.abs(newDayEnergy - input.softEnergyKcalPerDay);
      score += oldDist - newDist;
    }
    if (input.softProteinGPerDay != null && input.softProteinGPerDay > 0) {
      const oldDist = Math.abs(oldDayProtein - input.softProteinGPerDay);
      const newDist = Math.abs(newDayProtein - input.softProteinGPerDay);
      score += (oldDist - newDist) * 2;
    }

    return {
      recipeId: recipe.id,
      recipeKey: recipe.key,
      recipeName: recipe.name,
      portions: input.currentPortions,
      nutrientSnapshot: nutrients,
      score,
      dailyEnergyDeltaKcal: scaled.energyKcal - currentScaled.energyKcal,
      dailyProteinDeltaG: scaled.proteinG - currentScaled.proteinG,
    };
  });

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.recipeKey.localeCompare(b.recipeKey);
  });

  if (candidates.length === 0) {
    explanationCodes.push('NO_ELIGIBLE_SWAP_CANDIDATES');
  }

  return {
    current: {
      recipeId: input.currentRecipeId,
      portions: input.currentPortions,
      nutrientSnapshot: input.currentNutrients,
    },
    candidates: candidates.slice(0, 10),
    explanationCodes,
  };
}
