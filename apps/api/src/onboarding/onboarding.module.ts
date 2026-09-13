import { Module, forwardRef } from '@nestjs/common';

import { CharactersModule } from '../characters/characters.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { OnboardingApplicationService } from './onboarding.application.service.js';
import { OnboardingController } from './onboarding.controller.js';
import { OnboardingFacade } from './onboarding.facade.js';

@Module({
  imports: [
    IdentityModule,
    ProfilesModule,
    forwardRef(() => CharactersModule),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingApplicationService, OnboardingFacade],
  exports: [OnboardingFacade],
})
export class OnboardingModule {}
