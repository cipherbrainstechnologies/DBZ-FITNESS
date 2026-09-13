import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { MediaApplicationService } from './media.application.service.js';
import { MediaController } from './media.controller.js';
import { MediaFacade } from './media.facade.js';

@Module({
  imports: [IdentityModule],
  controllers: [MediaController],
  providers: [MediaApplicationService, MediaFacade],
  exports: [MediaFacade],
})
export class MediaModule {}
