import type { MemberJourney, OnboardingProgress } from '@saiyan/contracts';

/**
 * Client mirror of `resolveAuthenticatedMemberJourney` in `@saiyan/domain`.
 * Uses the API `journey` when present; otherwise derives it from progress so
 * a temporary schema mismatch cannot crash routing or clear a saved coach.
 */
export type ProgressLike = Partial<OnboardingProgress> & {
  completedSteps?: string[];
  completedAt?: string | null;
  hasCharacterSelection?: boolean;
  currentStep?: string;
};

export function coerceMemberJourney(
  progress: ProgressLike | undefined,
  journey?: MemberJourney | null,
): MemberJourney {
  if (journey?.destination && journey.path) {
    return journey;
  }

  const completedSteps = progress?.completedSteps ?? [];
  const welcomeComplete =
    progress?.welcomeComplete ??
    (completedSteps.includes('WELCOME') || Boolean(progress?.completedAt));
  const hasValidCoachSelection =
    progress?.hasValidCoachSelection ?? Boolean(progress?.hasCharacterSelection);
  const coachReplacementRequired = progress?.coachReplacementRequired ?? false;
  const onboardingComplete =
    progress?.onboardingComplete ?? Boolean(progress?.completedAt);

  let destination: MemberJourney['destination'] = 'TODAY';
  if (!welcomeComplete) {
    destination = 'RESUME_ONBOARDING';
  } else if (!hasValidCoachSelection || coachReplacementRequired) {
    destination = 'SELECT_COACH';
  } else if (!onboardingComplete) {
    destination = 'RESUME_ONBOARDING';
  }

  const path =
    destination === 'SELECT_COACH'
      ? '/app/coach'
      : destination === 'RESUME_ONBOARDING'
        ? '/app/onboarding'
        : '/app';

  return {
    destination,
    path,
    nextOnboardingStep: (progress?.currentStep as MemberJourney['nextOnboardingStep']) ?? null,
    welcomeComplete,
    hasValidCoachSelection,
    coachReplacementRequired,
    onboardingComplete,
  };
}
