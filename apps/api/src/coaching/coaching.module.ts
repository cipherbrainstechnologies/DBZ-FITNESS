import { Module, forwardRef } from '@nestjs/common';

import { CharactersModule } from '../characters/characters.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { NutritionModule } from '../nutrition/nutrition.module.js';
import { OnboardingModule } from '../onboarding/onboarding.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { TrainingModule } from '../training/training.module.js';
import { CoachingApplicationService } from './coaching.application.service.js';
import { CoachingController } from './coaching.controller.js';
import { CoachingFacade } from './coaching.facade.js';

@Module({
  imports: [
    IdentityModule,
    OnboardingModule,
    ProfilesModule,
    forwardRef(() => CharactersModule),
    forwardRef(() => TrainingModule),
    NutritionModule,
  ],
  controllers: [CoachingController],
  providers: [CoachingApplicationService, CoachingFacade],
  exports: [CoachingFacade],
})
export class CoachingModule {}
