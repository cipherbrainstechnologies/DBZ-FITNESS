import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import {
  characterMayBiasTrainingEmphasis,
  evaluateSavedCoachValidity,
  getCoachPersona,
  isCoachingTone,
  personaKeyFromArchetype,
  type ScreeningOutcome,
} from '@saiyan/domain';

import { esmForwardRef } from '../common/esm-forward-ref.js';
import type { Env } from '../config/env.js';
import { ENV } from '../config/tokens.js';
import { PrismaService } from '../database/prisma.service.js';
import type { OnboardingFacade } from '../onboarding/onboarding.facade.js';

export type CharacterPresentationSummary = {
  id: string;
  archetypeKey: string;
  personaKey: string;
  approvedName: string;
  emphasis: string;
  tone: string;
  coachingStyleKey: string | null;
  coachingDescription: string;
  sampleGreeting: string;
  artworkKey: string | null;
  artworkUrl: string | null;
  mediaFallback: boolean;
  contentPackMode: 'ORIGINAL' | 'DBZ_LICENSED';
  publicationStatus: 'DRAFT' | 'UNAVAILABLE' | 'PUBLISHED' | 'WITHDRAWN';
  sortOrder: number;
};

export type CharacterArchetypeSummary = {
  id: string;
  key: string;
  emphasis: string;
  tone: string;
  preferenceTags: string[];
};

export type CharacterSelectionView = {
  userId: string;
  presentationId: string;
  selectedAt: string;
  personaVersion: number;
  coachingTone: 'GENTLE' | 'BALANCED' | 'DIRECT' | null;
  replacementRequired: boolean;
  presentation: CharacterPresentationSummary;
  screeningOutcome: ScreeningOutcome | null;
  characterMayBiasTrainingEmphasis: boolean;
};

export type ListCharactersResult = {
  presentations: CharacterPresentationSummary[];
  unavailable: boolean;
  retryable: boolean;
};

export type ContentReadinessView = {
  contentMode: 'ORIGINAL' | 'DBZ_LICENSED';
  locale: string;
  packFound: boolean;
  packKey: string | null;
  packPublicationStatus: 'DRAFT' | 'UNAVAILABLE' | 'PUBLISHED' | 'WITHDRAWN' | null;
  publishedPresentationCount: number;
  missingDependencies: string[];
  diagnosticCode: string | null;
  repairAction: string;
  memberCatalogueAvailable: boolean;
};

/**
 * Owns ContentPack, CharacterArchetype, CharacterPresentation, CharacterSelection.
 * Training/Nutrition must use CharacterFacade — not query these entities directly.
 */
@Injectable()
export class CharacterApplicationService {
  private readonly logger = new Logger(CharacterApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
    @Inject(
      forwardRef(
        esmForwardRef<OnboardingFacade>(
          import.meta.url,
          '../onboarding/onboarding.facade.js',
          'OnboardingFacade',
        ),
      ),
    )
    private readonly onboarding: OnboardingFacade,
  ) {}

