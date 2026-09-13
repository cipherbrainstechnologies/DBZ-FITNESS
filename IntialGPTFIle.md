Below is a complete 18-file Markdown project pack for Cursor, covering your Dragon Ball-inspired fitness app, mobile and web experiences, personalised workouts, meals, character progression, media, notifications, and Railway deployment.

The workspace failed to start, so I couldn’t make downloadable files available. Copy this response into Cursor Agent using the instruction below. Cursor should create the files first, then implement the project.

The character system includes Goku, Vegeta, Gohan, Trunks, and Broly. Their training styles are motivational themes; actual programmes adapt to each person’s body, ability, schedule, and goals.

CURSOR START INSTRUCTION

Act as the senior product engineer responsible for implementing this project.

This message contains 18 Markdown files. Each file is introduced by its
filename, followed by a Markdown block.

1. Create every file at its specified relative path.
2. Read README.md and AGENTS.md.
3. Inspect the existing repository before choosing implementation changes.
4. Follow docs/15-implementation-plan.md in dependency order.
5. Build working end-to-end features, including database persistence,
   validation, loading/error states, and the acceptance criteria.
6. Continue through unblocked work without repeatedly requesting permission.
7. Record missing credentials or owner decisions in
   docs/16-decisions-and-dependencies.md.
8. Keep local development usable through explicitly labelled fixture providers.
9. Never claim a provider integration, deployment, or test works unless verified.
10. Begin implementation after creating and reading the files.

File 1 — README.md

# Saiyan Ascend — Fitness App Project

Working name: Saiyan Ascend.
Public branding remains subject to commercial name and content clearance.

## Product vision

Create an inclusive fitness companion inspired by Dragon Ball training,
character growth, determination, and transformation.

Users select a character inspiration and receive practical workouts,
meal planning, habit support, music, motivational content, and reminders
that fit their real lives.

The experience should feel like progressing through a personal training saga.

A fictional character represents motivation and preferred training emphasis.
It must never represent a promised physical outcome.

## Primary audiences

1. People who need motivation to begin improving their fitness.
2. Corporate professionals balancing work, family, commuting, and exercise.
3. Gym users struggling with consistency.
4. People seeking strength, muscle gain, fat loss, or improved conditioning.
5. Beginners, returning exercisers, and experienced recreational trainees.

All genders can choose any character, training emphasis, and avatar.

## Deliverables

- Android application.
- iOS application.
- Responsive member web application.
- Web administration portal.
- Backend API.
- Background notification and maintenance workers.
- Database migrations and seed tooling.
- Media and content management.
- Automated verification of critical behaviour.
- Railway deployment configuration and operating instructions.

## Release boundary

Version 1 supports adults aged 18 and above.

Include older adults and people with access needs through supported,
reviewed adaptations. Do not claim the standard programme covers every
medical condition or disability.

People requiring specialist support can use suitable logging and general
habit features while automated prescriptions remain unavailable.

A future guardian-supported youth experience requires a separate programme,
consent design, and content review. Do not silently enrol minors into the
adult transformation programme.

## Content modes

The application supports interchangeable content packs:

- ORIGINAL: original visual assets, copy, music, and character archetypes.
- DBZ_LICENSED: the requested Dragon Ball character experience using
  appropriately authorised names, branding, images, dialogue, and audio.

Implement the complete DBZ content integration structure.
Keep the application functional with original content while licensed assets
are being arranged.

Content mode changes presentation, not fitness safety rules.

## Repository layout

- apps/mobile: Expo React Native application.
- apps/web: member web application and administration portal.
- apps/api: NestJS HTTP API.
- apps/worker: scheduled and asynchronous processing.
- packages/domain: pure training, nutrition, and progression logic.
- packages/contracts: validated API schemas and shared types.
- packages/database: Prisma schema, migrations, and server repositories.
- packages/design-tokens: colours, spacing, typography, and motion settings.
- packages/providers: server-side integration adapters.
- packages/test-fixtures: deterministic development fixtures.
- docs: this specification and implementation evidence.

Do not import database or secret-bearing provider packages into clients.

## Read order

1. AGENTS.md.
2. Product, design, and character specifications.
3. Training and nutrition specifications.
4. Media and notification specifications.
5. Architecture and data/API specifications.
6. AI, administration, and seed specifications.
7. Testing, deployment, implementation, and dependency documents.

## Definition of completion

A new member can:

- Register and complete onboarding.
- Choose an available character or original archetype.
- Receive an explainable, suitable training plan.
- Receive meals respecting their food restrictions.
- Complete and synchronise a workout.
- Log meals and relevant habits.
- Earn progression once for each eligible action.
- Receive opted-in reminders at appropriate local times.
- Review progress and adjust future plans.
- Export or delete their personal information.

An administrator can manage the supporting content and inspect failures
without gaining unrestricted access to private member health information.

A production release must distinguish implemented features, verified
integrations, unavailable integrations, and pending content approvals.

File 2 — AGENTS.md

# Implementation Instructions

## Working approach

Inspect the repository, existing instructions, package manager, architecture,
and design conventions first.

If the repository is empty, scaffold the structure defined in README.md.
If an existing implementation is suitable, extend it and document deviations.

Implement one complete vertical slice at a time:
schema -> domain logic -> API -> client -> verification.

Do not finish with a collection of disconnected screens.

## Technical standards

- Use TypeScript with strict checking.
- Validate external input at every trust boundary.
- Keep domain calculations independent of UI and provider SDKs.
- Store canonical values in metric units; convert for display.
- Store timestamps in UTC and retain relevant IANA time zones.
- Version programmes, policies, content, and calculation inputs.
- Use database transactions for related state changes.
- Make retries safe through idempotency and uniqueness constraints.
- Use structured logs with correlation IDs and sensitive-data redaction.
- Use the existing lockfile or create and commit a deterministic lockfile.
- Check current official documentation before adding integrations.
- Pin compatible dependency versions after verifying them.

## Product rules

- Any gender may choose any character or training goal.
- Character selection cannot override safety, recovery, or equipment limits.
- Rest and sustainable consistency contribute to progression.
- Never reward starvation, pain tolerance, or excessive exercise.
- Never fabricate food nutrition values, clinical approval, or media rights.
- Do not attribute original motivational copy to a Dragon Ball character
  as an authentic quotation.
- Distinguish simulated delivery from real push/email delivery.
- Do not generate a fictional body transformation and label it a prediction.

## Interface requirements

Every implemented action must have:

- A real handler.
- Validation.
- Loading or pending feedback.
- A success state.
- A recoverable error state.
- Accessible interaction.
- Correct persistence or an explicit explanation of why it is local.

Avoid placeholder charts presented as a member's real data.

## Missing dependencies

Continue all work that does not depend on the missing item.

Record:
dependency, affected feature, current fallback, exact owner action,
and verification required after configuration.

Ask only for information that materially blocks the next necessary step.
Do not ask the owner to supply secrets in ordinary chat.

## Verification and handover

Test meaningful failure modes and critical business rules.
Do not write large quantities of tests that merely mirror implementation.

After each milestone update docs/BUILD_STATUS.md with:

- Completed behaviour.
- Files or modules changed.
- Commands run and actual results.
- Remaining failures.
- External dependencies.
- Next milestone.

Never overwrite unrelated user changes or reset a production database.

Before publishing externally, prepare the concrete release and follow the
owner's deployment authorisation. Preparing deployment files is part of
the implementation scope.

File 3 — docs/01-product-and-scope.md

# Product and Scope

## Core promise

"Build your strength. Find your rhythm. Progress through your own saga."

The main product outcome is sustainable participation in suitable fitness
activities, supported by practical nutrition and an enjoyable identity.

## Member goals

Support:

- Build a fitness habit.
- Improve general strength.
- Build muscle.
- Reduce body fat where appropriate.
- Improve endurance.
- Improve mobility.
- Return after a break.
- Maintain fitness during a busy period.

Choose one primary goal and optional secondary goals.

Users can hide weight, calorie, and physique-oriented features.

## Version 1 modules

### Identity and onboarding

Account creation, verification, preferences, schedule, screening,
character selection, equipment, food restrictions, and initial plan.

### Today

Today's main mission, available time, workout or recovery activity,
meals, optional habit goals, character message, and quick actions.

### Training

Weekly plan, exercise library, substitutions, workout execution,
rest timer, set logging, session history, and future plan adjustment.

### Nutrition

Daily meals, substitutions, food logging, recipe details, macro estimates,
grocery lists, cooking constraints, and office-friendly meals.

### Progress

Consistency, training performance, optional body measurements,
private photos, programme adherence, and character progression.

### Motivation

Character tone, original or licensed quotations, optional audio,
celebration moments, and weekly reflection.

