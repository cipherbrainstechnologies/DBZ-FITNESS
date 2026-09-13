import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  allergyExclusionIsHardRule,
  evaluateFoodAgainstDiet,
  evaluateRecipeAgainstDiet,
  filterFoodsByDiet,
  filterRecipesByDiet,
  type FoodFilterCandidate,
  type RecipeFilterCandidate,
} from './dietary-filter.ts';
import {
  mifflinStJeorRestingKcal,
  previewNutritionTarget,
} from './targets.ts';

const peanutButter: FoodFilterCandidate = {
  id: 'food-peanut',
  key: 'peanut-butter',
  name: 'Peanut butter',
  allergens: ['PEANUT'],
  allergensKnown: true,
  ingredientCategories: ['PLANT'],
};

const chicken: FoodFilterCandidate = {
  id: 'food-chicken',
  key: 'chicken-breast',
  name: 'Chicken breast',
  allergens: [],
  allergensKnown: true,
  ingredientCategories: ['POULTRY'],
};

const paneer: FoodFilterCandidate = {
  id: 'food-paneer',
  key: 'paneer',
  name: 'Paneer',
  allergens: ['MILK'],
  allergensKnown: true,
  ingredientCategories: ['DAIRY'],
};

const rice: FoodFilterCandidate = {
  id: 'food-rice',
  key: 'cooked-rice',
  name: 'Cooked rice',
  allergens: [],
  allergensKnown: true,
  ingredientCategories: ['PLANT'],
};

const mysterySauce: FoodFilterCandidate = {
  id: 'food-mystery',
  key: 'mystery-sauce',
  name: 'Mystery sauce',
  allergens: [],
  allergensKnown: false,
  ingredientCategories: ['PLANT'],
};

describe('dietary filter — allergen hard rules', () => {
  it('excludes foods that contain a declared member allergy', () => {
    const result = evaluateFoodAgainstDiet(peanutButter, {
      pattern: 'VEGAN',
      allergyRestrictions: ['PEANUT'],
      ingredientExclusions: [],
    });
    assert.equal(result.eligible, false);
    assert.ok(result.reasons.includes('ALLERGY'));
    assert.deepEqual(result.matchedAllergens, ['PEANUT']);
  });

  it('excludes allergen foods from filtered catalogues', () => {
    const filtered = filterFoodsByDiet([peanutButter, rice, paneer], {
      pattern: 'VEGETARIAN',
      allergyRestrictions: ['MILK'],
      ingredientExclusions: [],
    });
    assert.deepEqual(
      filtered.map((f) => f.key).sort(),
      ['cooked-rice', 'peanut-butter'].sort(),
    );
    assert.ok(!filtered.some((f) => f.key === 'paneer'));
  });

  it('excludes peanut foods when member lists PEANUT allergy', () => {
    const filtered = filterFoodsByDiet([peanutButter, rice, paneer], {
      pattern: 'VEGETARIAN',
      allergyRestrictions: ['PEANUT'],
      ingredientExclusions: [],
    });
    assert.ok(!filtered.some((f) => f.key === 'peanut-butter'));
    assert.ok(filtered.some((f) => f.key === 'cooked-rice'));
    assert.ok(filtered.some((f) => f.key === 'paneer'));
  });

  it('treats unknown allergen metadata as unsafe when member has allergies', () => {
    const result = evaluateFoodAgainstDiet(mysterySauce, {
      pattern: 'VEGAN',
      allergyRestrictions: ['PEANUT'],
      ingredientExclusions: [],
    });
    assert.equal(result.eligible, false);
    assert.ok(result.reasons.includes('ALLERGEN_METADATA_UNKNOWN'));
  });

  it('allows unknown allergen metadata when member has no allergy restrictions', () => {
    const result = evaluateFoodAgainstDiet(mysterySauce, {
      pattern: 'VEGAN',
      allergyRestrictions: [],
      ingredientExclusions: [],
    });
    assert.equal(result.eligible, true);
  });

  it('excludes entire recipes when any ingredient fails allergy rules', () => {
    const recipe: RecipeFilterCandidate = {
      id: 'recipe-1',
      key: 'satay-bowl',
      name: 'Satay bowl',
      mealTypes: ['LUNCH'],
      ingredients: [rice, peanutButter],
    };
    const result = evaluateRecipeAgainstDiet(recipe, {
      pattern: 'VEGAN',
      allergyRestrictions: ['PEANUT'],
      ingredientExclusions: [],
    });
    assert.equal(result.eligible, false);
    assert.ok(result.reasons.includes('ALLERGY'));
  });

  it('never includes allergen recipes in filtered recipe catalogues', () => {
    const safe: RecipeFilterCandidate = {
      id: 'r-dal',
      key: 'dal-rice',
      name: 'Dal rice',
      mealTypes: ['LUNCH'],
      ingredients: [rice],
    };
    const unsafe: RecipeFilterCandidate = {
      id: 'r-peanut',
      key: 'peanut-rice',
      name: 'Peanut rice',
      mealTypes: ['LUNCH'],
      ingredients: [rice, peanutButter],
    };
    const filtered = filterRecipesByDiet([safe, unsafe], {
      pattern: 'VEGAN',
      allergyRestrictions: ['PEANUT'],
      ingredientExclusions: [],
    });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.key, 'dal-rice');
  });

  it('never relaxes allergy exclusion for soft targets (hard rule flag)', () => {
    assert.equal(allergyExclusionIsHardRule(), true);
  });
});

