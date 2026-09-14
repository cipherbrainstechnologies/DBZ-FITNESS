/**
 * Authoritative post-authentication member journey.
 * Character selection is the first personalised step after eligibility/consent.
 */

export const AUTHENTICATED_JOURNEY_DESTINATIONS = [
  'SELECT_COACH',
  'RESUME_ONBOARDING',
  'TODAY',
] as const;

export type AuthenticatedJourneyDestination =
  (typeof AUTHENTICATED_JOURNEY_DESTINATIONS)[number];

export const JOURNEY_PATHS = {
  SELECT_COACH: '/app/coach',
  RESUME_ONBOARDING: '/app/onboarding',
  TODAY: '/app',
} as const;

export type JourneyPath = (typeof JOURNEY_PATHS)[AuthenticatedJourneyDestination];

export type AuthenticatedJourneyInput = {
  welcomeComplete: boolean;
  hasValidCoachSelection: boolean;
  coachReplacementRequired: boolean;
  onboardingComplete: boolean;
};

/**
 * Resolve where an authenticated member should land.
 * Temporary catalogue/member fetch failures are handled by the caller —
 * this function never infers a default character or treats a profile row
 * as onboarding-complete.
 */
export function resolveAuthenticatedMemberJourney(
  input: AuthenticatedJourneyInput,
): AuthenticatedJourneyDestination {
  if (!input.welcomeComplete) {
    return 'RESUME_ONBOARDING';
  }
  if (!input.hasValidCoachSelection || input.coachReplacementRequired) {
    return 'SELECT_COACH';
  }
  if (!input.onboardingComplete) {
    return 'RESUME_ONBOARDING';
  }
  return 'TODAY';
}

export function pathForAuthenticatedJourney(
  destination: AuthenticatedJourneyDestination,
): JourneyPath {
  return JOURNEY_PATHS[destination];
}

export function isSelectablePublicationStatus(
  status: string | null | undefined,
): boolean {
  return status === 'PUBLISHED';
}

/**
 * A saved selection remains valid unless the presentation was deliberately
 * withdrawn or is no longer selectable. Missing artwork is not a reason to
 * force reselection. Temporary catalogue outages must not clear this.
 */
export function evaluateSavedCoachValidity(input: {
  hasSelection: boolean;
  publicationStatus: string | null | undefined;
}): { hasValidCoachSelection: boolean; coachReplacementRequired: boolean } {
  if (!input.hasSelection) {
    return { hasValidCoachSelection: false, coachReplacementRequired: false };
  }
  if (
    input.publicationStatus === 'WITHDRAWN' ||
    input.publicationStatus === 'UNAVAILABLE' ||
    input.publicationStatus === 'DRAFT'
  ) {
    return { hasValidCoachSelection: false, coachReplacementRequired: true };
  }
  return { hasValidCoachSelection: true, coachReplacementRequired: false };
}