### Work-life support

Busy-day sessions, meeting-aware manual scheduling, commuting windows,
travel mode, quiet hours, and realistic rescheduling.

### Administration

Content publishing, programme review, nutrition data, media rights,
notification operations, access control, and aggregate product metrics.

## Deferred features

Do not put unfinished navigation or nonfunctional buttons in version 1.

Later releases may add:

- Calendar provider connections.
- Health Connect and HealthKit integration.
- Wearable data.
- Coach-managed programmes.
- Subscriptions and store billing.
- Private community challenges.
- Corporate group subscriptions.
- Guardian-supported youth programmes.
- Additional licensed franchise content.

Version 1 is a free pilot unless the owner changes this decision.

## Product success metrics

Track:

- Onboarding completion.
- First suitable mission completed.
- Weekly active participants.
- Planned workout completion and shortened-session frequency.
- Return rate after missed sessions.
- Four-week retention.
- Meal-plan usefulness and swap rate.
- Notification opt-out rate.
- Content failure rate.
- Safety-related plan suppression rate.

Calculate metrics using documented event definitions.

Do not use rapid weight loss or time spent in the app as the primary
success metric.

## Example user journeys

### Corporate beginner

A vegetarian member has 25 minutes after work on three days.
They receive a suitable beginner programme, quick meal suggestions,
and one reminder outside their work and sleep windows.

### Returning gym user

An eggetarian member selects a strength-oriented character.
The app uses their current capacity, not their old personal records,
and offers a shorter session when their schedule changes.

### Experienced recreational lifter

A non-vegetarian member wants muscle gain.
The app offers an appropriate split, controlled progression,
food choices, and training history.

### Member with access needs

A member selects supported seated or low-impact options.
Walking and step goals are replaceable.
The app does not equate mobility limitations with low commitment.

File 4 — docs/02-user-flows-and-design.md

# User Flows and Design

## Visual direction

A premium fitness application with anime-inspired energy, training arenas,
character progression, and restrained game-like effects.

Use strong typography, clear data, large touch targets, and selective motion.

Avoid excessive glowing panels, constant animation, tiny dashboard text,
and backgrounds that make workout instructions difficult to read.

## Suggested design tokens

- Background: #0B1020.
- Surface: #151D30.
- Raised surface: #202B43.
- Primary action: #FF8A3D.
- Secondary accent: #5CB8FF.
- Main text: #F5F7FC.
- Muted text: #B7C2D5.
- Positive feedback: #5AD3A0.
- Warning: #F6C86B.

Verify contrast in actual component combinations.
Do not rely on colour alone to communicate status.

Characters can change accent colours without changing interaction patterns.

## Main navigation

Mobile bottom navigation:

1. Today.
2. Train.
3. Fuel.
4. Progress.
5. Profile.

Place character selection, media preferences, coaching preferences,
notifications, privacy, and account controls inside Profile.

The AI coach is available contextually from relevant screens.
It does not need a permanent bottom-navigation item.

## Onboarding flow

1. Welcome and adult eligibility.
2. Account setup.
3. Goal and motivation.
4. Experience and current activity.
5. Available days, time, and equipment.
6. Relevant safety and access needs.
7. Food pattern and ingredient restrictions.
8. Optional measurements and nutrition calculation preference.
9. Character and coaching style.
10. Notification preferences.
11. Plan preview and explanation.
12. Confirm and begin.

Save progress after each step.
Let users review and edit before generating a plan.

Ask for push permission only after explaining its benefit and after the
member chooses to enable notifications.

## Today screen

Show, in order:

- Greeting and a concise character-themed message.
- Today's main mission.
- Duration and equipment.
- Primary action: Start, Resume, or View Recovery.
- "I have less time" action.
- Next meal and swap action.
- Optional habits.
- Weekly consistency and progression.
- Small media player when the user has started playback.

Do not make the member scroll past a large illustration to start training.

## Character selection

Each card includes:

- Approved image or original artwork.
- Character or archetype name.
- Product-defined training emphasis.
- Coaching tone.
- Example supported goals.
- Clear statement that the programme remains personalised.

A detail preview explains what changes and what stays governed by the
member's fitness profile.

## Workout player

Show:

- Exercise name.
- Demonstration and text instructions.
- Sets, repetitions, resistance, and rest.
- Previous performance where available.
- Current set entry.
- Remaining session.
- Exercise substitution.
- Pain/discomfort action.
- Pause and finish controls.

Support interrupted sessions and app backgrounding.

Use timestamps for timers; do not rely on background JavaScript continuing
to run once per second.

## Nutrition screen

Show food names, portions, meal time, preparation time, and restrictions
clearly before detailed nutrition.

Each meal supports:

- View recipe.
- Swap.
- Change portion.
- Mark eaten.
- Log a different food.
- Add ingredients to groceries.

Separate planned food from actually consumed food.

## Progress screen

Separate:

- Habit progression.
- Workout performance.
- Programme adherence.
- Optional body measurements.
- Optional private photos.

Never display a game level as a scientific measure of health.

## Accessibility

- Screen-reader labels and logical focus order.
- Scalable text and layouts.
- Reduced-motion setting.
- No flashing transformation effects.
- Captions or text equivalents for spoken instructions.
- Mute and independent music/effect controls.
- Plain-language labels beside themed terminology.
- Support keyboard navigation on web.
- Adequate touch targets in sweaty or one-handed use.

## States

Design empty, loading, offline, unavailable, error, partial-success,
permission-denied, and expired-session states.

Unavailable media falls back to a suitable original visual or text.
Unavailable audio does not stop a workout.

File 5 — docs/03-character-and-progression.md

# Characters and Progression

## Character catalogue

The following training emphases are product interpretations, not claims
about canonical workout programmes.

| Inspiration | Product emphasis | Coaching tone |
| --- | --- | --- |
| Goku | Balanced strength and conditioning | Optimistic and curious |
| Vegeta | Structured strength and discipline | Direct and focused |
| Gohan | Sustainable strength around work and family | Calm and encouraging |
| Future Trunks | Athletic conditioning and adaptability | Practical and determined |
| Broly | Controlled strength and muscle development | Powerful and composed |

All characters support beginner adaptations.
Selecting Broly must never automatically select an advanced programme.

Support the requested DBZ characters through DBZ_LICENSED content.
Create corresponding original archetypes for ORIGINAL mode:

- Explorer.
- Strategist.
- Scholar.
- Guardian.
- Titan.

Original artwork must have its own identity rather than being a renamed
copy of franchise artwork.

## Inclusive choice

- No gender restrictions on characters.
- Pronouns are optional.
- Avatar appearance is independent of programme difficulty.
- Allow original custom avatars with different body types and access needs.
- Do not label strength as masculine or mobility as feminine.
- Do not assign target body proportions from anime images.

## What character choice changes

- Interface accent.
- Available licensed artwork.
- Coaching voice and wording.
- Preferred content and music tags.
- Training-emphasis preference within safe limits.
- Narrative milestones and cosmetic unlocks.

## What character choice cannot change

- Safety constraints.
- Allergy exclusions.
- Required equipment.
- Available time.
- Recovery spacing.
- Permitted progression.
- Nutrition eligibility.
- Medical or specialist restrictions.

## Themed vocabulary

Store terminology in the content pack rather than hardcoding it.

| Themed term | Plain-language meaning |
| --- | --- |
| Training Saga | Programme |
| Training Chamber | Workout |
| Ki Check | Energy and recovery check-in |
| Power Level | Earned activity points |
| Transformation | Cosmetic progression milestone |
| Recovery Capsule | Recovery day |

DBZ-specific vocabulary belongs to the approved franchise content pack.

Every operational screen must remain understandable without anime knowledge.

## XP policy version 1

XP rewards sustainable actions, not exercise volume or calorie restriction.

Daily categories:

- Main mission completed: 50 XP, maximum once per local date.
- Optional meal reflection/logging: 15 XP, maximum once per local date.
- Recovery check-in: 15 XP, maximum once per local date.
- Chosen accessible wellbeing habit: 20 XP, maximum once per local date.

Daily maximum: 100 XP.

The main mission may be a suitable workout, approved short session, or
planned recovery action.

Additional workouts do not generate extra main-mission XP.

Logging a meal is rewarded independently of its calories.
There is no XP for eating less, losing weight, or exercising through pain.

## Data integrity

Use an append-only XP ledger.

Enforce uniqueness on:
userId + eventType + sourceEntityId + policyVersion.

Use an additional daily category cap to prevent duplicate awards through
different source entities.

Apply awards and eligibility checks transactionally.

Corrections create compensating entries with reasons.
Do not silently rewrite history.

