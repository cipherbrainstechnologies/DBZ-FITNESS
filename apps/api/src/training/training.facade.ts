import { Injectable } from '@nestjs/common';
import type {
  ActivateTrainingPlanRequest,
  CompleteWorkoutSessionRequest,
  PreviewTrainingPlanRequest,
  ShortenPlannedSessionRequest,
  StartWorkoutSessionRequest,
  UpdateWorkoutSetRequest,
} from '@saiyan/contracts';

import { TrainingApplicationService } from './training.application.service.js';

/**
 * Cross-module façade for training catalogue, plans, and workouts.
 * Other modules must depend on this — not Exercise / TrainingPlan Prisma models.
 */
@Injectable()
export class TrainingFacade {
  constructor(private readonly training: TrainingApplicationService) {}

  listExercises() {
    return this.training.listExercises();
  }

  getExercise(id: string) {
    return this.training.getExercise(id);
  }

  previewPlan(userId: string, body: PreviewTrainingPlanRequest) {
    return this.training.previewPlan(userId, body);
  }

  activatePlan(
    userId: string,
    body: ActivateTrainingPlanRequest,
    idempotencyKey: string | undefined,
  ) {
    return this.training.activatePlan(userId, body, idempotencyKey);
  }

  getCurrentPlan(userId: string) {
    return this.training.getCurrentPlan(userId);
  }

  listPlannedSessions(userId: string) {
    return this.training.listPlannedSessions(userId);
  }

  shortenPlannedSession(
    userId: string,
    plannedSessionId: string,
    body: ShortenPlannedSessionRequest,
  ) {
    return this.training.shortenPlannedSession(userId, plannedSessionId, body);
  }

  startWorkout(userId: string, body: StartWorkoutSessionRequest) {
    return this.training.startWorkout(userId, body);
  }

  updateSet(
    userId: string,
    workoutSessionId: string,
    setId: string,
    body: UpdateWorkoutSetRequest,
  ) {
    return this.training.updateSet(userId, workoutSessionId, setId, body);
  }

  completeWorkout(
    userId: string,
    workoutSessionId: string,
    body: CompleteWorkoutSessionRequest,
    idempotencyKey: string | undefined,
  ) {
    return this.training.completeWorkout(userId, workoutSessionId, body, idempotencyKey);
  }

  abandonWorkout(userId: string, workoutSessionId: string) {
    return this.training.abandonWorkout(userId, workoutSessionId);
  }
}
