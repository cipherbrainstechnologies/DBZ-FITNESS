import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CreateMealLogRequestSchema,
  UpdateMealLogRequestSchema,
  type CreateMealLogRequest,
  type UpdateMealLogRequest,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { NutritionFacade } from './nutrition.facade.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class MealLogsController {
  constructor(private readonly nutrition: NutritionFacade) {}

  @Post('meal-logs')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CreateMealLogRequestSchema))
    body: CreateMealLogRequest,
  ) {
    return this.nutrition.createMealLog(user.id, body);
  }

  @Patch('meal-logs/:id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateMealLogRequestSchema))
    body: UpdateMealLogRequest,
  ) {
    return this.nutrition.updateMealLog(user.id, id, body);
  }

  @Delete('meal-logs/:id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nutrition.deleteMealLog(user.id, id);
  }
}

@Controller()
@UseGuards(JwtAuthGuard)
export class GroceryListsController {
  constructor(private readonly nutrition: NutritionFacade) {}

  @Get('grocery-lists/current')
  current(@CurrentUser() user: AuthenticatedUser) {
    return this.nutrition.getCurrentGroceryList(user.id);
  }
}