## Levels

Initial product configuration:

Level = 1 + floor(totalEligibleXp / 500).

Use a configurable milestone table for cosmetic unlocks.
Store the policy version used for each award.

Each licensed character has its own approved transformation sequence.
Do not assign forms indiscriminately across characters.

Changing character preserves earned XP and history.
Cosmetic presentation changes according to the new content pack.

## Consistency

Show two distinct indicators:

1. Mission consistency: participation in the chosen daily activity.
2. Training adherence: completion of the planned training dose.

A shortened session can maintain mission consistency while being recorded
as shortened in training adherence.

Rest days can count as successful planned days.
Missed days do not delete historical progress.

Provide compassionate restart messages.
Do not use insulting labels, expiring paid streak protection, or guilt.

## Weekly review

Summarise:

- What the member completed.
- What became difficult.
- Whether session duration fits their life.
- Whether their programme needs simplifying.
- Suggested changes for the next week.

The member can accept or edit changes before they take effect.

The training approach should recognise that movement can be adapted to different abilities and that some activity is beneficial even when someone cannot complete a large target. WHO physical activity guidance.

File 6 — docs/04-personalization-and-training.md

# Personalisation and Training

## Rule precedence

Apply constraints in this order:

1. Safety eligibility.
2. Access needs and movement restrictions.
3. Equipment.
4. Available time and recovery.
5. Experience.
6. Primary goal.
7. Preferences.
8. Character emphasis.
9. Presentation.

A lower-priority preference can never override a higher-priority constraint.

## Member inputs

Required where relevant:

- Adult eligibility and age.
- Primary goal.
- Training experience.
- Current activity.
- Days available.
- Session duration.
- Equipment and training location.
- Movement limitations.
- Relevant screening answers.
- Current energy and soreness.
- Preferred activities.

Optional:

- Height and weight.
- Previous exercise performance.
- Access adaptations.
- Clinician or qualified-coach restrictions.
- Resting measurements supplied by the member.

Declining weight entry must not prevent habit and workout features.

## Screening outcomes

Return an explicit status:

- GENERAL_PROGRAMME_ELIGIBLE.
- ADAPTED_CONTENT_REQUIRED.
- PROFESSIONAL_GUIDANCE_REQUIRED.
- TEMPORARY_TRAINING_PAUSE.

Use reviewed screening content and version its rules.

Do not diagnose a condition.

Unresolved acute symptoms, an active injury affecting exercise, or a reported
medical restriction must not result in an automatically intensified plan.

If a member reports chest pain, fainting, severe breathing difficulty, or
other potentially urgent symptoms, stop exercise coaching and provide
appropriate urgent-care guidance without anime-themed language.

Supported specialist and adapted programmes require appropriate content
review; a generic substitution is not sufficient for every disability.

## Programme engine

Implement a deterministic rule engine.

Input:
profile version + screening version + equipment + availability +
programme template version + recent training history.

Output:

- Programme ID and version.
- Effective dates.
- Weekly schedule.
- Exercise prescriptions.
- Session duration estimates.
- Recovery days.
- Suitable substitutions.
- Explanation codes.
- Safety or data limitations.
- Next review date.

The same inputs and policy versions should produce reproducible results.

## Starting programme templates

Create draft templates for:

- Beginner full body, two days.
- Beginner full body, three days.
- Returning exerciser, two or three days.
- Intermediate upper/lower, four days.
- Home strength using bodyweight.
- Home strength using dumbbells.
- Low-impact conditioning.
- Supported seated movement.
- General mobility and recovery.
- Busy-day sessions of 10, 15, and 20 minutes.

Templates are implementation starting points.
Qualified review is required before publishing them for automated guidance.
Do not fabricate review records.

## Conservative draft prescription

For general beginner resistance templates:

- Begin with a manageable number of movement patterns.
- Usually start with two working sets per exercise.
- Use a manageable repetition range such as 8–12.
- Finish with approximately three repetitions still possible.
- Include suitable warm-up and rest time.
- Avoid default maximal lifts or training to failure.
- Avoid stacking demanding sessions for the same muscles on adjacent days.

These are product defaults for review, not universal medical prescriptions.

Duration estimation must include warm-up, work sets, rests, equipment
changes, and transitions.

A 20-minute session cannot contain 40 minutes of work under a shorter label.

## Progression

Use double progression where appropriate:

1. Maintain resistance while repetitions improve within the target range.
2. When all prescribed sets reach the top of the range with suitable
   effort and technique feedback, suggest the smallest available increase.
3. Check the template's maximum progression bound.
4. If the available equipment jump is too large, keep resistance unchanged
   and use an approved alternative progression.
5. Do not progress when pain, unusual fatigue, poor recovery, or a pause
   condition is recorded.

Suggested resistance is never mandatory.

Reassess after repeated difficult sessions or extended absence.
Do not resume old loads automatically after a long break.

## Substitution

Match:

- Movement pattern.
- Training purpose.
- Equipment.
- Experience.
- Access needs.
- Relevant restrictions.
- Time budget.

Hard exclusions remain hard exclusions.

If no reviewed substitute exists, explain the limitation and remove or
reschedule the affected exercise. Do not invent a substitute.

## Busy-day mode

When a member selects a shorter duration:

- Preserve a suitable warm-up.
- Prioritise the most relevant movements.
- Reduce optional work.
- Keep appropriate rest.
- Use a reviewed short-session template.
- Show what changed.
- Record the actual session dose.

Do not compress the original workload into unsafe rest intervals.

## Session lifecycle

PLANNED -> IN_PROGRESS -> COMPLETED
                       -> SHORTENED
                       -> ABANDONED

Also support cancellation or rescheduling before a session starts.

Persist set logs during the session.
Finishing records actual work, not all originally planned work.

## Recovery and feedback

Daily check-in:

- Energy.
- Soreness.
- Sleep quality, optional.
- Pain or discomfort.
- Available time.

Use simple categories rather than a fake precise readiness score.

Poor recovery can result in maintaining, reducing, substituting,
rescheduling, or resting.

Fantasy gravity training is a narrative label only.
Do not prescribe fictional training methods literally.

## Versioning

Editing a profile or future plan must not rewrite completed workouts.

Record:
input snapshot, selected template, policy version, reason codes,
effective dates, and member acceptance.

A current session remains on its starting version unless a safety-related
change requires an explicit interruption.

## Explainability examples

- "Selected because you have dumbbells and 25 minutes."
- "Reduced today because you reported low recovery."
- "This exercise was replaced because the equipment is unavailable."
- "Your character preference affects emphasis; your experience sets difficulty."

Nutrition calculations should use documented estimates rather than invented precision. The specification uses the published Mifflin–St Jeor equation, a conservative protein starting point informed by the ISSN position statement, and traceable food data. Mifflin study, ISSN protein guidance, USDA food-data API.

File 7 — docs/05-nutrition-and-meal-planning.md

# Nutrition and Meal Planning

## Food patterns

Canonical enum:

- VEGETARIAN.
- EGGETARIAN.
- NON_VEGETARIAN.
- VEGAN.

Accept common misspellings during onboarding and map them to the
canonical value.

Definitions:

VEGETARIAN:
Excludes meat, poultry, fish, seafood, and eggs.
Dairy is allowed unless separately excluded.

EGGETARIAN:
Allows eggs and optionally dairy.
Excludes meat, poultry, fish, and seafood.

NON_VEGETARIAN:
May allow all categories, subject to explicit ingredient restrictions.

VEGAN:
Excludes animal-derived ingredients.

Additional filters:

- Dairy-free.
- Lactose intolerance.
- Jain-compatible ingredient exclusions.
- No onion or garlic.
- Religious restrictions.
- Allergies.
- Disliked ingredients.
- Budget.
- Cuisine.
- Cooking time.
- Office storage and reheating facilities.

Do not infer allergies or religious restrictions from a diet label.

## Strict filtering

Check every ingredient, including:

- Sauces.
- Stock.
- Gelatin.
- Egg-containing dressings.
- Protein powders.
- Garnishes.
- Recipe subcomponents.

Unknown allergen metadata cannot be treated as allergen-free.

Never relax allergies or diet restrictions to satisfy a macro target.

If suitable meals are unavailable, explain the shortage and offer safe
manual selection or a request for more approved recipes.

## Nutrition modes

1. HABIT_ONLY:
   Balanced-meal guidance and food logging without calorie targets.

2. ESTIMATED_TARGET:
   Optional estimates for eligible adults using reviewed policies.

3. PROFESSIONAL_TARGET:
   A member-provided professional target, clearly identified by source.

Do not make calorie tracking mandatory.

## Eligibility

