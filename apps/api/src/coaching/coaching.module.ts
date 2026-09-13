import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { OnboardingModule } from '../onboarding/onboarding.module.js';
import { CoachingApplicationService } from './coaching.application.service.js';
import { CoachingController } from './coaching.controller.js';
import { CoachingFacade } from './coaching.facade.js';

@Module({
  imports: [IdentityModule, OnboardingModule],
  controllers: [CoachingController],
  providers: [CoachingApplicationService, CoachingFacade],
  exports: [CoachingFacade],
})
export class CoachingModule {}
