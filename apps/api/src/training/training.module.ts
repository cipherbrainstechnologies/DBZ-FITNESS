import { Module } from '@nestjs/common';

import { CharactersModule } from '../characters/characters.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { OnboardingModule } from '../onboarding/onboarding.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { ProgressionModule } from '../progression/progression.module.js';
import { ExercisesController } from './exercises.controller.js';
import { TrainingApplicationService } from './training.application.service.js';
import { TrainingFacade } from './training.facade.js';
import { TrainingPlansController } from './training-plans.controller.js';
import { WorkoutSessionsController } from './workout-sessions.controller.js';

@Module({
  imports: [
    IdentityModule,
    ProfilesModule,
    OnboardingModule,
    CharactersModule,
    ProgressionModule,
  ],
  controllers: [
    ExercisesController,
    TrainingPlansController,
    WorkoutSessionsController,
  ],
  providers: [TrainingApplicationService, TrainingFacade],
  exports: [TrainingFacade],
})
export class TrainingModule {}
