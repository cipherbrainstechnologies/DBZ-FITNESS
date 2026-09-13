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
