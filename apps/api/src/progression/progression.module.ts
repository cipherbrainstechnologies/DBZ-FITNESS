import { Module } from '@nestjs/common';

import { CharactersModule } from '../characters/characters.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { ProgressController } from './progress.controller.js';
import { ProgressionApplicationService } from './progression.application.service.js';
import { ProgressionFacade } from './progression.facade.js';

@Module({
  imports: [IdentityModule, CharactersModule],
  controllers: [ProgressController],
  providers: [ProgressionApplicationService, ProgressionFacade],
  exports: [ProgressionFacade],
})
export class ProgressionModule {}
