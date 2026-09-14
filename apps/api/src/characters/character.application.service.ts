import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import {
  characterMayBiasTrainingEmphasis,
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
  approvedName: string;
  emphasis: string;
  tone: string;
  coachingStyleKey: string | null;
  artworkKey: string | null;
  artworkUrl: string | null;
  inspiredByLabel: string | null;
  contentPackMode: 'ORIGINAL' | 'DBZ_LICENSED';
  publicationStatus: 'DRAFT' | 'UNAVAILABLE' | 'PUBLISHED' | 'WITHDRAWN';
  sortOrder: number;
};

export type CharacterArchetypeSummary = {
  id: string;
  key: string;
  emphasis: string;
  tone: string;
  /** Soft preference tags derived from emphasis for ranking only. */
  preferenceTags: string[];
};

export type CharacterSelectionView = {
  userId: string;
  presentationId: string;
  selectedAt: string;
  presentation: CharacterPresentationSummary;
  screeningOutcome: ScreeningOutcome | null;
  characterMayBiasTrainingEmphasis: boolean;
};

export type ListCharactersResult = {
  contentMode: 'ORIGINAL' | 'DBZ_LICENSED';
  presentations: CharacterPresentationSummary[];
  unavailable: boolean;
  message?: string;
};

/**
 * Owns ContentPack, CharacterArchetype, CharacterPresentation, CharacterSelection.
 * Training/Nutrition must use CharacterFacade — not query these entities directly.
 */
@Injectable()
export class CharacterApplicationService {
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
    const pack = await this.prisma.client.contentPack.findFirst({
      where: { mode: contentMode },
      orderBy: { version: 'desc' },
    });

    if (!pack) {
      return {
        contentMode,
        presentations: [],
        unavailable: true,
        message: `No content pack configured for mode ${contentMode}`,
      };
    }

    const rows = await this.prisma.client.characterPresentation.findMany({
      where: {
        contentPackId: pack.id,
        publicationStatus: 'PUBLISHED',
      },
      include: {
        archetype: true,
        contentPack: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { approvedName: 'asc' }],
    });

    const presentations = rows.map((row) => this.toPresentationSummary(row));
    const unavailable = presentations.length === 0;
    return {
      contentMode,
      presentations,
      unavailable,
      ...(unavailable
        ? {
            message:
              contentMode === 'DBZ_LICENSED'
                ? 'DBZ_LICENSED presentations are not published until rights are verified. Use CONTENT_MODE=ORIGINAL.'
                : 'No published character presentations for the active content mode.',
          }
        : {}),
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
    return {
      userId,
      presentationId: row.presentationId,
      selectedAt: row.selectedAt.toISOString(),
      presentation: this.toPresentationSummary(row.presentation),
      screeningOutcome: outcome,
      characterMayBiasTrainingEmphasis: outcome
        ? characterMayBiasTrainingEmphasis(outcome)
        : false,
    };
  }

  async selectPresentation(
    userId: string,
    presentationId: string,
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
      throw new UnprocessableEntityException({
        code: 'CHARACTER_CONTENT_MODE_MISMATCH',
        message: `Presentation belongs to ${presentation.contentPack.mode}; active mode is ${this.env.CONTENT_MODE}`,
        retryable: false,
      });
    }

    if (presentation.publicationStatus !== 'PUBLISHED') {
      throw new UnprocessableEntityException({
        code: 'CHARACTER_PRESENTATION_UNAVAILABLE',
        message: 'Character presentation is not available for selection',
        retryable: false,
      });
    }

    // Character choice never clears screening restrictions (domain rule).
    // Character switching updates presentation only — XP ledger and milestone
    // unlocks are owned by Progression and must not be wiped here.
    const screening = await this.onboarding.getLatestScreeningSummary(userId);
    const outcome = screening?.outcome ?? null;

    const selectedAt = new Date();
    const row = await this.prisma.client.characterSelection.upsert({
      where: { userId },
      create: {
        userId,
        presentationId,
        selectedAt,
      },
      update: {
        presentationId,
        selectedAt,
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

    return {
      userId,
      presentationId: row.presentationId,
      selectedAt: row.selectedAt.toISOString(),
      presentation: this.toPresentationSummary(row.presentation),
      screeningOutcome: outcome,
      characterMayBiasTrainingEmphasis: outcome
        ? characterMayBiasTrainingEmphasis(outcome)
        : false,
    };
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
    return {
      id: row.id,
      archetypeKey: row.archetype.key,
      approvedName: row.approvedName,
      emphasis: row.archetype.emphasis,
      tone: row.archetype.tone,
      coachingStyleKey: row.coachingStyleKey,
      artworkKey: row.artworkKey,
      artworkUrl: originalArtworkUrl(this.env.API_URL, row.archetype.key),
      inspiredByLabel: THEME_INSPIRATION[row.archetype.key] ?? null,
      contentPackMode: row.contentPack.mode as 'ORIGINAL' | 'DBZ_LICENSED',
      publicationStatus: row.publicationStatus as CharacterPresentationSummary['publicationStatus'],
      sortOrder: row.sortOrder,
    };
  }
}

/** Training-emphasis inspiration labels from docs/03 — not licensed identities. */
const THEME_INSPIRATION: Record<string, string> = {
  explorer: 'Goku',
  strategist: 'Vegeta',
  scholar: 'Gohan',
  guardian: 'Trunks',
  titan: 'Broly',
};

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
