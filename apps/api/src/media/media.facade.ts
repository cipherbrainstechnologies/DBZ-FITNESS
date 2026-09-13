import { Injectable } from '@nestjs/common';
import type {
  ContentTodayResponse,
  ListMediaResponse,
  MediaAccessRequest,
  MediaAccessResponse,
} from '@saiyan/contracts';

import { MediaApplicationService } from './media.application.service.js';

/**
 * Cross-module façade for media assets, quotes, rights grants, and publications.
 * Training / Nutrition must not import Media Prisma models.
 */
@Injectable()
export class MediaFacade {
  constructor(private readonly media: MediaApplicationService) {}

  getContentToday(locale?: string): Promise<ContentTodayResponse> {
    return this.media.getContentToday(locale);
  }

  listMedia(): Promise<ListMediaResponse> {
    return this.media.listMedia();
  }

  accessMedia(
    mediaAssetId: string,
    body: MediaAccessRequest,
  ): Promise<MediaAccessResponse> {
    return this.media.accessMedia(mediaAssetId, body);
  }
}
