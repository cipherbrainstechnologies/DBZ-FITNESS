import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertCharacterCannotOverrideScreening,
  characterMayBiasTrainingEmphasis,
  resolveScreeningOutcome,
} from './outcomes.ts';

describe('resolveScreeningOutcome', () => {
  it('returns CLEAR when no restricting signals are present', () => {
    const result = resolveScreeningOutcome({});
    assert.equal(result.outcome, 'CLEAR');
    assert.deepEqual(result.restrictions, []);
  });

  it('maps movement adaptations to ADAPTATIONS_REQUIRED', () => {
    const result = resolveScreeningOutcome({ requiresMovementAdaptations: true });
    assert.equal(result.outcome, 'ADAPTATIONS_REQUIRED');
    assert.ok(result.restrictions.includes('ADAPTATIONS_REQUIRED'));
  });

  it('maps urgent chest pain to SPECIALIST_SUPPORT', () => {
    const result = resolveScreeningOutcome({ reportsChestPain: true });
    assert.equal(result.outcome, 'SPECIALIST_SUPPORT');
    assert.ok(result.restrictions.includes('CHEST_PAIN_REPORTED'));
  });

  it('does not let character remove restrictions', () => {
    const gate = assertCharacterCannotOverrideScreening('SPECIALIST_SUPPORT', [
      'SPECIALIST_SUPPORT_REQUIRED',
    ]);
    assert.equal(gate.allowed, false);
  });

  it('blocks training emphasis bias under specialist support', () => {
    assert.equal(characterMayBiasTrainingEmphasis('SPECIALIST_SUPPORT'), false);
    assert.equal(characterMayBiasTrainingEmphasis('CLEAR'), true);
  });
});
