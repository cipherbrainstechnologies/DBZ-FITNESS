import type { MealType, PlannedMealSummary } from '@saiyan/contracts';

import { localDateInTimeZone } from './api';

const MEAL_TYPE_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

function mealTypeRank(mealType: MealType): number {
  const index = MEAL_TYPE_ORDER.indexOf(mealType);
  return index === -1 ? MEAL_TYPE_ORDER.length : index;
}

export function sortPlannedMeals(meals: PlannedMealSummary[]): PlannedMealSummary[] {
  return [...meals].sort((a, b) => {
    if (a.localDate !== b.localDate) {
      return a.localDate.localeCompare(b.localDate);
    }
    return mealTypeRank(a.mealType) - mealTypeRank(b.mealType);
  });
}

/** Next planned meal for the member's local calendar day (or soonest upcoming). */
export function pickNextPlannedMeal(
  meals: PlannedMealSummary[],
  timeZone: string,
  loggedPlannedMealIds: ReadonlySet<string> = new Set(),
  at: Date = new Date(),
): PlannedMealSummary | null {
  const today = localDateInTimeZone(timeZone, at);
  const available = sortPlannedMeals(meals).filter(
    (meal) => !loggedPlannedMealIds.has(meal.id),
  );
  if (available.length === 0) {
    return null;
  }

  const todays = available.filter((meal) => meal.localDate === today);
  if (todays.length > 0) {
    return todays[0] ?? null;
  }

  const upcoming = available.find((meal) => meal.localDate > today);
  return upcoming ?? available[0] ?? null;
}

export function showsCalorieEstimates(mode: string, energyKcal: number | null): boolean {
  return (
    energyKcal != null &&
    (mode === 'ESTIMATED_TARGET' || mode === 'PROFESSIONAL_TARGET')
  );
}
