/**
 * Diet pattern + allergy hard filtering (docs/05).
 * Never relax allergies or diet restrictions to satisfy a macro target.
 * Unknown allergen metadata cannot be treated as allergen-free.
 */

export type DietaryPattern =
  | 'VEGETARIAN'
  | 'EGGETARIAN'
  | 'NON_VEGETARIAN'
  | 'VEGAN';

export const INGREDIENT_CATEGORIES = [
  'MEAT',
  'POULTRY',
  'FISH',
  'SEAFOOD',
  'EGG',
  'DAIRY',
  'HONEY',
  'ANIMAL_OTHER',
  'PLANT',
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

const ANIMAL_FLESH: ReadonlySet<IngredientCategory> = new Set([
  'MEAT',
  'POULTRY',
  'FISH',
  'SEAFOOD',
]);

const VEGAN_EXCLUDED: ReadonlySet<IngredientCategory> = new Set([
  'MEAT',
  'POULTRY',
  'FISH',
  'SEAFOOD',
  'EGG',
  'DAIRY',
  'HONEY',
  'ANIMAL_OTHER',
]);

export type FoodFilterCandidate = {
  id: string;
  key: string;
  name: string;
  allergens: string[];
  /** false => unknown allergen metadata; exclude when member lists any allergy. */
  allergensKnown: boolean;
  ingredientCategories: IngredientCategory[];
};

export type RecipeFilterCandidate = {
  id: string;
  key: string;
  name: string;
  mealTypes: string[];
  ingredients: FoodFilterCandidate[];
};

export type DietFilterPreferences = {
  pattern: DietaryPattern;
  allergyRestrictions: string[];
  ingredientExclusions: string[];
};

export type FilterExclusionReason =
  | 'DIET_PATTERN'
  | 'ALLERGY'
  | 'ALLERGEN_METADATA_UNKNOWN'
  | 'INGREDIENT_EXCLUSION';

export type FoodFilterResult = {
  eligible: boolean;
  reasons: FilterExclusionReason[];
  matchedAllergens: string[];
  matchedCategories: IngredientCategory[];
};

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '_');
}

function categoriesForbiddenByPattern(
  pattern: DietaryPattern,
): ReadonlySet<IngredientCategory> {
  switch (pattern) {
    case 'VEGETARIAN':
      return new Set([...ANIMAL_FLESH, 'EGG']);
    case 'EGGETARIAN':
      return ANIMAL_FLESH;
    case 'VEGAN':
      return VEGAN_EXCLUDED;
    case 'NON_VEGETARIAN':
      return new Set();
    default: {
      const _exhaustive: never = pattern;
      return _exhaustive;
    }
  }
}

/**
 * Hard-rule check for a single food against diet pattern, allergies, and exclusions.
 */
export function evaluateFoodAgainstDiet(
  food: FoodFilterCandidate,
  prefs: DietFilterPreferences,
): FoodFilterResult {
  const reasons: FilterExclusionReason[] = [];
  const matchedCategories: IngredientCategory[] = [];
  const matchedAllergens: string[] = [];

  const forbidden = categoriesForbiddenByPattern(prefs.pattern);
  for (const category of food.ingredientCategories) {
    if (forbidden.has(category)) {
      matchedCategories.push(category);
    }
  }
  if (matchedCategories.length > 0) {
    reasons.push('DIET_PATTERN');
  }

  const allergySet = new Set(
    prefs.allergyRestrictions.map(normalizeCode).filter((a) => a.length > 0),
  );

  if (allergySet.size > 0) {
    if (!food.allergensKnown) {
      reasons.push('ALLERGEN_METADATA_UNKNOWN');
    } else {
      for (const allergen of food.allergens) {
        const code = normalizeCode(allergen);
        if (allergySet.has(code)) {
          matchedAllergens.push(code);
        }
      }
      if (matchedAllergens.length > 0) {
        reasons.push('ALLERGY');
      }
    }
  }

  const exclusionSet = new Set(
    prefs.ingredientExclusions.map(normalizeCode).filter((e) => e.length > 0),
  );
  if (exclusionSet.size > 0) {
    const foodKey = normalizeCode(food.key);
    const foodName = normalizeCode(food.name);
    if (exclusionSet.has(foodKey) || exclusionSet.has(foodName)) {
      reasons.push('INGREDIENT_EXCLUSION');
    }
    for (const allergen of food.allergens) {
      if (exclusionSet.has(normalizeCode(allergen))) {
        reasons.push('INGREDIENT_EXCLUSION');
        break;
      }
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons: [...new Set(reasons)],
    matchedAllergens,
    matchedCategories,
  };
}

/**
 * Recipe is eligible only when every ingredient passes hard filters.
 */
export function evaluateRecipeAgainstDiet(
  recipe: RecipeFilterCandidate,
  prefs: DietFilterPreferences,
): FoodFilterResult {
  const reasons: FilterExclusionReason[] = [];
  const matchedAllergens: string[] = [];
  const matchedCategories: IngredientCategory[] = [];

  for (const ingredient of recipe.ingredients) {
    const result = evaluateFoodAgainstDiet(ingredient, prefs);
    if (!result.eligible) {
      reasons.push(...result.reasons);
      matchedAllergens.push(...result.matchedAllergens);
      matchedCategories.push(...result.matchedCategories);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons: [...new Set(reasons)],
    matchedAllergens: [...new Set(matchedAllergens)],
    matchedCategories: [...new Set(matchedCategories)],
  };
}

export function filterFoodsByDiet(
  foods: FoodFilterCandidate[],
  prefs: DietFilterPreferences,
): FoodFilterCandidate[] {
  return foods.filter((food) => evaluateFoodAgainstDiet(food, prefs).eligible);
}

export function filterRecipesByDiet(
  recipes: RecipeFilterCandidate[],
  prefs: DietFilterPreferences,
): RecipeFilterCandidate[] {
  return recipes.filter((recipe) => evaluateRecipeAgainstDiet(recipe, prefs).eligible);
}

/**
 * Allergy exclusion is a hard rule — never overridden by energy/protein proximity.
 */
export function allergyExclusionIsHardRule(): true {
  return true;
}
