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
