import { createHash, randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  ActivateMealPlanRequest,
  ActivateNutritionTargetRequest,
  CreateMealLogRequest,
  PreviewMealPlanRequest,
  PreviewNutritionTargetRequest,
  SwapMealConfirmRequest,
  SwapMealPreviewRequest,
  UpdateMealLogRequest,
} from '@saiyan/contracts';
import type { Prisma } from '@saiyan/database';
import {
  NUTRITION_POLICY_VERSION,
  aggregateGroceryList,
  evaluateRecipeAgainstDiet,
  isDietaryPattern,
  previewMealPlan,
  previewMealSwap,
  previewNutritionTarget,
  type DietaryPattern,
  type IngredientCategory,
  type MealType,
  type NutrientSnapshot,
  type RecipePlanCandidate,
} from '@saiyan/domain';

import { PrismaService } from '../database/prisma.service.js';
import { OnboardingFacade } from '../onboarding/onboarding.facade.js';
import { ProfileFacade } from '../profiles/profile.facade.js';

const PREVIEW_TTL_MS = 30 * 60 * 1000;

type TargetPreviewPayload = {
  request: PreviewNutritionTargetRequest;
  preview: ReturnType<typeof previewNutritionTarget>;
  dietPreferenceId: string | null;
  profileVersionId: string | null;
};

type MealPlanPreviewPayload = {
  request: PreviewMealPlanRequest;
  preview: ReturnType<typeof previewMealPlan>;
  dietPreferenceId: string;
  nutritionTargetId: string | null;
  softEnergyKcalPerDay: number | null;
};

type SwapPreviewPayload = {
  plannedMealId: string;
  recipeId: string;
  portions: number;
};

/**
 * Owns Food, Recipe, NutritionTarget, MealPlan, PlannedMeal, MealLog, Grocery*.
 * Other modules must use NutritionFacade — not query these entities directly.
 * Training must not import Nutrition entities.
 */