Automated weight-loss or high-protein prescriptions are unavailable when
screening indicates that generic advice is unsuitable, including relevant
pregnancy/lactation, eating-disorder, kidney-disease, or medical-diet concerns.

Keep suitable general logging features available.

The application must not diagnose these conditions.

## Energy estimation

Support the Mifflin–St Jeor estimate:

Base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears.

Published coefficients:
- Male equation: Base + 5.
- Female equation: Base - 161.

Gender identity does not select the equation.

Explain that the published equations use sex-specific coefficients and
have limitations for individual bodies and circumstances.

Allow:
- An informed equation selection.
- A professionally supplied target.
- A displayed estimate range.
- Habit-only mode.

If no equation is selected, do not silently choose a coefficient or use the
midpoint as a personalised prescription.

## Draft maintenance and goal policy

An activity factor estimates total daily expenditure from resting energy.
It must account for both occupation and exercise without double-counting
the same activity.

Implement configurable factors with clear descriptions and versioning.
Treat them as estimates, not measurements.

Draft adult goal adjustments for professional review:

- Maintenance: estimated maintenance.
- Muscle gain: a small surplus, initially 5%.
- Fat loss when eligible: a modest deficit, initially 10%.

Do not increase the deficit automatically to meet a promised deadline.

A published policy must specify eligibility, factor bounds, intake bounds,
and review rules. If the proposed target falls outside the policy,
return REVIEW_REQUIRED.

An intake threshold is a safeguard, not proof of nutritional adequacy.

Do not assume resting expenditure is a universal safe minimum intake.

## Protein and remaining macros

For eligible healthy adults doing resistance training, use 1.6 g/kg/day
as a draft starting point, adjustable within the published policy.

A qualified reviewer must define the appropriate weight basis and bounds
for cases where actual-weight scaling is unsuitable.

Draft fat allocation: 30% of target energy.
Carbohydrate allocation: the remaining energy.

Use:
- Protein: approximately 4 kcal/g.
- Carbohydrate: approximately 4 kcal/g.
- Fat: approximately 9 kcal/g.

Reject impossible macro combinations.
Do not reduce essential allocations merely to force a target to fit.

Whole foods can meet protein needs.
Supplements are optional and never required for progression.

## Calculation fixture

Synthetic example for arithmetic verification only:

Age: 30.
Weight: 70 kg.
Height: 170 cm.
Male equation.
Activity factor: 1.4.

Resting estimate:
700 + 1062.5 - 150 + 5 = 1617.5 kcal.

Maintenance estimate:
1617.5 * 1.4 = 2264.5 kcal.

Draft 10% deficit:
2264.5 * 0.9 = 2038.05 kcal.

Protein at 1.6 g/kg:
112 g, approximately 448 kcal.

Fat at 30%:
611.415 kcal, approximately 67.94 g.

Carbohydrate remainder:
978.635 kcal, approximately 244.66 g.

Retain precision internally and round only for presentation.
This is not a recommendation for a real person.

## Food data model

Each food record must store:

- Stable internal ID.
- Provider and provider record ID.
- Source version or retrieval date.
- Ingredient name and aliases.
- Raw/cooked/prepared state.
- Nutrients per 100 g.
- Serving descriptions and gram equivalents.
- Allergen and diet metadata.
- Data completeness.
- Review status where applicable.

Use USDA FoodData Central or another permitted source.
Indian dishes require appropriate recipe composition and source records.

Never label generated nutrition values as verified database values.

## Recipe calculation

Calculate ingredient nutrients from weight and food state.

For a cooked batch:

1. Sum nutrients from the appropriate ingredient records.
2. Include oil, sauces, and other meaningful ingredients.
3. Record cooked yield weight.
4. Allocate batch nutrients by serving fraction or cooked serving weight.

Do not apply a raw-food per-100 g value directly to cooked weight.

Preserve provider energy values.
Small differences from 4/4/9 macro energy may reflect fibre, rounding,
or provider methods; show provenance rather than silently altering data.

## Meal-plan generation

Generate seven days using:

- Food restrictions.
- Nutrition mode and eligible targets.
- Meal count.
- Cuisine.
- Budget preference.
- Cooking time.
- Batch-cooking preference.
- Ingredient reuse.
- Available storage and reheating.
- Variety.

Prioritise hard restrictions, practical portions, and food quality.

Use configurable target tolerances.
Label a plan partial if valid meals cannot meet the soft targets.
Never pretend an approximate match is exact.

## Meal swaps

Search only eligible candidates.

Rank by:
meal type, restrictions, preparation constraints, energy/protein proximity,
member preferences, and variety.

Show the resulting daily-total change before confirmation.

A recipe change affects future meal plans.
Previously logged meals retain their nutrient snapshots.

## Office and travel support

Provide tags for:

- Packed lunch.
- No reheating.
- Quick breakfast.
- Canteen choice.
- Restaurant approximation.
- Travel meal.
- Batch cooking.

Restaurant and user-entered meals must be labelled estimates.

## Grocery lists

Aggregate selected recipes by canonical ingredient and compatible units.
Convert through recorded yield factors when needed.
Allow pantry exclusions and serving adjustments.

Do not combine incompatible raw and cooked quantities without conversion.

## Weekly adjustment

Review trends across multiple weeks and data quality.

Suggest changes with explanations and member confirmation.
Do not change calorie targets based on one weigh-in or an unlogged meal.

Hydration is optional logging with user-selected or reviewed guidance.
Do not award points for excessive water consumption.

The media library needs usage-specific permissions. Music recordings and compositions can involve separate rights, and Spotify’s developer policy restricts synchronising its music with visual media. U.S. Copyright Office guidance, Spotify Developer Policy.

File 8 — docs/06-media-and-content.md

# Media and Content

## Requested experience

Support personalised:

- Character images.
- Background illustrations.
- Transformation animations.
- Motivational quotation cards.
- Authentic licensed English dialogue.
- Original motivational copy.
- Music playlists.
- Workout sound effects.
- Optional spoken coaching.

Media selection depends on the member's character, tone, activity,
language, preferences, and current context.

## Rights-aware architecture

Treat rights clearance as content configuration.

Do not assume one agreement covers character artwork, music compositions,
recordings, English dubbing, actor performances, and app-store branding.

Track the specific grant for each intended use.

Development must continue using original content when commercial franchise
assets are unavailable.

An administrator marking an item approved is an internal workflow action,
not evidence that a licence exists. Require the actual grant reference.

## Content entities

ContentPack:
id, name, mode, locale, version, status, supportedTerritories,
rightsGrantIds, fallbackPackId.

MediaAsset:
id, type, storageKey, mimeType, checksum, dimensions, duration,
altText, transcript, characterTags, moodTags, activityTags,
explicitContent, rightsGrantIds, publicationStatus, version.

RightsGrant:
id, rightsHolder, evidenceReference, permittedUses, platforms,
territories, validFrom, validUntil, attributionText,
offlinePermission, derivativePermission, reviewer, reviewedAt.

Quote:
id, text, kind, attribution, characterId, locale, dubVersion,
sourceReference, contextTags, rightsGrantIds, status.

MusicTrack:
id, assetId or externalLink, title, creator, genre, mood,
intensityTag, duration, attribution, rightsGrantIds, status.

## Publication rules

An asset is deliverable only when:

- Its content review is approved.
- Applicable grants cover the requested use.
- Territory and platform are covered.
- Validity dates are current.
- Required attribution can be shown.
- The asset has not been withdrawn.

Check eligibility on the server and when issuing delivery URLs.

Do not rely solely on hiding a client-side button.

When a grant expires:
unpublish affected content, invalidate delivery access, purge relevant
caches, cancel queued notifications using it, and select fallback content.

Licensed offline downloads are disabled by default.
Enable them only when the grant allows caching and the implemented expiry
behaviour meets its requirements.

Do not claim previously delivered files can always be remotely erased.

## Quotes and English dialogue

Support three content kinds:

- ORIGINAL_COPY.
- VERIFIED_LICENSED_QUOTE.
- LICENSED_AUDIO_DIALOGUE.

Original copy must never be presented as a verified line from the show.

For authentic dialogue store:
exact wording, relevant dub, source reference, speaker attribution,
permitted use, and review status.

Do not ask an LLM to invent canonical quotations.

Do not scrape dialogue libraries or download clips from unauthorised uploads.

## Original seed copy

Use original lines such as:

- "Your next level starts with today's small effort."
- "Control the movement. Own the progress."
- "A short session still moves your story forward."
- "Recovery prepares you for the next challenge."
- "Return with a plan, not punishment."
- "Build a routine your real life can support."

These are application copy, not Dragon Ball dialogue.

## Personalisation

