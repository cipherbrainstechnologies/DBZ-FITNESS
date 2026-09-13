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
} from '@saiyan/contracts';
import {
  evaluateCoachProposalSafety,
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
import { PrismaService } from '../database/prisma.service.js';
import { OnboardingFacade } from '../onboarding/onboarding.facade.js';

const PROPOSAL_TTL_MS = 30 * 60 * 1000;
const DEFAULT_MOTIVATIONAL = [
  "Let's make today's session fit the time you have.",
  'Choose your session. Follow the plan. Record the work.',
  'A demanding week can still include a manageable routine.',
  'Rest and consistency both move you forward.',
] as const;

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

    const conversation = body.conversationId
      ? await this.requireConversation(userId, body.conversationId)
      : await this.prisma.client.coachConversation.create({
          data: { userId },
        });

    const approvedContent = await this.loadApprovedContent();

    const structured = await this.coach.complete({
      memberMessage: body.message,
      approvedContent,
      context: {
        screeningOutcome: screening?.outcome ?? null,
        allergies: diet?.allergyRestrictions ?? [],
        dietaryPattern: diet?.pattern ?? null,
        tone: body.tone ?? null,
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

    // Thin slice: confirm records intent only — does not silently mutate plans.
    const updated = await this.prisma.client.coachActionProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    return {
      proposal: mapProposal(updated),
      applied: false,
      note: `Proposal confirmed for member follow-up. Plan mutations remain in Training/Nutrition façades. idempotencyKey=${idempotencyKey.trim()}`,
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

  private async loadApprovedContent() {
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

    const motivationalLines =
      quotes.length > 0
        ? quotes.map((q) => q.text)
        : [...DEFAULT_MOTIVATIONAL];

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
      | 'RESCHEDULE_SESSION'
      | 'SELECT_SHORT_SESSION'
      | 'SWAP_MEAL'
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
