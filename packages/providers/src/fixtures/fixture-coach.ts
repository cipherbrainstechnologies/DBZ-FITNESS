import type {
  CoachApprovedContent,
  CoachMemberContext,
  CoachMessageRequest,
  CoachProvider,
  CoachStructuredResponse,
} from '../coach.js';

const DEFAULT_APPROVED: CoachApprovedContent = {
  motivationalLines: [
    "Let's make today's session fit the time you have.",
    'Choose your session. Follow the plan. Record the work.',
    'A demanding week can still include a manageable routine.',
    'Rest and consistency both move you forward.',
  ],
  exerciseIds: [],
  recipeIds: [],
};

function pickTone(context?: CoachMemberContext): string {
  const tone = context?.coachingTone?.trim() || context?.tone?.trim();
  if (tone && tone.length > 0) return tone;
  return 'BALANCED';
}

function lower(text: string): string {
  return text.toLowerCase();
}

function containsAny(text: string, needles: readonly string[]): boolean {
  const hay = lower(text);
  return needles.some((n) => hay.includes(n));
}

function personaLine(context: CoachMemberContext | undefined, approved: CoachApprovedContent): string {
  const named = context?.coachDisplayName
    ? approved.motivationalLines.find((line) => line.length > 0)
    : null;
  return named ?? approved.motivationalLines[0] ?? FALLBACK_MESSAGE;
}

const FALLBACK_MESSAGE =
  'I can help explain your existing plan, suggest a shorter approved session, or find eligible recipes. I cannot invent nutrition numbers, override screening, or remove allergies.';

/**
 * Fixture coach — structured safe responses from approved content only.
 * Does not call external models. Never invents food nutrition numbers or
 * clinical advice.
 */
export class FixtureCoachProvider implements CoachProvider {
  readonly kind = 'coach' as const;
  readonly mode = 'fixture' as const;
  readonly label = 'fixture' as const;

