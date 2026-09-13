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
