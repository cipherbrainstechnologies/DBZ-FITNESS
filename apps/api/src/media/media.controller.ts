import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  MediaAccessRequestSchema,
  type MediaAccessRequest,
} from '@saiyan/contracts';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { MediaFacade } from './media.facade.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly media: MediaFacade) {}

  @Get('content/today')
  getContentToday(@Query('locale') locale?: string) {
    return this.media.getContentToday(locale || 'en');
  }

  @Get('media')
  listMedia() {
    return this.media.listMedia();
  }

  @Post('media/:id/access')
  accessMedia(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(MediaAccessRequestSchema))
    body: MediaAccessRequest = { purpose: 'IN_APP_DISPLAY' },
  ) {
    return this.media.accessMedia(id, body ?? { purpose: 'IN_APP_DISPLAY' });
  }
}
