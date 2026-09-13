/**
 * Resumable onboarding step order (docs/02).
 * ACCOUNT is established by auth registration before this flow resumes.
 */

export const ONBOARDING_STEPS = [
  'WELCOME',
  'GOALS',
  'EXPERIENCE',
  'AVAILABILITY',
  'SCREENING',
  'DIET',
  'MEASUREMENTS',
  'CHARACTER',
  'NOTIFICATIONS',
  'PLAN_PREVIEW',
  'CONFIRM',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_FIRST_STEP: OnboardingStep = ONBOARDING_STEPS[0];

const STEP_INDEX = new Map<OnboardingStep, number>(
  ONBOARDING_STEPS.map((step, index) => [step, index]),
);

export function isOnboardingStep(value: string): value is OnboardingStep {
  return STEP_INDEX.has(value as OnboardingStep);
}

export function onboardingStepIndex(step: OnboardingStep): number {
  return STEP_INDEX.get(step) ?? -1;
}

export function parseCompletedSteps(raw: unknown): OnboardingStep[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const steps: OnboardingStep[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && isOnboardingStep(item)) {
      steps.push(item);
    }
  }
  return steps;
}

/**
 * A step may be saved when it is the next incomplete step, or any already
 * completed step (edit-in-place before confirm).
 */
export function canSaveOnboardingStep(
  step: OnboardingStep,
  completedSteps: readonly OnboardingStep[],
): boolean {
  const completed = new Set(completedSteps);
  if (completed.has(step)) {
    return true;
  }
  const next = nextIncompleteStep(completedSteps);
  return next === step;
}

export function nextIncompleteStep(
  completedSteps: readonly OnboardingStep[],
): OnboardingStep | null {
  const completed = new Set(completedSteps);
  for (const step of ONBOARDING_STEPS) {
    if (!completed.has(step)) {
      return step;
    }
  }
  return null;
}

export function withStepCompleted(
  completedSteps: readonly OnboardingStep[],
  step: OnboardingStep,
): OnboardingStep[] {
  if (completedSteps.includes(step)) {
    return [...completedSteps];
  }
  const next = [...completedSteps, step];
  next.sort((a, b) => onboardingStepIndex(a) - onboardingStepIndex(b));
  return next;
}

/** Required steps before POST /onboarding/complete. */
export const ONBOARDING_REQUIRED_BEFORE_COMPLETE: readonly OnboardingStep[] = [
  'WELCOME',
  'GOALS',
  'EXPERIENCE',
  'AVAILABILITY',
  'SCREENING',
  'DIET',
  'CHARACTER',
  'CONFIRM',
];

export function missingStepsForComplete(
  completedSteps: readonly OnboardingStep[],
): OnboardingStep[] {
  const completed = new Set(completedSteps);
  return ONBOARDING_REQUIRED_BEFORE_COMPLETE.filter((step) => !completed.has(step));
}

export function isOnboardingComplete(completedSteps: readonly OnboardingStep[]): boolean {
  return missingStepsForComplete(completedSteps).length === 0;
}
