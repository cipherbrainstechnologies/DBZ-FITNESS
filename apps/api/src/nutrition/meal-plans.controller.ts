import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ActivateMealPlanRequestSchema,
  PreviewMealPlanRequestSchema,
  SwapMealConfirmRequestSchema,
  SwapMealPreviewRequestSchema,
  type ActivateMealPlanRequest,
  type PreviewMealPlanRequest,
  type SwapMealConfirmRequest,
  type SwapMealPreviewRequest,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { NutritionFacade } from './nutrition.facade.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class MealPlansController {
  constructor(private readonly nutrition: NutritionFacade) {}

  @Post('meal-plans/preview')
  preview(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(PreviewMealPlanRequestSchema))
    body: PreviewMealPlanRequest,
  ) {
    return this.nutrition.previewMealPlan(user.id, body);
  }

  @Post('meal-plans')
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(ActivateMealPlanRequestSchema))
    body: ActivateMealPlanRequest,
  ) {
    return this.nutrition.activateMealPlan(user.id, body, idempotencyKey);
  }

  @Get('meal-plans/current')
  current(@CurrentUser() user: AuthenticatedUser) {
    return this.nutrition.getCurrentMealPlan(user.id);
  }
}

@Controller()
@UseGuards(JwtAuthGuard)
export class PlannedMealsController {
  constructor(private readonly nutrition: NutritionFacade) {}

  @Post('planned-meals/:id/swap-preview')
  swapPreview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(SwapMealPreviewRequestSchema))
    body: SwapMealPreviewRequest,
  ) {
    return this.nutrition.previewMealSwap(user.id, id, body);
  }

  @Post('planned-meals/:id/swap-confirm')
  swapConfirm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(SwapMealConfirmRequestSchema))
    body: SwapMealConfirmRequest,
  ) {
    return this.nutrition.confirmMealSwap(user.id, id, body);
  }
}
