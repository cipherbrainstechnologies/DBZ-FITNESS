import { z } from 'zod';

import { PublicationStatusSchema } from './characters.js';
import { DietaryPatternSchema } from './onboarding.js';
import { IsoDateTimeSchema, UuidSchema } from './common.js';
import { ContentReviewStatusSchema } from './training.js';

export const NutritionModeSchema = z.enum([
  'HABIT_ONLY',
  'ESTIMATED_TARGET',
  'PROFESSIONAL_TARGET',
]);

export const NutritionTargetStatusSchema = z.enum([
  'ACTIVE',
  'SUPERSEDED',
  'CANCELLED',
  'REVIEW_REQUIRED',
]);

export const MealPlanStatusSchema = z.enum(['ACTIVE', 'SUPERSEDED', 'CANCELLED']);

export const MealTypeSchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);

export const MealLogSourceSchema = z.enum(['PLANNED', 'MANUAL', 'RESTAURANT_ESTIMATE']);

export const MealLogEstimateStatusSchema = z.enum([
  'PROVIDER',
  'RECIPE_CALCULATED',
  'MEMBER_ESTIMATE',
  'UNKNOWN',
]);

export const FoodStateSchema = z.enum(['RAW', 'COOKED', 'PREPARED']);

export const NutrientDataCompletenessSchema = z.enum(['COMPLETE', 'PARTIAL', 'UNKNOWN']);

export const MifflinSexCoefficientSchema = z.enum(['MALE_EQUATION', 'FEMALE_EQUATION']);

export const TargetGoalAdjustmentSchema = z.enum([
  'MAINTENANCE',
  'MUSCLE_GAIN',
  'FAT_LOSS',
]);

export const NutrientSnapshotSchema = z.object({
  energyKcal: z.number(),
  proteinG: z.number(),
  fatG: z.number(),
  carbohydrateG: z.number(),
});

export const FoodSummarySchema = z.object({
  id: UuidSchema,
  key: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  providerId: z.string().min(1),
  sourceLabel: z.string().min(1),
  state: FoodStateSchema,
  nutrientsPer100g: NutrientSnapshotSchema,
  allergens: z.array(z.string()),
  allergensKnown: z.boolean(),
  ingredientCategories: z.array(z.string()),
  dataCompleteness: NutrientDataCompletenessSchema,
  reviewStatus: ContentReviewStatusSchema,
  publicationStatus: PublicationStatusSchema,
});

export const ListFoodsResponseSchema = z.object({
  foods: z.array(FoodSummarySchema),
});

export const RecipeIngredientSummarySchema = z.object({
  foodId: UuidSchema,
  foodKey: z.string().min(1),
  foodName: z.string().min(1),
  quantityGrams: z.number().positive(),
  sortOrder: z.number().int().nonnegative(),
});

export const RecipeSummarySchema = z.object({
  id: UuidSchema,
  key: z.string().min(1),
  version: z.number().int().positive(),
  name: z.string().min(1),
  instructions: z.string(),
  cookedYieldGrams: z.number().positive(),
  portions: z.number().int().positive(),
  mealTypes: z.array(MealTypeSchema),
  preparationTags: z.array(z.string()).nullable().optional(),
  cuisineTags: z.array(z.string()).nullable().optional(),
  nutrientsPerPortion: NutrientSnapshotSchema.nullable(),
  sourceLabel: z.string().min(1),
  reviewStatus: ContentReviewStatusSchema,
  publicationStatus: PublicationStatusSchema,
});

export const RecipeDetailSchema = RecipeSummarySchema.extend({
  ingredients: z.array(RecipeIngredientSummarySchema),
});

export const ListRecipesResponseSchema = z.object({
  recipes: z.array(RecipeSummarySchema),
});

export const PreviewNutritionTargetRequestSchema = z
  .object({
    mode: NutritionModeSchema,
    dietPreferenceId: UuidSchema.optional().nullable(),
    profileVersionId: UuidSchema.optional().nullable(),
    weightKg: z.number().positive().max(500).optional().nullable(),
    heightCm: z.number().positive().max(300).optional().nullable(),
    ageYears: z.number().int().positive().max(120).optional().nullable(),
    mifflinSexCoefficient: MifflinSexCoefficientSchema.optional().nullable(),
    activityFactor: z.number().positive().max(3).optional().nullable(),
    goalAdjustment: TargetGoalAdjustmentSchema.optional().nullable(),
    professionalEnergyKcal: z.number().positive().max(10000).optional().nullable(),
    professionalProteinG: z.number().nonnegative().max(1000).optional().nullable(),
    professionalFatG: z.number().nonnegative().max(1000).optional().nullable(),
    professionalCarbohydrateG: z.number().nonnegative().max(2000).optional().nullable(),
    blocksAutomatedTargets: z.boolean().optional(),
  })
  .strict();