@Injectable()
export class NutritionApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly onboarding: OnboardingFacade,
    private readonly profiles: ProfileFacade,
  ) {}

  async listFoods() {
    const rows = await this.prisma.client.food.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      orderBy: { name: 'asc' },
    });
    return { foods: rows.map((row) => this.toFoodSummary(row)) };
  }

  async listRecipes() {
    const rows = await this.prisma.client.recipe.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      orderBy: { name: 'asc' },
    });
    return { recipes: rows.map((row) => this.toRecipeSummary(row)) };
  }

  async getRecipe(id: string) {
    const row = await this.prisma.client.recipe.findFirst({
      where: { id, publicationStatus: 'PUBLISHED' },
      include: {
        ingredients: {
          include: { food: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'RECIPE_NOT_FOUND',
        message: 'Recipe not found',
        retryable: false,
      });
    }
    return {
      recipe: {
        ...this.toRecipeSummary(row),
        ingredients: row.ingredients.map((ing) => ({
          foodId: ing.foodId,
          foodKey: ing.food.key,
          foodName: ing.food.name,
          quantityGrams: Number(ing.quantityGrams),
          sortOrder: ing.sortOrder,
        })),
      },
    };
  }

  async previewNutritionTarget(userId: string, body: PreviewNutritionTargetRequest) {
    let dietPreferenceId = body.dietPreferenceId ?? null;
    if (dietPreferenceId) {
      const diet = await this.onboarding.getDietPreferenceSummaryByIdForUser(
        userId,
        dietPreferenceId,
      );
      if (!diet) {
        throw new NotFoundException({
          code: 'DIET_PREFERENCE_NOT_FOUND',
          message: 'Diet preference not found for user',
          retryable: false,
        });
      }
    } else {
      const latest = await this.onboarding.getLatestDietPreferenceSummary(userId);
      dietPreferenceId = latest?.id ?? null;
    }

    if (body.profileVersionId) {
      await this.profiles.requireSummaryByIdForUser(userId, body.profileVersionId);
    }

    const preview = previewNutritionTarget({
      mode: body.mode,
      weightKg: body.weightKg,
      heightCm: body.heightCm,
      ageYears: body.ageYears,
      mifflinSexCoefficient: body.mifflinSexCoefficient,
      activityFactor: body.activityFactor,
      goalAdjustment: body.goalAdjustment ?? undefined,
      professionalEnergyKcal: body.professionalEnergyKcal,
      professionalProteinG: body.professionalProteinG,
      professionalFatG: body.professionalFatG,
      professionalCarbohydrateG: body.professionalCarbohydrateG,
      blocksAutomatedTargets: body.blocksAutomatedTargets ?? false,
    });

    const activatable =
      preview.status === 'OK' ||
      preview.status === 'HABIT_ONLY' ||
      preview.status === 'REVIEW_REQUIRED';

    if (!activatable) {
      return {
        ...preview,
        previewToken: null,
        expiresAt: null,
      };
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS);
    const payload: TargetPreviewPayload = {
      request: body,
      preview,
      dietPreferenceId,
      profileVersionId: body.profileVersionId ?? null,
    };
    await this.prisma.client.nutritionTargetPreview.create({
      data: {
        token,
        userId,
        payload: payload as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return {
      ...preview,
      previewToken: token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async activateNutritionTarget(
    userId: string,
    body: ActivateNutritionTargetRequest,
  ) {
    const previewRow = await this.prisma.client.nutritionTargetPreview.findUnique({
      where: { token: body.previewToken },
    });
    if (!previewRow || previewRow.userId !== userId) {
      throw new NotFoundException({
        code: 'PREVIEW_TOKEN_NOT_FOUND',
        message: 'Nutrition target preview token not found',
        retryable: false,
      });
    }
    if (previewRow.consumedAt) {
      throw new ConflictException({
        code: 'PREVIEW_TOKEN_CONSUMED',
        message: 'Preview token already used',
        retryable: false,
      });
    }
    if (previewRow.expiresAt.getTime() < Date.now()) {
      throw new UnprocessableEntityException({
        code: 'PREVIEW_TOKEN_EXPIRED',
        message: 'Preview token has expired; request a new preview',
        retryable: false,
      });
    }

    const payload = previewRow.payload as unknown as TargetPreviewPayload;
    if (payload.preview.status === 'INELIGIBLE') {
      throw new UnprocessableEntityException({
        code: 'TARGET_NOT_ACTIVATABLE',
        message: 'Preview is not eligible for activation',
        retryable: false,
      });
    }

    const status =
      payload.preview.status === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : 'ACTIVE';

    const target = await this.prisma.client.$transaction(async (tx) => {
      if (status === 'ACTIVE') {
        await tx.nutritionTarget.updateMany({
          where: { userId, status: 'ACTIVE' },
          data: { status: 'SUPERSEDED' },
        });
      }

      const latest = await tx.nutritionTarget.findFirst({
        where: { userId },
        orderBy: { version: 'desc' },
      });
      const version = (latest?.version ?? 0) + 1;
      const created = await tx.nutritionTarget.create({
        data: {
          userId,
          version,
          mode: payload.preview.mode,
          calculationInputs: (payload.preview.calculationInputs ??
            {}) as Prisma.InputJsonValue,
          policyVersion: NUTRITION_POLICY_VERSION,
          energyKcal: payload.preview.targets.energyKcal,
          proteinG: payload.preview.targets.proteinG,
          fatG: payload.preview.targets.fatG,
          carbohydrateG: payload.preview.targets.carbohydrateG,
          explanationCodes: payload.preview.explanationCodes,
          warnings: [...payload.preview.warnings, ...payload.preview.disclaimers],
          dietPreferenceId: payload.dietPreferenceId,
          profileVersionId: payload.profileVersionId,
          effectiveFrom: new Date(),
          status,
        },
      });

      await tx.nutritionTargetPreview.update({
        where: { id: previewRow.id },
        data: { consumedAt: new Date() },
      });

      return created;
    });

    return { target: this.toTargetSummary(target) };
  }

  async previewMealPlan(userId: string, body: PreviewMealPlanRequest) {
    const diet = await this.resolveDietPreference(userId, body.dietPreferenceId);
    if (!isDietaryPattern(diet.pattern)) {
      throw new UnprocessableEntityException({
        code: 'INVALID_DIETARY_PATTERN',
        message: 'Stored diet preference pattern is not canonical',
        retryable: false,
      });
    }

    let softEnergy: number | null = null;
    let nutritionTargetId: string | null = body.nutritionTargetId ?? null;
    if (nutritionTargetId) {
      const target = await this.prisma.client.nutritionTarget.findFirst({
        where: { id: nutritionTargetId, userId },
      });
      if (!target) {
        throw new NotFoundException({
          code: 'NUTRITION_TARGET_NOT_FOUND',
          message: 'Nutrition target not found for user',
          retryable: false,
        });
      }
      if (body.useSoftEnergyProximity && target.energyKcal != null) {
        softEnergy = Number(target.energyKcal);
      }
    } else if (body.useSoftEnergyProximity) {
      const active = await this.prisma.client.nutritionTarget.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { version: 'desc' },
      });
      if (active?.energyKcal != null) {
        softEnergy = Number(active.energyKcal);
        nutritionTargetId = active.id;
      }
    }

    const recipes = await this.loadRecipeCandidates();
    const mealTypes = (body.mealTypesPerDay ?? ['BREAKFAST', 'LUNCH', 'DINNER']) as MealType[];
    const preview = previewMealPlan({
      startLocalDate: body.startLocalDate,
      mealTypesPerDay: mealTypes,
      prefs: {
        pattern: diet.pattern as DietaryPattern,
        allergyRestrictions: diet.allergyRestrictions,
        ingredientExclusions: diet.ingredientExclusions,
      },
      recipes,
      softEnergyKcalPerDay: softEnergy,
    });

    if (preview.days.length === 0) {
      return {
        ...preview,
        dietaryPattern: diet.pattern as DietaryPattern,
        previewToken: null,
        expiresAt: null,
      };
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS);
    const payload: MealPlanPreviewPayload = {
      request: body,
      preview,
      dietPreferenceId: diet.id,
      nutritionTargetId,
      softEnergyKcalPerDay: softEnergy,
    };
    await this.prisma.client.mealPlanPreview.create({
      data: {
        token,
        userId,
        payload: payload as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return {
      ...preview,
      dietaryPattern: diet.pattern as DietaryPattern,
      previewToken: token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async activateMealPlan(
    userId: string,
    body: ActivateMealPlanRequest,
    idempotencyKey: string | undefined,
  ) {
    return this.withIdempotency(userId, 'meal-plan-activate', idempotencyKey, body, async () => {
      const previewRow = await this.prisma.client.mealPlanPreview.findUnique({
        where: { token: body.previewToken },
      });
      if (!previewRow || previewRow.userId !== userId) {
        throw new NotFoundException({
          code: 'PREVIEW_TOKEN_NOT_FOUND',
          message: 'Meal plan preview token not found',
          retryable: false,
        });
      }
      if (previewRow.consumedAt) {
        throw new ConflictException({
          code: 'PREVIEW_TOKEN_CONSUMED',
          message: 'Preview token already used',
          retryable: false,
        });
      }
      if (previewRow.expiresAt.getTime() < Date.now()) {
        throw new UnprocessableEntityException({
          code: 'PREVIEW_TOKEN_EXPIRED',
          message: 'Preview token has expired; request a new preview',
          retryable: false,
        });
      }

      const payload = previewRow.payload as unknown as MealPlanPreviewPayload;
      if (payload.preview.days.length === 0) {
        throw new UnprocessableEntityException({
          code: 'PREVIEW_NOT_ACTIVATABLE',
          message: 'Preview has no meals to activate',
          retryable: false,
        });
      }

      // Re-validate diet preference still present via façade.
      const diet = await this.onboarding.getDietPreferenceSummaryByIdForUser(
        userId,
        payload.dietPreferenceId,
      );
      if (!diet) {
        throw new UnprocessableEntityException({
          code: 'DIET_PREFERENCE_CHANGED',
          message: 'Diet preference is no longer available',
          retryable: false,
        });
      }

      const result = await this.prisma.client.$transaction(async (tx) => {
        await tx.mealPlan.updateMany({
          where: { userId, status: 'ACTIVE' },
          data: { status: 'SUPERSEDED' },
        });

        const latest = await tx.mealPlan.findFirst({
          where: { userId },
          orderBy: { version: 'desc' },
        });
        const version = (latest?.version ?? 0) + 1;
        const plan = await tx.mealPlan.create({
          data: {
            userId,
            version,
            targetId: payload.nutritionTargetId,
            dietPreferenceId: payload.dietPreferenceId,
            startLocalDate: payload.request.startLocalDate,
            timeZone: payload.request.timeZone,
            policyVersion: NUTRITION_POLICY_VERSION,
            inputSnapshot: {
              request: payload.request,
              preview: payload.preview,
              softEnergyKcalPerDay: payload.softEnergyKcalPerDay,
            } as Prisma.InputJsonValue,
            explanationCodes: payload.preview.explanationCodes,
            isPartial: payload.preview.isPartial,
            effectiveFrom: new Date(),
            status: 'ACTIVE',
          },
        });

        const meals = [];
        for (const day of payload.preview.days) {
          const meal = await tx.plannedMeal.create({
            data: {
              mealPlanId: plan.id,
              userId,
              localDate: day.localDate,
              mealType: day.mealType,
              recipeId: day.recipeId,
              portions: day.portions,
              nutrientSnapshot: (day.nutrientSnapshot ??
                null) as Prisma.InputJsonValue,
            },
          });
          meals.push(meal);
        }

        const grocerySources = await this.buildGrocerySources(tx, meals);
        const groceryLines = aggregateGroceryList(grocerySources);
        const groceryList = await tx.groceryList.create({
          data: {
            userId,
            mealPlanId: plan.id,
            version: 1,
            pantryAdjustments: {},
          },
        });
        for (const line of groceryLines) {
          await tx.groceryListItem.create({
            data: {
              groceryListId: groceryList.id,
              foodId: line.foodId,
              displayName: line.displayName,
              quantityGrams: line.quantityGrams,
              excluded: false,
            },
          });
        }

        await tx.mealPlanPreview.update({
          where: { id: previewRow.id },
          data: { consumedAt: new Date() },
        });

        return { plan, meals };
      });

      return {
        plan: this.toMealPlanSummary(result.plan),
        meals: result.meals.map((m) => this.toPlannedMealSummary(m)),
      };
    });
  }

  async getCurrentMealPlan(userId: string) {
    const plan = await this.prisma.client.mealPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { version: 'desc' },
    });
    if (!plan) {
      return { plan: null, meals: [] };
    }
    const meals = await this.prisma.client.plannedMeal.findMany({
      where: { mealPlanId: plan.id },
      orderBy: [{ localDate: 'asc' }, { mealType: 'asc' }],
    });
    return {
      plan: this.toMealPlanSummary(plan),
      meals: meals.map((m) => this.toPlannedMealSummary(m)),
    };
  }

  async previewMealSwap(
    userId: string,
    plannedMealId: string,
    _body: SwapMealPreviewRequest,
  ) {
    const planned = await this.prisma.client.plannedMeal.findFirst({
      where: { id: plannedMealId, userId },
    });
    if (!planned) {
      throw new NotFoundException({
        code: 'PLANNED_MEAL_NOT_FOUND',
        message: 'Planned meal not found',
        retryable: false,
      });
    }

    const plan = await this.prisma.client.mealPlan.findFirst({
      where: { id: planned.mealPlanId, userId },
    });
    if (!plan) {
      throw new NotFoundException({
        code: 'MEAL_PLAN_NOT_FOUND',
        message: 'Meal plan not found',
        retryable: false,
      });
    }

    const diet = await this.onboarding.getDietPreferenceSummaryByIdForUser(
      userId,
      plan.dietPreferenceId,
    );
    if (!diet || !isDietaryPattern(diet.pattern)) {
      throw new UnprocessableEntityException({
        code: 'DIET_PREFERENCE_REQUIRED',
        message: 'Valid diet preference required for meal swap',
        retryable: false,
      });
    }

    const sameDay = await this.prisma.client.plannedMeal.findMany({
      where: {
        mealPlanId: plan.id,
        localDate: planned.localDate,
        id: { not: planned.id },
      },
    });

    let softEnergy: number | null = null;
    let softProtein: number | null = null;
    if (plan.targetId) {
      const target = await this.prisma.client.nutritionTarget.findFirst({
        where: { id: plan.targetId, userId },
      });
      if (target?.energyKcal != null) {
        softEnergy = Number(target.energyKcal);
      }
      if (target?.proteinG != null) {
        softProtein = Number(target.proteinG);
      }
    }

    const recipes = await this.loadRecipeCandidates();
    const swap = previewMealSwap({
      mealType: planned.mealType as MealType,
      currentRecipeId: planned.recipeId,
      currentPortions: Number(planned.portions),
      currentNutrients: parseNutrientSnapshot(planned.nutrientSnapshot),
      sameDayOtherMeals: sameDay.map((m) => ({
        nutrientSnapshot: parseNutrientSnapshot(m.nutrientSnapshot),
        portions: Number(m.portions),
      })),
      prefs: {
        pattern: diet.pattern as DietaryPattern,
        allergyRestrictions: diet.allergyRestrictions,
        ingredientExclusions: diet.ingredientExclusions,
      },
      recipes,
      softEnergyKcalPerDay: softEnergy,
      softProteinGPerDay: softProtein,
    });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS);
    const payload: SwapPreviewPayload = {
      plannedMealId,
      recipeId: planned.recipeId,
      portions: Number(planned.portions),
    };
    // Reuse mealPlanPreview table for swap tokens (scoped by payload shape).
    await this.prisma.client.mealPlanPreview.create({
      data: {
        token,
        userId,
        payload: {
          kind: 'MEAL_SWAP',
          ...payload,
          candidates: swap.candidates.map((c) => c.recipeId),
        } as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return {
      plannedMealId,
      ...swap,
      previewToken: token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async confirmMealSwap(
    userId: string,
    plannedMealId: string,
    body: SwapMealConfirmRequest,
  ) {
    const previewRow = await this.prisma.client.mealPlanPreview.findUnique({
      where: { token: body.previewToken },
    });
    if (!previewRow || previewRow.userId !== userId) {
      throw new NotFoundException({
        code: 'PREVIEW_TOKEN_NOT_FOUND',
        message: 'Swap preview token not found',
        retryable: false,
      });
    }
    if (previewRow.consumedAt) {
      throw new ConflictException({
        code: 'PREVIEW_TOKEN_CONSUMED',
        message: 'Preview token already used',
        retryable: false,
      });
    }
    if (previewRow.expiresAt.getTime() < Date.now()) {
      throw new UnprocessableEntityException({
        code: 'PREVIEW_TOKEN_EXPIRED',
        message: 'Preview token has expired',
        retryable: false,
      });
    }

    const payload = previewRow.payload as unknown as {
      kind?: string;
      plannedMealId: string;
      candidates?: string[];
    };
    if (payload.kind !== 'MEAL_SWAP' || payload.plannedMealId !== plannedMealId) {
      throw new UnprocessableEntityException({
        code: 'SWAP_PREVIEW_MISMATCH',
        message: 'Swap preview does not match planned meal',
        retryable: false,
      });
    }
    if (payload.candidates && !payload.candidates.includes(body.recipeId)) {
      throw new UnprocessableEntityException({
        code: 'SWAP_RECIPE_NOT_IN_PREVIEW',
        message: 'Selected recipe was not in the swap preview candidates',
        retryable: false,
      });
    }

    const planned = await this.prisma.client.plannedMeal.findFirst({
      where: { id: plannedMealId, userId },
      include: { mealPlan: true },
    });
    if (!planned) {
      throw new NotFoundException({
        code: 'PLANNED_MEAL_NOT_FOUND',
        message: 'Planned meal not found',
        retryable: false,
      });
    }

    const diet = await this.onboarding.getDietPreferenceSummaryByIdForUser(
      userId,
      planned.mealPlan.dietPreferenceId,
    );
    if (!diet || !isDietaryPattern(diet.pattern)) {
      throw new UnprocessableEntityException({
        code: 'DIET_PREFERENCE_REQUIRED',
        message: 'Valid diet preference required',
        retryable: false,
      });
    }

    const recipes = await this.loadRecipeCandidates();
    const candidate = recipes.find((r) => r.id === body.recipeId);
    if (!candidate) {
      throw new NotFoundException({
        code: 'RECIPE_NOT_FOUND',
        message: 'Swap recipe not found or not published',
        retryable: false,
      });
    }

    // Re-check hard filters at confirm time.
    const eligibility = evaluateRecipeAgainstDiet(candidate, {
      pattern: diet.pattern as DietaryPattern,
      allergyRestrictions: diet.allergyRestrictions,
      ingredientExclusions: diet.ingredientExclusions,
    });
    if (!eligibility.eligible) {
      throw new UnprocessableEntityException({
        code: 'SWAP_RECIPE_INELIGIBLE',
        message: 'Recipe fails diet or allergy hard rules',
        retryable: false,
      });
    }

    const updated = await this.prisma.client.$transaction(async (tx) => {
      const meal = await tx.plannedMeal.update({
        where: { id: plannedMealId },
        data: {
          recipeId: body.recipeId,
          nutrientSnapshot: (candidate.nutrientsPerPortion ??
            null) as Prisma.InputJsonValue,
        },
      });

      // Rebuild grocery list for the active plan (future plans only; logs untouched).
      await tx.groceryListItem.deleteMany({
        where: { groceryList: { mealPlanId: planned.mealPlanId, userId } },
      });
      await tx.groceryList.deleteMany({
        where: { mealPlanId: planned.mealPlanId, userId },
      });
      const allMeals = await tx.plannedMeal.findMany({
        where: { mealPlanId: planned.mealPlanId },
      });
      const grocerySources = await this.buildGrocerySources(tx, allMeals);
      const groceryLines = aggregateGroceryList(grocerySources);
      const groceryList = await tx.groceryList.create({
        data: {
          userId,
          mealPlanId: planned.mealPlanId,
          version: 1,
          pantryAdjustments: {},
        },
      });
      for (const line of groceryLines) {
        await tx.groceryListItem.create({
          data: {
            groceryListId: groceryList.id,
            foodId: line.foodId,
            displayName: line.displayName,
            quantityGrams: line.quantityGrams,
            excluded: false,
          },
        });
      }

      await tx.mealPlanPreview.update({
        where: { id: previewRow.id },
        data: { consumedAt: new Date() },
      });

      return meal;
    });

    return { meal: this.toPlannedMealSummary(updated) };
  }

  async createMealLog(userId: string, body: CreateMealLogRequest) {
    let nutrientSnapshot = body.nutrientSnapshot ?? null;
    let estimateStatus = body.estimateStatus ?? 'UNKNOWN';
    let recipeId = body.recipeId ?? null;
    let foodId = body.foodId ?? null;

    if (body.plannedMealId) {
      const planned = await this.prisma.client.plannedMeal.findFirst({
        where: { id: body.plannedMealId, userId },
      });
      if (!planned) {
        throw new NotFoundException({
          code: 'PLANNED_MEAL_NOT_FOUND',
          message: 'Planned meal not found',
          retryable: false,
        });
      }
      recipeId = recipeId ?? planned.recipeId;
      if (!nutrientSnapshot) {
        const base = parseNutrientSnapshot(planned.nutrientSnapshot);
        if (base) {
          const portions = body.portions ?? Number(planned.portions);
          nutrientSnapshot = {
            energyKcal: base.energyKcal * portions,
            proteinG: base.proteinG * portions,
            fatG: base.fatG * portions,
            carbohydrateG: base.carbohydrateG * portions,
          };
          estimateStatus = 'RECIPE_CALCULATED';
        }
      }
    }

    if (!nutrientSnapshot && recipeId) {
      const recipe = await this.prisma.client.recipe.findFirst({
        where: { id: recipeId, publicationStatus: 'PUBLISHED' },
      });
      if (!recipe) {
        throw new NotFoundException({
          code: 'RECIPE_NOT_FOUND',
          message: 'Recipe not found',
          retryable: false,
        });
      }
      const base = parseNutrientSnapshot(recipe.nutrientsPerPortion);
      if (base) {
        const portions = body.portions ?? 1;
        nutrientSnapshot = {
          energyKcal: base.energyKcal * portions,
          proteinG: base.proteinG * portions,
          fatG: base.fatG * portions,
          carbohydrateG: base.carbohydrateG * portions,
        };
        estimateStatus = 'RECIPE_CALCULATED';
      }
    }

    if (!nutrientSnapshot && foodId) {
      const food = await this.prisma.client.food.findFirst({
        where: { id: foodId, publicationStatus: 'PUBLISHED' },
      });
      if (!food) {
        throw new NotFoundException({
          code: 'FOOD_NOT_FOUND',
          message: 'Food not found',
          retryable: false,
        });
      }
      const per100 = parseNutrientSnapshot(food.nutrientsPer100g);
      if (per100) {
        // Default serving assumption: 100 g × portions when logging a food.
        const portions = body.portions ?? 1;
        nutrientSnapshot = {
          energyKcal: per100.energyKcal * portions,
          proteinG: per100.proteinG * portions,
          fatG: per100.fatG * portions,
          carbohydrateG: per100.carbohydrateG * portions,
        };
        estimateStatus = 'PROVIDER';
      }
    }

    if (!nutrientSnapshot) {
      throw new UnprocessableEntityException({
        code: 'NUTRIENT_SNAPSHOT_REQUIRED',
        message:
          'Provide nutrientSnapshot or a resolvable recipe/food/planned meal reference',
        retryable: false,
      });
    }

    if (body.source === 'RESTAURANT_ESTIMATE') {
      estimateStatus = 'MEMBER_ESTIMATE';
    }

    const log = await this.prisma.client.mealLog.create({
      data: {
        userId,
        plannedMealId: body.plannedMealId ?? null,
        consumedAt: new Date(body.consumedAt),
        localDate: body.localDate,
        timeZone: body.timeZone,
        source: body.source,
        mealType: body.mealType ?? null,
        recipeId,
        foodId,
        portions: body.portions ?? 1,
        nutrientSnapshot: nutrientSnapshot as Prisma.InputJsonValue,
        estimateStatus,
        notes: body.notes ?? null,
        version: 1,
      },
    });

    return { log: this.toMealLogSummary(log) };
  }

  async updateMealLog(userId: string, logId: string, body: UpdateMealLogRequest) {
    const existing = await this.prisma.client.mealLog.findFirst({
      where: { id: logId, userId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'MEAL_LOG_NOT_FOUND',
        message: 'Meal log not found',
        retryable: false,
      });
    }
    if (existing.version !== body.version) {
      throw new ConflictException({
        code: 'MEAL_LOG_VERSION_CONFLICT',
        message: 'Meal log version conflict; refresh and retry',
        retryable: false,
      });
    }

    const updated = await this.prisma.client.mealLog.update({
      where: { id: logId },
      data: {
        portions: body.portions ?? existing.portions,
        nutrientSnapshot: (body.nutrientSnapshot ??
          existing.nutrientSnapshot) as Prisma.InputJsonValue,
        notes: body.notes === undefined ? existing.notes : body.notes,
        estimateStatus: body.estimateStatus ?? existing.estimateStatus,
        version: existing.version + 1,
      },
    });

    return { log: this.toMealLogSummary(updated) };
  }

  async deleteMealLog(userId: string, logId: string) {
    const existing = await this.prisma.client.mealLog.findFirst({
      where: { id: logId, userId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'MEAL_LOG_NOT_FOUND',
        message: 'Meal log not found',
        retryable: false,
      });
    }
    await this.prisma.client.mealLog.delete({ where: { id: logId } });
    return { deleted: true, id: logId };
  }

  async getCurrentGroceryList(userId: string) {
    const plan = await this.prisma.client.mealPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { version: 'desc' },
    });
    if (!plan) {
      return { groceryList: null };
    }
    const list = await this.prisma.client.groceryList.findFirst({
      where: { userId, mealPlanId: plan.id },
      orderBy: { version: 'desc' },
      include: { items: { orderBy: { displayName: 'asc' } } },
    });
    if (!list) {
      return { groceryList: null };
    }
    return {
      groceryList: {
        id: list.id,
        mealPlanId: list.mealPlanId,
        version: list.version,
        items: list.items.map((item) => ({
          id: item.id,
          foodId: item.foodId,
          displayName: item.displayName,
          quantityGrams: Number(item.quantityGrams),
          excluded: item.excluded,
        })),
      },
    };
  }

  private async resolveDietPreference(
    userId: string,
    dietPreferenceId: string | null | undefined,
  ) {
    if (dietPreferenceId) {
      const diet = await this.onboarding.getDietPreferenceSummaryByIdForUser(
        userId,
        dietPreferenceId,
      );
      if (!diet) {
        throw new NotFoundException({
          code: 'DIET_PREFERENCE_NOT_FOUND',
          message: 'Diet preference not found for user',
          retryable: false,
        });
      }
      return diet;
    }
    const latest = await this.onboarding.getLatestDietPreferenceSummary(userId);
    if (!latest) {
      throw new UnprocessableEntityException({
        code: 'DIET_PREFERENCE_REQUIRED',
        message: 'Diet preference must be set before meal planning',
        retryable: false,
      });
    }
    return latest;
  }

  private async loadRecipeCandidates(): Promise<RecipePlanCandidate[]> {
    const rows = await this.prisma.client.recipe.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      include: {
        ingredients: { include: { food: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      name: row.name,
      mealTypes: asStringArray(row.mealTypes) as MealType[],
      preparationTags: asStringArray(row.preparationTags),
      nutrientsPerPortion: parseNutrientSnapshot(row.nutrientsPerPortion),
      ingredients: row.ingredients.map((ing) => ({
        id: ing.food.id,
        key: ing.food.key,
        name: ing.food.name,
        allergens: asStringArray(ing.food.allergens),
        allergensKnown: ing.food.allergensKnown,
        ingredientCategories: asStringArray(
          ing.food.ingredientCategories,
        ) as IngredientCategory[],
      })),
    }));
  }

  private async buildGrocerySources(
    tx: Prisma.TransactionClient,
    meals: Array<{ recipeId: string; portions: Prisma.Decimal | number }>,
  ) {
    const recipeIds = [...new Set(meals.map((m) => m.recipeId))];
    const recipes = await tx.recipe.findMany({
      where: { id: { in: recipeIds } },
      include: { ingredients: { include: { food: true } } },
    });
    const byId = new Map(recipes.map((r) => [r.id, r]));

    return meals.map((meal) => {
      const recipe = byId.get(meal.recipeId);
      if (!recipe) {
        return {
          portions: Number(meal.portions),
          recipePortions: 1,
          ingredients: [],
        };
      }
      return {
        portions: Number(meal.portions),
        recipePortions: recipe.portions,
        ingredients: recipe.ingredients.map((ing) => ({
          foodId: ing.foodId,
          displayName: ing.food.name,
          quantityGrams: Number(ing.quantityGrams),
        })),
      };
    });
  }

  private toFoodSummary(row: {
    id: string;
    key: string;
    name: string;
    provider: string;
    providerId: string;
    sourceLabel: string;
    state: string;
    nutrientsPer100g: Prisma.JsonValue;
    allergens: Prisma.JsonValue;
    allergensKnown: boolean;
    ingredientCategories: Prisma.JsonValue;
    dataCompleteness: string;
    reviewStatus: string;
    publicationStatus: string;
  }) {
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      provider: row.provider,
      providerId: row.providerId,
      sourceLabel: row.sourceLabel,
      state: row.state,
      nutrientsPer100g: parseNutrientSnapshot(row.nutrientsPer100g) ?? {
        energyKcal: 0,
        proteinG: 0,
        fatG: 0,
        carbohydrateG: 0,
      },
      allergens: asStringArray(row.allergens),
      allergensKnown: row.allergensKnown,
      ingredientCategories: asStringArray(row.ingredientCategories),
      dataCompleteness: row.dataCompleteness,
      reviewStatus: row.reviewStatus,
      publicationStatus: row.publicationStatus,
    };
  }

  private toRecipeSummary(row: {
    id: string;
    key: string;
    version: number;
    name: string;
    instructions: string;
    cookedYieldGrams: Prisma.Decimal | number;
    portions: number;
    mealTypes: Prisma.JsonValue;
    preparationTags: Prisma.JsonValue | null;
    cuisineTags: Prisma.JsonValue | null;
    nutrientsPerPortion: Prisma.JsonValue | null;
    sourceLabel: string;
    reviewStatus: string;
    publicationStatus: string;
  }) {
    return {
      id: row.id,
      key: row.key,
      version: row.version,
      name: row.name,
      instructions: row.instructions,
      cookedYieldGrams: Number(row.cookedYieldGrams),
      portions: row.portions,
      mealTypes: asStringArray(row.mealTypes),
      preparationTags: row.preparationTags ? asStringArray(row.preparationTags) : null,
      cuisineTags: row.cuisineTags ? asStringArray(row.cuisineTags) : null,
      nutrientsPerPortion: parseNutrientSnapshot(row.nutrientsPerPortion),
      sourceLabel: row.sourceLabel,
      reviewStatus: row.reviewStatus,
      publicationStatus: row.publicationStatus,
    };
  }

  private toTargetSummary(row: {
    id: string;
    version: number;
    mode: string;
    policyVersion: string;
    energyKcal: Prisma.Decimal | null;
    proteinG: Prisma.Decimal | null;
    fatG: Prisma.Decimal | null;
    carbohydrateG: Prisma.Decimal | null;
    explanationCodes: Prisma.JsonValue;
    warnings: Prisma.JsonValue | null;
    status: string;
    effectiveFrom: Date;
  }) {
    return {
      id: row.id,
      version: row.version,
      mode: row.mode,
      policyVersion: row.policyVersion,
      energyKcal: row.energyKcal == null ? null : Number(row.energyKcal),
      proteinG: row.proteinG == null ? null : Number(row.proteinG),
      fatG: row.fatG == null ? null : Number(row.fatG),
      carbohydrateG: row.carbohydrateG == null ? null : Number(row.carbohydrateG),
      explanationCodes: asStringArray(row.explanationCodes),
      warnings: row.warnings ? asStringArray(row.warnings) : null,
      status: row.status,
      effectiveFrom: row.effectiveFrom.toISOString(),
    };
  }

  private toMealPlanSummary(row: {
    id: string;
    version: number;
    targetId: string | null;
    dietPreferenceId: string;
    startLocalDate: string;
    timeZone: string;
    policyVersion: string;
    isPartial: boolean;
    explanationCodes: Prisma.JsonValue;
    status: string;
    effectiveFrom: Date;
  }) {
    return {
      id: row.id,
      version: row.version,
      targetId: row.targetId,
      dietPreferenceId: row.dietPreferenceId,
      startLocalDate: row.startLocalDate,
      timeZone: row.timeZone,
      policyVersion: row.policyVersion,
      isPartial: row.isPartial,
      explanationCodes: asStringArray(row.explanationCodes),
      status: row.status,
      effectiveFrom: row.effectiveFrom.toISOString(),
    };
  }

  private toPlannedMealSummary(row: {
    id: string;
    localDate: string;
    mealType: string;
    recipeId: string;
    portions: Prisma.Decimal | number;
    nutrientSnapshot: Prisma.JsonValue | null;
  }) {
    return {
      id: row.id,
      localDate: row.localDate,
      mealType: row.mealType,
      recipeId: row.recipeId,
      portions: Number(row.portions),
      nutrientSnapshot: parseNutrientSnapshot(row.nutrientSnapshot),
    };
  }

  private toMealLogSummary(row: {
    id: string;
    consumedAt: Date;
    localDate: string;
    timeZone: string;
    source: string;
    mealType: string | null;
    plannedMealId: string | null;
    recipeId: string | null;
    foodId: string | null;
    portions: Prisma.Decimal | number;
    nutrientSnapshot: Prisma.JsonValue;
    estimateStatus: string;
    notes: string | null;
    version: number;
  }) {
    return {
      id: row.id,
      consumedAt: row.consumedAt.toISOString(),
      localDate: row.localDate,
      timeZone: row.timeZone,
      source: row.source,
      mealType: row.mealType,
      plannedMealId: row.plannedMealId,
      recipeId: row.recipeId,
      foodId: row.foodId,
      portions: Number(row.portions),
      nutrientSnapshot: parseNutrientSnapshot(row.nutrientSnapshot) ?? {
        energyKcal: 0,
        proteinG: 0,
        fatG: 0,
        carbohydrateG: 0,
      },
      estimateStatus: row.estimateStatus,
      notes: row.notes,
      version: row.version,
    };
  }

  private async withIdempotency<T>(
    userId: string,
    scope: string,
    key: string | undefined,
    requestBody: unknown,
    run: () => Promise<T>,
  ): Promise<T> {
    if (!key) {
      throw new UnprocessableEntityException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required',
        retryable: false,
      });
    }
    const requestHash = createHash('sha256')
      .update(JSON.stringify(requestBody))
      .digest('hex');

    const existing = await this.prisma.client.idempotencyRecord.findUnique({
      where: {
        userId_scope_key: { userId, scope, key },
      },
    });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_KEY_REUSE',
          message: 'Idempotency-Key was reused with a different request body',
          retryable: false,
        });
      }
      return existing.responseBody as T;
    }

    const response = await run();
    try {
      await this.prisma.client.idempotencyRecord.create({
        data: {
          userId,
          scope,
          key,
          requestHash,
          responseBody: response as unknown as Prisma.InputJsonValue,
          statusCode: 200,
        },
      });
    } catch (error) {
      const raced = await this.prisma.client.idempotencyRecord.findUnique({
        where: { userId_scope_key: { userId, scope, key } },
      });
      if (raced && raced.requestHash === requestHash) {
        return raced.responseBody as T;
      }
      throw error;
    }
    return response;
  }
}

function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((v): v is string => typeof v === 'string');
}

function parseNutrientSnapshot(
  value: Prisma.JsonValue | null | undefined,
): NutrientSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const energyKcal = row['energyKcal'];
  const proteinG = row['proteinG'];
  const fatG = row['fatG'];
  const carbohydrateG = row['carbohydrateG'];
  if (
    typeof energyKcal !== 'number' ||
    typeof proteinG !== 'number' ||
    typeof fatG !== 'number' ||
    typeof carbohydrateG !== 'number'
  ) {
    return null;
  }
  return { energyKcal, proteinG, fatG, carbohydrateG };
}
