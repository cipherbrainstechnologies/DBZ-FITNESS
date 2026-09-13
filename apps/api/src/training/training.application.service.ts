import { createHash, randomUUID } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  ActivateTrainingPlanRequest,
  CompleteWorkoutSessionRequest,
  PreviewTrainingPlanRequest,
  ShortenPlannedSessionRequest,
  StartWorkoutSessionRequest,
  UpdateWorkoutSetRequest,
} from '@saiyan/contracts';
import type { Prisma } from '@saiyan/database';
import {
  TRAINING_POLICY_VERSION,
  XP_POLICY_VERSION,
  previewTrainingPlan,
  shortenBusyDaySession,
  type ExerciseCandidate,
  type PlanPreviewResult,
  type ProgrammeTemplateCandidate,
  type ScreeningOutcomeForTraining,
  type ShortenExerciseSlot,
} from '@saiyan/domain';

import { CharacterFacade } from '../characters/character.facade.js';
import { PrismaService } from '../database/prisma.service.js';
import { OnboardingFacade } from '../onboarding/onboarding.facade.js';
import { ProfileFacade } from '../profiles/profile.facade.js';
import { ProgressionFacade } from '../progression/progression.facade.js';

const PREVIEW_TTL_MS = 30 * 60 * 1000;

type PrescriptionExercise = ShortenExerciseSlot & { exerciseKey?: string };

type PreviewPayload = {
  request: PreviewTrainingPlanRequest;
  preview: PlanPreviewResult;
  profileVersionId: string;
  screeningRecordId: string;
  characterArchetypeId: string | null;
  startLocalDate: string;
  timeZone: string;
};

/**
 * Owns Exercise, ProgrammeTemplate, TrainingPlan, PlannedSession, Workout*.
 * Other modules must use TrainingFacade — not query these entities directly.
 */
