import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../identity/jwt-auth.guard.js';
import { TrainingFacade } from './training.facade.js';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly training: TrainingFacade) {}

  @Get()
  listExercises() {
    return this.training.listExercises();
  }

  @Get(':id')
  getExercise(@Param('id', ParseUUIDPipe) id: string) {
    return this.training.getExercise(id);
  }
}
