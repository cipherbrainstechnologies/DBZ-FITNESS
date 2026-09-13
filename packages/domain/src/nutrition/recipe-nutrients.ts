/**
 * Recipe nutrient aggregation from ingredient weights + cooked yield (docs/05).
 */

export type NutrientSnapshot = {
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbohydrateG: number;
};

export type RecipeIngredientForCalc = {
  quantityGrams: number;
  nutrientsPer100g: NutrientSnapshot;
};

export function scaleNutrients(
  per100g: NutrientSnapshot,
  grams: number,
): NutrientSnapshot {
  const factor = grams / 100;
  return {
    energyKcal: per100g.energyKcal * factor,
    proteinG: per100g.proteinG * factor,
    fatG: per100g.fatG * factor,
    carbohydrateG: per100g.carbohydrateG * factor,
  };
}

export function sumNutrients(parts: NutrientSnapshot[]): NutrientSnapshot {
  return parts.reduce(
    (acc, part) => ({
      energyKcal: acc.energyKcal + part.energyKcal,
      proteinG: acc.proteinG + part.proteinG,
      fatG: acc.fatG + part.fatG,
      carbohydrateG: acc.carbohydrateG + part.carbohydrateG,
    }),
    { energyKcal: 0, proteinG: 0, fatG: 0, carbohydrateG: 0 },
  );
}

/**
 * Sum ingredient nutrients, allocate by cooked yield into per-portion values.
 * Does not apply raw per-100 g values directly to cooked weight.
 */
export function calculateRecipeNutrientsPerPortion(input: {
  ingredients: RecipeIngredientForCalc[];
  cookedYieldGrams: number;
  portions: number;
}): NutrientSnapshot {
  const batch = sumNutrients(
    input.ingredients.map((ing) =>
      scaleNutrients(ing.nutrientsPer100g, ing.quantityGrams),
    ),
  );
  const portions = Math.max(1, input.portions);
  return {
    energyKcal: batch.energyKcal / portions,
    proteinG: batch.proteinG / portions,
    fatG: batch.fatG / portions,
    carbohydrateG: batch.carbohydrateG / portions,
  };
}

export function scalePortion(
  perPortion: NutrientSnapshot,
  portions: number,
): NutrientSnapshot {
  return {
    energyKcal: perPortion.energyKcal * portions,
    proteinG: perPortion.proteinG * portions,
    fatG: perPortion.fatG * portions,
    carbohydrateG: perPortion.carbohydrateG * portions,
  };
}
