import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  ContentTodayResponse,
  ListMediaResponse,
  MediaAccessRequest,
  MediaAccessResponse,
  MediaAssetSummary,
  QuoteSummary,
} from '@saiyan/contracts';
import {
  ORIGINAL_COPY_ATTRIBUTION,
  checkExpiryAndWithdrawal,
  evaluatePublicationEligibility,
  isSafeForOriginalContentMode,
} from '@saiyan/domain';

import type { Env } from '../config/env.js';
import { ENV } from '../config/tokens.js';
import { PrismaService } from '../database/prisma.service.js';

/**
 * Owns MediaAsset, Quote, RightsGrant, ContentPublication.
 */
@Injectable()
export class MediaApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /**
   * Today strip: ORIGINAL fixtures only. Never attributes fake DBZ quotes as authentic.
   */
  async getContentToday(locale = 'en'): Promise<ContentTodayResponse> {
    const originalPack = await this.prisma.client.contentPack.findFirst({
      where: { mode: 'ORIGINAL', key: 'original-en-v1' },
    });

    const quotes = await this.prisma.client.quote.findMany({
      where: {
        kind: 'ORIGINAL_COPY',
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
        withdrawnAt: null,
        locale,
        ...(originalPack ? { contentPackId: originalPack.id } : {}),
      },
      orderBy: { key: 'asc' },
      take: 12,
    });

    const mediaRows = await this.prisma.client.mediaAsset.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
        withdrawnAt: null,
        ...(originalPack ? { contentPackId: originalPack.id } : {}),
      },
      orderBy: { key: 'asc' },
      take: 12,
    });

    const safeQuotes: QuoteSummary[] = quotes
      .filter((q) => isSafeForOriginalContentMode(q.kind))
      .map((q) => ({
        id: q.id,
        key: q.key,
        text: q.text,
        kind: q.kind,
        attribution: q.attribution || ORIGINAL_COPY_ATTRIBUTION,
        locale: q.locale,
        contextTags: Array.isArray(q.contextTags)
          ? (q.contextTags as string[])
          : null,
        isAuthenticLicensedDialogue: false as const,
      }));

    return {
      quotes: safeQuotes,
      media: mediaRows.map((m) => this.toMediaSummary(m)),
      contentMode: 'ORIGINAL',
      note:
        'ORIGINAL fixtures only. Motivational lines are Saiyan Ascend original copy — not authentic Dragon Ball dialogue. Licensed DBZ content remains unpublished until rights are verified.',
    };
  }

  async listMedia(): Promise<ListMediaResponse> {
    const rows = await this.prisma.client.mediaAsset.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
        withdrawnAt: null,
      },
      orderBy: { key: 'asc' },
    });

    return {
      assets: rows.map((m) => this.toMediaSummary(m)),
      note: 'Published ORIGINAL media only. Image URLs are original static files from this API, not licensed Dragon Ball stills.',
    };
  }

  async accessMedia(
    mediaAssetId: string,
    body: MediaAccessRequest,
  ): Promise<MediaAccessResponse> {
    const asset = await this.prisma.client.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      include: {
        publications: {
          where: { publicationStatus: 'PUBLISHED' },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!asset) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media asset not found',
      });
    }

    const publication = asset.publications[0];
    const grantIds = Array.isArray(asset.rightsGrantIds)
      ? (asset.rightsGrantIds as string[])
      : [];

    const grants =
      grantIds.length > 0
        ? await this.prisma.client.rightsGrant.findMany({
            where: { id: { in: grantIds } },
          })
        : [];

    const eligibility = evaluatePublicationEligibility({
      publicationStatus: asset.publicationStatus,
      reviewStatus: asset.reviewStatus,
      withdrawnAt: asset.withdrawnAt,
      publicationExpiresAt: publication?.expiresAt ?? null,
      scheduledPublishAt: publication?.scheduledPublishAt ?? null,
      rightsGrantIds: grantIds,
      grants: grants.map((g) => ({
        id: g.id,
        permittedUses: Array.isArray(g.permittedUses)
          ? (g.permittedUses as string[])
          : [],
        platforms: Array.isArray(g.platforms) ? (g.platforms as string[]) : null,
        territories: Array.isArray(g.territories)
          ? (g.territories as string[])
          : null,
        validFrom: g.validFrom,
        validUntil: g.validUntil,
      })),
      requiredUse: body.purpose,
      platform: body.platform,
      territory: body.territory,
    });

    const expiry = checkExpiryAndWithdrawal({
      publicationStatus: asset.publicationStatus,
      withdrawnAt: asset.withdrawnAt,
      expiresAt: publication?.expiresAt ?? null,
      grantValidUntil: grants
        .map((g) => g.validUntil)
        .filter((d): d is Date => d != null)
        .sort((a, b) => a.getTime() - b.getTime())[0],
    });

    if (!eligibility.eligible || !expiry.deliverable) {
      throw new UnprocessableEntityException({
        code: 'MEDIA_NOT_DELIVERABLE',
        message: 'Media is not eligible for delivery',
        fieldErrors: {
          reasons: [...eligibility.reasons, ...expiry.reasons],
        },
      });
    }

    const publicUrl = this.staticOriginalUrl(asset.storageKey);
    const stubExpires = new Date(Date.now() + 15 * 60_000);

    return {
      mediaAssetId: asset.id,
      url: publicUrl,
      deliveryMode: 'STATIC_ORIGINAL',
      expiresAt: stubExpires.toISOString(),
      label:
        'Original product artwork served by this API — not a licensed Dragon Ball Z still or CDN object-storage grant',
      eligible: true,
      reasons: [],
    };
  }

  private staticOriginalUrl(storageKey: string): string {
    const origin = this.env.API_URL.replace(/\/$/, '');
    return `${origin}/static/${storageKey.replace(/^\/+/, '')}`;
  }

  private toMediaSummary(m: {
    id: string;
    key: string;
    type: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
    mimeType: string;
    altText: string | null;
    durationSeconds: number | null;
    publicationStatus: 'DRAFT' | 'UNAVAILABLE' | 'PUBLISHED' | 'WITHDRAWN';
    storageKey: string;
  }): MediaAssetSummary {
    return {
      id: m.id,
      key: m.key,
      type: m.type,
      mimeType: m.mimeType,
      altText: m.altText,
      durationSeconds: m.durationSeconds,
      publicationStatus: m.publicationStatus,
      deliveryMode: 'STATIC_ORIGINAL',
      publicUrl: this.staticOriginalUrl(m.storageKey),
    };
  }
}