export const PreviewNutritionTargetResponseSchema = z.object({
  mode: NutritionModeSchema,
  policyVersion: z.string().min(1),
  status: z.enum(['OK', 'REVIEW_REQUIRED', 'HABIT_ONLY', 'INELIGIBLE']),
  targets: z.object({
    energyKcal: z.number().nullable(),
    proteinG: z.number().nullable(),
    fatG: z.number().nullable(),
    carbohydrateG: z.number().nullable(),
  }),
  explanationCodes: z.array(z.string()),
  warnings: z.array(z.string()),
  disclaimers: z.array(z.string()),
  previewToken: z.string().min(1).nullable(),
  expiresAt: IsoDateTimeSchema.nullable(),
});

export const ActivateNutritionTargetRequestSchema = z
  .object({
    previewToken: z.string().uuid(),
  })
  .strict();

export const NutritionTargetSummarySchema = z.object({
  id: UuidSchema,
  version: z.number().int().positive(),
  mode: NutritionModeSchema,
  policyVersion: z.string().min(1),
  energyKcal: z.number().nullable(),
  proteinG: z.number().nullable(),
  fatG: z.number().nullable(),
  carbohydrateG: z.number().nullable(),
  explanationCodes: z.array(z.string()),
  warnings: z.array(z.string()).nullable().optional(),
  status: NutritionTargetStatusSchema,
  effectiveFrom: IsoDateTimeSchema,
});

export const ActivateNutritionTargetResponseSchema = z.object({
  target: NutritionTargetSummarySchema,
});

export const PreviewMealPlanRequestSchema = z
  .object({
    dietPreferenceId: UuidSchema.optional().nullable(),
    nutritionTargetId: UuidSchema.optional().nullable(),
    startLocalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timeZone: z.string().min(1).max(64),
    mealTypesPerDay: z.array(MealTypeSchema).min(1).max(4).optional(),
    /** When true and a target has energy, use soft proximity only — never a guarantee. */
    useSoftEnergyProximity: z.boolean().optional(),
  })
  .strict();

export const PlannedMealSlotSchema = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: MealTypeSchema,
  recipeId: UuidSchema,
  recipeKey: z.string().min(1),
  recipeName: z.string().min(1),
  portions: z.number().positive(),
  nutrientSnapshot: NutrientSnapshotSchema.nullable(),
});

export const PreviewMealPlanResponseSchema = z.object({
  policyVersion: z.string().min(1),
  isPartial: z.boolean(),
  explanationCodes: z.array(z.string()),
  warnings: z.array(z.string()),
  days: z.array(PlannedMealSlotSchema),
  eligibleRecipeCount: z.number().int().nonnegative(),
  dietaryPattern: DietaryPatternSchema.nullable(),
  previewToken: z.string().min(1).nullable(),
  expiresAt: IsoDateTimeSchema.nullable(),
});

export const ActivateMealPlanRequestSchema = z
  .object({
    previewToken: z.string().uuid(),
  })
  .strict();

export const MealPlanSummarySchema = z.object({
  id: UuidSchema,
  version: z.number().int().positive(),
  targetId: UuidSchema.nullable(),
  dietPreferenceId: UuidSchema,
  startLocalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1),
  policyVersion: z.string().min(1),
  isPartial: z.boolean(),
  explanationCodes: z.array(z.string()),
  status: MealPlanStatusSchema,
  effectiveFrom: IsoDateTimeSchema,
});

export const PlannedMealSummarySchema = z.object({
  id: UuidSchema,
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: MealTypeSchema,
  recipeId: UuidSchema,
  portions: z.number().positive(),
  nutrientSnapshot: NutrientSnapshotSchema.nullable(),
});

export const ActivateMealPlanResponseSchema = z.object({
  plan: MealPlanSummarySchema,
  meals: z.array(PlannedMealSummarySchema),
});

export const CurrentMealPlanResponseSchema = z.object({
  plan: MealPlanSummarySchema.nullable(),
  meals: z.array(PlannedMealSummarySchema),
});

export const SwapMealPreviewRequestSchema = z
  .object({
    recipeId: UuidSchema.optional().nullable(),
  })
  .strict();

export const SwapCandidateSchema = z.object({
  recipeId: UuidSchema,
  recipeKey: z.string().min(1),
  recipeName: z.string().min(1),
  portions: z.number().positive(),
  nutrientSnapshot: NutrientSnapshotSchema.nullable(),
  score: z.number(),
  dailyEnergyDeltaKcal: z.number().nullable(),
  dailyProteinDeltaG: z.number().nullable(),
});

export const SwapMealPreviewResponseSchema = z.object({
  plannedMealId: UuidSchema,
  current: z.object({
    recipeId: UuidSchema,
    portions: z.number().positive(),
    nutrientSnapshot: NutrientSnapshotSchema.nullable(),
  }),
  candidates: z.array(SwapCandidateSchema),
  explanationCodes: z.array(z.string()),
  previewToken: z.string().min(1).nullable(),
  expiresAt: IsoDateTimeSchema.nullable(),
});

export const SwapMealConfirmRequestSchema = z
  .object({
    previewToken: z.string().uuid(),
    recipeId: UuidSchema,
  })
  .strict();

export const SwapMealConfirmResponseSchema = z.object({
  meal: PlannedMealSummarySchema,
});