describe('dietary filter — diet patterns', () => {
  it('excludes poultry for vegetarian, vegan, and eggetarian', () => {
    for (const pattern of ['VEGETARIAN', 'VEGAN', 'EGGETARIAN'] as const) {
      const result = evaluateFoodAgainstDiet(chicken, {
        pattern,
        allergyRestrictions: [],
        ingredientExclusions: [],
      });
      assert.equal(result.eligible, false, pattern);
      assert.ok(result.reasons.includes('DIET_PATTERN'), pattern);
    }
  });

  it('allows paneer for vegetarian but not vegan', () => {
    assert.equal(
      evaluateFoodAgainstDiet(paneer, {
        pattern: 'VEGETARIAN',
        allergyRestrictions: [],
        ingredientExclusions: [],
      }).eligible,
      true,
    );
    assert.equal(
      evaluateFoodAgainstDiet(paneer, {
        pattern: 'VEGAN',
        allergyRestrictions: [],
        ingredientExclusions: [],
      }).eligible,
      false,
    );
  });
});

describe('nutrition targets — no calorie guarantees', () => {
  it('HABIT_ONLY returns null energy targets', () => {
    const preview = previewNutritionTarget({ mode: 'HABIT_ONLY' });
    assert.equal(preview.status, 'HABIT_ONLY');
    assert.equal(preview.targets.energyKcal, null);
    assert.ok(preview.disclaimers.includes('NO_CALORIE_GUARANTEE'));
    assert.equal(preview.policyVersion, 'nutrition-policy-v1');
  });

  it('matches docs/05 Mifflin fixture arithmetic', () => {
    const resting = mifflinStJeorRestingKcal({
      weightKg: 70,
      heightCm: 170,
      ageYears: 30,
      sexCoefficient: 'MALE_EQUATION',
    });
    assert.equal(resting, 1617.5);
    const preview = previewNutritionTarget({
      mode: 'ESTIMATED_TARGET',
      weightKg: 70,
      heightCm: 170,
      ageYears: 30,
      mifflinSexCoefficient: 'MALE_EQUATION',
      activityFactor: 1.4,
      goalAdjustment: 'FAT_LOSS',
    });
    assert.equal(preview.status, 'OK');
    assert.ok(preview.targets.energyKcal != null);
    assert.ok(Math.abs(preview.targets.energyKcal - 2038.05) < 0.01);
  });

  it('does not silently choose Mifflin coefficient', () => {
    const preview = previewNutritionTarget({
      mode: 'ESTIMATED_TARGET',
      weightKg: 70,
      heightCm: 170,
      ageYears: 30,
      activityFactor: 1.4,
      mifflinSexCoefficient: null,
    });
    assert.equal(preview.status, 'REVIEW_REQUIRED');
    assert.ok(preview.explanationCodes.includes('MIFFLIN_SEX_COEFFICIENT_NOT_SELECTED'));
  });
});
