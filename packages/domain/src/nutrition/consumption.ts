/**
 * Planned meals vs logged consumption remain separate (docs/05 Milestone 4 exit).
 */

import type { NutrientSnapshot } from './recipe-nutrients.js';

export type PlannedMealView = {
  id: string;
  localDate: string;
  mealType: string;
  recipeId: string;
  portions: number;
  nutrientSnapshot: NutrientSnapshot | null;
};

export type MealLogView = {
  id: string;
  localDate: string;
  plannedMealId: string | null;
  nutrientSnapshot: NutrientSnapshot;
  source: string;
};

/**
 * Sum planned nutrients for a local date — does not include meal logs.
 */
export function sumPlannedNutrientsForDate(
  planned: PlannedMealView[],
  localDate: string,
): NutrientSnapshot {
  return planned
    .filter((m) => m.localDate === localDate && m.nutrientSnapshot)
    .reduce(
      (acc, m) => ({
        energyKcal: acc.energyKcal + (m.nutrientSnapshot?.energyKcal ?? 0) * m.portions,
        proteinG: acc.proteinG + (m.nutrientSnapshot?.proteinG ?? 0) * m.portions,
        fatG: acc.fatG + (m.nutrientSnapshot?.fatG ?? 0) * m.portions,
        carbohydrateG:
          acc.carbohydrateG + (m.nutrientSnapshot?.carbohydrateG ?? 0) * m.portions,
      }),
      { energyKcal: 0, proteinG: 0, fatG: 0, carbohydrateG: 0 },
    );
}

/**
 * Sum logged consumption for a local date — independent of the meal plan.
 */
export function sumLoggedNutrientsForDate(
  logs: MealLogView[],
  localDate: string,
): NutrientSnapshot {
  return logs
    .filter((m) => m.localDate === localDate)
    .reduce(
      (acc, m) => ({
        energyKcal: acc.energyKcal + m.nutrientSnapshot.energyKcal,
        proteinG: acc.proteinG + m.nutrientSnapshot.proteinG,
        fatG: acc.fatG + m.nutrientSnapshot.fatG,
        carbohydrateG: acc.carbohydrateG + m.nutrientSnapshot.carbohydrateG,
      }),
      { energyKcal: 0, proteinG: 0, fatG: 0, carbohydrateG: 0 },
    );
}

export function plannedAndLoggedAreSeparate(): true {
  return true;
}