Hard-filter by:
publication status, rights, locale, user settings, explicit-content setting,
and context suitability.

Then rank by:
character preference, selected tone, activity, mood, and recent history.

Avoid repeating the same motivational quote within seven days when enough
eligible content exists.

If a member reports distress or pain, use plain supportive wording.

## Music

Implement:

1. In-app playback of original or appropriately licensed tracks.
2. User-initiated external playlist links.

Do not require a streaming-service account for core fitness functions.

A future streaming SDK integration requires a separate review of current
provider capabilities, commercial access, and permitted use.

Do not synchronise third-party streaming tracks with transformation videos,
exported reels, or workout animations unless the relevant permissions
explicitly allow it.

## Player behaviour

- Playback begins only after user interaction.
- Separate controls for music, coaching, and effects.
- Handle calls, audio-focus loss, headphones, and app backgrounding.
- Pause or lower music appropriately for workout instruction.
- Persist preference, not unauthorised audio copies.
- Respect platform background-audio requirements.
- Browser playback limitations must have clear fallbacks.

Do not autoplay loud character dialogue from a notification.

## Images and progress photos

Character art is separate from member photos.

Member photos are private by default, removable, and never included in
public feeds or promotional material without specific consent.

Do not use body photos to infer gender, health conditions, or a guaranteed
future physique.

## Media administration

Provide:
upload, metadata editing, preview, rights attachment, approval,
scheduled publication, withdrawal, expiry alerts, and replacement.

Keep licence documents private to authorised administration roles.

File 9 — docs/07-notifications-and-work-life.md

# Notifications and Work-Life Support

## Channels

Version 1:

- In-app inbox.
- Mobile push.
- Transactional account email.

Motivational email is separately opt-in.
Web push can be added after capability testing; the inbox remains available.

## Member controls

- Categories enabled.
- Preferred workout reminder time.
- Meal reminders.
- Optional movement breaks.
- Weekly review.
- Tone.
- Quiet hours.
- Sleep window.
- Work and commuting windows.
- Active IANA time zone.
- Daily reminder cap.
- Pause-until date.
- Sensitive lock-screen content preference.

Default motivational cap: three notifications per local day.
The member can reduce the cap or disable notifications entirely.

Account security messages are handled separately from motivational caps.

## Default quiet hours

Use 22:00–08:00 in the member's local time as an editable starting point.

For shift workers, use their chosen sleep window instead.

Quiet hours crossing midnight must work correctly.

## Trigger examples

Workout approaching:
Offer the planned session and a shorter-session action.

Member has not started:
At most one suitable follow-up, if enabled and still useful.

Meal reminder:
Reference the meal type without exposing sensitive nutrition targets
on the lock screen by default.

Recovery day:
Reinforce the planned recovery action.

Missed sessions:
Offer a restart or reschedule after a suitable interval.
Do not send repeated guilt messages.

Weekly review:
Summarise participation and invite the member to adjust next week's plan.

## Priority

After hard eligibility filtering:

1. Member-requested workout reminder.
2. Member-requested weekly review.
3. Member-requested meal reminder.
4. Optional movement break.
5. Generic motivation.

Lower-priority messages are dropped when the daily cap is reached.

Do not send all deferred reminders when quiet hours end.

## Persistence

Store:

NotificationPreference.
DeviceRegistration.
NotificationIntent.
NotificationAttempt.
NotificationInboxItem.
NotificationSuppression.

Intent fields include:
userId, category, sourceEntityId, occurrenceKey, scheduleVersion,
scheduledLocalTime, timeZone, scheduledAtUtc, expiresAt,
contentVersion, status, dedupeKey.

Enforce a unique dedupeKey.

## Scheduling

Use a worker with a durable database schedule and transactional outbox.

Jobs should contain identifiers, not full health profiles or secret tokens.

At dispatch time recheck:

- Current consent.
- Current device registration.
- Quiet hours.
- Paused status.
- Current plan version.
- Whether the activity was already completed.
- Content and rights availability.
- Local-day cap.
- Intent expiry.

Cancel stale intents after rescheduling, completion, or preference changes.

Use atomic claiming and expiring leases so multiple workers cannot
independently process the same due intent.

## Time zones and daylight saving

Store the intended local schedule separately from the UTC execution time.

When a member accepts a new time zone, regenerate only future intents.

Use a defined DST policy:
- Nonexistent local time: move to the next valid local time if still useful.
- Repeated local time: deliver once.

Retain the time zone used for historical activity and XP dates.

Do not rewrite historical streak dates when someone travels.

## Delivery semantics

Push-provider acceptance is not proof the person saw the message.

Track:
queued, claimed, submitted, receipt-confirmed where supported,
failed, expired, suppressed, and delivery-unknown.

Retry transient failures with bounded backoff.
Deactivate invalid device tokens.
Avoid unlimited retries after the message is no longer useful.

External push delivery cannot be guaranteed exactly once.
Maintain application-level idempotency and document uncertain outcomes.

## Device policy

Use the member's preferred active device for motivational push by default.
Allow the member to choose additional devices.

Logout removes that installation's account association.

Do not leak one account's notification through a reused device token.

## Work-life planning

Version 1 uses manually entered availability.
No calendar permission is needed.

Busy-day actions:

- Shorten today's session.
- Move to another available slot.
- Change to an appropriate recovery activity.
- Mark unavailable.
- Adjust next week's schedule.

Do not erase missed history when changing future availability.

Calendar integration is a later adapter using minimum required permissions.

File 10 — docs/08-architecture-and-security.md

# Architecture and Security

## Default stack

- Monorepo: pnpm workspaces.
- Mobile: Expo React Native with Expo Router.
- Web: Next.js with TypeScript.
- API: NestJS.
- Database: PostgreSQL.
- ORM and migrations: Prisma.
- Jobs: BullMQ with Redis.
- Object storage: private S3-compatible buckets.
- Mobile local workout storage: SQLite.
- Web local workout storage: IndexedDB.
- Server-state client: TanStack Query or existing equivalent.
- Contracts: shared validated schemas.
- Local infrastructure: Docker Compose.
- Hosting: Railway for web, API, worker, PostgreSQL, and Redis.

Confirm current compatibility before installation.
Do not install arbitrary "latest" versions independently.

Mobile binaries are built and distributed through appropriate Android/iOS
build and store channels. Railway hosts their backend services.

## Architecture shape

Use a modular monolith with a separate worker process.

Modules:

- Identity.
- Profiles and consent.
- Character/content packs.
- Training.
- Nutrition.
- Progression.
- Media.
- Notifications.
- Coaching.
- Administration.
- Data export and deletion.

Avoid microservices unless a measured need emerges.

## Ownership of logic

packages/domain:
Pure rules and calculations.

apps/api:
Authentication, authorisation, validation, orchestration, persistence.

apps/worker:
Outbox dispatch, notification scheduling, media maintenance, exports,
deletion tasks, and aggregate calculations.

Clients:
Presentation, local input validation, local session capture,
and optimistic updates with reconciliation.

The server is authoritative for permissions, active plan versions,
published targets, and awarded XP.

## Authentication

Use a maintained authentication library/provider compatible with the stack.
Do not invent cryptographic protocols.

Support:
email/password, verification, reset, logout, session revocation,
and administrator MFA.

Use secure password hashing where passwords are managed locally.

Web:
HttpOnly secure cookies, appropriate SameSite settings, and CSRF protection
for cookie-authenticated mutations.

Mobile:
short-lived access tokens with secure refresh-token storage.

Store server-side session or refresh-token identifiers in a revocable form.
Apply rate limits and account-enumeration protections.

## Authorisation

Roles:

- MEMBER.
- SUPPORT.
- CONTENT_EDITOR.
- FITNESS_REVIEWER.
- NUTRITION_REVIEWER.
- ADMIN.

Enforce roles and resource ownership on every endpoint.

Support should see operational metadata by default, not private photos,
nutrition histories, or screening answers.

Reviewer qualifications are owner-managed records.
A software role alone is not a professional credential.

## Sensitive information

Collect only information required for enabled features.

- Private object storage.
- Short-lived authorised media URLs.
- Encryption in transit and configured encryption at rest.
- Redacted logs.
- Separate credentials for environments.
- Least-privilege database and storage accounts.
- Audit records for privileged actions.
- No raw health profile in product analytics.
- No advertising targeting from health information.

## Offline workouts

Persist local sessions and append local events with stable event IDs.

Each event includes:
clientEventId, userId, sessionId, entityId, baseVersion,
occurredAt, capturedTimeZone, payload.

On reconnect:
submit pending events, deduplicate by event ID, and reconcile with
server versions.

Use optimistic concurrency for conflicting edits.
Return an explicit conflict instead of silently overwriting another device.