@Injectable()
export class TrainingApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfileFacade,
    private readonly onboarding: OnboardingFacade,
    private readonly characters: CharacterFacade,
    private readonly progression: ProgressionFacade,
  ) {}

  async listExercises() {
    const rows = await this.prisma.client.exercise.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      orderBy: [{ movementPattern: 'asc' }, { name: 'asc' }],
    });
    return { exercises: rows.map((row) => this.toExerciseSummary(row)) };
  }

  async getExercise(id: string) {
    const row = await this.prisma.client.exercise.findFirst({
      where: { id, publicationStatus: 'PUBLISHED' },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'EXERCISE_NOT_FOUND',
        message: 'Exercise not found',
        retryable: false,
      });
    }
    return { exercise: this.toExerciseSummary(row) };
  }

  async previewPlan(userId: string, body: PreviewTrainingPlanRequest) {
    const profile = await this.profiles.requireSummaryByIdForUser(
      userId,
      body.profileVersionId,
    );
    const screening = await this.onboarding.getScreeningSummaryByIdForUser(
      userId,
      body.screeningRecordId,
    );
    if (!screening) {
      throw new NotFoundException({
        code: 'SCREENING_NOT_FOUND',
        message: 'Screening record not found for user',
        retryable: false,
      });
    }

    let characterPreferenceTags: string[] = [];
    if (body.characterArchetypeId) {
      const archetype = await this.characters.getArchetypeSummary(body.characterArchetypeId);
      if (!archetype) {
        throw new NotFoundException({
          code: 'CHARACTER_ARCHETYPE_NOT_FOUND',
          message: 'Character archetype not found',
          retryable: false,
        });
      }
      characterPreferenceTags = archetype.preferenceTags;
    }

    const { templates, exercises } = await this.loadCatalogueCandidates();
    const preview = previewTrainingPlan({
      constraints: {
        equipment: profile.equipment ?? [],
        experience: profile.experience,
        sessionDurationMinutes: profile.sessionDurationMinutes,
        availableDaysCount: profile.availableDays?.length ?? null,
        screeningOutcome: screening.outcome as ScreeningOutcomeForTraining,
        screeningRestrictions: screening.restrictions,
        characterPreferenceTags,
        programmePreference: body.programmePreference ?? null,
      },
      templates,
      exercises,
    });

    if (!preview.candidatePlan) {
      return {
        ...preview,
        previewToken: null,
        expiresAt: null,
        screeningOutcome: screening.outcome,
      };
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS);
    const payload: PreviewPayload = {
      request: body,
      preview,
      profileVersionId: body.profileVersionId,
      screeningRecordId: body.screeningRecordId,
      characterArchetypeId: body.characterArchetypeId ?? null,
      startLocalDate: body.startLocalDate,
      timeZone: body.timeZone,
    };

    await this.prisma.client.trainingPlanPreview.create({
      data: {
        token,
        userId,
        payload: payload as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return {
      ...preview,
      previewToken: token,
      expiresAt: expiresAt.toISOString(),
      screeningOutcome: screening.outcome,
    };
  }

  async activatePlan(
    userId: string,
    body: ActivateTrainingPlanRequest,
    idempotencyKey: string | undefined,
  ) {
    return this.withIdempotency(
      userId,
      'training-plan-activate',
      idempotencyKey,
      body,
      async () => {
        const previewRow = await this.prisma.client.trainingPlanPreview.findUnique({
          where: { token: body.previewToken },
        });
        if (!previewRow || previewRow.userId !== userId) {
          throw new NotFoundException({
            code: 'PREVIEW_TOKEN_NOT_FOUND',
            message: 'Training plan preview token not found',
            retryable: false,
          });
        }
        if (previewRow.consumedAt) {
          throw new ConflictException({
            code: 'PREVIEW_TOKEN_CONSUMED',
            message: 'Preview token already used',
            retryable: false,
          });
        }
        if (previewRow.expiresAt.getTime() < Date.now()) {
          throw new UnprocessableEntityException({
            code: 'PREVIEW_TOKEN_EXPIRED',
            message: 'Preview token has expired; request a new preview',
            retryable: false,
          });
        }

        const payload = previewRow.payload as unknown as PreviewPayload;
        if (!payload.preview.candidatePlan) {
          throw new UnprocessableEntityException({
            code: 'PREVIEW_NOT_ACTIVATABLE',
            message: 'Preview has no candidate plan to activate',
            retryable: false,
          });
        }

        // Re-validate source versions unchanged.
        await this.profiles.requireSummaryByIdForUser(userId, payload.profileVersionId);
        const screening = await this.onboarding.getScreeningSummaryByIdForUser(
          userId,
          payload.screeningRecordId,
        );
        if (!screening) {
          throw new UnprocessableEntityException({
            code: 'SCREENING_VERSION_CHANGED',
            message: 'Screening record is no longer available',
            retryable: false,
          });
        }

        const candidate = payload.preview.candidatePlan;
        const result = await this.prisma.client.$transaction(async (tx) => {
          await tx.trainingPlan.updateMany({
            where: { userId, status: 'ACTIVE' },
            data: { status: 'SUPERSEDED' },
          });

          const latest = await tx.trainingPlan.findFirst({
            where: { userId },
            orderBy: { version: 'desc' },
          });
          const version = (latest?.version ?? 0) + 1;
          const effectiveFrom = new Date();

          const plan = await tx.trainingPlan.create({
            data: {
              userId,
              version,
              templateId: candidate.templateId,
              profileVersionId: payload.profileVersionId,
              screeningRecordId: payload.screeningRecordId,
              characterArchetypeId: payload.characterArchetypeId,
              inputSnapshot: {
                request: payload.request,
                eligibilityStatus: payload.preview.eligibilityStatus,
                candidatePlan: candidate,
                policyVersion: TRAINING_POLICY_VERSION,
              } as Prisma.InputJsonValue,
              policyVersion: TRAINING_POLICY_VERSION,
              explanationCodes: payload.preview.explanationCodes,
              effectiveFrom,
              status: 'ACTIVE',
            },
            include: { template: true },
          });

          const plannedSessions = await this.createPlannedSessions(
            tx,
            userId,
            plan.id,
            payload.startLocalDate,
            payload.timeZone,
            candidate.weeklySessions,
          );

          await tx.trainingPlanPreview.update({
            where: { id: previewRow.id },
            data: { consumedAt: new Date() },
          });

          return { plan, plannedSessions };
        });

        return {
          plan: {
            id: result.plan.id,
            userId: result.plan.userId,
            version: result.plan.version,
            templateId: result.plan.templateId,
            templateKey: result.plan.template.key,
            templateVersion: result.plan.template.version,
            policyVersion: result.plan.policyVersion,
            explanationCodes: asStringArray(result.plan.explanationCodes),
            effectiveFrom: result.plan.effectiveFrom.toISOString(),
            status: result.plan.status as 'ACTIVE' | 'SUPERSEDED' | 'CANCELLED',
          },
          plannedSessions: result.plannedSessions.map((s) => ({
            id: s.id,
            localDate: s.localDate,
            timeZone: s.timeZone,
            durationBudget: s.durationBudget,
            status: s.status,
          })),
        };
      },
    );
  }

  async getCurrentPlan(userId: string) {
    const plan = await this.prisma.client.trainingPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { template: true },
      orderBy: { version: 'desc' },
    });
    if (!plan) {
      return { plan: null };
    }
    return {
      plan: {
        id: plan.id,
        userId: plan.userId,
        version: plan.version,
        templateId: plan.templateId,
        templateKey: plan.template.key,
        templateVersion: plan.template.version,
        policyVersion: plan.policyVersion,
        explanationCodes: asStringArray(plan.explanationCodes),
        effectiveFrom: plan.effectiveFrom.toISOString(),
        status: plan.status as 'ACTIVE' | 'SUPERSEDED' | 'CANCELLED',
      },
    };
  }

  async listPlannedSessions(userId: string) {
    const sessions = await this.prisma.client.plannedSession.findMany({
      where: { userId },
      orderBy: [{ localDate: 'asc' }, { createdAt: 'asc' }],
    });
    return {
      sessions: sessions.map((s) => this.toPlannedSession(s)),
    };
  }

  async shortenPlannedSession(
    userId: string,
    plannedSessionId: string,
    body: ShortenPlannedSessionRequest,
  ) {
    const session = await this.prisma.client.plannedSession.findFirst({
      where: { id: plannedSessionId, userId },
    });
    if (!session) {
      throw new NotFoundException({
        code: 'PLANNED_SESSION_NOT_FOUND',
        message: 'Planned session not found',
        retryable: false,
      });
    }
    if (session.status !== 'PLANNED' && session.status !== 'SHORTENED') {
      throw new UnprocessableEntityException({
        code: 'PLANNED_SESSION_NOT_SHORTENABLE',
        message: `Cannot shorten session in status ${session.status}`,
        retryable: false,
      });
    }

    const exercises = parsePrescriptionExercises(session.prescriptionSnapshot);
    const shortened = shortenBusyDaySession({
      durationBudgetMinutes: session.durationBudget,
      targetDurationMinutes: body.targetDurationMinutes,
      exercises,
    });

    const updated = await this.prisma.client.plannedSession.update({
      where: { id: session.id },
      data: {
        durationBudget: shortened.durationBudgetMinutes,
        shortenedFromDuration: session.shortenedFromDuration ?? session.durationBudget,
        prescriptionSnapshot: {
          exercises: shortened.exercises,
          removedExerciseIds: shortened.removedExerciseIds,
        } as Prisma.InputJsonValue,
        status: shortened.shortened ? 'SHORTENED' : session.status,
        explanationCodes: shortened.explanationCodes,
      },
    });

    return { session: this.toPlannedSession(updated) };
  }

  async startWorkout(userId: string, body: StartWorkoutSessionRequest) {
    const planned = await this.prisma.client.plannedSession.findFirst({
      where: { id: body.plannedSessionId, userId },
      include: { plan: true, workout: true },
    });
    if (!planned) {
      throw new NotFoundException({
        code: 'PLANNED_SESSION_NOT_FOUND',
        message: 'Planned session not found',
        retryable: false,
      });
    }
    if (planned.workout) {
      return { session: await this.getWorkoutView(planned.workout.id, userId) };
    }
    if (
      planned.status !== 'PLANNED' &&
      planned.status !== 'SHORTENED' &&
      planned.status !== 'IN_PROGRESS'
    ) {
      throw new UnprocessableEntityException({
        code: 'PLANNED_SESSION_NOT_STARTABLE',
        message: `Cannot start workout from status ${planned.status}`,
        retryable: false,
      });
    }

    const exercises = parsePrescriptionExercises(planned.prescriptionSnapshot);
    const session = await this.prisma.client.$transaction(async (tx) => {
      await tx.plannedSession.update({
        where: { id: planned.id },
        data: { status: 'IN_PROGRESS' },
      });
      const created = await tx.workoutSession.create({
        data: {
          userId,
          plannedSessionId: planned.id,
          planVersion: planned.plan.version,
          status: 'IN_PROGRESS',
        },
      });

      for (const exercise of exercises) {
        for (let setIndex = 0; setIndex < exercise.sets; setIndex += 1) {
          await tx.workoutSet.create({
            data: {
              sessionId: created.id,
              exerciseId: exercise.exerciseId,
              setIndex,
            },
          });
        }
      }

      return created;
    });

    return { session: await this.getWorkoutView(session.id, userId) };
  }

  async updateSet(
    userId: string,
    workoutSessionId: string,
    setId: string,
    body: UpdateWorkoutSetRequest,
  ) {
    const session = await this.prisma.client.workoutSession.findFirst({
      where: { id: workoutSessionId, userId },
    });
    if (!session) {
      throw new NotFoundException({
        code: 'WORKOUT_SESSION_NOT_FOUND',
        message: 'Workout session not found',
        retryable: false,
      });
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new UnprocessableEntityException({
        code: 'WORKOUT_SESSION_NOT_EDITABLE',
        message: 'Only in-progress workouts accept set updates',
        retryable: false,
      });
    }

    const set = await this.prisma.client.workoutSet.findFirst({
      where: { id: setId, sessionId: workoutSessionId },
    });
    if (!set) {
      throw new NotFoundException({
        code: 'WORKOUT_SET_NOT_FOUND',
        message: 'Workout set not found',
        retryable: false,
      });
    }
    if (body.expectedVersion !== undefined && body.expectedVersion !== set.version) {
      throw new ConflictException({
        code: 'WORKOUT_SET_VERSION_CONFLICT',
        message: 'Set version conflict',
        retryable: false,
      });
    }

    const updated = await this.prisma.client.workoutSet.update({
      where: { id: set.id },
      data: {
        repetitions: body.repetitions ?? set.repetitions,
        resistanceKg:
          body.resistanceKg !== undefined ? body.resistanceKg : set.resistanceKg,
        durationSeconds: body.durationSeconds ?? set.durationSeconds,
        effort: body.effort ?? set.effort,
        completed: body.completed ?? set.completed,
        version: set.version + 1,
      },
    });

    return { set: this.toWorkoutSet(updated) };
  }

  async completeWorkout(
    userId: string,
    workoutSessionId: string,
    body: CompleteWorkoutSessionRequest,
    idempotencyKey: string | undefined,
  ) {
    return this.withIdempotency(
      userId,
      `workout-complete:${workoutSessionId}`,
      idempotencyKey,
      body,
      async () => {
        const session = await this.prisma.client.workoutSession.findFirst({
          where: { id: workoutSessionId, userId },
          include: { plannedSession: true },
        });
        if (!session) {
          throw new NotFoundException({
            code: 'WORKOUT_SESSION_NOT_FOUND',
            message: 'Workout session not found',
            retryable: false,
          });
        }
        if (session.status === 'COMPLETED') {
          const existingAward = await this.progression.getAwardForSource(
            userId,
            'WORKOUT_COMPLETE',
            session.id,
          );
          return {
            session: await this.getWorkoutView(session.id, userId),
            xpAward: existingAward ?? {
              status: 'ALREADY_AWARDED' as const,
              awarded: 0,
              category: 'MAIN_MISSION' as const,
              eventType: 'WORKOUT_COMPLETE',
              sourceEntityId: session.id,
              policyVersion: XP_POLICY_VERSION,
              ledgerEntryId: null,
              reason: 'WORKOUT_ALREADY_COMPLETED',
            },
          };
        }
        if (session.status !== 'IN_PROGRESS') {
          throw new UnprocessableEntityException({
            code: 'WORKOUT_SESSION_NOT_COMPLETABLE',
            message: `Cannot complete workout in status ${session.status}`,
            retryable: false,
          });
        }

        const finishedAt = new Date();
        const actualDuration =
          body.actualDurationMinutes ??
          Math.max(
            1,
            Math.round((finishedAt.getTime() - session.startedAt.getTime()) / 60_000),
          );

        const xpAward = await this.prisma.client.$transaction(async (tx) => {
          await tx.workoutSession.update({
            where: { id: session.id },
            data: {
              status: 'COMPLETED',
              finishedAt,
              actualDuration,
              version: session.version + 1,
            },
          });
          await tx.plannedSession.update({
            where: { id: session.plannedSessionId },
            data: {
              status:
                session.plannedSession.status === 'SHORTENED' ? 'SHORTENED' : 'COMPLETED',
            },
          });

          // Same DB transaction — Training uses ProgressionFacade, not XpLedger Prisma.
          return this.progression.awardIfEligible(
            {
              userId,
              eventType: 'WORKOUT_COMPLETE',
              sourceEntityId: session.id,
              localDate: session.plannedSession.localDate,
              timeZone: session.plannedSession.timeZone,
              reason: 'WORKOUT_COMPLETE_MAIN_MISSION',
            },
            tx,
          );
        });

        return {
          session: await this.getWorkoutView(workoutSessionId, userId),
          xpAward,
        };
      },
    );
  }

  async abandonWorkout(userId: string, workoutSessionId: string) {
    const session = await this.prisma.client.workoutSession.findFirst({
      where: { id: workoutSessionId, userId },
    });
    if (!session) {
      throw new NotFoundException({
        code: 'WORKOUT_SESSION_NOT_FOUND',
        message: 'Workout session not found',
        retryable: false,
      });
    }
    if (session.status === 'ABANDONED') {
      return { session: await this.getWorkoutView(session.id, userId) };
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new UnprocessableEntityException({
        code: 'WORKOUT_SESSION_NOT_ABANDONABLE',
        message: `Cannot abandon workout in status ${session.status}`,
        retryable: false,
      });
    }

    const finishedAt = new Date();
    await this.prisma.client.$transaction(async (tx) => {
      await tx.workoutSession.update({
        where: { id: session.id },
        data: {
          status: 'ABANDONED',
          finishedAt,
          version: session.version + 1,
        },
      });
      await tx.plannedSession.update({
        where: { id: session.plannedSessionId },
        data: { status: 'ABANDONED' },
      });
    });

    return { session: await this.getWorkoutView(workoutSessionId, userId) };
  }

  private async loadCatalogueCandidates(): Promise<{
    templates: ProgrammeTemplateCandidate[];
    exercises: ExerciseCandidate[];
  }> {
    const exerciseRows = await this.prisma.client.exercise.findMany({
      where: { publicationStatus: 'PUBLISHED' },
    });
    const exercises: ExerciseCandidate[] = exerciseRows.map((row) => ({
      id: row.id,
      key: row.key,
      movementPattern: row.movementPattern,
      equipment: asStringArray(row.equipment),
      difficulty: row.difficulty,
      restrictions: asStringArray(row.restrictions),
      preferenceTags: asStringArray(row.preferenceTags),
    }));

    const templateRows = await this.prisma.client.programmeTemplate.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      include: {
        sessions: {
          include: { exercises: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ key: 'asc' }, { version: 'desc' }],
    });

    const templates: ProgrammeTemplateCandidate[] = templateRows.map((tmpl) => {
      const eligibility =
        tmpl.eligibility && typeof tmpl.eligibility === 'object' && !Array.isArray(tmpl.eligibility)
          ? (tmpl.eligibility as Record<string, unknown>)
          : {};
      return {
        id: tmpl.id,
        key: tmpl.key,
        version: tmpl.version,
        name: tmpl.name,
        goalTags: asStringArray(tmpl.goalTags),
        preferenceTags: asStringArray(tmpl.preferenceTags),
        requiredEquipment: asStringArray(eligibility['requiredEquipment']),
        experienceLevels: asStringArray(eligibility['experienceLevels']),
        minDaysPerWeek:
          typeof eligibility['minDaysPerWeek'] === 'number' ? eligibility['minDaysPerWeek'] : 1,
        maxDaysPerWeek:
          typeof eligibility['maxDaysPerWeek'] === 'number' ? eligibility['maxDaysPerWeek'] : 7,
        maxSessionMinutes:
          typeof eligibility['maxSessionMinutes'] === 'number'
            ? eligibility['maxSessionMinutes']
            : 60,
        sessions: tmpl.sessions.map((session) => ({
          id: session.id,
          dayPattern: session.dayPattern,
          estimatedDuration: session.estimatedDuration,
          sortOrder: session.sortOrder,
          isOptional: session.isOptional,
          exercises: session.exercises
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((te) => {
              const rx =
                te.prescription &&
                typeof te.prescription === 'object' &&
                !Array.isArray(te.prescription)
                  ? (te.prescription as Record<string, unknown>)
                  : {};
              return {
                exerciseId: te.exerciseId,
                sortOrder: te.sortOrder,
                priority: rx['priority'] === 'OPTIONAL' ? ('OPTIONAL' as const) : ('CORE' as const),
                sets: typeof rx['sets'] === 'number' ? rx['sets'] : 2,
                repMin: typeof rx['repMin'] === 'number' ? rx['repMin'] : 8,
                repMax: typeof rx['repMax'] === 'number' ? rx['repMax'] : 12,
                restSeconds: typeof rx['restSeconds'] === 'number' ? rx['restSeconds'] : 60,
                estimatedMinutes:
                  typeof rx['estimatedMinutes'] === 'number' ? rx['estimatedMinutes'] : 8,
              };
            }),
        })),
      };
    });

    return { templates, exercises };
  }

  private async createPlannedSessions(
    tx: Prisma.TransactionClient,
    userId: string,
    planId: string,
    startLocalDate: string,
    timeZone: string,
    weeklySessions: NonNullable<PlanPreviewResult['candidatePlan']>['weeklySessions'],
  ) {
    const start = parseLocalDate(startLocalDate);
    const created = [];
    for (let i = 0; i < weeklySessions.length; i += 1) {
      const session = weeklySessions[i]!;
      const localDate = addDays(start, i * 2); // simple every-other-day placement for M3
      const row = await tx.plannedSession.create({
        data: {
          userId,
          planId,
          localDate: formatLocalDate(localDate),
          timeZone,
          durationBudget: session.estimatedDuration,
          prescriptionSnapshot: {
            templateSessionId: session.templateSessionId,
            dayPattern: session.dayPattern,
            exercises: session.exercises,
          } as Prisma.InputJsonValue,
          status: 'PLANNED',
          explanationCodes: ['SCHEDULED_FROM_TEMPLATE'],
        },
      });
      created.push(row);
    }
    return created;
  }

  private async getWorkoutView(sessionId: string, userId: string) {
    const session = await this.prisma.client.workoutSession.findFirst({
      where: { id: sessionId, userId },
      include: { sets: { orderBy: [{ exerciseId: 'asc' }, { setIndex: 'asc' }] } },
    });
    if (!session) {
      throw new NotFoundException({
        code: 'WORKOUT_SESSION_NOT_FOUND',
        message: 'Workout session not found',
        retryable: false,
      });
    }
    return {
      id: session.id,
      userId: session.userId,
      plannedSessionId: session.plannedSessionId,
      planVersion: session.planVersion,
      status: session.status as 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED',
      startedAt: session.startedAt.toISOString(),
      finishedAt: session.finishedAt?.toISOString() ?? null,
      actualDuration: session.actualDuration,
      version: session.version,
      sets: session.sets.map((s) => this.toWorkoutSet(s)),
    };
  }

  private toWorkoutSet(set: {
    id: string;
    exerciseId: string;
    setIndex: number;
    repetitions: number | null;
    resistanceKg: Prisma.Decimal | null;
    durationSeconds: number | null;
    effort: string | null;
    completed: boolean;
    version: number;
  }) {
    return {
      id: set.id,
      exerciseId: set.exerciseId,
      setIndex: set.setIndex,
      repetitions: set.repetitions,
      resistanceKg: set.resistanceKg === null ? null : Number(set.resistanceKg),
      durationSeconds: set.durationSeconds,
      effort: set.effort,
      completed: set.completed,
      version: set.version,
    };
  }

  private toPlannedSession(session: {
    id: string;
    planId: string;
    localDate: string;
    timeZone: string;
    durationBudget: number;
    status: string;
    shortenedFromDuration: number | null;
    explanationCodes: Prisma.JsonValue;
    prescriptionSnapshot: Prisma.JsonValue;
  }) {
    return {
      id: session.id,
      planId: session.planId,
      localDate: session.localDate,
      timeZone: session.timeZone,
      durationBudget: session.durationBudget,
      status: session.status,
      shortenedFromDuration: session.shortenedFromDuration,
      explanationCodes: asStringArray(session.explanationCodes),
      prescriptionSnapshot: session.prescriptionSnapshot,
    };
  }

  private toExerciseSummary(row: {
    id: string;
    key: string;
    name: string;
    movementPattern: string;
    equipment: Prisma.JsonValue;
    difficulty: string;
    instructions: string;
    restrictions: Prisma.JsonValue;
    adaptations: Prisma.JsonValue;
    preferenceTags: Prisma.JsonValue;
    reviewStatus: string;
    publicationStatus: string;
  }) {
    return {
      id: row.id,
      key: row.key,
      name: row.name,
      movementPattern: row.movementPattern,
      equipment: asStringArray(row.equipment),
      difficulty: row.difficulty,
      instructions: row.instructions,
      restrictions: asStringArray(row.restrictions),
      adaptations: row.adaptations === null ? null : asStringArray(row.adaptations),
      preferenceTags: row.preferenceTags === null ? null : asStringArray(row.preferenceTags),
      reviewStatus: row.reviewStatus,
      publicationStatus: row.publicationStatus,
    };
  }

  private async withIdempotency<T>(
    userId: string,
    scope: string,
    key: string | undefined,
    requestBody: unknown,
    run: () => Promise<T>,
  ): Promise<T> {
    if (!key || key.trim().length === 0) {
      throw new UnprocessableEntityException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required',
        retryable: false,
      });
    }
    const requestHash = createHash('sha256')
      .update(JSON.stringify(requestBody))
      .digest('hex');

    const existing = await this.prisma.client.idempotencyRecord.findUnique({
      where: {
        userId_scope_key: { userId, scope, key },
      },
    });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_KEY_REUSE',
          message: 'Idempotency-Key was reused with a different request body',
          retryable: false,
        });
      }
      return existing.responseBody as T;
    }

    const response = await run();
    try {
      await this.prisma.client.idempotencyRecord.create({
        data: {
          userId,
          scope,
          key,
          requestHash,
          responseBody: response as unknown as Prisma.InputJsonValue,
          statusCode: 200,
        },
      });
    } catch (error) {
      // Concurrent duplicate key — return stored response if hash matches.
      const raced = await this.prisma.client.idempotencyRecord.findUnique({
        where: { userId_scope_key: { userId, scope, key } },
      });
      if (raced && raced.requestHash === requestHash) {
        return raced.responseBody as T;
      }
      throw error;
    }
    return response;
  }
}

