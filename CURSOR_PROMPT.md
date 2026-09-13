# Cursor Master Implementation Prompt

Act as a Senior Full Stack Engineer, Product Engineer, and Technical Lead.

Implement the fitness application described in this project pack.
Your responsibility is to produce a working application, not only a plan,
scaffolding, static screens, or mock dashboards.

## First actions

1. Inspect the repository, existing instructions, and available environment.
2. Read README.md and AGENTS.md.
3. Read every numbered specification in docs/.
4. Identify conflicts with existing code or instructions.
5. Record material assumptions and dependencies.
6. Create docs/BUILD_STATUS.md.
7. Begin Milestone 0, then implement the remaining milestones in order.

Use docs/15-implementation-plan.md as the execution sequence.

Do not ask me to restate requirements already supplied in these files.

## Project intent

Build a Dragon Ball-inspired fitness journey for people who want:

- Motivation to improve their fitness.
- A routine that fits corporate work and family life.
- Better gym consistency.
- Strength, muscle development, conditioning, or appropriate fat loss.
- Character-inspired coaching and progression.
- Meals matching vegetarian, eggetarian, non-vegetarian, or vegan choices.
- Personalised images, quotations, music, and notifications.

Make the experience inclusive. Any gender can choose any character.

Follow the specified adult version-1 scope and specialist-support boundaries.

## Technical direction

For an empty repository, use the documented monorepo:

- Expo React Native mobile application.
- Next.js member web application and administration portal.
- NestJS API.
- PostgreSQL and Prisma.
- Redis and BullMQ workers.
- Shared TypeScript domain logic and validated contracts.
- Private S3-compatible object storage.
- Railway deployment configuration.

If an existing implementation is suitable, extend it and document deviations.

Check compatible versions against current official documentation.
Use a deterministic lockfile.

## Implementation approach

Build each feature end to end:

database -> domain logic -> API -> interface -> meaningful verification.

Prioritise:

1. Foundation and authentication.
2. Resumable onboarding and character selection.
3. Personalised training and workout logging.
4. Diet restrictions, recipes, meal planning, and logging.
5. Progression, history, and progress views.
6. Media and rights-aware content management.
7. Notifications and work-life scheduling.
8. Optional AI coach.
9. Offline synchronisation and privacy controls.
10. Administration and operational visibility.
11. Release preparation.

Continue through unblocked work.

Do not stop after the first milestone merely to ask whether to continue.

## Interface requirements

Use the supplied visual direction and design tokens.

Every implemented action needs:

- Real behaviour.
- Correct persistence.
- Validation.
- Loading feedback.
- Success feedback.
- Recoverable errors.
- Accessible controls.
- Relevant offline or unavailable states.

Keep workout actions fast and easy to use.

Do not display synthetic statistics as real member activity.

## Fitness and nutrition

Implement deterministic, versioned planning rules.

Character preferences cannot override:

- Screening outcomes.
- Movement restrictions.
- Equipment.
- Available time.
- Recovery.
- Allergies or ingredient exclusions.

Separate mission consistency from completed training dose.

Keep calorie tracking optional.

Do not invent nutrition values, reviewer credentials, clinical approvals,
or guaranteed body-transformation outcomes.

Use draft fixtures honestly until genuine content reviews are available.

## Character and media experience

Implement the complete original and licensed content-pack architecture.

Support the specified Goku, Vegeta, Gohan, Future Trunks, and Broly
presentations when appropriately authorised assets are available.

Use original archetypes and content to keep development functional.

Provide working management for:

- Images.
- Quotations.
- English dialogue.
- Music.
- Sound effects.
- Publication status.
- Rights references.
- Expiry.
- Fallback content.

Do not fabricate authentic quotations, licences, or media URLs.

## Notifications

Implement durable scheduling and delivery-state tracking.

Respect:

- Opt-in settings.
- Quiet hours.
- Shift-worker sleep windows.
- Local time zones.
- Daily caps.
- Completed or rescheduled activities.
- Device registration.
- Content availability.

Simulated notifications must be labelled as simulated.

Provider acceptance must not be presented as proof a user saw a message.

## Missing information or credentials

Maintain docs/16-decisions-and-dependencies.md.

For each missing dependency record:

- Affected feature.
- Current fallback.
- Exact owner action.
- Secure configuration location.
- Verification needed.

Continue unaffected work.

Ask a narrow question only when the missing answer materially blocks the
next necessary implementation step.

Never request secrets in ordinary chat.

## Verification

Follow docs/13-testing-and-acceptance.md.

Prioritise:

- Cross-user access prevention.
- Dietary exclusions.
- Calculation correctness.
- Plan-version preservation.
- Duplicate event handling.
- XP caps.
- Notification scheduling.
- Offline conflict handling.
- Media withdrawal.
- Data export and deletion.
- Complete member journeys.

Use actual PostgreSQL integration tests for critical transaction behaviour.

Record PASS, FAIL, NOT_RUN, or BLOCKED.
Never claim a test passed unless it ran successfully.

## Persistence and continuity

Update docs/BUILD_STATUS.md after each milestone.

If the session ends or context becomes limited:

- Save the implementation state.
- Record the next concrete task.
- Preserve outstanding failures.
- Make continuation possible without restarting.

Do not overwrite unrelated changes.
Do not reset or delete existing production data.

## Deployment and handover

Prepare:

- Verified local startup instructions.
- Environment-variable examples without secrets.
- Production build configuration.
- Railway service configuration.
- Migration procedure.
- Android/iOS build instructions.
- Health checks.
- Backup and rollback instructions.
- Release smoke tests.

Follow existing owner authorisation for external deployment.
Do not represent deployment files as an already deployed application.

## Completion report

Report:

- What works.
- How to run it.
- Actual verification results.
- Remaining external dependencies.
- Known limitations.
- Deployment/build status.

Begin implementation now.
