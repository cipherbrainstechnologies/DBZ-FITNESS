import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  evaluateSavedCoachValidity,
  pathForAuthenticatedJourney,
  resolveAuthenticatedMemberJourney,
} from './journey.ts';

describe('resolveAuthenticatedMemberJourney', () => {
  it('sends members without consent/welcome to onboarding first', () => {
    assert.equal(
      resolveAuthenticatedMemberJourney({
        welcomeComplete: false,
        hasValidCoachSelection: false,
        coachReplacementRequired: false,
        onboardingComplete: false,
      }),
      'RESUME_ONBOARDING',
    );
  });

  it('sends authenticated members without a coach to selection', () => {
    assert.equal(
      resolveAuthenticatedMemberJourney({
        welcomeComplete: true,
        hasValidCoachSelection: false,
        coachReplacementRequired: false,
        onboardingComplete: false,
      }),
      'SELECT_COACH',
    );
  });

  it('does not force selection when a valid coach is saved', () => {
    assert.equal(
      resolveAuthenticatedMemberJourney({
        welcomeComplete: true,
        hasValidCoachSelection: true,
        coachReplacementRequired: false,
        onboardingComplete: true,
      }),
      'TODAY',
    );
  });

  it('resumes fitness onboarding after a coach is saved', () => {
    assert.equal(
      resolveAuthenticatedMemberJourney({
        welcomeComplete: true,
        hasValidCoachSelection: true,
        coachReplacementRequired: false,
        onboardingComplete: false,
      }),
      'RESUME_ONBOARDING',
    );
  });

  it('asks for a replacement when the saved coach is withdrawn', () => {
    assert.equal(
      resolveAuthenticatedMemberJourney({
        welcomeComplete: true,
        hasValidCoachSelection: false,
        coachReplacementRequired: true,
        onboardingComplete: true,
      }),
      'SELECT_COACH',
    );
  });

  it('maps destinations to stable paths', () => {
    assert.equal(pathForAuthenticatedJourney('SELECT_COACH'), '/app/coach');
    assert.equal(pathForAuthenticatedJourney('RESUME_ONBOARDING'), '/app/onboarding');
    assert.equal(pathForAuthenticatedJourney('TODAY'), '/app');
  });
});

describe('evaluateSavedCoachValidity', () => {
  it('does not invent a default when nothing is saved', () => {
    assert.deepEqual(evaluateSavedCoachValidity({ hasSelection: false, publicationStatus: null }), {
      hasValidCoachSelection: false,
      coachReplacementRequired: false,
    });
  });

  it('keeps a published selection valid even without artwork metadata', () => {
    assert.deepEqual(
      evaluateSavedCoachValidity({ hasSelection: true, publicationStatus: 'PUBLISHED' }),
      { hasValidCoachSelection: true, coachReplacementRequired: false },
    );
  });

  it('requires replacement only when the presentation is not selectable', () => {
    assert.equal(
      evaluateSavedCoachValidity({ hasSelection: true, publicationStatus: 'WITHDRAWN' })
        .coachReplacementRequired,
      true,
    );
  });
});
