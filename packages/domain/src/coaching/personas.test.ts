import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { composeCoachBriefing, COACH_PERSONAS, getCoachPersona } from './personas.ts';

describe('coach personas', () => {
  it('keeps Goku, Vegeta, Gohan, Future Trunks, and Broly as identities', () => {
    assert.equal(getCoachPersona('explorer').displayName, 'Goku');
    assert.equal(getCoachPersona('strategist').displayName, 'Vegeta');
    assert.equal(getCoachPersona('scholar').displayName, 'Gohan');
    assert.equal(getCoachPersona('guardian').displayName, 'Future Trunks');
    assert.equal(getCoachPersona('titan').displayName, 'Broly');
  });

  it('produces distinct busy-day copy per persona', () => {
    const keys = ['explorer', 'strategist', 'scholar', 'guardian', 'titan'] as const;
    const lines = keys.map(
      (archetypeKey) =>
        composeCoachBriefing({
          archetypeKey,
          displayName: getCoachPersona(archetypeKey).displayName,
          situation: 'BUSY_DAY',
          hasEligibleShortSession: true,
          hasPlannedSession: true,
          hasEligibleMealSwap: false,
          sessionMinutes: 15,
        }).messageText,
    );
    const unique = new Set(lines);
    assert.equal(unique.size, 5);
    assert.match(lines[0] ?? '', /fifteen minutes/i);
    assert.match(lines[1] ?? '', /controlled work/i);
    assert.match(lines[2] ?? '', /Work has taken a lot/i);
    assert.match(lines[3] ?? '', /schedule changed/i);
    assert.match(lines[4] ?? '', /Controlled movement/i);
  });

  it('does not claim a short session exists until the engine confirms it', () => {
    const result = composeCoachBriefing({
      archetypeKey: 'explorer',
      displayName: 'Goku',
      situation: 'BUSY_DAY',
      hasEligibleShortSession: false,
      hasPlannedSession: true,
      hasEligibleMealSwap: false,
    });
    assert.match(result.messageText, /will not assume a shorter session exists/i);
    assert.equal(result.action?.actionType, 'RESCHEDULE_SESSION');
    assert.equal(result.action?.appliedClaim, false);
  });

  it('describes missing logs as not logged rather than skipped', () => {
    const result = composeCoachBriefing({
      archetypeKey: 'titan',
      displayName: 'Broly',
      situation: 'UNLOGGED_WORKOUT',
      hasEligibleShortSession: false,
      hasPlannedSession: false,
      hasEligibleMealSwap: false,
    });
    assert.match(result.messageText, /don't see a workout logged yet/i);
    assert.equal(/skipped/i.test(result.messageText), false);
  });

  it('does not use authentic-quotation framing in persona copy', () => {
    for (const persona of Object.values(COACH_PERSONAS)) {
      assert.equal(/as goku (once )?said/i.test(persona.sampleGreeting), false);
      assert.equal(/official dragon ball/i.test(persona.coachingDescription), false);
    }
  });
});