export const CreateMealLogRequestSchema = z
  .object({
    consumedAt: IsoDateTimeSchema,
    localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timeZone: z.string().min(1).max(64),
    source: MealLogSourceSchema,
    mealType: MealTypeSchema.optional().nullable(),
    plannedMealId: UuidSchema.optional().nullable(),
    recipeId: UuidSchema.optional().nullable(),
    foodId: UuidSchema.optional().nullable(),
    portions: z.number().positive().max(20).optional(),
    nutrientSnapshot: NutrientSnapshotSchema.optional().nullable(),
    estimateStatus: MealLogEstimateStatusSchema.optional(),
    notes: z.string().max(500).optional().nullable(),
  })
  .strict();

export const MealLogSummarySchema = z.object({
  id: UuidSchema,
  consumedAt: IsoDateTimeSchema,
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1),
  source: MealLogSourceSchema,
  mealType: MealTypeSchema.nullable(),
  plannedMealId: UuidSchema.nullable(),
  recipeId: UuidSchema.nullable(),
  foodId: UuidSchema.nullable(),
  portions: z.number().positive(),
  nutrientSnapshot: NutrientSnapshotSchema,
  estimateStatus: MealLogEstimateStatusSchema,
  notes: z.string().nullable().optional(),
  version: z.number().int().positive(),
});

export const CreateMealLogResponseSchema = z.object({
  log: MealLogSummarySchema,
});

export const UpdateMealLogRequestSchema = z
  .object({
    portions: z.number().positive().max(20).optional(),
    nutrientSnapshot: NutrientSnapshotSchema.optional(),
    notes: z.string().max(500).optional().nullable(),
    estimateStatus: MealLogEstimateStatusSchema.optional(),
    version: z.number().int().positive(),
  })
  .strict();

export const GroceryListItemSchema = z.object({
  id: UuidSchema,
  foodId: UuidSchema,
  displayName: z.string().min(1),
  quantityGrams: z.number().nonnegative(),
  excluded: z.boolean(),
});

export const CurrentGroceryListResponseSchema = z.object({
  groceryList: z
    .object({
      id: UuidSchema,
      mealPlanId: UuidSchema,
      version: z.number().int().positive(),
      items: z.array(GroceryListItemSchema),
    })
    .nullable(),
});

export type PreviewNutritionTargetRequest = z.infer<
  typeof PreviewNutritionTargetRequestSchema
>;
export type PreviewNutritionTargetResponse = z.infer<
  typeof PreviewNutritionTargetResponseSchema
>;
export type ActivateNutritionTargetRequest = z.infer<
  typeof ActivateNutritionTargetRequestSchema
>;
export type ActivateNutritionTargetResponse = z.infer<
  typeof ActivateNutritionTargetResponseSchema
>;
export type NutritionTargetSummary = z.infer<typeof NutritionTargetSummarySchema>;
export type PreviewMealPlanRequest = z.infer<typeof PreviewMealPlanRequestSchema>;
export type PreviewMealPlanResponse = z.infer<typeof PreviewMealPlanResponseSchema>;
export type ActivateMealPlanRequest = z.infer<typeof ActivateMealPlanRequestSchema>;
export type ActivateMealPlanResponse = z.infer<typeof ActivateMealPlanResponseSchema>;
export type CurrentMealPlanResponse = z.infer<typeof CurrentMealPlanResponseSchema>;
export type MealPlanSummary = z.infer<typeof MealPlanSummarySchema>;
export type PlannedMealSummary = z.infer<typeof PlannedMealSummarySchema>;
export type PlannedMealSlot = z.infer<typeof PlannedMealSlotSchema>;
export type SwapMealPreviewRequest = z.infer<typeof SwapMealPreviewRequestSchema>;
export type SwapMealPreviewResponse = z.infer<typeof SwapMealPreviewResponseSchema>;
export type SwapCandidate = z.infer<typeof SwapCandidateSchema>;
export type SwapMealConfirmRequest = z.infer<typeof SwapMealConfirmRequestSchema>;
export type SwapMealConfirmResponse = z.infer<typeof SwapMealConfirmResponseSchema>;
export type CreateMealLogRequest = z.infer<typeof CreateMealLogRequestSchema>;
export type CreateMealLogResponse = z.infer<typeof CreateMealLogResponseSchema>;
export type MealLogSummary = z.infer<typeof MealLogSummarySchema>;
export type UpdateMealLogRequest = z.infer<typeof UpdateMealLogRequestSchema>;
export type CurrentGroceryListResponse = z.infer<
  typeof CurrentGroceryListResponseSchema
>;
export type RecipeSummary = z.infer<typeof RecipeSummarySchema>;
export type RecipeDetail = z.infer<typeof RecipeDetailSchema>;
export type ListRecipesResponse = z.infer<typeof ListRecipesResponseSchema>;
export type NutrientSnapshot = z.infer<typeof NutrientSnapshotSchema>;
export type MealType = z.infer<typeof MealTypeSchema>;
export type NutritionMode = z.infer<typeof NutritionModeSchema>;
