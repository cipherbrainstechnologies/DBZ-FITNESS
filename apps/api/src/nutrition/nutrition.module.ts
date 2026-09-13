import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { OnboardingModule } from '../onboarding/onboarding.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { FoodsController, RecipesController } from './foods-recipes.controller.js';
import { GroceryListsController, MealLogsController } from './meal-logs.controller.js';
import { MealPlansController, PlannedMealsController } from './meal-plans.controller.js';
import { NutritionApplicationService } from './nutrition.application.service.js';
import { NutritionFacade } from './nutrition.facade.js';
import { NutritionTargetsController } from './nutrition-targets.controller.js';

@Module({
  imports: [IdentityModule, OnboardingModule, ProfilesModule],
  controllers: [
    FoodsController,
    RecipesController,
    NutritionTargetsController,
    MealPlansController,
    PlannedMealsController,
    MealLogsController,
    GroceryListsController,
  ],
  providers: [NutritionApplicationService, NutritionFacade],
  exports: [NutritionFacade],
})
export class NutritionModule {}