Clients can display provisional XP, clearly labelled pending sync.
Only the server finalises XP.

Clear account-associated local caches on logout and deletion.
Keep sensitive offline data minimal.

## Transactions and outbox

Workout completion, eligible XP award, and outbox event creation happen
in one database transaction.

Workers may retry.
Consumers must be idempotent.

Use PostgreSQL as the durable source of truth.
Redis loss must not destroy workout history or earned progression.

## Uploads

Restrict size and MIME type.
Verify content rather than trusting file extensions.
Use random storage keys and ownership checks.
Scan or safely process uploads before publication.
Do not accept arbitrary server-fetch URLs that enable SSRF.

## Deletion

Re-authenticate before destructive account actions.

Immediately revoke sessions and stop future notifications.
Process associated private objects, personal records, and provider data
through a documented deletion workflow.

Define retention for limited legal/security records and backups.
Explain that backup expiry is separate from immediate account removal.

## Observability

Record:
request ID, operation, timing, result code, provider state,
queue age, and relevant non-sensitive identifiers.

Monitor:
API failures, queue lag, dead-letter jobs, failed synchronisation,
invalid tokens, content expiry, and failed deletions.

## Privacy release review

Create an owner-reviewed privacy notice, consent records, retention policy,
and incident process appropriate to launch territories.

Check applicable Indian data-protection requirements and any other target
markets at release time, including effective dates.

Do not claim regulatory compliance merely because these features exist.

File 11 — docs/09-data-model-and-api.md

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

File 12 — docs/10-ai-coach.md

# AI Coach

## Purpose

Provide supportive explanations, planning assistance, and conversational
navigation using the member's selected tone.

AI is an optional layer.
Core workouts, nutrition calculations, logging, and progression must work
without an AI provider.

## Allowed responsibilities

- Explain an existing plan.
- Summarise completed activity.
- Suggest a shorter approved session.
- Find eligible recipes.
- Explain meal swaps.
- Help the member choose a realistic schedule.
- Provide original motivational messages.
- Propose changes for member confirmation.

## Restricted responsibilities

The coach must not:

- Diagnose medical conditions.
- Prescribe medication.
- Override screening outcomes.
- Invent nutrient values.
- Remove allergies.
- Increase exercise despite pain warnings.
- Promise an anime physique.
- Invent authentic Dragon Ball quotations.
- Claim to be the actual character, actor, or a licensed clinician.
- Modify plans silently.
- Read another member's information.

## Architecture

Use a server-side provider adapter.

Inputs contain the minimum necessary context.
Exclude photos, full medical histories, credentials, and unnecessary
identifiers.

Retrieve only approved exercise, recipe, and content records.

Treat retrieved content and member text as data, not authority to change
system instructions.

## Structured response

Validate:

messageText.
tone.
referencedExerciseIds.
referencedRecipeIds.
referencedPlanVersion.
proposedAction.
safetyStatus.
limitations.

Verify all referenced records exist and are eligible.

Discard invalid output and use a deterministic fallback.
Do not display unchecked model-generated prescription numbers.

## Action proposals

Examples:

- RESCHEDULE_SESSION.
- SELECT_SHORT_SESSION.
- SWAP_MEAL.
- UPDATE_NEXT_WEEK_AVAILABILITY.

Store:
proposalId, userId, actionType, validatedPayload, sourceVersions,
expiresAt, status.

The member confirms changes.

On confirmation:
recheck permissions, source versions, eligibility, and idempotency.

Reject stale proposals with an explanation and regenerated preview.

## Tone examples

Optimistic:
"Let's make today's session fit the time you have."

Focused:
"Choose your session. Follow the plan. Record the work."

Calm:
"A demanding week can still include a manageable routine."

Do not use insults, threats, or guilt even when a direct tone is selected.

## Failure behaviour

- Timeout: show a concise fallback and preserve the request draft.
- Provider unavailable: allow existing plans and manual actions.
- Rate limit: explain availability without losing member input.
- Invalid structured output: fail safely and log a redacted reason.
- Missing context: ask a narrow question rather than guessing.

## Cost controls

Configurable:
daily request limits, maximum context size, output length,
timeout, and per-environment budget.

Track aggregate usage without logging unnecessary health content.

## Evaluation cases

- Member asks for an extreme starvation plan.
- Member reports pain during training.
- Vegetarian asks for protein meals.
- Egg allergy conflicts with eggetarian preference.
- Member has only ten minutes.
- Member requests a fabricated character quotation.
- Prompt injection appears inside recipe text.
- Member asks for another user's progress.
- Model returns a nonexistent exercise ID.
- Provider fails during a proposed plan change.

File 13 — docs/11-admin-and-analytics.md

# Administration and Analytics

## Administration sections

1. Overview.
2. Members and support.
3. Characters and content packs.
4. Exercise library.
5. Programme templates.
6. Food data and recipes.
7. Nutrition policies.
8. Media and rights.
9. Notification operations.
10. AI operations.
11. Feature configuration.
12. Audit and privacy jobs.

## Content workflow

DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> WITHDRAWN.

Updates create a new version.

Review records contain:
reviewer identity, role, relevant credential reference where applicable,
review date, notes, and approved scope.

Do not auto-approve content during production seeding.

## Programme management

Administrators can:

- Create templates.
- Inspect eligibility rules.
- Preview against synthetic profiles.
- Review exercise substitutions.
- Inspect duration calculations.
- Publish versions.
- Withdraw unsafe or obsolete versions.
- See affected future plans.

Withdrawal must not erase historical session records.

## Recipe and food management

- Import traceable food records.
- Map aliases.
- Review raw/cooked state.
- Verify gram conversions.
- Inspect allergens and ingredient chains.
- Calculate recipe yield and portions.
- Preview diet eligibility.
- Publish recipe versions.
- Flag incomplete data.

Show why a recipe is excluded from a particular synthetic profile.

## Media management

- Upload and preview.
- Manage original/licensed classification.
- Attach rights evidence.
- Configure territories, platforms, and expiry.
- Show attribution.
- Withdraw assets.
- Inspect fallback coverage.

Show assets expiring within configurable periods.

## Notification operations

Inspect:

- Pending intents.
- Suppression reasons.
- Provider submission outcomes.
- Invalid tokens.
- Queue lag.
- Dead-letter jobs.

A test-send action must be explicitly triggered by an authorised operator
and target an identified test account.

Avoid a one-click broadcast to all members.
Campaigns require a concrete preview, audience definition, consent filters,
and confirmation.

## Support access

Support can inspect account state, app version, sync errors,
and integration status.

Sensitive member content requires a specific authorised support workflow
and audited access.

Do not provide unrestricted impersonation.

## Analytics definitions

Activation:
onboarding complete plus first eligible mission completed.

Weekly active member:
at least one meaningful training, meal, recovery, or planning action.

Training adherence:
completed planned training dose divided by the applicable scheduled dose,
with shortened sessions separately visible.

Retention:
returning cohort members performing a meaningful action.

Notification effectiveness:
interaction where observable, paired with opt-out and suppression rates.

Never treat provider acceptance as confirmed notification viewing.

## Privacy

Use pseudonymous analytics identifiers.
Exclude sensitive free text, photos, screening answers, and exact diet logs.

Corporate wellness dashboards are deferred.
If introduced, they must not expose individual employee health information.

## Operational configuration

Expose only safe configuration values.

Secrets belong in the deployment secret manager.
The admin portal can show configured/missing status, not secret values.

Audit configuration changes and permit rollback to a previous version.

File 14 — docs/12-seed-content.md

# Seed Content

## Separate development and production seeds

Development:
Synthetic users, sample histories, deterministic programmes,
mock provider responses, and original placeholder media.

Production:
Roles, permissions, configuration, and real content with genuine provenance.

Never create fake review or licence approvals in production.

Seed operations must be repeatable without duplicating records.
Do not reset existing member data.

## Synthetic profiles

Create at least these test personas:

1. Vegetarian corporate beginner, three 25-minute sessions, home dumbbells.
2. Eggetarian returning gym user, three 40-minute sessions.
3. Non-vegetarian intermediate user, four 50-minute sessions.
4. Vegan member with soy exclusion, two short home sessions.
5. Nonbinary member using habit-only nutrition and optional measurements.
6. Older adult using a reviewed low-impact adaptation fixture.
7. Member requiring supported seated activities.
8. Shift worker whose sleep window crosses ordinary working hours.
9. Member travelling between Asia/Kolkata and Europe/London.
10. Member whose screening requires professional guidance.

Use synthetic names and example-domain email addresses.
Do not seed the owner's real personal data from conversation memory.

## Exercise catalogue target

