import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyXpAward,
  applyXpCap,
  computeGameLevel,
  XP_CATEGORY_CAPS,
  XP_DAILY_MAXIMUM,
  XP_PER_LEVEL,
  XP_POLICY_VERSION,
} from './xp-cap.ts';

describe('applyXpCap', () => {
  it('awards full main-mission XP when under caps', () => {
    const result = applyXpCap({
      category: 'MAIN_MISSION',
      alreadyAwardedInCategory: 0,
      alreadyAwardedDailyTotal: 0,
      requestedDelta: 50,
    });
    assert.equal(result.awarded, 50);
    assert.equal(result.cappedBy, 'NONE');
  });

  it('enforces category cap once per local date', () => {
    const result = applyXpCap({
      category: 'MAIN_MISSION',
      alreadyAwardedInCategory: XP_CATEGORY_CAPS.MAIN_MISSION,
      alreadyAwardedDailyTotal: 50,
      requestedDelta: 50,
    });
    assert.equal(result.awarded, 0);
    assert.equal(result.cappedBy, 'CATEGORY');
  });

  it('enforces daily maximum across categories', () => {
    const result = applyXpCap({
      category: 'WELLBEING_HABIT',
      alreadyAwardedInCategory: 0,
      alreadyAwardedDailyTotal: XP_DAILY_MAXIMUM,
      requestedDelta: 20,
    });
    assert.equal(result.awarded, 0);
    assert.equal(result.cappedBy, 'DAILY');
  });

  it('partially awards when daily remaining is smaller than request', () => {
    const result = applyXpCap({
      category: 'WELLBEING_HABIT',
      alreadyAwardedInCategory: 0,
      alreadyAwardedDailyTotal: 90,
      requestedDelta: 20,
    });
    assert.equal(result.awarded, 10);
    assert.equal(result.cappedBy, 'DAILY');
  });
});

describe('applyXpAward', () => {
  it('awards workout complete as main mission under caps', () => {
    const result = applyXpAward({
      eventType: 'WORKOUT_COMPLETE',
      sourceEntityId: 'workout-1',
      existingSourceAwarded: false,
      alreadyAwardedInCategory: 0,
      alreadyAwardedDailyTotal: 0,
    });
    assert.equal(result.status, 'AWARDED');
    assert.equal(result.awarded, 50);
    assert.equal(result.category, 'MAIN_MISSION');
    assert.equal(result.policyVersion, XP_POLICY_VERSION);
  });

  it('awards rest mission as main mission (sustainable consistency)', () => {
    const result = applyXpAward({
      eventType: 'REST_MISSION',
      sourceEntityId: 'planned-rest-1',
      existingSourceAwarded: false,
      alreadyAwardedInCategory: 0,
      alreadyAwardedDailyTotal: 0,
    });
    assert.equal(result.status, 'AWARDED');
    assert.equal(result.awarded, 50);
    assert.equal(result.category, 'MAIN_MISSION');
  });

  it('rejects duplicate source event at domain level', () => {
    const result = applyXpAward({
      eventType: 'WORKOUT_COMPLETE',
      sourceEntityId: 'workout-1',
      existingSourceAwarded: true,
      alreadyAwardedInCategory: 0,
      alreadyAwardedDailyTotal: 0,
    });
    assert.equal(result.status, 'REJECTED_DUPLICATE_SOURCE');
    assert.equal(result.awarded, 0);
    assert.equal(result.reason, 'DUPLICATE_SOURCE_EVENT');
  });

  it('rejects starvation and pain-related event types', () => {
    for (const eventType of [
      'STARVATION',
      'CALORIE_RESTRICTION',
      'PAIN_TOLERANCE',
      'EXERCISE_THROUGH_PAIN',
      'WEIGHT_LOSS',
      'EXCESS_VOLUME',
    ]) {
      const result = applyXpAward({
        eventType,
        sourceEntityId: 'bad-1',
        existingSourceAwarded: false,
        alreadyAwardedInCategory: 0,
        alreadyAwardedDailyTotal: 0,
      });
      assert.equal(result.status, 'REJECTED_INELIGIBLE_EVENT');
      assert.equal(result.awarded, 0);
      assert.equal(result.reason, 'INELIGIBLE_EVENT_TYPE');
    }
  });

  it('does not award a second main mission via a different source once category is full', () => {
    const result = applyXpAward({
      eventType: 'WORKOUT_COMPLETE',
      sourceEntityId: 'workout-2',
      existingSourceAwarded: false,
      alreadyAwardedInCategory: 50,
      alreadyAwardedDailyTotal: 50,
    });
    assert.equal(result.status, 'CAPPED_TO_ZERO');
    assert.equal(result.awarded, 0);
  });

  it('requires a source entity id', () => {
    const result = applyXpAward({
      eventType: 'WORKOUT_COMPLETE',
      sourceEntityId: '   ',
      existingSourceAwarded: false,
      alreadyAwardedInCategory: 0,
      alreadyAwardedDailyTotal: 0,
    });
    assert.equal(result.status, 'REJECTED_INELIGIBLE_EVENT');
    assert.equal(result.reason, 'SOURCE_ENTITY_REQUIRED');
  });
});

describe('computeGameLevel', () => {
  it('starts at level 1 and steps every XP_PER_LEVEL', () => {
    assert.equal(computeGameLevel(0), 1);
    assert.equal(computeGameLevel(XP_PER_LEVEL - 1), 1);
    assert.equal(computeGameLevel(XP_PER_LEVEL), 2);
    assert.equal(computeGameLevel(XP_PER_LEVEL * 2), 3);
  });
});