  async complete(request: CoachMessageRequest): Promise<CoachStructuredResponse> {
    const approved = request.approvedContent ?? DEFAULT_APPROVED;
    const tone = pickTone(request.context);
    const message = request.memberMessage.trim();
    const limitations: string[] = [
      'FIXTURE_PROVIDER',
      'NO_CLINICAL_ADVICE',
      'NO_INVENTED_NUTRITION_NUMBERS',
      'NO_AUTHENTIC_CHARACTER_QUOTATIONS',
    ];

    if (!message) {
      return this.safe({
        messageText: FALLBACK_MESSAGE,
        tone,
        safetyStatus: 'FALLBACK',
        limitations: [...limitations, 'EMPTY_MEMBER_MESSAGE'],
        approved,
      });
    }

    // Starve / extreme restriction — refuse without inventing calorie targets.
    if (
      containsAny(message, [
        'starve',
        'starvation',
        'zero calorie',
        '0 calorie',
        'fast until',
        'eat nothing',
        'crash diet',
      ])
    ) {
      return this.safe({
        messageText:
          'I will not help with starvation or extreme restriction plans. Sustainable eating habits and your approved meal options stay within product safety rules.',
        tone,
        safetyStatus: 'REFUSED',
        limitations: [...limitations, 'REFUSED_STARVATION_REQUEST'],
        approved,
      });
    }

    // Clinical / diagnostic requests.
    if (
      containsAny(message, [
        'diagnose',
        'prescription',
        'prescribe',
        'medication',
        'what disease',
        'am i sick',
      ])
    ) {
      return this.safe({
        messageText:
          'I am not a clinician and cannot diagnose conditions or prescribe medication. Use your in-app plan tools, and seek qualified care for medical questions.',
        tone,
        safetyStatus: 'REFUSED',
        limitations: [...limitations, 'REFUSED_CLINICAL_REQUEST'],
        approved,
      });
    }

    // Pain / increase despite warnings.
    if (
      containsAny(message, ['ignore pain', 'train through pain', 'push through injury']) ||
      (containsAny(message, ['pain']) &&
        containsAny(message, ['harder', 'increase', 'ignore', 'anyway']))
    ) {
      return this.safe({
        messageText:
          'Pain is a stop signal in this product. I will not suggest increasing exercise despite pain warnings. Choose a shorter approved session or rest if you need recovery.',
        tone,
        safetyStatus: 'REFUSED',
        limitations: [...limitations, 'REFUSED_PAIN_OVERRIDE'],
        approved,
        proposedAction:
          approved.exerciseIds.length > 0
            ? {
                actionType: 'PREVIEW_SHORTER_SESSION',
                payload: { reason: 'pain_safe_shorten' },
              }
            : null,
      });
    }

    // Invented nutrition number requests — refuse; never fabricate macros.
    if (
      containsAny(message, [
        'exact calories',
        'invent macros',
        'make up nutrition',
        'guess protein grams',
        'how many calories in',
      ])
    ) {
      return this.safe({
        messageText:
          'I only reference catalogue nutrition when it already exists on approved foods or recipes. I will not invent calorie or macro numbers.',
        tone,
        safetyStatus: 'REFUSED',
        limitations: [...limitations, 'REFUSED_INVENTED_NUTRITION'],
        approved,
      });
    }

    // Remove allergy / bypass diet.
    if (
      containsAny(message, [
        'remove allergy',
        'ignore allergy',
        'bypass allergy',
        'remove allergen',
        'ignore my diet',
        'override diet',
      ])
    ) {
      return this.safe({
        messageText:
          'Allergies and diet-pattern hard rules cannot be removed by the coach. Eligible recipes must still pass those filters.',
        tone,
        safetyStatus: 'REFUSED',
        limitations: [...limitations, 'REFUSED_DIET_HARD_RULE_BYPASS'],
        approved,
      });
    }

    // Override screening.
    if (
      containsAny(message, [
        'override screening',
        'ignore screening',
        'bypass screening',
        'clear my restrictions',
        'remove training pause',
      ])
    ) {
      return this.safe({
        messageText:
          'Screening outcomes and restrictions stay authoritative. Character tone and coach suggestions cannot override them.',
        tone,
        safetyStatus: 'REFUSED',
        limitations: [...limitations, 'REFUSED_SCREENING_BYPASS'],
        approved,
      });
    }

    // Fabricated character quotation.
    if (
      containsAny(message, [
        'quote from goku',
        'vegeta said',
        'authentic dragon ball',
        'real dbz quote',
      ])
    ) {
      const line =
        approved.motivationalLines[0] ??
        'Stay consistent with the plan you already have.';
      return this.safe({
        messageText: `${line} (Original coaching copy — not an authentic Dragon Ball quotation.)`,
        tone,
        safetyStatus: 'REFUSED',
        limitations: [...limitations, 'REFUSED_FABRICATED_CHARACTER_QUOTE'],
        approved,
      });
    }

    // Short session help.
    if (containsAny(message, ['ten minutes', '10 minutes', 'fifteen minutes', '15 minutes', 'short session', 'busy day', 'no time'])) {
      const line = personaLine(request.context, approved);
      const eligible = request.context?.hasEligibleShortSession === true;
      const plannedSessionId = request.context?.plannedSessionId ?? null;
      return this.safe({
        messageText: eligible
          ? `${line} I can propose a shorter approved session for your confirmation — I will not invent a new programme.`
          : `${line} I will not assume a shorter session exists until your plan confirms an eligible option. We can open Train to check, or reschedule.`,
        tone,
        safetyStatus: 'SAFE',
        limitations,
        approved,
        proposedAction: eligible
          ? {
              actionType: 'PREVIEW_SHORTER_SESSION',
              payload: {
                reason: 'busy_day',
                maxMinutes: 15,
                ...(plannedSessionId ? { plannedSessionId } : {}),
              },
            }
          : {
              actionType: 'RESCHEDULE_SESSION',
              payload: { reason: 'busy_day' },
            },
        referencedExerciseIds: approved.exerciseIds.slice(0, 3),
      });
    }

    if (containsAny(message, ['skipped', 'i skipped', 'missed my workout'])) {
      const line = personaLine(request.context, approved);
      return this.safe({
        messageText: `${line} I don't see a workout logged yet — that is not the same as skipping. Start the planned session, or check in.`,
        tone,
        safetyStatus: 'SAFE',
        limitations,
        approved,
        proposedAction: request.context?.hasPlannedSession
          ? {
              actionType: 'START_WORKOUT',
              payload: {
                ...(request.context.plannedSessionId
                  ? { plannedSessionId: request.context.plannedSessionId }
                  : {}),
              },
            }
          : { actionType: 'LOG_CHECK_IN', payload: { reason: 'unlogged' } },
      });
    }

    // Meal / recipe help — reference approved recipe ids only; no invented macros.
    if (containsAny(message, ['recipe', 'meal', 'protein', 'swap', 'vegetarian', 'vegan'])) {
      const recipeIds = approved.recipeIds.slice(0, 3);
      const line =
        approved.motivationalLines[1] ??
        approved.motivationalLines[0] ??
        FALLBACK_MESSAGE;
      return this.safe({
        messageText:
          recipeIds.length > 0
            ? `${line} Here are eligible recipe references from your approved catalogue. Nutrition values come only from those records — none are invented here.`
            : `${line} Ask again after recipes are available in your plan. I will not invent food nutrition numbers.`,
        tone,
        safetyStatus: 'SAFE',
        limitations,
        approved,
        referencedRecipeIds: recipeIds,
        proposedAction:
          recipeIds.length > 0
            ? {
                actionType: 'PREVIEW_MEAL_SWAP',
                payload: { candidateRecipeIds: recipeIds },
              }
            : null,
      });
    }

    // Default: approved motivational line only.
    const line =
      approved.motivationalLines[
        Math.abs(hashString(message)) % Math.max(approved.motivationalLines.length, 1)
      ] ?? FALLBACK_MESSAGE;

    return this.safe({
      messageText: `${line} ${FALLBACK_MESSAGE}`,
      tone,
      safetyStatus: 'SAFE',
      limitations,
      approved,
    });
  }

  private safe(input: {
    messageText: string;
    tone: string;
    safetyStatus: CoachStructuredResponse['safetyStatus'];
    limitations: string[];
    approved: CoachApprovedContent;
    proposedAction?: CoachStructuredResponse['proposedAction'];
    referencedExerciseIds?: string[];
    referencedRecipeIds?: string[];
  }): CoachStructuredResponse {
    return {
      messageText: input.messageText,
      tone: input.tone,
      referencedExerciseIds: (input.referencedExerciseIds ?? []).filter((id) =>
        input.approved.exerciseIds.includes(id),
      ),
      referencedRecipeIds: (input.referencedRecipeIds ?? []).filter((id) =>
        input.approved.recipeIds.includes(id),
      ),
      referencedPlanVersion: null,
      proposedAction: input.proposedAction ?? null,
      safetyStatus: input.safetyStatus,
      limitations: input.limitations,
      providerMode: 'fixture',
      inventsNutritionNumbers: false,
    };
  }
}

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return h;
}
