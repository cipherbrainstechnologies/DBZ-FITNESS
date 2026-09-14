import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  ConfirmCoachActionResponse,
  PostCoachMessageRequest,
  PostCoachMessageResponse,
  RejectCoachActionResponse,
  UpsertCoachMemoryRequest,
} from '@saiyan/contracts';
import {
  composeCoachBriefing,
  evaluateCoachProposalSafety,
  getCoachPersona,
  localDateInTimeZone,
  normalizeCoachingTone,
  type CoachBriefingSituation,
  type CoachScreeningOutcome,
} from '@saiyan/domain';
import {
  FixtureCoachProvider,
  type CoachProvider,
  type CoachStructuredResponse,
} from '@saiyan/providers';
import type { Prisma } from '@saiyan/database';

import type { Env } from '../config/env.js';
import { ENV } from '../config/tokens.js';
import { CharacterFacade } from '../characters/character.facade.js';
import { PrismaService } from '../database/prisma.service.js';
import { NutritionFacade } from '../nutrition/nutrition.facade.js';
import { OnboardingFacade } from '../onboarding/onboarding.facade.js';
import { ProfileFacade } from '../profiles/profile.facade.js';
import { TrainingFacade } from '../training/training.facade.js';

const PROPOSAL_TTL_MS = 30 * 60 * 1000;

/**
 * Owns CoachConversation / CoachMessage / CoachActionProposal.
 * Uses FixtureCoachProvider unless COACH_PROVIDER=openai is configured with a key.
 */
