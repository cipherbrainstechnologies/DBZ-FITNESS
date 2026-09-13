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
