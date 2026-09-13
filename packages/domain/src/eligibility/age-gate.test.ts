import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ADULT_MINIMUM_AGE_YEARS,
  evaluateAdultAgeGate,
  isAdultEligible,
} from './age-gate.ts';

describe('evaluateAdultAgeGate', () => {
  it('allows members who are exactly 18 on the reference date', () => {
    const result = evaluateAdultAgeGate({
      dateOfBirth: '2008-09-13',
      asOfDate: '2026-09-13',
    });
    assert.equal(result.eligible, true);
    if (result.eligible) {
      assert.equal(result.ageYears, ADULT_MINIMUM_AGE_YEARS);
    }
  });

  it('rejects members one day before their 18th birthday', () => {
    const result = evaluateAdultAgeGate({
      dateOfBirth: '2008-09-14',
      asOfDate: '2026-09-13',
    });
    assert.equal(result.eligible, false);
    if (!result.eligible) {
      assert.equal(result.reason, 'UNDER_AGE');
      assert.equal(result.ageYears, 17);
    }
  });

  it('rejects invalid calendar dates', () => {
    const result = evaluateAdultAgeGate({
      dateOfBirth: '2000-02-30',
      asOfDate: '2026-09-13',
    });
    assert.equal(result.eligible, false);
    if (!result.eligible) {
      assert.equal(result.reason, 'INVALID_DATE');
    }
  });

  it('exposes isAdultEligible helper', () => {
    assert.equal(
      isAdultEligible({ dateOfBirth: '1990-01-01', asOfDate: '2026-09-13' }),
      true,
    );
    assert.equal(
      isAdultEligible({ dateOfBirth: '2015-01-01', asOfDate: '2026-09-13' }),
      false,
    );
  });
});
