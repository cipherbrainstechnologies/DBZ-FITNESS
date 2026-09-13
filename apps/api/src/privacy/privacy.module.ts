import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { PrivacyApplicationService } from './privacy.application.service.js';
import { PrivacyController } from './privacy.controller.js';
import { PrivacyFacade } from './privacy.facade.js';

@Module({
  imports: [IdentityModule],
  controllers: [PrivacyController],
  providers: [PrivacyApplicationService, PrivacyFacade],
  exports: [PrivacyFacade],
})
export class PrivacyModule {}