Provide at least 40 well-described draft exercise records across:

- Squat or suitable sit-to-stand patterns.
- Hip hinge.
- Horizontal push.
- Horizontal pull.
- Vertical push where appropriate.
- Vertical pull.
- Carry where appropriate.
- Core stability.
- Low-impact conditioning.
- Mobility.
- Supported seated movement.

Each record requires:
instructions, equipment, difficulty, duration assumptions,
restrictions, alternatives, and demonstration availability.

The catalogue must not consist only of names and muscle labels.

Do not invent missing demonstration URLs.

## Programme fixtures

Implement fixtures for the templates in the training specification.

Include examples where:

- Time is insufficient.
- Equipment is unavailable.
- Recovery prevents progression.
- A suitable substitution exists.
- No suitable substitution exists.
- Screening suppresses automated guidance.

## Recipe catalogue target

Create at least 36 draft recipes with ingredient-level data:

- 12 vegetarian.
- 8 eggetarian.
- 8 non-vegetarian.
- 8 vegan.

These counts describe primary catalogue groups.
Actual eligibility is calculated from ingredients.

Include Indian and practical office meals, such as:

Vegetarian:
paneer with roti, dal with rice, chana dishes, curd-based meals.

Eggetarian:
egg bhurji, egg wraps, boiled-egg meal combinations.

Non-vegetarian:
chicken and rice, chicken wraps, suitable fish meals.

Vegan:
tofu meals, lentil meals, chickpea bowls, soy-free alternatives.

Every nutrition value must come from a source record or a transparently
labelled synthetic calculation fixture.

Do not publish guessed macros as verified food data.

## Original motivational copy

Create at least 40 original entries covering:

- Starting.
- Returning after a break.
- Short sessions.
- Recovery.
- Work stress.
- Meal preparation.
- Consistency.
- Personal progress.

Use the original lines from the media specification as starting examples.

## Artwork

Create or use original, permitted assets for five archetypes.

The default interface must still work with abstract original illustrations
when character artwork is unavailable.

Do not create fake rights documents or claim placeholder artwork is licensed.

## Audio

Include small original or clearly permitted development audio samples with
provenance, attribution, and intended use recorded.

If audio is unavailable, provide a working silent player state and an
explicit sample-content requirement.

Do not add empty tracks that appear playable.

## Historical fixtures

Generate deterministic synthetic:

- Four weeks of workouts.
- Meal logs.
- Recovery checks.
- XP entries.
- Notification attempts.
- Plan changes.

Clearly label demo data in the UI.
Never mix synthetic records with a real member's account.

## Seed verification

Check:

- All referenced records exist.
- Diet filters behave correctly.
- No fabricated approval or rights evidence exists.
- Re-running seeds does not duplicate content.
- Production seed does not add demo members.

File 15 — docs/13-testing-and-acceptance.md

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

File 16 — docs/14-deployment-and-configuration.md

# Deployment and Configuration

## Local development

Provide Docker Compose services for:

- PostgreSQL.
- Redis.
- S3-compatible local object storage.
- Local email capture.

Provide documented scripts for:

- Installing dependencies.
- Starting infrastructure.
- Generating database clients.
- Applying development migrations.
- Seeding development fixtures.
- Running web, API, and worker.
- Starting the mobile development build.
- Running required checks.

The root README must state the exact commands after implementation.

Do not assume Docker is installed.
If unavailable, document connection alternatives without changing production
configuration or deleting existing resources.

## Environment separation

Support:

- development.
- test.
- staging.
- production.

Separate databases, storage buckets, notification credentials,
and AI budgets.

Do not run development seed users in production.

## Railway services

Provision or document:

1. web.
2. api.
3. worker.
4. PostgreSQL.
5. Redis.

Use private service networking where supported.
Expose only services that need public access.

Use private S3-compatible object storage for user uploads and restricted media.

Mobile application binaries are not deployed as Railway web services.

## Build requirements

Create production Dockerfiles or equivalent verified build configuration.

For a shared monorepo:

- Build from a context that includes required shared packages.
- Use service-specific build and start commands.
- Preserve lockfile-based dependency resolution.
- Do not exclude packages required at runtime.
- Run as a non-root user where practical.
- Bind HTTP services to 0.0.0.0 and the supplied PORT.

Check current Railway documentation before finalising service settings.

## Migrations

Use a single controlled migration job for each release.

Production uses migration deployment, not schema-reset commands.

Apply backward-compatible expansion migrations before new code.
Defer destructive contraction until older code no longer depends on it.

Do not run simultaneous uncontrolled migrations from every replica.

## Health checks

API:

- /health/live: process is alive.
- /health/ready: critical dependencies are usable.

Web:
health endpoint suitable for deployment checks.

Worker:
heartbeat and queue-processing visibility.
Avoid exposing administrative worker endpoints publicly.

A temporary optional provider outage must not make the whole API unready.

## Configuration catalogue

### Server only

DATABASE_URL
REDIS_URL

AUTH_SECRET
AUTH_ISSUER
AUTH_AUDIENCE

S3_ENDPOINT
S3_REGION
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
S3_PRIVATE_BUCKET

EMAIL_PROVIDER
EMAIL_FROM
EMAIL_API_KEY

PUSH_PROVIDER
EXPO_ACCESS_TOKEN

AI_PROVIDER
AI_API_KEY
AI_MODEL
AI_DAILY_BUDGET

FOOD_DATA_PROVIDER
USDA_API_KEY

CONTENT_MODE
APP_ENV
CORS_ALLOWED_ORIGINS
LOG_LEVEL

Only include variables actually used by the selected implementation.
Document any renamed or additional variables.

### Public client configuration

NEXT_PUBLIC_API_BASE_URL
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_PROJECT_ID

Public variables must contain no secrets.

### Native build configuration

Android package identifier.
iOS bundle identifier.
Expo/EAS project association where used.
Android push credentials.
Apple push credentials and entitlements.
Store-signing configuration.

Keep service-account secrets out of the application bundle.

## Provider fallback matrix

Email:
local capture in development; configured provider in production.

Push:
simulated inbox delivery in development; real provider when configured.

AI:
deterministic helpful fallback when disabled.

Food data:
traceable imported local catalogue; provider search when configured.

Media:
original available content; licensed pack when its assets and grants exist.

Storage:
local S3-compatible service in development; private object storage in production.

Fixture mode must be visible and impossible to mistake for successful
external delivery.

## Backups and recovery

Enable and document database backups.
Define initial recovery objectives with the owner.
Perform one staging restore exercise before launch.

Use object versioning or appropriate protection for critical media and
licence evidence.

Record how to restore application state without replaying external
notifications or duplicating XP.

## Release sequence

1. Required tests pass.
2. Production configuration validated.
3. Backup/recovery readiness checked.
4. Migration reviewed.
5. Staging deployed and smoke-tested.
6. Concrete release summary prepared.
7. Follow existing owner authorisation for production publishing.
8. Deploy migration and services in the documented order.
9. Verify key user journeys and worker processing.
10. Observe errors and queue lag.

## Rollback

Document rollback to the previous application image.

Database changes should permit that rollback where feasible.
Do not automatically reverse destructive migrations.

Pause affected workers if rollback would otherwise replay side effects.

## Costs

Do not invent current hosting or provider prices.

Provide a configurable cost worksheet covering:

- Web/API/worker resources.
- PostgreSQL and backups.
- Redis.
- Storage and egress.
- Email.
- AI usage.
- Mobile build/distribution accounts.
- Original or licensed content.

Populate current prices from provider sources when the owner requests a budget.

File 17 — docs/15-implementation-plan.md

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

File 18 — docs/16-decisions-and-dependencies.md

# Decisions and Dependencies

## Accepted starting assumptions

- Product working name: Saiyan Ascend.
- Audience: inclusive adult fitness, version 1 ages 18+.
- Platforms: Android, iOS, and responsive member web.
- Administration: web.
- Backend hosting preference: Railway.
- Primary language: English.
- Initial food emphasis: Indian and practical international options.
- Unit storage: metric.
- Display units: member-selectable where implemented.
- Pilot monetisation: free.
- Core planning: deterministic rules.
- AI coaching: optional.
- Calendar and wearables: deferred.
- User notifications: opt-in.
- Progress photos: optional and private.
- Original content: immediately usable once appropriately sourced.
- DBZ content: complete integration path with usage-specific rights records.

These are implementation assumptions, not claims that the owner has already
purchased services or licensed franchise content.

## Owner dependencies

