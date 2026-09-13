import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { NutritionFacade } from './nutrition.facade.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class FoodsController {
  constructor(private readonly nutrition: NutritionFacade) {}

  @Get('foods')
  list(@CurrentUser() _user: AuthenticatedUser) {
    return this.nutrition.listFoods();
  }
}

@Controller()
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly nutrition: NutritionFacade) {}

  @Get('recipes')
  list(@CurrentUser() _user: AuthenticatedUser) {
    return this.nutrition.listRecipes();
  }

  @Get('recipes/:id')
  get(
    @CurrentUser() _user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nutrition.getRecipe(id);
  }
}
