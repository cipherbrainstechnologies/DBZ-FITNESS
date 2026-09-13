# Testing and Acceptance

## Test strategy

Prioritise:
domain correctness, resource ownership, retry behaviour,
offline synchronisation, dietary exclusions, and complete user journeys.

Use unit tests for calculations and rule precedence.
Use real PostgreSQL integration tests for constraints and transactions.
Use end-to-end tests for critical member and administration flows.

Do not use mocked databases as the only proof of transactional correctness.

## Critical acceptance cases

### Onboarding

- Interrupted onboarding resumes.
- Optional pronouns and measurements can be skipped.
- Any gender can select any available character.
- A minor cannot enter the adult transformation programme.
- Screening outcomes affect programme eligibility.

### Training

- Character choice cannot bypass an injury restriction.
- A session fits its duration budget including rests.
- Equipment substitutions respect restrictions.
- Poor recovery prevents automatic load increases.
- A shortened session records actual work.
- Completing the same session twice awards XP only once.
- Rescheduling does not rewrite completed history.

### Nutrition

- Vegetarian plans contain no eggs, meat, or fish.
- Eggetarian plans contain no meat or fish.
- Egg allergy excludes eggs even when EGGETARIAN is selected.
- Dairy exclusion removes paneer, curd, and relevant subingredients.
- Unknown allergen data is not treated as safe.
- A hard restriction is never relaxed to meet macros.
- Raw/cooked conversion and recipe yield are correct.
- Swapping a meal recalculates daily totals.
- Logged nutrient snapshots survive later recipe edits.
- The numerical fixture in the nutrition specification passes.
- Habit-only mode works without weight or calorie targets.

### Progression

- Daily category caps work across multiple devices.
- Transaction retries cannot create extra XP.
- Rest missions qualify according to policy.
- Additional exercise does not bypass the daily cap.
- Changing character preserves history.
- Time-zone changes do not duplicate historical daily awards.

### Notifications

- Quiet hours work across midnight.
- Shift-worker sleep windows work.
- DST repeated time sends once.
- DST skipped time follows the documented policy.
- Completed workouts suppress stale reminders.
- Preference changes invalidate old schedules.
- Invalid tokens are deactivated.
- Two workers cannot independently claim the same intent.
- Provider timeout is not reported as confirmed delivery.
- Local-day limits apply across categories.

### Media

- Expired or withdrawn assets are not issued new access URLs.
- Wrong-territory assets are excluded.
- Missing rights evidence prevents publication.
- Original copy is not labelled an authentic character quotation.
- Missing audio does not interrupt training.
- Reduced-motion and mute preferences work.

### Security

- Member A cannot read or modify Member B's records.
- Support cannot access private photos by default.
- Cookie-authenticated mutations are protected appropriately.
- Upload validation rejects unsupported or unsafe files.
- Sensitive values do not appear in logs.
- Logout revokes the relevant session and device association.
- Deletion stops future notifications.

### Offline

- A workout survives application restart.
- Repeated sync is idempotent.
- Concurrent device edits produce a visible conflict.
- Partial sync failure returns per-event outcomes.
- Provisional XP becomes authoritative after successful sync.

### AI

- Invalid exercise/recipe references are rejected.
- Extreme dieting requests do not produce harmful plans.
- Pain reporting suppresses motivational intensification.
- Prompt injection cannot alter permissions.
- Proposed changes require confirmation.
- Provider outage preserves core functionality.

## End-to-end release journeys

1. Vegetarian beginner onboarding -> plan -> workout -> XP -> progress.
2. Eggetarian onboarding -> meal swap -> logging -> grocery list.
3. Corporate schedule -> short session -> future reschedule.
4. Offline workout -> reconnect -> no duplicate logs or XP.
5. Admin publishes reviewed content -> eligible member sees it.
6. Asset withdrawal -> fallback appears.
7. Export -> authorised download -> account deletion request.

## Performance targets

Initial engineering targets, to be measured rather than assumed:

- Common API reads: p95 below 500 ms under the documented test load.
- Plan preview: below three seconds for deterministic local computation.
- No LLM dependency on workout start or set logging.
- Images sized for their display context.
- Large media loaded lazily.
- Pagination for all growing histories.
- No N+1 queries in Today or weekly-plan endpoints.

Document hardware, dataset, concurrency, and exclusions for performance runs.

## Accessibility verification

Test keyboard use, screen readers, large text, reduced motion,
contrast, touch targets, and meaningful labels.

## Completion evidence

Record actual commands and results in docs/BUILD_STATUS.md.

Use:
PASS, FAIL, NOT_RUN, or BLOCKED.

A test file existing does not count as a passing test.

Expo provides mobile push and audio capabilities, but credentials and platform configuration are still required for the finished app. Expo push setup, Expo audio documentation.
