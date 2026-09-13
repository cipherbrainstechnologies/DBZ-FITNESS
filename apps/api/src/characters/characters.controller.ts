import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  SelectCharacterRequestSchema,
  type SelectCharacterRequest,
} from '@saiyan/contracts';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../identity/auth.types.js';
import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { CharacterFacade } from './character.facade.js';

@Controller('characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(private readonly characters: CharacterFacade) {}

  @Get()
  async listCharacters() {
    return this.characters.listAvailablePresentations();
  }

  @Post('select')
  async selectCharacter(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(SelectCharacterRequestSchema))
    body: SelectCharacterRequest,
  ) {
    const selection = await this.characters.selectPresentation(
      user.id,
      body.presentationId,
    );
    return { selection };
  }
}
