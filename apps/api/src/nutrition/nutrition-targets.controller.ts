import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ActivateNutritionTargetRequestSchema,
  PreviewNutritionTargetRequestSchema,
  type ActivateNutritionTargetRequest,
  type PreviewNutritionTargetRequest,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { NutritionFacade } from './nutrition.facade.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class NutritionTargetsController {
  constructor(private readonly nutrition: NutritionFacade) {}

  @Post('nutrition-targets/preview')
  preview(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(PreviewNutritionTargetRequestSchema))
    body: PreviewNutritionTargetRequest,
  ) {
    return this.nutrition.previewNutritionTarget(user.id, body);
  }

  @Post('nutrition-targets')
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ActivateNutritionTargetRequestSchema))
    body: ActivateNutritionTargetRequest,
  ) {
    return this.nutrition.activateNutritionTarget(user.id, body);
  }
}
