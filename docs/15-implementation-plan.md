# Implementation Plan

## Milestone 0 — Repository and decisions

Tasks:

- Inspect repository and instructions.
- Record existing architecture.
- Materialise this specification.
- Select compatible dependency versions.
- Create docs/BUILD_STATUS.md.
- Record important architectural decisions.
- Identify existing credentials without exposing their values.

Exit:
A concrete implementation path and documented deviations.

## Milestone 1 — Foundation

Tasks:

- Scaffold applications and shared packages.
- Configure local infrastructure.
- Establish validated configuration.
- Add authentication and role-based access.
- Add migrations.
- Add structured errors and logs.
- Add development fixtures.
- Implement basic navigation and design tokens.

Exit:
A member can sign in and reach a persisted profile.
An administrator can access a protected administration shell.

## Milestone 2 — Onboarding and character experience

Tasks:

- Implement resumable onboarding.
- Add profile versioning.
- Add screening outcomes.
- Add food preferences.
- Add availability.
- Add character/archetype selection.
- Add original content-pack presentation.
- Add DBZ content-pack data structures and admin configuration.

Exit:
Different synthetic profiles persist correctly and receive distinct,
explainable eligibility outcomes.

## Milestone 3 — Training engine and workout execution

Tasks:

- Exercise catalogue.
- Draft/review/publish programme workflow.
- Deterministic plan preview.
- Plan activation.
- Weekly schedule.
- Workout player.
- Set logging.
- Suitable substitutions.
- Busy-day sessions.
- Completion and history.

Exit:
A member can complete a real persisted workout matched to their constraints.

## Milestone 4 — Nutrition

Tasks:

- Traceable food import.
- Ingredient restrictions.
- Recipe calculations.
- Nutrition modes.
- Target preview and activation.
- Seven-day meal planning.
- Meal swaps.
- Meal logging.
- Grocery list.
- Office and travel tags.

Exit:
All diet fixtures pass and actual consumption remains separate from plans.

## Milestone 5 — Progression and progress

Tasks:

- XP ledger.
- Daily caps.
- Milestones.
- Character switching.
- Mission consistency.
- Training adherence.
- Measurements.
- Private progress photos.
- Weekly review.

Exit:
Retries and multiple devices cannot inflate progression.

## Milestone 6 — Media

Tasks:

- Image/audio upload and validation.
- Rights-grant records.
- Content review.
- Publication.
- Personalised retrieval.
- Original quotations.
- Licensed-dialogue workflow.
- Audio player.
- Expiry and withdrawal.
- Fallbacks.

Exit:
Valid content plays or displays; unavailable content fails gracefully.

## Milestone 7 — Notifications and schedule adaptation

Tasks:

- Preferences.
- Device registration.
- In-app inbox.
- Durable notification intents.
- Dispatcher and retries.
- Quiet hours and daily caps.
- Time-zone handling.
- Rescheduling cancellation.
- Delivery-state reporting.
- Configured-device testing.

Exit:
Notifications respect real member choices and scheduling constraints.

## Milestone 8 — AI coach

Tasks:

- Provider adapter.
- Structured responses.
- Retrieval from approved content.
- Safety validation.
- Proposed actions.
- Member confirmation.
- Fallbacks.
- Usage controls.

Exit:
The coach assists with existing product functions without bypassing rules.

## Milestone 9 — Offline and privacy

Tasks:

- Local workout persistence.
- Event synchronisation.
- Conflict resolution.
- Provisional progression.
- Export.
- Account deletion.
- Cache clearing.
- Sensitive-data access controls.

Exit:
Interrupted sessions recover and personal-data controls work end to end.

## Milestone 10 — Administration and operations

Tasks:

- Complete content management.
- Reviewer workflows.
- Notification diagnostics.
- AI usage visibility.
- Audit records.
- Aggregate analytics.
- Provider configuration status.
- Expiry and failure alerts.

Exit:
The owner can operate the product without direct database editing.

## Milestone 11 — Release preparation

Tasks:

- Run critical automated checks.
- Complete accessibility review.
- Measure performance.
- Create Railway configuration.
- Create native build configuration.
- Deploy staging when authorised.
- Verify backup restoration.
- Run release smoke tests.
- Produce implementation and dependency report.

Exit:
A concrete reviewable release with clearly reported remaining external gates.

## Continuous rules

At every milestone:

- Keep existing successful flows working.
- Implement real persistence.
- Address meaningful errors.
- Update BUILD_STATUS.
- Continue unblocked tasks.
- Avoid adding deferred modules to navigation.
- Do not claim production readiness while required checks are unrun.

## Final handover

Provide:

- Implemented feature list.
- Exact local startup commands.
- Test results.
- Staging URLs if actually deployed.
- Native build status.
- Required owner actions.
- Known limitations.
- Deployment and rollback instructions.
- Remaining content review and media dependencies.

Do not stop after generating scaffolding or mock dashboards.