@Injectable()
export class CoachingApplicationService {
  private readonly coach: CoachProvider;
  private readonly providerNote: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly onboarding: OnboardingFacade,
    private readonly characters: CharacterFacade,
    private readonly profiles: ProfileFacade,
    private readonly training: TrainingFacade,
    private readonly nutrition: NutritionFacade,
    @Inject(ENV) private readonly env: Env,
  ) {
    const resolved = resolveCoachProvider(this.env);
    this.coach = resolved.provider;
    this.providerNote = resolved.note;
  }

  async postMessage(
    userId: string,
    body: PostCoachMessageRequest,
  ): Promise<PostCoachMessageResponse> {
    const screening = await this.onboarding.getLatestScreeningSummary(userId);
    const diet = await this.onboarding.getLatestDietPreferenceSummary(userId);
    const selection = await this.characters.getSelection(userId);
    const runtime = await this.loadRuntimeHints(userId, 'UTC');

    const conversation = body.conversationId
      ? await this.requireConversation(userId, body.conversationId)
      : await this.prisma.client.coachConversation.create({
          data: { userId },
        });

    const approvedContent = await this.loadApprovedContent(selection?.presentation.archetypeKey);

    const structured = await this.coach.complete({
      memberMessage: body.message,
      approvedContent,
      context: {
        screeningOutcome: screening?.outcome ?? null,
        allergies: diet?.allergyRestrictions ?? [],
        dietaryPattern: diet?.pattern ?? null,
        tone: body.tone ?? selection?.coachingTone ?? null,
        personaKey: selection?.presentation.personaKey ?? null,
        coachDisplayName: selection?.presentation.approvedName ?? null,
        coachingTone: selection?.coachingTone ?? body.tone ?? null,
        hasEligibleShortSession: runtime.hasEligibleShortSession,
        hasPlannedSession: runtime.hasPlannedSession,
        hasEligibleMealSwap: runtime.hasEligibleMealSwap,
        plannedSessionId: runtime.plannedSessionId,
      },
    });

    const now = new Date();
    const result = await this.prisma.client.$transaction(async (tx) => {
      await tx.coachMessage.create({
        data: {
          conversationId: conversation.id,
          userId,
          role: 'USER',
          messageText: body.message,
        },
      });

      const assistant = await tx.coachMessage.create({
        data: {
          conversationId: conversation.id,
          userId,
          role: 'ASSISTANT',
          messageText: structured.messageText,
          structuredResponse: structured as object,
          providerMode: structured.providerMode,
          safetyStatus: structured.safetyStatus,
        },
      });

      let proposalRecord = null;
      if (structured.proposedAction && structured.safetyStatus === 'SAFE') {
        const safety = evaluateCoachProposalSafety({
          actionType: structured.proposedAction.actionType,
          payload: structured.proposedAction.payload,
          screeningOutcome: (screening?.outcome as CoachScreeningOutcome | null) ?? null,
          allergies: diet?.allergyRestrictions ?? [],
          dietaryPattern: diet?.pattern ?? null,
        });

        if (safety.allowed) {
          proposalRecord = await tx.coachActionProposal.create({
            data: {
              userId,
              conversationId: conversation.id,
              messageId: assistant.id,
              actionType: structured.proposedAction.actionType,
              validatedPayload: structured.proposedAction.payload as Prisma.InputJsonValue,
              sourceVersions: {
                screeningOutcome: screening?.outcome ?? null,
                dietPreferenceId: diet?.id ?? null,
              } as Prisma.InputJsonValue,
              status: 'PENDING',
              safetyStatus: 'SAFE',
              expiresAt: new Date(now.getTime() + PROPOSAL_TTL_MS),
            },
          });
        } else {
          proposalRecord = await tx.coachActionProposal.create({
            data: {
              userId,
              conversationId: conversation.id,
              messageId: assistant.id,
              actionType: structured.proposedAction.actionType,
              validatedPayload: structured.proposedAction.payload as Prisma.InputJsonValue,
              sourceVersions: {
                screeningOutcome: screening?.outcome ?? null,
              } as Prisma.InputJsonValue,
              status: 'FAILED_SAFETY',
              safetyStatus: 'REFUSED',
              rejectionReason: safety.reasons.join(','),
              expiresAt: new Date(now.getTime() + PROPOSAL_TTL_MS),
            },
          });
        }
      }

      return { assistant, proposalRecord };
    });

    const response = sanitizeStructured(structured);

    return {
      conversationId: conversation.id,
      messageId: result.assistant.id,
      response,
      proposal:
        result.proposalRecord && result.proposalRecord.status === 'PENDING'
          ? mapProposal(result.proposalRecord)
          : null,
      note: this.providerNote,
    };
  }

  async confirmProposal(
    userId: string,
    proposalId: string,
    idempotencyKey: string | undefined,
  ): Promise<ConfirmCoachActionResponse> {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required',
        retryable: false,
      });
    }

    const proposal = await this.prisma.client.coachActionProposal.findFirst({
      where: { id: proposalId, userId },
    });
    if (!proposal) {
      throw new NotFoundException({
        code: 'PROPOSAL_NOT_FOUND',
        message: 'Coach action proposal not found',
        retryable: false,
      });
    }

    if (proposal.status === 'CONFIRMED') {
      return {
        proposal: mapProposal(proposal),
        applied: true,
        note: 'Proposal already confirmed (idempotent).',
      };
    }

    if (proposal.status !== 'PENDING') {
      throw new UnprocessableEntityException({
        code: 'PROPOSAL_NOT_PENDING',
        message: `Proposal status is ${proposal.status}`,
        retryable: false,
      });
    }

    if (proposal.expiresAt.getTime() <= Date.now()) {
      await this.prisma.client.coachActionProposal.update({
        where: { id: proposal.id },
        data: { status: 'EXPIRED' },
      });
      throw new UnprocessableEntityException({
        code: 'PROPOSAL_EXPIRED',
        message: 'Proposal expired; request a new coach suggestion',
        retryable: false,
      });
    }

    const screening = await this.onboarding.getLatestScreeningSummary(userId);
    const diet = await this.onboarding.getLatestDietPreferenceSummary(userId);
    const payload =
      proposal.validatedPayload &&
      typeof proposal.validatedPayload === 'object' &&
      !Array.isArray(proposal.validatedPayload)
        ? (proposal.validatedPayload as Record<string, unknown>)
        : {};

    const safety = evaluateCoachProposalSafety({
      actionType: proposal.actionType,
      payload,
      screeningOutcome: (screening?.outcome as CoachScreeningOutcome | null) ?? null,
      allergies: diet?.allergyRestrictions ?? [],
      dietaryPattern: diet?.pattern ?? null,
    });

    if (!safety.allowed) {
      await this.prisma.client.coachActionProposal.update({
        where: { id: proposal.id },
        data: {
          status: 'FAILED_SAFETY',
          safetyStatus: 'REFUSED',
          rejectionReason: safety.reasons.join(','),
        },
      });
      throw new ForbiddenException({
        code: 'COACH_PROPOSAL_UNSAFE',
        message: 'Proposal rejected by screening/diet hard rules',
        retryable: false,
        details: { reasons: safety.reasons },
      });
    }

    // Apply only after member confirmation. Informational actions stay unapplied.
    let applied = false;
    let note = `Proposal confirmed. idempotencyKey=${idempotencyKey.trim()}`;

    try {
      const appliedResult = await this.applyConfirmedAction(userId, proposal.actionType, payload);
      applied = appliedResult.applied;
      note = appliedResult.note;
    } catch (error) {
      await this.prisma.client.coachActionProposal.update({
        where: { id: proposal.id },
        data: {
          status: 'FAILED_SAFETY',
          safetyStatus: 'REFUSED',
          rejectionReason: error instanceof Error ? error.message : 'APPLY_FAILED',
        },
      });
      throw error;
    }

    const updated = await this.prisma.client.coachActionProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    return {
      proposal: mapProposal(updated),
      applied,
      note,
    };
  }

  async rejectProposal(
    userId: string,
    proposalId: string,
  ): Promise<RejectCoachActionResponse> {
    const proposal = await this.prisma.client.coachActionProposal.findFirst({
      where: { id: proposalId, userId },
    });
    if (!proposal) {
      throw new NotFoundException({
        code: 'PROPOSAL_NOT_FOUND',
        message: 'Coach action proposal not found',
        retryable: false,
      });
    }

    if (proposal.status === 'REJECTED') {
      return {
        proposal: mapProposal(proposal),
        note: 'Proposal already rejected.',
      };
    }

    if (proposal.status !== 'PENDING') {
      throw new UnprocessableEntityException({
        code: 'PROPOSAL_NOT_PENDING',
        message: `Proposal status is ${proposal.status}`,
        retryable: false,
      });
    }

    const updated = await this.prisma.client.coachActionProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    });

    return {
      proposal: mapProposal(updated),
      note: 'Proposal rejected by member.',
    };
  }

  async getContext(userId: string, timeZone: string) {
    const [selection, profile, screening, diet, plan, meals] = await Promise.all([
      this.characters.getSelection(userId),
      this.profiles.getLatestSummary(userId),
      this.onboarding.getLatestScreeningSummary(userId),
      this.onboarding.getLatestDietPreferenceSummary(userId),
      this.training.getCurrentPlan(userId),
      this.nutrition.getCurrentMealPlan(userId),
    ]);
    const runtime = await this.loadRuntimeHints(userId, timeZone);
    const unknownInputs: string[] = [];
    if (!profile?.goals?.length) unknownInputs.push('goals');
    if (!profile?.equipment) unknownInputs.push('equipment');
    if (!diet) unknownInputs.push('diet');
    if (!screening) unknownInputs.push('screening');

    return {
      persona: selection ? toPersonaView(selection) : null,
      primaryGoals: profile?.goals ?? [],
      experience: profile?.experience ?? null,
      equipment: profile?.equipment ?? [],
      availableMinutes: profile?.sessionDurationMinutes ?? profile?.weeklyAvailabilityMinutes ?? null,
      foodPattern: diet?.pattern ?? null,
      allergies: diet?.allergyRestrictions ?? [],
      ingredientExclusions: diet?.ingredientExclusions ?? [],
      screeningOutcome: screening?.outcome ?? null,
      screeningRestrictions: screening?.restrictions ?? [],
      timeZone,
      notificationConsent: null,
      dataFreshness: {
        hasPlan: Boolean(plan.plan),
        hasMealPlan: Boolean(meals.plan),
        hasRecentWorkoutLog: runtime.hasRecentWorkoutLog,
        hasRecentMealLog: runtime.hasRecentMealLog,
        unknownInputs,
      },
    };
  }

  async getBriefing(userId: string, timeZone: string) {
    const selection = await this.characters.getSelection(userId);
    if (!selection) {
      throw new UnprocessableEntityException({
        code: 'CHARACTER_SELECTION_REQUIRED',
        message: 'Choose a coach before viewing Today.',
        retryable: false,
      });
    }
    const runtime = await this.loadRuntimeHints(userId, timeZone);
    let situation: CoachBriefingSituation = 'NO_PLAN';
    if (runtime.hasPlan && runtime.hasPlannedSession) {
      situation = 'SESSION_READY';
    } else if (runtime.hasPlan) {
      situation = 'REST_DAY';
    }
    const busy = await this.prisma.client.coachingMemoryEntry.findUnique({
      where: { userId_key: { userId, key: 'busy_day' } },
    });
    if (busy && Date.now() - busy.occurredAt.getTime() < 18 * 60 * 60 * 1000) {
      situation = 'BUSY_DAY';
    }

    const composed = composeCoachBriefing({
      archetypeKey: selection.presentation.archetypeKey,
      displayName: selection.presentation.approvedName,
      coachingTone: selection.coachingTone,
      situation,
      sessionMinutes: runtime.sessionMinutes,
      hasEligibleShortSession: runtime.hasEligibleShortSession,
      hasPlannedSession: runtime.hasPlannedSession,
      hasEligibleMealSwap: runtime.hasEligibleMealSwap,
    });

    const href = hrefForAction(composed.action?.actionType ?? 'LOG_CHECK_IN', runtime.plannedSessionId);
    return {
      persona: toPersonaView(selection),
      messageText: composed.messageText,
      situation,
      action: composed.action
        ? {
            actionType: composed.action.actionType,
            label: composed.action.label,
            href,
            appliedClaim: false as const,
            payload: {
              ...(runtime.plannedSessionId ? { plannedSessionId: runtime.plannedSessionId } : {}),
            },
          }
        : null,
      limitations: composed.limitations,
      providerMode: 'fixture' as const,
    };
  }

  async listMemory(userId: string) {
    const rows = await this.prisma.client.coachingMemoryEntry.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    });
    return {
      entries: rows.map((row) => ({
        id: row.id,
        key: row.key,
        valueText: row.valueText,
        sourceRef: row.sourceRef,
        occurredAt: row.occurredAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  async upsertMemory(userId: string, body: UpsertCoachMemoryRequest) {
    const row = await this.prisma.client.coachingMemoryEntry.upsert({
      where: { userId_key: { userId, key: body.key } },
      create: {
        userId,
        key: body.key,
        valueText: body.valueText,
        sourceRef: body.sourceRef ?? null,
      },
      update: {
        valueText: body.valueText,
        sourceRef: body.sourceRef ?? null,
        occurredAt: new Date(),
      },
    });
    return {
      id: row.id,
      key: row.key,
      valueText: row.valueText,
      sourceRef: row.sourceRef,
      occurredAt: row.occurredAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async deleteMemory(userId: string, id: string) {
    const existing = await this.prisma.client.coachingMemoryEntry.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'COACHING_MEMORY_NOT_FOUND',
        message: 'Coaching memory entry not found',
        retryable: false,
      });
    }
    await this.prisma.client.coachingMemoryEntry.delete({ where: { id } });
    return { ok: true as const };
  }

  private async applyConfirmedAction(
    userId: string,
    actionType: string,
    payload: Record<string, unknown>,
  ): Promise<{ applied: boolean; note: string }> {
    const plannedSessionId =
      typeof payload.plannedSessionId === 'string' ? payload.plannedSessionId : null;

    if (actionType === 'START_WORKOUT') {
      if (!plannedSessionId) {
        return { applied: false, note: 'Start workout needs a planned session. Open Train to choose one.' };
      }
      await this.training.startWorkout(userId, { plannedSessionId });
      return { applied: true, note: 'Workout session started.' };
    }

    if (actionType === 'PREVIEW_SHORTER_SESSION' || actionType === 'SELECT_SHORT_SESSION') {
      if (!plannedSessionId) {
        return {
          applied: false,
          note: 'We can shorten a session once an eligible planned session is selected in Train.',
        };
      }
      const minutes =
        typeof payload.maxMinutes === 'number'
          ? payload.maxMinutes
          : typeof payload.targetDurationMinutes === 'number'
            ? payload.targetDurationMinutes
            : 15;
      await this.training.shortenPlannedSession(userId, plannedSessionId, {
        targetDurationMinutes: Math.max(10, Math.min(180, Math.round(minutes))),
      });
      return { applied: true, note: 'The planned session was shortened.' };
    }

    if (actionType === 'LOG_CHECK_IN') {
      await this.upsertMemory(userId, {
        key: 'check_in',
        valueText:
          typeof payload.note === 'string' && payload.note.trim()
            ? payload.note.trim()
            : 'Checked in',
        sourceRef: 'coach-action',
      });
      return { applied: true, note: 'Check-in saved.' };
    }

    if (actionType === 'PREVIEW_MEAL_SWAP' || actionType === 'SWAP_MEAL') {
      return {
        applied: false,
        note: 'We can preview an eligible meal swap on Fuel. No meal was changed yet.',
      };
    }

    if (actionType === 'RESCHEDULE_SESSION') {
      return {
        applied: false,
        note: 'We can move your workout from Train. No session was moved yet.',
      };
    }

    if (actionType === 'REVIEW_WEEK' || actionType === 'PROPOSE_FUTURE_PLAN_ADJUSTMENT' || actionType === 'UPDATE_NEXT_WEEK_AVAILABILITY') {
      return {
        applied: false,
        note: 'This is a proposal for you to confirm in Progress or Train. Nothing was changed yet.',
      };
    }

    return { applied: false, note: 'No plan change was applied.' };
  }

  private async loadRuntimeHints(userId: string, timeZone: string) {
    const localDate = localDateInTimeZone(timeZone || 'UTC', new Date());
    const [plan, sessions, meals] = await Promise.all([
      this.training.getCurrentPlan(userId),
      this.training.listPlannedSessions(userId),
      this.nutrition.getCurrentMealPlan(userId),
    ]);
    const today = sessions.sessions.find((session) => session.localDate === localDate);
    const hasEligibleShortSession = Boolean(
      today &&
        (today.status === 'PLANNED' || today.status === 'SHORTENED') &&
        today.durationBudget > 10,
    );
    return {
      hasPlan: Boolean(plan.plan),
      hasPlannedSession: Boolean(today),
      plannedSessionId: today?.id ?? null,
      sessionMinutes: today?.durationBudget ?? null,
      hasEligibleShortSession,
      hasEligibleMealSwap: Boolean(meals.plan),
      hasRecentWorkoutLog: today?.status === 'IN_PROGRESS' || today?.status === 'COMPLETED',
      hasRecentMealLog: false,
    };
  }

  private async requireConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.client.coachConversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new NotFoundException({
        code: 'CONVERSATION_NOT_FOUND',
        message: 'Coach conversation not found',
        retryable: false,
      });
    }
    return conversation;
  }

  private async loadApprovedContent(archetypeKey?: string) {
    const persona = getCoachPersona(archetypeKey);
    const quotes = await this.prisma.client.quote.findMany({
      where: {
        kind: 'ORIGINAL_COPY',
        publicationStatus: 'PUBLISHED',
      },
      take: 12,
      orderBy: { createdAt: 'asc' },
      select: { text: true },
    });

    const exercises = await this.prisma.client.exercise.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      take: 20,
      select: { id: true },
    });

    const recipes = await this.prisma.client.recipe.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      take: 20,
      select: { id: true },
    });

    const motivationalLines = [
      persona.busyDayLine,
      persona.sessionReadyLine,
      persona.missedLogLine,
      persona.mealLine,
      persona.fallbackLine,
      ...quotes.map((q) => q.text),
    ];

    return {
      motivationalLines,
      exerciseIds: exercises.map((e) => e.id),
      recipeIds: recipes.map((r) => r.id),
    };
  }
}