| Dependency | Needed for | Continue without it |
| --- | --- | --- |
| Final brand/domain | Public branding | Use working branding |
| DBZ commercial permissions | Franchise publication | Build complete system with original content |
| Approved artwork and dialogue | Authentic character experience | Original visuals and copy |
| Music rights and files | Full in-app soundtrack | Original permitted samples or external links |
| Exercise/programme review | Public automated training guidance | Draft templates and labelled fixtures |
| Nutrition-policy review | Public automated nutrition targets | Habit mode and draft calculations |
| Food-data credentials/import | Expanded food search | Traceable local catalogue |
| Email provider | Production account email | Local email capture |
| Mobile push configuration | Real push delivery | Inbox and simulation |
| AI key and budget | Generative coach | Deterministic fallback |
| Object storage | Production private uploads | Local development storage |
| Railway project access | Hosted deployment | Docker and deployment files |
| Apple/Google developer setup | Store distribution | Development builds |
| Privacy contact and policies | Public operation | Draft operational documents |

## How to request a dependency

When a dependency becomes necessary, provide:

1. The implemented feature it enables.
2. The current fallback.
3. The exact credential, file, or owner decision required.
4. Where the owner should configure it securely.
5. The verification that will follow.

Do not ask for the same item repeatedly.
Do not treat optional AI or franchise-media availability as a blocker to
the rest of the application.

## Owner decisions that can remain open during development

- Final product name.
- Exact launch territories.
- Licensed character availability.
- Original artwork style.
- Final approved programme catalogue.
- Commercial subscription structure.
- Additional languages.
- Timing of wearable and calendar integrations.

## Material constraints

- Fictional character physiques are not achievable-outcome guarantees.
- Adult general-wellness logic is not a universal medical programme.
- An app role does not establish professional qualifications.
- A rights checkbox does not create a licence.
- A streaming subscription does not automatically permit music reuse.
- Push notifications are subject to permissions, device state, and delivery limits.
- Railway deployment does not publish mobile applications to stores.
- Provider integrations require real credentials and verification.
- Database correctness cannot be established by UI demonstrations alone.

## Change control

If the owner changes a decision:

- Record the change and date.
- Identify affected specifications.
- Update only relevant future behaviour.
- Preserve historical member records.
- Adjust the implementation plan.
- Explain material consequences concisely.

## Implementation status template

For every dependency record:

ID:
Description:
Status: NOT_NEEDED / PENDING / CONFIGURED / VERIFIED / BLOCKED
Affected feature:
Current fallback:
Owner action:
Secure configuration location:
Verification required:
Last checked:
Notes:
all 18 files in md format with initial and cursor prompt 

I can’t attach downloadable files because the file workspace is unavailable. This setup creates all 18 .md files, plus START_HERE.md, CURSOR_PROMPT.md, and a ZIP on your Windows computer.

Open PowerShell in your preferred project folder and paste the script below.
When it pauses, copy my previous response containing all 18 specifications, then return to PowerShell and press Enter.
Open the generated folder in Cursor and use CURSOR_PROMPT.md.
& {
    $ErrorActionPreference = 'Stop'

    [void](Read-Host 'Copy the previous ChatGPT response containing all 18 files, then press Enter')

    $specificationText = Get-Clipboard -Raw

    if ([string]::IsNullOrWhiteSpace($specificationText)) {
        throw 'Clipboard is empty. Copy the complete previous specification response.'
    }

    $markdownPattern = '(?ms)^```markdown[ \t]*\r?\n(.*?)^```[ \t]*(?:\r?\n|$)'
    $markdownBlocks = [regex]::Matches(
        $specificationText,
        $markdownPattern
    )

    $projectFiles = @(
        'README.md'
        'AGENTS.md'
        'docs/01-product-and-scope.md'
        'docs/02-user-flows-and-design.md'
        'docs/03-character-and-progression.md'
        'docs/04-personalization-and-training.md'
        'docs/05-nutrition-and-meal-planning.md'
        'docs/06-media-and-content.md'
        'docs/07-notifications-and-work-life.md'
        'docs/08-architecture-and-security.md'
        'docs/09-data-model-and-api.md'
        'docs/10-ai-coach.md'
        'docs/11-admin-and-analytics.md'
        'docs/12-seed-content.md'
        'docs/13-testing-and-acceptance.md'
        'docs/14-deployment-and-configuration.md'
        'docs/15-implementation-plan.md'
        'docs/16-decisions-and-dependencies.md'
    )

    if ($markdownBlocks.Count -ne $projectFiles.Count) {
        throw "Expected 18 Markdown blocks; found $($markdownBlocks.Count). Use the Copy button on the complete previous 18-file response."
    }

    $uniqueSuffix = [Guid]::NewGuid().ToString('N').Substring(0, 8)
    $projectFolder = Join-Path `
        (Get-Location).Path `
        "saiyan-ascend-cursor-pack-$uniqueSuffix"

    [void][System.IO.Directory]::CreateDirectory($projectFolder)

    $utf8Encoding = New-Object System.Text.UTF8Encoding -ArgumentList $false

    for ($index = 0; $index -lt $projectFiles.Count; $index++) {
        $destination = Join-Path $projectFolder $projectFiles[$index]
        $parentDirectory = [System.IO.Path]::GetDirectoryName($destination)

        [void][System.IO.Directory]::CreateDirectory($parentDirectory)

        $fileContent = $markdownBlocks[$index].Groups[1].Value.TrimEnd()
        $fileContent += [Environment]::NewLine

        [System.IO.File]::WriteAllText(
            $destination,
            $fileContent,
            $utf8Encoding
        )
    }

    $additionalFiles = [ordered]@{
        'START_HERE.md' = @'
# Start Here — Saiyan Ascend

## What this pack contains

- 18 project specification Markdown files.
- This initial setup guide.
- CURSOR_PROMPT.md containing the implementation prompt.

This is a specification pack. Cursor will create the application code.

## Initial setup

1. Open this folder as a project in Cursor.
2. Open Cursor Agent.
3. Copy the complete contents of CURSOR_PROMPT.md into Agent.
4. Let Cursor inspect the folder and read the specifications.
5. Cursor should initialise the project and begin implementation.

For a new application, use this folder as the project root.

For an existing application, ask Cursor to inspect that repository and
incorporate the specification without overwriting existing instructions,
application code, or unrelated changes.

## Intended application

- Android and iOS fitness application.
- Responsive member web application.
- Web administration portal.
- Personalised training and meals.
- Vegetarian, eggetarian, non-vegetarian, and vegan support.
- Character-inspired motivation and progression.
- Images, quotations, music, and personal notifications.
- Railway-hosted backend, web application, database, and workers.

## Important starting decisions

- Working name: Saiyan Ascend.
- Version 1: adults aged 18 and above, inclusive of all genders.
- Any gender can choose any available character.
- Character choice affects motivation and emphasis.
- Fitness restrictions and dietary requirements remain authoritative.
- Original content keeps development functional.
- Authentic Dragon Ball content uses the licensed content-pack workflow.
- Core features work without an AI provider.

## Progress tracking

Cursor must create and maintain:

docs/BUILD_STATUS.md

It should record:

- Current milestone.
- Completed functionality.
- Actual test results.
- Missing dependencies.
- Known limitations.
- Next implementation step.

## Credentials

Configure secrets through local environment files or the hosting provider.

Do not put passwords, API keys, service-account credentials, or signing
secrets into Markdown specifications, source control, or ordinary chat.

Cursor should explain exactly which credential is needed when a particular
integration reaches that stage.

Missing optional integrations must not stop unrelated development.

## Running the finished application

Cursor must add exact verified commands to README.md for:

- Dependency installation.
- Local infrastructure.
- Database migrations.
- Development seed data.
- Web/API/worker startup.
- Mobile development builds.
- Required tests.
- Production builds.

Do not assume commands exist until Cursor implements and verifies them.

## Deployment

Cursor must prepare Railway and native build configuration.

Public deployment and app-store submission follow the owner's deployment
authorisation. Preparing the deployable release is part of implementation.
'@

        'CURSOR_PROMPT.md' = @'
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
'@
    }

    foreach ($fileEntry in $additionalFiles.GetEnumerator()) {
        $destination = Join-Path $projectFolder $fileEntry.Key

        [System.IO.File]::WriteAllText(
            $destination,
            $fileEntry.Value.TrimEnd() + [Environment]::NewLine,
            $utf8Encoding
        )
    }

    $zipPath = "$projectFolder.zip"

    Compress-Archive `
        -LiteralPath $projectFolder `
        -DestinationPath $zipPath

    Write-Host ''
    Write-Host 'Created 20 Markdown files: 18 specifications + 2 setup files.'
    Write-Host "Project folder: $projectFolder"
    Write-Host "ZIP: $zipPath"
    Write-Host 'Open the project folder in Cursor, then use CURSOR_PROMPT.md.'
}