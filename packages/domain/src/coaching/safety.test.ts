import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  evaluateCoachProposalSafety,
  COACH_UNSAFE_ACTION_TYPES,
} from './safety.ts';

describe('evaluateCoachProposalSafety', () => {
  const base = {
    screeningOutcome: 'CLEAR' as const,
    allergies: ['EGG'],
    dietaryPattern: 'VEGETARIAN',
  };

  it('allows safe short-session proposals', () => {
    const result = evaluateCoachProposalSafety({
      ...base,
      actionType: 'SELECT_SHORT_SESSION',
      payload: { reason: 'busy_day', maxMinutes: 10 },
    });
    assert.equal(result.allowed, true);
  });

  it('rejects explicit unsafe action types', () => {
    for (const actionType of COACH_UNSAFE_ACTION_TYPES) {
      const result = evaluateCoachProposalSafety({
        ...base,
        actionType,
        payload: {},
      });
      assert.equal(result.allowed, false, actionType);
      assert.ok(result.reasons.includes('UNSAFE_ACTION_TYPE'));
    }
  });

  it('rejects screening bypass payloads', () => {
    const result = evaluateCoachProposalSafety({
      ...base,
      actionType: 'RESCHEDULE_SESSION',
      payload: { overrideScreening: true },
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes('SCREENING_BYPASS_REJECTED'));
  });

  it('rejects allergy / diet hard-rule bypasses', () => {
    const allergy = evaluateCoachProposalSafety({
      ...base,
      actionType: 'SWAP_MEAL',
      payload: { removeAllergies: ['EGG'] },
    });
    assert.equal(allergy.allowed, false);
    assert.ok(allergy.reasons.includes('ALLERGY_REMOVAL_REJECTED'));

    const diet = evaluateCoachProposalSafety({
      ...base,
      actionType: 'SWAP_MEAL',
      payload: { ignoreDietPattern: true },
    });
    assert.equal(diet.allowed, false);
    assert.ok(diet.reasons.includes('DIET_PATTERN_BYPASS_REJECTED'));
  });

  it('rejects invented nutrition payloads', () => {
    const result = evaluateCoachProposalSafety({
      ...base,
      actionType: 'SWAP_MEAL',
      payload: { fabricatedKcal: 500 },
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes('INVENTED_NUTRITION_REJECTED'));
  });

  it('blocks training actions when screening pauses automated guidance', () => {
    const result = evaluateCoachProposalSafety({
      ...base,
      screeningOutcome: 'TEMPORARY_TRAINING_PAUSE',
      actionType: 'SELECT_SHORT_SESSION',
      payload: { reason: 'busy_day' },
    });
    assert.equal(result.allowed, false);
    assert.ok(result.reasons.includes('SCREENING_BLOCKS_AUTOMATED_TRAINING_ACTION'));
  });
});
