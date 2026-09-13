import { Module, forwardRef } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { OnboardingModule } from '../onboarding/onboarding.module.js';
import { CharacterApplicationService } from './character.application.service.js';
import { CharacterFacade } from './character.facade.js';
import { CharactersController } from './characters.controller.js';

@Module({
  imports: [IdentityModule, forwardRef(() => OnboardingModule)],
  controllers: [CharactersController],
  providers: [CharacterApplicationService, CharacterFacade],
  exports: [CharacterFacade],
})
export class CharactersModule {}