function resolveCoachProvider(env: Env): { provider: CoachProvider; note: string } {
  if (env.COACH_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
    // OpenAI adapter not implemented in this thin slice — fall back honestly.
    return {
      provider: new FixtureCoachProvider(),
      note: 'COACH_PROVIDER=openai requested but OpenAI adapter is PENDING (DEP-M8-001); using FixtureCoachProvider. No fabricated clinical advice.',
    };
  }
  if (env.COACH_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
    return {
      provider: new FixtureCoachProvider(),
      note: 'COACH_PROVIDER=openai without OPENAI_API_KEY — using FixtureCoachProvider. Configure key out of band (DEP-M8-001).',
    };
  }
  return {
    provider: new FixtureCoachProvider(),
    note: 'FixtureCoachProvider — approved content only; inventsNutritionNumbers=false; OpenAI PENDING.',
  };
}

function sanitizeStructured(structured: CoachStructuredResponse) {
  return {
    messageText: structured.messageText,
    tone: structured.tone,
    referencedExerciseIds: structured.referencedExerciseIds,
    referencedRecipeIds: structured.referencedRecipeIds,
    referencedPlanVersion: structured.referencedPlanVersion,
    proposedAction: structured.proposedAction,
    safetyStatus: structured.safetyStatus,
    limitations: structured.limitations,
    providerMode: structured.providerMode,
    inventsNutritionNumbers: false as const,
  };
}

