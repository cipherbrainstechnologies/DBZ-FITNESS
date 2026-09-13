import {
  BadRequestException,
  Inject,
  Injectable,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import type { SaveOnboardingStep } from '@saiyan/contracts';
import type { Prisma } from '@saiyan/database';
import {
  ONBOARDING_FIRST_STEP,
  canSaveOnboardingStep,
  evaluateAdultAgeGate,
  isOnboardingComplete,
  isOnboardingStep,
  missingStepsForComplete,
  nextIncompleteStep,
  parseCompletedSteps,
  resolveScreeningOutcome,
  withStepCompleted,
  type OnboardingStep,
  type ScreeningOutcome,
} from '@saiyan/domain';

import type { Env } from '../config/env.js';
import { ENV } from '../config/tokens.js';
import { CharacterFacade } from '../characters/character.facade.js';
import { PrismaService } from '../database/prisma.service.js';
import { ProfileFacade } from '../profiles/profile.facade.js';

export type ScreeningSummary = {
  id: string;
  outcome: ScreeningOutcome;
  restrictions: string[];
  questionnaireVersion: string;
  effectiveAt: string;
};

export type DietPreferenceSummary = {
  id: string;
  version: number;
  pattern: string;
  allergyRestrictions: string[];
  ingredientExclusions: string[];
  cuisinePreferences: string[];
  budgetPreference: string | null;
  preparationConstraints: string[];
  effectiveAt: string;
};

export type OnboardingProgressView = {
  userId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  completedAt: string | null;
  updatedAt: string;
  screeningOutcome: ScreeningOutcome | null;
  screeningRestrictions: string[] | null;
  screeningRecordId: string | null;
  hasDietPreference: boolean;
  hasCharacterSelection: boolean;
  contentMode: 'ORIGINAL' | 'DBZ_LICENSED';
};

/**
 * Owns ConsentRecord, ScreeningRecord, DietPreference, OnboardingProgress.
 * Other modules must use OnboardingFacade — not query these entities directly.
 */
@Injectable()
export class OnboardingApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfileFacade,
    @Inject(forwardRef(() => CharacterFacade))
    private readonly characters: CharacterFacade,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async getProgress(userId: string): Promise<OnboardingProgressView> {
    const progress = await this.ensureProgress(userId);
    return this.toView(userId, progress);
  }

  async getLatestScreeningSummary(userId: string): Promise<ScreeningSummary | null> {
    const row = await this.prisma.client.screeningRecord.findFirst({
      where: { userId },
      orderBy: { effectiveAt: 'desc' },
    });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      outcome: row.outcome as ScreeningOutcome,
      restrictions: asStringArray(row.restrictions),
      questionnaireVersion: row.questionnaireVersion,
      effectiveAt: row.effectiveAt.toISOString(),
    };
  }

  async getScreeningSummaryByIdForUser(
    userId: string,
    screeningRecordId: string,
  ): Promise<ScreeningSummary | null> {
    const row = await this.prisma.client.screeningRecord.findFirst({
      where: { id: screeningRecordId, userId },
    });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      outcome: row.outcome as ScreeningOutcome,
      restrictions: asStringArray(row.restrictions),
      questionnaireVersion: row.questionnaireVersion,
      effectiveAt: row.effectiveAt.toISOString(),
    };
  }

  async getLatestDietPreferenceSummary(
    userId: string,
  ): Promise<DietPreferenceSummary | null> {
    const row = await this.prisma.client.dietPreference.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
    return row ? this.toDietSummary(row) : null;
  }

  async getDietPreferenceSummaryByIdForUser(
    userId: string,
    dietPreferenceId: string,
  ): Promise<DietPreferenceSummary | null> {
    const row = await this.prisma.client.dietPreference.findFirst({
      where: { id: dietPreferenceId, userId },
    });
    return row ? this.toDietSummary(row) : null;
  }

  async saveStep(userId: string, body: SaveOnboardingStep): Promise<OnboardingProgressView> {
    const progress = await this.ensureProgress(userId);
    if (progress.completedAt) {
      throw new UnprocessableEntityException({
        code: 'ONBOARDING_ALREADY_COMPLETE',
        message: 'Onboarding is already complete',
        retryable: false,
      });
    }

    const completedSteps = parseCompletedSteps(progress.completedSteps);
    if (!canSaveOnboardingStep(body.step, completedSteps)) {
      const expected = nextIncompleteStep(completedSteps);
      throw new UnprocessableEntityException({
        code: 'ONBOARDING_STEP_OUT_OF_ORDER',
        message: expected
          ? `Expected step ${expected} next (or edit a completed step)`
          : 'No further onboarding steps available',
        retryable: false,
      });
    }

    await this.applyStepPayload(userId, body);

    const nextCompleted = withStepCompleted(completedSteps, body.step);
    const nextCurrent = nextIncompleteStep(nextCompleted) ?? body.step;
    const stepData = mergeStepData(progress.stepData, body);

    const updated = await this.prisma.client.onboardingProgress.update({
      where: { userId },
      data: {
        currentStep: nextCurrent,
        completedSteps: nextCompleted,
        stepData: stepData as Prisma.InputJsonValue,
      },
    });

    return this.toView(userId, updated);
  }

  async complete(userId: string): Promise<OnboardingProgressView> {
    const progress = await this.ensureProgress(userId);
    if (progress.completedAt) {
      return this.toView(userId, progress);
    }

    const completedSteps = parseCompletedSteps(progress.completedSteps);
    const missing = missingStepsForComplete(completedSteps);
    if (missing.length > 0) {
      throw new UnprocessableEntityException({
        code: 'ONBOARDING_INCOMPLETE',
        message: `Missing required steps: ${missing.join(', ')}`,
        fieldErrors: { completedSteps: missing },
        retryable: false,
      });
    }

    if (!isOnboardingComplete(completedSteps)) {
      throw new UnprocessableEntityException({
        code: 'ONBOARDING_INCOMPLETE',
        message: 'Onboarding requirements are not satisfied',
        retryable: false,
      });
    }

    const screening = await this.getLatestScreeningSummary(userId);
    if (!screening) {
      throw new UnprocessableEntityException({
        code: 'SCREENING_REQUIRED',
        message: 'Screening must be completed before finishing onboarding',
        retryable: false,
      });
    }

    const diet = await this.prisma.client.dietPreference.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
    if (!diet) {
      throw new UnprocessableEntityException({
        code: 'DIET_PREFERENCE_REQUIRED',
        message: 'Diet preference must be saved before finishing onboarding',
        retryable: false,
      });
    }

    const selection = await this.characters.getSelection(userId);
    if (!selection) {
      throw new UnprocessableEntityException({
        code: 'CHARACTER_SELECTION_REQUIRED',
        message: 'Character selection is required before finishing onboarding',
        retryable: false,
      });
    }

    const updated = await this.prisma.client.onboardingProgress.update({
      where: { userId },
      data: {
        completedAt: new Date(),
        currentStep: 'CONFIRM',
        completedSteps,
      },
    });

    return this.toView(userId, updated);
  }

  private async applyStepPayload(userId: string, body: SaveOnboardingStep): Promise<void> {
    switch (body.step) {
      case 'WELCOME': {
        const asOfDate =
          body.payload.asOfDate ?? new Date().toISOString().slice(0, 10);
        const age = evaluateAdultAgeGate({
          dateOfBirth: body.payload.dateOfBirth,
          asOfDate,
        });
        if (!age.eligible) {
          throw new UnprocessableEntityException({
            code: 'AGE_GATE_FAILED',
            message: 'Adult eligibility requirement not met',
            retryable: false,
          });
        }
        const now = new Date();
        await this.prisma.client.$transaction(async (tx) => {
          for (const consent of body.payload.consents) {
            await tx.consentRecord.create({
              data: {
                userId,
                purpose: consent.purpose,
                policyVersion: consent.policyVersion,
                grantedAt: now,
              },
            });
          }
        });
        return;
      }
      case 'GOALS': {
        await this.profiles.updateLatestBasics(userId, {
          goals: body.payload.goals,
        });
        return;
      }
      case 'EXPERIENCE': {
        await this.profiles.updateLatestBasics(userId, {
          experience: body.payload.experience,
        });
        return;
      }
      case 'AVAILABILITY': {
        await this.profiles.updateLatestBasics(userId, {
          weeklyAvailabilityMinutes: body.payload.weeklyAvailabilityMinutes,
          equipment: body.payload.equipment,
          accessPreferences: {
            ...(body.payload.accessPreferences ?? {}),
            availableDays: body.payload.availableDays,
            sessionDurationMinutes: body.payload.sessionDurationMinutes ?? null,
          },
        });
        return;
      }
      case 'SCREENING': {
        const resolved = resolveScreeningOutcome({
          reportsUrgentSymptoms: body.payload.reportsUrgentSymptoms,
          reportsChestPain: body.payload.reportsChestPain,
          reportsFainting: body.payload.reportsFainting,
          reportsSevereBreathingDifficulty:
            body.payload.reportsSevereBreathingDifficulty,
          reportsActiveInjuryAffectingExercise:
            body.payload.reportsActiveInjuryAffectingExercise,
          reportsClinicianRestriction: body.payload.reportsClinicianRestriction,
          requiresMovementAdaptations: body.payload.requiresMovementAdaptations,
          requiresTemporaryPause: body.payload.requiresTemporaryPause,
        });
        // Store restricted answers for compliance; never return them on GET /onboarding.
        await this.prisma.client.screeningRecord.create({
          data: {
            userId,
            questionnaireVersion: body.payload.questionnaireVersion,
            answersRestricted: {
              access: 'restricted',
              signals: {
                reportsUrgentSymptoms: body.payload.reportsUrgentSymptoms ?? false,
                reportsChestPain: body.payload.reportsChestPain ?? false,
                reportsFainting: body.payload.reportsFainting ?? false,
                reportsSevereBreathingDifficulty:
                  body.payload.reportsSevereBreathingDifficulty ?? false,
                reportsActiveInjuryAffectingExercise:
                  body.payload.reportsActiveInjuryAffectingExercise ?? false,
                reportsClinicianRestriction:
                  body.payload.reportsClinicianRestriction ?? false,
                requiresMovementAdaptations:
                  body.payload.requiresMovementAdaptations ?? false,
                requiresTemporaryPause: body.payload.requiresTemporaryPause ?? false,
              },
            },
            outcome: resolved.outcome,
            restrictions: resolved.restrictions,
          },
        });
        return;
      }
      case 'DIET': {
        const latest = await this.prisma.client.dietPreference.findFirst({
          where: { userId },
          orderBy: { version: 'desc' },
        });
        const version = (latest?.version ?? 0) + 1;
        await this.prisma.client.dietPreference.create({
          data: {
            userId,
            version,
            pattern: body.payload.pattern,
            ingredientExclusions: body.payload.ingredientExclusions ?? [],
            allergyRestrictions: body.payload.allergyRestrictions ?? [],
            cuisinePreferences: body.payload.cuisinePreferences ?? [],
            budgetPreference: body.payload.budgetPreference ?? null,
            preparationConstraints: body.payload.preparationConstraints ?? [],
          },
        });
        return;
      }
      case 'MEASUREMENTS': {
        // Optional; stored as non-sensitive resume hint only. No fabricated nutrition values.
        return;
      }
      case 'CHARACTER': {
        await this.characters.selectPresentation(userId, body.payload.presentationId);
        return;
      }
      case 'NOTIFICATIONS':
      case 'PLAN_PREVIEW':
      case 'CONFIRM':
        return;
      default: {
        const _exhaustive: never = body;
        throw new BadRequestException({
          code: 'UNKNOWN_ONBOARDING_STEP',
          message: `Unsupported step: ${JSON.stringify(_exhaustive)}`,
          retryable: false,
        });
      }
    }
  }

  private async ensureProgress(userId: string) {
    const existing = await this.prisma.client.onboardingProgress.findUnique({
      where: { userId },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.client.onboardingProgress.create({
      data: {
        userId,
        currentStep: ONBOARDING_FIRST_STEP,
        completedSteps: [],
        stepData: {},
      },
    });
  }

  private async toView(
    userId: string,
    progress: {
      currentStep: string;
      completedSteps: Prisma.JsonValue;
      completedAt: Date | null;
      updatedAt: Date;
    },
  ): Promise<OnboardingProgressView> {
    const completedSteps = parseCompletedSteps(progress.completedSteps);
    const currentStep: OnboardingStep = isOnboardingStep(progress.currentStep)
      ? progress.currentStep
      : (nextIncompleteStep(completedSteps) ?? ONBOARDING_FIRST_STEP);

    const [screening, diet, selection] = await Promise.all([
      this.getLatestScreeningSummary(userId),
      this.prisma.client.dietPreference.findFirst({
        where: { userId },
        orderBy: { version: 'desc' },
        select: { id: true },
      }),
      this.characters.getSelection(userId),
    ]);

    return {
      userId,
      currentStep,
      completedSteps,
      completedAt: progress.completedAt?.toISOString() ?? null,
      updatedAt: progress.updatedAt.toISOString(),
      screeningOutcome: screening?.outcome ?? null,
      screeningRestrictions: screening?.restrictions ?? null,
      screeningRecordId: screening?.id ?? null,
      hasDietPreference: Boolean(diet),
      hasCharacterSelection: Boolean(selection),
      contentMode: this.env.CONTENT_MODE,
    };
  }

  private toDietSummary(row: {
    id: string;
    version: number;
    pattern: string;
    allergyRestrictions: Prisma.JsonValue | null;
    ingredientExclusions: Prisma.JsonValue | null;
    cuisinePreferences: Prisma.JsonValue | null;
    budgetPreference: string | null;
    preparationConstraints: Prisma.JsonValue | null;
    effectiveAt: Date;
  }): DietPreferenceSummary {
    return {
      id: row.id,
      version: row.version,
      pattern: row.pattern,
      allergyRestrictions: asStringArray(row.allergyRestrictions),
      ingredientExclusions: asStringArray(row.ingredientExclusions),
      cuisinePreferences: asStringArray(row.cuisinePreferences),
      budgetPreference: row.budgetPreference,
      preparationConstraints: asStringArray(row.preparationConstraints),
      effectiveAt: row.effectiveAt.toISOString(),
    };
  }
}

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function mergeStepData(
  existing: Prisma.JsonValue | null | undefined,
  body: SaveOnboardingStep,
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  switch (body.step) {
    case 'WELCOME':
      base['WELCOME'] = { adultEligible: true };
      break;
    case 'GOALS':
      base['GOALS'] = { goals: body.payload.goals };
      break;
    case 'EXPERIENCE':
      base['EXPERIENCE'] = { experience: body.payload.experience };
      break;
    case 'AVAILABILITY':
      base['AVAILABILITY'] = {
        weeklyAvailabilityMinutes: body.payload.weeklyAvailabilityMinutes,
        availableDays: body.payload.availableDays,
      };
      break;
    case 'SCREENING':
      // Do not mirror restricted answers into resume JSON.
      base['SCREENING'] = { recorded: true };
      break;
    case 'DIET':
      base['DIET'] = { pattern: body.payload.pattern };
      break;
    case 'MEASUREMENTS':
      base['MEASUREMENTS'] = {
        skip: body.payload.skip ?? false,
        nutritionCalculationPreference:
          body.payload.nutritionCalculationPreference ?? null,
        hasHeight: body.payload.heightCm !== undefined,
        hasWeight: body.payload.weightKg !== undefined,
      };
      break;
    case 'CHARACTER':
      base['CHARACTER'] = { presentationId: body.payload.presentationId };
      break;
    case 'NOTIFICATIONS':
      base['NOTIFICATIONS'] = {
        enablePush: body.payload.enablePush,
        enableEmail: body.payload.enableEmail ?? false,
      };
      break;
    case 'PLAN_PREVIEW':
      base['PLAN_PREVIEW'] = { acknowledgedExplanation: true };
      break;
    case 'CONFIRM':
      base['CONFIRM'] = { confirm: true };
      break;
  }

  return base;
}
