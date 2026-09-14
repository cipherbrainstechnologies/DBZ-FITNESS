import { Body, Controller, Get, Put, Post, UseGuards } from '@nestjs/common';
import {
  SaveOnboardingStepSchema,
  type SaveOnboardingStep,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { journeyFromProgress } from './onboarding.application.service.js';
import { OnboardingFacade } from './onboarding.facade.js';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingFacade) {}

  @Get()
  async getOnboarding(@CurrentUser() user: AuthenticatedUser) {
    const progress = await this.onboarding.getProgress(user.id);
    return { progress, journey: journeyFromProgress(progress) };
  }

  @Get('journey')
  async getJourney(@CurrentUser() user: AuthenticatedUser) {
    const journey = await this.onboarding.getJourney(user.id);
    return { journey };
  }

  @Put()
  async putOnboarding(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(SaveOnboardingStepSchema)) body: SaveOnboardingStep,
  ) {
    const progress = await this.onboarding.saveStep(user.id, body);
    return { progress, journey: journeyFromProgress(progress) };
  }

  @Post('complete')
  async completeOnboarding(@CurrentUser() user: AuthenticatedUser) {
    const progress = await this.onboarding.complete(user.id);
    return { progress, journey: journeyFromProgress(progress), completed: true as const };
  }
}