function mapProposal(row: {
  id: string;
  actionType: string;
  status: string;
  validatedPayload: unknown;
  safetyStatus: string;
  expiresAt: Date;
  rejectionReason: string | null;
  createdAt: Date;
}) {
  const payload =
    row.validatedPayload &&
    typeof row.validatedPayload === 'object' &&
    !Array.isArray(row.validatedPayload)
      ? (row.validatedPayload as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    actionType: row.actionType as
      | 'START_WORKOUT'
      | 'PREVIEW_SHORTER_SESSION'
      | 'SELECT_SHORT_SESSION'
      | 'RESCHEDULE_SESSION'
      | 'PREVIEW_MEAL_SWAP'
      | 'SWAP_MEAL'
      | 'LOG_CHECK_IN'
      | 'REVIEW_WEEK'
      | 'PROPOSE_FUTURE_PLAN_ADJUSTMENT'
      | 'UPDATE_NEXT_WEEK_AVAILABILITY',
    status: row.status as
      | 'PENDING'
      | 'CONFIRMED'
      | 'REJECTED'
      | 'EXPIRED'
      | 'FAILED_SAFETY',
    validatedPayload: payload,
    safetyStatus: row.safetyStatus as 'SAFE' | 'REFUSED' | 'FALLBACK',
    expiresAt: row.expiresAt.toISOString(),
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
  };
}

