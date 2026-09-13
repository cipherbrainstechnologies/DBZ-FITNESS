export {
  ADULT_MINIMUM_AGE_YEARS,
  evaluateAdultAgeGate,
  isAdultEligible,
  type AgeGateInput,
  type AgeGateResult,
} from './eligibility/age-gate.js';

export {
  XP_POLICY_VERSION,
  XP_DAILY_MAXIMUM,
  XP_CATEGORY_CAPS,
  XP_PER_LEVEL,
  applyXpCap,
  applyXpAward,
  computeGameLevel,
  ELIGIBLE_XP_EVENT_TYPES,
  INELIGIBLE_XP_EVENT_TYPES,
  XP_EVENT_CATEGORY,
  XP_EVENT_BASE_DELTA,
  isEligibleXpEventType,
  isIneligibleXpEventType,
  type XpCategory,
  type ApplyCapInput,
  type ApplyCapResult,
  type EligibleXpEventType,
  type IneligibleXpEventType,
  type ApplyXpAwardInput,
  type ApplyXpAwardStatus,
  type ApplyXpAwardResult,
} from './progression/xp-cap.js';

export {
  DIETARY_PATTERNS,
  isDietaryPattern,
  normalizeDietaryPattern,
  listDietaryPatterns,
  type DietaryPattern,
} from './nutrition/dietary-pattern.js';

export {
  NUTRITION_POLICY_VERSION,
  NUTRITION_MODES,
  ENERGY_PROXIMITY_TOLERANCE_FRACTION,
  PROTEIN_PROXIMITY_TOLERANCE_FRACTION,
  type NutritionMode,
} from './nutrition/policy.js';

export {
  INGREDIENT_CATEGORIES,
  evaluateFoodAgainstDiet,
  evaluateRecipeAgainstDiet,
  filterFoodsByDiet,
  filterRecipesByDiet,
  allergyExclusionIsHardRule,
  type IngredientCategory,
  type FoodFilterCandidate,
  type RecipeFilterCandidate,
  type DietFilterPreferences,
  type FilterExclusionReason,
  type FoodFilterResult,
} from './nutrition/dietary-filter.js';

export {
  mifflinStJeorRestingKcal,
  previewNutritionTarget,
  type MifflinSexCoefficient,
  type TargetGoalAdjustment,
  type PreviewNutritionTargetInput,
  type NutrientTotals,
  type NutritionTargetPreviewResult,
} from './nutrition/targets.js';

export {
  scaleNutrients,
  sumNutrients,
  calculateRecipeNutrientsPerPortion,
  scalePortion,
  type NutrientSnapshot,
  type RecipeIngredientForCalc,
} from './nutrition/recipe-nutrients.js';

export {
  sumPlannedNutrientsForDate,
  sumLoggedNutrientsForDate,
  plannedAndLoggedAreSeparate,
  type PlannedMealView,
  type MealLogView,
} from './nutrition/consumption.js';

export {
  MEAL_TYPES,
  previewMealPlan,
  type MealType,
  type RecipePlanCandidate,
  type MealPlanSlot,
  type MealPlanPreviewResult,
} from './nutrition/meal-plan.js';

export {
  previewMealSwap,
  type SwapCandidate,
  type SwapPreviewResult,
} from './nutrition/meal-swap.js';

export {
  aggregateGroceryList,
  type GroceryIngredientLine,
  type RecipeGrocerySource,
} from './nutrition/grocery.js';

export {
  SCREENING_OUTCOMES,
  SCREENING_QUESTIONNAIRE_VERSION,
  SCREENING_RESTRICTION_CODES,
  resolveScreeningOutcome,
  allowsAutomatedProgrammeGuidance,
  characterMayBiasTrainingEmphasis,
  assertCharacterCannotOverrideScreening,
  type ScreeningOutcome,
  type ScreeningRestrictionCode,
  type ScreeningSignalInput,
  type ResolvedScreening,
} from './screening/outcomes.js';

export {
  ONBOARDING_STEPS,
  ONBOARDING_FIRST_STEP,
  ONBOARDING_REQUIRED_BEFORE_COMPLETE,
  isOnboardingStep,
  onboardingStepIndex,
  parseCompletedSteps,
  canSaveOnboardingStep,
  nextIncompleteStep,
  withStepCompleted,
  missingStepsForComplete,
  isOnboardingComplete,
  type OnboardingStep,
} from './onboarding/steps.js';

export {
  TRAINING_POLICY_VERSION,
  previewTrainingPlan,
  characterCannotOverrideEquipment,
  type ScreeningOutcomeForTraining,
  type TrainingEligibilityStatus,
  type ExerciseCandidate,
  type TemplateExerciseCandidate,
  type TemplateSessionCandidate,
  type ProgrammeTemplateCandidate,
  type PlanPreviewConstraints,
  type PreviewExerciseSlot,
  type PreviewSession,
  type CandidatePlan,
  type PlanPreviewResult,
} from './training/plan-preview.js';

export {
  shortenBusyDaySession,
  type ShortenExerciseSlot,
  type ShortenSessionInput,
  type ShortenSessionResult,
} from './training/busy-day.js';

export {
  isSubstitutionEligible,
  type SubstitutionCandidate,
  type SubstitutionContext,
  type SubstitutionEligibilityResult,
} from './training/substitution.js';

export {
  ORIGINAL_COPY_ATTRIBUTION,
  evaluatePublicationEligibility,
  checkExpiryAndWithdrawal,
  isGrantValidAt,
  isAuthenticLicensedQuoteKind,
  isSafeForOriginalContentMode,
  type PublicationStatusValue,
  type ContentReviewStatusValue,
  type QuoteKindValue,
  type RightsGrantSnapshot,
  type PublicationEligibilityInput,
  type PublicationEligibilityResult,
  type ExpiryWithdrawalCheckInput,
  type ExpiryWithdrawalCheckResult,
} from './media/publication.js';

export {
  DEFAULT_DAILY_MOTIVATIONAL_CAP,
  DEFAULT_QUIET_HOURS_START,
  DEFAULT_QUIET_HOURS_END,
  CAP_COUNTED_CATEGORIES,
  isWithinQuietHours,
  isWithinLocalWindow,
  parseHhMmToMinutes,
  evaluateDailyCap,
  localScheduleToUtc,
  localDateInTimeZone,
  localTimeHhMmInTimeZone,
  evaluateDispatchEligibility,
  type NotificationCategoryValue,
  type QuietHoursInput,
  type DailyCapInput,
  type DailyCapResult,
  type ScheduleLocalInput,
  type DispatchEligibilityInput,
  type DispatchEligibilityResult,
} from './notifications/scheduling.js';

export {
  COACH_ALLOWED_ACTION_TYPES,
  COACH_UNSAFE_ACTION_TYPES,
  evaluateCoachProposalSafety,
  type CoachAllowedActionType,
  type CoachUnsafeActionType,
  type CoachScreeningOutcome,
  type CoachProposalSafetyInput,
  type CoachProposalSafetyResult,
} from './coaching/safety.js';