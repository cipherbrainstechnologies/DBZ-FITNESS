import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canSaveOnboardingStep,
  isOnboardingComplete,
  missingStepsForComplete,
  nextIncompleteStep,
  withStepCompleted,
} from './steps.ts';

describe('onboarding step order', () => {
  it('allows saving the first incomplete step', () => {
    assert.equal(canSaveOnboardingStep('WELCOME', []), true);
    assert.equal(canSaveOnboardingStep('GOALS', []), false);
  });

  it('allows editing an already completed step', () => {
    assert.equal(canSaveOnboardingStep('WELCOME', ['WELCOME', 'GOALS']), true);
  });

  it('advances next incomplete after completion', () => {
    const completed = withStepCompleted([], 'WELCOME');
    assert.deepEqual(completed, ['WELCOME']);
    assert.equal(nextIncompleteStep(completed), 'GOALS');
  });

  it('requires core steps before complete', () => {
    const missing = missingStepsForComplete(['WELCOME']);
    assert.ok(missing.includes('SCREENING'));
    assert.ok(missing.includes('CHARACTER'));
    assert.equal(isOnboardingComplete([]), false);
  });
});