function toPersonaView(selection: {
  presentationId: string;
  personaVersion: number;
  coachingTone: 'GENTLE' | 'BALANCED' | 'DIRECT' | null;
  presentation: {
    archetypeKey: string;
    personaKey: string;
    approvedName: string;
    artworkUrl: string | null;
    mediaFallback: boolean;
  };
}) {
  return {
    presentationId: selection.presentationId,
    archetypeKey: selection.presentation.archetypeKey,
    personaKey: selection.presentation.personaKey,
    displayName: selection.presentation.approvedName,
    personaVersion: selection.personaVersion,
    coachingTone: normalizeCoachingTone(selection.coachingTone),
    artworkUrl: selection.presentation.artworkUrl,
    mediaFallback: selection.presentation.mediaFallback,
  };
}

function hrefForAction(actionType: string, plannedSessionId: string | null): string {
  switch (actionType) {
    case 'START_WORKOUT':
      return plannedSessionId ? `/app/train/session/${plannedSessionId}` : '/app/train';
    case 'PREVIEW_SHORTER_SESSION':
    case 'SELECT_SHORT_SESSION':
    case 'RESCHEDULE_SESSION':
      return '/app/train';
    case 'PREVIEW_MEAL_SWAP':
    case 'SWAP_MEAL':
      return '/app/fuel';
    case 'REVIEW_WEEK':
    case 'PROPOSE_FUTURE_PLAN_ADJUSTMENT':
      return '/app/progress';
    default:
      return '/app';
  }
}