function asStringArray(value: Prisma.JsonValue | unknown | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((v): v is string => typeof v === 'string');
}

function parsePrescriptionExercises(snapshot: Prisma.JsonValue): PrescriptionExercise[] {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return [];
  }
  const exercises = (snapshot as Record<string, unknown>)['exercises'];
  if (!Array.isArray(exercises)) {
    return [];
  }
  const result: PrescriptionExercise[] = [];
  for (const item of exercises) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }
    const row = item as Record<string, unknown>;
    if (typeof row['exerciseId'] !== 'string') {
      continue;
    }
    result.push({
      exerciseId: row['exerciseId'],
      sortOrder: typeof row['sortOrder'] === 'number' ? row['sortOrder'] : 0,
      priority: row['priority'] === 'OPTIONAL' ? 'OPTIONAL' : 'CORE',
      sets: typeof row['sets'] === 'number' ? row['sets'] : 2,
      repMin: typeof row['repMin'] === 'number' ? row['repMin'] : 8,
      repMax: typeof row['repMax'] === 'number' ? row['repMax'] : 12,
      restSeconds: typeof row['restSeconds'] === 'number' ? row['restSeconds'] : 60,
      estimatedMinutes:
        typeof row['estimatedMinutes'] === 'number' ? row['estimatedMinutes'] : 8,
    });
  }
  return result;
}

function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map((p) => Number(p));
  return new Date(Date.UTC(y!, m! - 1, d!));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatLocalDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
