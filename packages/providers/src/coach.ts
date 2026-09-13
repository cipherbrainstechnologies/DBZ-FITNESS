/**
 * AI coach provider port (docs/10).
 * Real LLM adapters are optional; fixtures return approved content only.
 */

export const COACH_ACTION_TYPES = [
  'RESCHEDULE_SESSION',
  'SELECT_SHORT_SESSION',
  'SWAP_MEAL',
  'UPDATE_NEXT_WEEK_AVAILABILITY',
] as const;

export type CoachActionType = (typeof COACH_ACTION_TYPES)[number];

export const COACH_SAFETY_STATUSES = ['SAFE', 'REFUSED', 'FALLBACK'] as const;
export type CoachSafetyStatus = (typeof COACH_SAFETY_STATUSES)[number];

export type CoachProviderMode = 'fixture' | 'openai';

export type CoachApprovedContent = {
  /** Original motivational lines only — never fabricated character quotations. */
  motivationalLines: readonly string[];
  exerciseIds: readonly string[];
  recipeIds: readonly string[];
};

export type CoachMemberContext = {
  screeningOutcome?: string | null;
  allergies?: readonly string[];
  dietaryPattern?: string | null;
  tone?: string | null;
};

export type CoachMessageRequest = {
  memberMessage: string;
  approvedContent: CoachApprovedContent;
  context?: CoachMemberContext;
  correlationId?: string;
};

export type CoachProposedAction = {
  actionType: CoachActionType;
  payload: Record<string, unknown>;
};

export type CoachStructuredResponse = {
  messageText: string;
  tone: string;
  referencedExerciseIds: string[];
  referencedRecipeIds: string[];
  referencedPlanVersion: string | null;
  proposedAction: CoachProposedAction | null;
  safetyStatus: CoachSafetyStatus;
  limitations: string[];
  providerMode: CoachProviderMode;
  /**
   * Always false for honest providers. Fixture never invents food nutrition
   * numbers; OpenAI adapters must not surface unchecked prescription macros.
   */
  inventsNutritionNumbers: false;
};

export interface CoachProvider {
  readonly kind: 'coach';
  readonly mode: CoachProviderMode;
  complete(request: CoachMessageRequest): Promise<CoachStructuredResponse>;
}
