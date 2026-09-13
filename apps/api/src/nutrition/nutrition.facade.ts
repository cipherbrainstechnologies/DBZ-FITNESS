import { Injectable } from '@nestjs/common';
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

import { NutritionApplicationService } from './nutrition.application.service.js';

/**
 * Cross-module façade for nutrition catalogue, targets, meal plans, and logs.
 * Other modules must depend on this — not Food / Recipe / MealPlan Prisma models.
 * Training must not import Nutrition entities.
 */
@Injectable()
export class NutritionFacade {
  constructor(private readonly nutrition: NutritionApplicationService) {}

  listFoods() {
    return this.nutrition.listFoods();
  }

  listRecipes() {
    return this.nutrition.listRecipes();
  }

  getRecipe(id: string) {
    return this.nutrition.getRecipe(id);
  }

  previewNutritionTarget(userId: string, body: PreviewNutritionTargetRequest) {
    return this.nutrition.previewNutritionTarget(userId, body);
  }

  activateNutritionTarget(userId: string, body: ActivateNutritionTargetRequest) {
    return this.nutrition.activateNutritionTarget(userId, body);
  }

  previewMealPlan(userId: string, body: PreviewMealPlanRequest) {
    return this.nutrition.previewMealPlan(userId, body);
  }

  activateMealPlan(
    userId: string,
    body: ActivateMealPlanRequest,
    idempotencyKey: string | undefined,
  ) {
    return this.nutrition.activateMealPlan(userId, body, idempotencyKey);
  }

  getCurrentMealPlan(userId: string) {
    return this.nutrition.getCurrentMealPlan(userId);
  }

  previewMealSwap(
    userId: string,
    plannedMealId: string,
    body: SwapMealPreviewRequest,
  ) {
    return this.nutrition.previewMealSwap(userId, plannedMealId, body);
  }

  confirmMealSwap(
    userId: string,
    plannedMealId: string,
    body: SwapMealConfirmRequest,
  ) {
    return this.nutrition.confirmMealSwap(userId, plannedMealId, body);
  }

  createMealLog(userId: string, body: CreateMealLogRequest) {
    return this.nutrition.createMealLog(userId, body);
  }

  updateMealLog(userId: string, logId: string, body: UpdateMealLogRequest) {
    return this.nutrition.updateMealLog(userId, logId, body);
  }

  deleteMealLog(userId: string, logId: string) {
    return this.nutrition.deleteMealLog(userId, logId);
  }

  getCurrentGroceryList(userId: string) {
    return this.nutrition.getCurrentGroceryList(userId);
  }
}
