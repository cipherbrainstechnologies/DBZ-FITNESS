/**
 * Canonical dietary pattern enum helpers (docs/05).
 */

export const DIETARY_PATTERNS = [
  'VEGETARIAN',
  'EGGETARIAN',
  'NON_VEGETARIAN',
  'VEGAN',
] as const;

export type DietaryPattern = (typeof DIETARY_PATTERNS)[number];

const CANONICAL = new Set<string>(DIETARY_PATTERNS);

/** Common onboarding misspellings / aliases mapped to canonical values. */
const ALIASES: Record<string, DietaryPattern> = {
  vegetarian: 'VEGETARIAN',
  veggie: 'VEGETARIAN',
  vegatarian: 'VEGETARIAN',
  eggetarian: 'EGGETARIAN',
  eggitarian: 'EGGETARIAN',
  ovo: 'EGGETARIAN',
  'ovo-vegetarian': 'EGGETARIAN',
  'non-vegetarian': 'NON_VEGETARIAN',
  nonvegetarian: 'NON_VEGETARIAN',
  'non vegetarian': 'NON_VEGETARIAN',
  omnivore: 'NON_VEGETARIAN',
  omnivorous: 'NON_VEGETARIAN',
  vegan: 'VEGAN',
  plantbased: 'VEGAN',
  'plant-based': 'VEGAN',
};

export function isDietaryPattern(value: string): value is DietaryPattern {
  return CANONICAL.has(value);
}

/**
 * Map free-text / misspellings to a canonical dietary pattern.
 * Returns null when the input cannot be mapped (do not invent allergies from labels).
 */
export function normalizeDietaryPattern(raw: string): DietaryPattern | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const upper = trimmed.toUpperCase().replace(/\s+/g, '_');
  if (isDietaryPattern(upper)) {
    return upper;
  }
  const key = trimmed.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const compact = key.replace(/\s+/g, '');
  return ALIASES[key] ?? ALIASES[compact] ?? null;
}

export function listDietaryPatterns(): readonly DietaryPattern[] {
  return DIETARY_PATTERNS;
}
