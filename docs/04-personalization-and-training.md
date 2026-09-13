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
