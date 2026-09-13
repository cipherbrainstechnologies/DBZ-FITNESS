import { Inject, Injectable, forwardRef } from '@nestjs/common';

import {
  CharacterApplicationService,
  type CharacterArchetypeSummary,
  type CharacterSelectionView,
  type ListCharactersResult,
} from './character.application.service.js';

/**
 * Cross-module façade for content packs and character selection.
 * Training/Nutrition must depend on this — not Character* / ContentPack entities.
 */
@Injectable()
export class CharacterFacade {
  constructor(
    @Inject(forwardRef(() => CharacterApplicationService))
    private readonly characters: CharacterApplicationService,
  ) {}

  listAvailablePresentations(): Promise<ListCharactersResult> {
    return this.characters.listAvailablePresentations();
  }

  getSelection(userId: string): Promise<CharacterSelectionView | null> {
    return this.characters.getSelection(userId);
  }

  selectPresentation(
    userId: string,
    presentationId: string,
  ): Promise<CharacterSelectionView> {
    return this.characters.selectPresentation(userId, presentationId);
  }

  getArchetypeSummary(archetypeId: string): Promise<CharacterArchetypeSummary | null> {
    return this.characters.getArchetypeSummary(archetypeId);
  }
}