  async listAvailablePresentations(): Promise<ListCharactersResult> {
    const contentMode = this.env.CONTENT_MODE;
    const rows = await this.prisma.client.characterPresentation.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
        contentPack: { mode: contentMode },
      },
      include: {
        archetype: true,
        contentPack: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { approvedName: 'asc' }],
    });

    const presentations = rows.map((row) => this.toPresentationSummary(row));
    const unavailable = presentations.length === 0;
    if (unavailable) {
      const readiness = await this.getContentReadiness();
      this.logger.error('Selectable coach catalogue unavailable', {
        contentMode,
        diagnosticCode: readiness.diagnosticCode,
        packFound: readiness.packFound,
        packKey: readiness.packKey,
        repairAction: readiness.repairAction,
      });
    }

    return {
      presentations,
      unavailable,
      retryable: unavailable,
    };
  }

  async getContentReadiness(): Promise<ContentReadinessView> {
    const contentMode = this.env.CONTENT_MODE;
    const pack = await this.prisma.client.contentPack.findFirst({
      where: { mode: contentMode },
      orderBy: { version: 'desc' },
    });
    const publishedPresentationCount = await this.prisma.client.characterPresentation.count({
      where: {
        publicationStatus: 'PUBLISHED',
        contentPack: { mode: contentMode },
      },
    });

    const missingDependencies: string[] = [];
    let diagnosticCode: string | null = null;
    if (!pack) {
      missingDependencies.push(`content_pack.mode=${contentMode}`);
      diagnosticCode = 'MISSING_CONTENT_PACK';
    } else if (publishedPresentationCount === 0) {
      missingDependencies.push('published_character_presentations');
      diagnosticCode =
        contentMode === 'DBZ_LICENSED'
          ? 'LICENSED_PACK_NOT_PUBLISHED'
          : 'NO_PUBLISHED_PRESENTATIONS';
    }

    const repairAction =
      diagnosticCode === 'MISSING_CONTENT_PACK' || diagnosticCode === 'NO_PUBLISHED_PRESENTATIONS'
        ? 'Run the idempotent content seed (`pnpm db:seed` or production SEED_ON_BOOT). Do not mutate from GET/login.'
        : diagnosticCode === 'LICENSED_PACK_NOT_PUBLISHED'
          ? 'Keep CONTENT_MODE=ORIGINAL for first-party coaches, or verify licensed rights before publishing DBZ_LICENSED media.'
          : 'No repair required.';

    return {
      contentMode,
      locale: pack?.locale ?? 'en',
      packFound: Boolean(pack),
      packKey: pack?.key ?? null,
      packPublicationStatus: pack
        ? (pack.publicationStatus as ContentReadinessView['packPublicationStatus'])
        : null,
      publishedPresentationCount,
      missingDependencies,
      diagnosticCode,
      repairAction,
      memberCatalogueAvailable: publishedPresentationCount > 0,
    };
  }

  async getSelection(userId: string): Promise<CharacterSelectionView | null> {
    const row = await this.prisma.client.characterSelection.findUnique({
      where: { userId },
      include: {
        presentation: {
          include: {
            archetype: true,
            contentPack: true,
          },
        },
      },
    });
    if (!row) {
      return null;
    }
    const screening = await this.onboarding.getLatestScreeningSummary(userId);
    const outcome = screening?.outcome ?? null;
    return this.toSelectionView(row, outcome);
  }

  async selectPresentation(
    userId: string,
    presentationId: string,
    coachingTone?: string,
  ): Promise<CharacterSelectionView> {
    const presentation = await this.prisma.client.characterPresentation.findUnique({
      where: { id: presentationId },
      include: {
        archetype: true,
        contentPack: true,
      },
    });
    if (!presentation) {
      throw new NotFoundException({
        code: 'CHARACTER_PRESENTATION_NOT_FOUND',
        message: 'Character presentation not found',
        retryable: false,
      });
    }

    if (presentation.contentPack.mode !== this.env.CONTENT_MODE) {
      this.logger.warn('Rejected selection for inactive content pack mode', {
        presentationId,
        packMode: presentation.contentPack.mode,
        activeMode: this.env.CONTENT_MODE,
        userId,
      });
      throw new UnprocessableEntityException({
        code: 'CHARACTER_PRESENTATION_UNAVAILABLE',
        message: 'That coach is not available. Choose an available coach to continue.',
        retryable: false,
      });
    }

    if (presentation.publicationStatus !== 'PUBLISHED') {
      throw new UnprocessableEntityException({
        code: 'CHARACTER_PRESENTATION_UNAVAILABLE',
        message: 'That coach is no longer available. Choose an available replacement.',
        retryable: false,
      });
    }

    const existing = await this.prisma.client.characterSelection.findUnique({
      where: { userId },
    });
    const nextTone = isCoachingTone(coachingTone)
      ? coachingTone
      : existing?.coachingTone && isCoachingTone(existing.coachingTone)
        ? existing.coachingTone
        : 'BALANCED';
    const nextVersion =
      existing && existing.presentationId !== presentationId
        ? existing.personaVersion + 1
        : (existing?.personaVersion ?? 1);

    const screening = await this.onboarding.getLatestScreeningSummary(userId);
    const outcome = screening?.outcome ?? null;
    const selectedAt = new Date();

    const row = await this.prisma.client.characterSelection.upsert({
      where: { userId },
      create: {
        userId,
        presentationId,
        selectedAt,
        personaVersion: 1,
        coachingTone: nextTone,
      },
      update: {
        presentationId,
        selectedAt,
        personaVersion: nextVersion,
        coachingTone: nextTone,
      },
      include: {
        presentation: {
          include: {
            archetype: true,
            contentPack: true,
          },
        },
      },
    });

    if (existing && existing.presentationId !== presentationId) {
      await this.prisma.client.notificationIntent.updateMany({
        where: { userId, status: 'PENDING' },
        data: {
          scheduleVersion: { increment: 1 },
        },
      });
    }

    return this.toSelectionView(row, outcome);
  }

  async getArchetypeSummary(archetypeId: string): Promise<CharacterArchetypeSummary | null> {
    const row = await this.prisma.client.characterArchetype.findUnique({
      where: { id: archetypeId },
    });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      key: row.key,
      emphasis: row.emphasis,
      tone: row.tone,
      preferenceTags: preferenceTagsForArchetype(row.key, row.emphasis),
    };
  }

  private toSelectionView(
    row: {
      userId: string;
      presentationId: string;
      selectedAt: Date;
      personaVersion: number;
      coachingTone: string | null;
      presentation: {
        id: string;
        approvedName: string;
        artworkKey: string | null;
        coachingStyleKey: string | null;
        publicationStatus: string;
        sortOrder: number;
        archetype: { key: string; emphasis: string; tone: string };
        contentPack: { mode: string };
      };
    },
    outcome: ScreeningOutcome | null,
  ): CharacterSelectionView {
    const validity = evaluateSavedCoachValidity({
      hasSelection: true,
      publicationStatus: row.presentation.publicationStatus,
    });
    return {
      userId: row.userId,
      presentationId: row.presentationId,
      selectedAt: row.selectedAt.toISOString(),
      personaVersion: row.personaVersion,
      coachingTone: isCoachingTone(row.coachingTone) ? row.coachingTone : null,
      replacementRequired: validity.coachReplacementRequired,
      presentation: this.toPresentationSummary(row.presentation),
      screeningOutcome: outcome,
      characterMayBiasTrainingEmphasis: outcome
        ? characterMayBiasTrainingEmphasis(outcome)
        : false,
    };
  }

  private toPresentationSummary(row: {
    id: string;
    approvedName: string;
    artworkKey: string | null;
    coachingStyleKey: string | null;
    publicationStatus: string;
    sortOrder: number;
    archetype: { key: string; emphasis: string; tone: string };
    contentPack: { mode: string };
  }): CharacterPresentationSummary {
    const persona = getCoachPersona(row.archetype.key);
    const artworkUrl = originalArtworkUrl(this.env.API_URL, row.archetype.key);
    const mediaFallback = !row.artworkKey;
    return {
      id: row.id,
      archetypeKey: row.archetype.key,
      personaKey: personaKeyFromArchetype(row.archetype.key),
      approvedName: row.approvedName || persona.displayName,
      emphasis: row.archetype.emphasis,
      tone: row.archetype.tone,
      coachingStyleKey: row.coachingStyleKey,
      coachingDescription: persona.coachingDescription,
      sampleGreeting: persona.sampleGreeting,
      artworkKey: row.artworkKey,
      artworkUrl,
      mediaFallback,
      contentPackMode: row.contentPack.mode as 'ORIGINAL' | 'DBZ_LICENSED',
      publicationStatus: row.publicationStatus as CharacterPresentationSummary['publicationStatus'],
      sortOrder: row.sortOrder,
    };
  }
}

function originalArtworkUrl(apiUrl: string, archetypeKey: string): string {
  const origin = apiUrl.replace(/\/$/, '');
  return `${origin}/static/characters/${archetypeKey}.png`;
}

/** Soft tags only — never used as hard equipment or screening overrides. */
function preferenceTagsForArchetype(key: string, emphasis: string): string[] {
  const tags = new Set<string>();
  tags.add(key.toLowerCase());
  const lower = emphasis.toLowerCase();
  if (lower.includes('strength') || lower.includes('muscle')) {
    tags.add('strength');
  }
  if (lower.includes('conditioning') || lower.includes('athletic')) {
    tags.add('conditioning');
  }
  if (lower.includes('sustainable') || lower.includes('family') || lower.includes('work')) {
    tags.add('home');
  }
  if (lower.includes('balanced') || lower.includes('general')) {
    tags.add('general_fitness');
  }
  return [...tags];
}
