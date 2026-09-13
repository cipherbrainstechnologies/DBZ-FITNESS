import { Module } from '@nestjs/common';

import { ProfileApplicationService } from './profile.application.service.js';
import { ProfileFacade } from './profile.facade.js';

@Module({
  providers: [ProfileApplicationService, ProfileFacade],
  exports: [ProfileFacade],
})
export class ProfilesModule {}
