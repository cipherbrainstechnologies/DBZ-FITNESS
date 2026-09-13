# Data Model and API

## Conventions

- Stable UUID identifiers.
- UTC createdAt and updatedAt.
- Explicit integer version for mutable resources.
- Decimal or appropriate numeric types for measurements.
- Canonical metric units.
- Enums for states.
- Indexes based on actual query patterns.
- Cursor pagination for histories and libraries.
- Foreign keys and database uniqueness constraints.

Do not store every core entity as an unvalidated JSON blob.

Use JSON for versioned calculation snapshots and structured provider payloads
where appropriate.

## Core entities

### Identity and preferences

User:
id, email, displayName, status, locale, currentTimeZone.

AuthSession:
userId, revocation state, expiry, device association.

UserRole:
userId, role.

ProfileVersion:
userId, version, goals, experience, availability,
equipment, access preferences, effectiveAt.

ScreeningRecord:
userId, questionnaireVersion, encrypted or access-restricted answers,
outcome, restrictions, effectiveAt.

ConsentRecord:
userId, purpose, policyVersion, grantedAt, revokedAt.

DietPreference:
userId, pattern, ingredient exclusions, allergy restrictions,
cuisine, budget preference, preparation constraints, version.

### Characters and progression

CharacterArchetype:
id, emphasis, tone, original presentation reference.

CharacterPresentation:
archetypeId, contentPackId, approved name, artwork, milestone definitions.

CharacterSelection:
userId, presentationId, selectedAt.

XpLedgerEntry:
userId, eventType, sourceEntityId, delta, localDate,
timeZone, policyVersion, reason, createdAt.

DailyXpCategory:
userId, localDate, category, awardedAmount.

MilestoneUnlock:
userId, milestoneDefinitionId, unlockedAt.

### Training

Exercise:
id, name, movementPattern, equipment, difficulty,
instructions, restrictions, adaptations, reviewStatus.

ProgrammeTemplate:
id, version, goalTags, eligibility, scheduleRules, publicationStatus.

TemplateSession:
templateVersionId, dayPattern, estimatedDuration.

TemplateExercise:
templateSessionId, exerciseId, order, prescription.

TrainingPlan:
userId, version, templateVersionId, inputSnapshot,
policyVersion, effectiveFrom, status.

PlannedSession:
planId, localDate, timeZone, durationBudget, status.

WorkoutSession:
userId, plannedSessionId, planVersion, status,
startedAt, finishedAt, actualDuration, version.

WorkoutSet:
sessionId, exerciseId, setIndex, repetitions,
resistanceKg, durationSeconds, effort, version.

CheckIn:
userId, localDate, energy, soreness, sleepFeedback, painFlag.

### Nutrition

FoodItem:
provider, providerId, name, state, nutrientBasis,
nutrients, servingConversions, dietMetadata, sourceVersion.

Recipe:
id, version, name, instructions, cookedYieldGrams,
portions, preparationTags, reviewStatus.

RecipeIngredient:
recipeVersionId, foodItemId, quantityGrams.

NutritionTarget:
userId, version, mode, calculationInputs, policyVersion,
energy, protein, fat, carbohydrate, effectiveFrom, status.

MealPlan:
userId, targetVersionId, startLocalDate, version.

PlannedMeal:
mealPlanId, localDate, mealType, recipeVersionId, portions.

MealLog:
userId, consumedAt, localDate, source, portions,
nutrientSnapshot, estimateStatus.

GroceryList:
userId, mealPlanVersionId, items, pantryAdjustments.

### Media and operations

Implement the content entities from docs/06-media-and-content.md.

NotificationPreference.
DeviceRegistration.
NotificationIntent.
NotificationAttempt.
NotificationInboxItem.
NotificationSuppression.

OutboxEvent.
IdempotencyRecord.
AuditEvent.
CoachConversation.
CoachMessage.
CoachActionProposal.
DataExportJob.
AccountDeletionJob.

## Important constraints

- One active profile version per effective point.
- One active programme per member for a given effective period.
- Unique workout set position within a session/exercise occurrence.
- Unique client event per member.
- Unique XP event identity.
- Atomic daily XP cap.
- Unique notification dedupe key.
- Unique provider food identifier within its versioning scheme.
- Ownership checks on every personal entity.
- No publishing a template or asset with missing required review metadata.

Use immutable historical snapshots for completed activity and consumed food.

## API base

/api/v1

Return structured errors:

code, message, fieldErrors, requestId, retryable.

Use 409 for meaningful version/idempotency conflicts.
Use 422 or a documented equivalent for validly formed but ineligible requests.
Do not hide operational failures behind HTTP 200 success responses.

## Identity and profile routes

POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/verify
POST /auth/password-reset/request
POST /auth/password-reset/complete

GET /me
PATCH /me
GET /me/profile
POST /me/profile/versions
POST /me/screening
GET /me/consents
PUT /me/consents/:purpose

GET /characters
PUT /me/character

## Training routes

GET /exercises
GET /exercises/:id
POST /training-plans/preview
POST /training-plans
GET /training-plans/current
POST /training-plans/:id/review
GET /planned-sessions
POST /planned-sessions/:id/reschedule
POST /planned-sessions/:id/shorten

POST /workout-sessions
GET /workout-sessions/:id
PUT /workout-sessions/:id/sets/:setId
POST /workout-sessions/:id/complete
POST /workout-sessions/:id/abandon
POST /workout-sessions/:id/substitution-preview
POST /workout-sessions/:id/substitution-confirm

POST /sync/workout-events
POST /check-ins

## Nutrition routes

GET /foods
GET /recipes
GET /recipes/:id
POST /nutrition-targets/preview
POST /nutrition-targets
POST /meal-plans/preview
POST /meal-plans
GET /meal-plans/current
POST /planned-meals/:id/swap-preview
POST /planned-meals/:id/swap-confirm
POST /meal-logs
PATCH /meal-logs/:id
DELETE /meal-logs/:id
GET /grocery-lists/current

## Progress and media

GET /progress/summary
GET /progress/history
GET /progress/xp-ledger
POST /measurements
DELETE /measurements/:id
POST /progress-photos/upload-intent
DELETE /progress-photos/:id

GET /content/today
GET /media
POST /media/:id/access

## Notifications and coaching

GET /notification-preferences
PUT /notification-preferences
POST /devices
DELETE /devices/:id
GET /notifications
POST /notifications/:id/read

POST /coach/messages
POST /coach/action-proposals/:id/confirm
POST /coach/action-proposals/:id/reject

## Administration and privacy

Provide role-protected /admin routes for the administration specification.

POST /me/export
GET /me/export/:id
POST /me/deletion-request
GET /me/deletion-status

## Mutation idempotency

Require an Idempotency-Key for:
plan activation, session completion, meal-plan activation,
confirmed coach actions, and export/deletion creation.

Store request hash and response.

Same key plus same request returns the original result.
Same key plus different request returns a conflict.

## Contract examples

POST /training-plans/preview accepts:

profileVersionId, screeningRecordId, characterArchetypeId,
programmePreference, startLocalDate, timeZone.

It returns:

eligibilityStatus, candidatePlan, explanationCodes,
warnings, policyVersion, previewToken, expiresAt.

Activation validates the preview token and unchanged source versions.

POST /sync/workout-events returns an outcome for every submitted event:

APPLIED, ALREADY_APPLIED, CONFLICT, or REJECTED.

Do not return an all-success summary for a partially failed batch.

## Documentation

Generate an OpenAPI document and client types.
Document permissions, idempotency, pagination, units, and error codes.

Keep the specification and generated contract aligned.
