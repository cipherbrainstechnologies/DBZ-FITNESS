/** Minimum age for adult programme enrolment (docs/01, onboarding). */
export const ADULT_MINIMUM_AGE_YEARS = 18;

export type AgeGateInput = {
  /** Local calendar date of birth as YYYY-MM-DD. */
  dateOfBirth: string;
  /** Reference local calendar date as YYYY-MM-DD (typically today in member TZ). */
  asOfDate: string;
};

export type AgeGateResult =
  | { eligible: true; ageYears: number }
  | { eligible: false; ageYears: number; reason: 'UNDER_AGE' | 'INVALID_DATE' };

function parseLocalDate(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function ageInYears(
  birth: { y: number; m: number; d: number },
  asOf: { y: number; m: number; d: number },
): number {
  let age = asOf.y - birth.y;
  if (asOf.m < birth.m || (asOf.m === birth.m && asOf.d < birth.d)) {
    age -= 1;
  }
  return age;
}

/**
 * Pure adult eligibility check. Does not enrol minors into the adult programme.
 */
export function evaluateAdultAgeGate(input: AgeGateInput): AgeGateResult {
  const birth = parseLocalDate(input.dateOfBirth);
  const asOf = parseLocalDate(input.asOfDate);
  if (!birth || !asOf) {
    return { eligible: false, ageYears: 0, reason: 'INVALID_DATE' };
  }
  if (
    birth.y > asOf.y ||
    (birth.y === asOf.y && birth.m > asOf.m) ||
    (birth.y === asOf.y && birth.m === asOf.m && birth.d > asOf.d)
  ) {
    return { eligible: false, ageYears: 0, reason: 'INVALID_DATE' };
  }

  const ageYears = ageInYears(birth, asOf);
  if (ageYears < ADULT_MINIMUM_AGE_YEARS) {
    return { eligible: false, ageYears, reason: 'UNDER_AGE' };
  }
  return { eligible: true, ageYears };
}

export function isAdultEligible(input: AgeGateInput): boolean {
  return evaluateAdultAgeGate(input).eligible;
}
