/**
 * Aggregate grocery quantities from planned recipes (docs/05).
 */

export type GroceryIngredientLine = {
  foodId: string;
  displayName: string;
  quantityGrams: number;
};

export type RecipeGrocerySource = {
  portions: number;
  recipePortions: number;
  ingredients: Array<{
    foodId: string;
    displayName: string;
    quantityGrams: number;
  }>;
};

/**
 * Aggregate by foodId. Quantities are scaled by planned portions / recipe batch portions.
 * Does not mix incompatible unit systems — grams only.
 */
export function aggregateGroceryList(
  sources: RecipeGrocerySource[],
): GroceryIngredientLine[] {
  const map = new Map<string, GroceryIngredientLine>();

  for (const source of sources) {
    const scale =
      source.recipePortions > 0 ? source.portions / source.recipePortions : source.portions;
    for (const ing of source.ingredients) {
      const existing = map.get(ing.foodId);
      const add = ing.quantityGrams * scale;
      if (existing) {
        existing.quantityGrams += add;
      } else {
        map.set(ing.foodId, {
          foodId: ing.foodId,
          displayName: ing.displayName,
          quantityGrams: add,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
}
