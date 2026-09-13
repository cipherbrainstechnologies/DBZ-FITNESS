import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_DAILY_MOTIVATIONAL_CAP,
  evaluateDailyCap,
  evaluateDispatchEligibility,
  isWithinQuietHours,
  localDateInTimeZone,
  localScheduleToUtc,
  localTimeHhMmInTimeZone,
  parseHhMmToMinutes,
} from './scheduling.ts';

describe('quiet hours', () => {
  it('handles overnight window 22:00–08:00', () => {
    assert.equal(
      isWithinQuietHours({
        quietHoursStartLocal: '22:00',
        quietHoursEndLocal: '08:00',
        localTimeHhMm: '23:30',
      }),
      true,
    );
    assert.equal(
      isWithinQuietHours({
        quietHoursStartLocal: '22:00',
        quietHoursEndLocal: '08:00',
        localTimeHhMm: '07:59',
      }),
      true,
    );
    assert.equal(
      isWithinQuietHours({
        quietHoursStartLocal: '22:00',
        quietHoursEndLocal: '08:00',
        localTimeHhMm: '08:00',
      }),
      false,
    );
    assert.equal(
      isWithinQuietHours({
        quietHoursStartLocal: '22:00',
        quietHoursEndLocal: '08:00',
        localTimeHhMm: '12:00',
      }),
      false,
    );
  });

  it('prefers sleep window for shift workers', () => {
    assert.equal(
      isWithinQuietHours({
        quietHoursStartLocal: '22:00',
        quietHoursEndLocal: '08:00',
        sleepWindowStartLocal: '08:00',
        sleepWindowEndLocal: '16:00',
        localTimeHhMm: '10:00',
      }),
      true,
    );
    assert.equal(
      isWithinQuietHours({
        quietHoursStartLocal: '22:00',
        quietHoursEndLocal: '08:00',
        sleepWindowStartLocal: '08:00',
        sleepWindowEndLocal: '16:00',
        localTimeHhMm: '23:00',
      }),
      false,
    );
  });
});

describe('daily cap', () => {
  it('defaults motivational cap to 3 and excludes account security', () => {
    assert.equal(DEFAULT_DAILY_MOTIVATIONAL_CAP, 3);
    const blocked = evaluateDailyCap({
      category: 'MOTIVATION',
      alreadySentMotivationalToday: 3,
      dailyReminderCap: 3,
    });
    assert.equal(blocked.allowed, false);

    const security = evaluateDailyCap({
      category: 'ACCOUNT_SECURITY',
      alreadySentMotivationalToday: 99,
      dailyReminderCap: 3,
    });
    assert.equal(security.allowed, true);
    assert.equal(security.countsTowardCap, false);
  });
});

describe('timezone scheduling', () => {
  it('parses HH:mm and formats local date in a zone', () => {
    assert.equal(parseHhMmToMinutes('09:30'), 9 * 60 + 30);
    assert.equal(parseHhMmToMinutes('24:00'), null);
    const utcNoon = new Date('2026-09-13T12:00:00Z');
    assert.equal(localDateInTimeZone('UTC', utcNoon), '2026-09-13');
    assert.equal(localTimeHhMmInTimeZone('UTC', utcNoon), '12:00');
  });

  it('maps Asia/Kolkata local schedule to the expected UTC instant', () => {
    const utc = localScheduleToUtc({
      localDate: '2026-09-13',
      localTimeHhMm: '18:30',
      timeZone: 'Asia/Kolkata',
    });
    assert.ok(utc);
    // 18:30 IST = 13:00 UTC
    assert.equal(utc!.toISOString(), '2026-09-13T13:00:00.000Z');
  });
});

describe('evaluateDispatchEligibility', () => {
  it('suppresses during quiet hours and when paused or capped', () => {
    const quiet = evaluateDispatchEligibility({
      category: 'MOTIVATION',
      categoriesEnabled: { MOTIVATION: true },
      quietHoursStartLocal: '22:00',
      quietHoursEndLocal: '08:00',
      timeZone: 'UTC',
      alreadySentMotivationalToday: 0,
      dailyReminderCap: 3,
      now: new Date('2026-09-13T23:00:00Z'),
    });
    assert.equal(quiet.eligible, false);
    assert.ok(quiet.reasons.includes('QUIET_HOURS'));

    const capped = evaluateDispatchEligibility({
      category: 'MEAL_REMINDER',
      categoriesEnabled: { MEAL_REMINDER: true },
      quietHoursStartLocal: '22:00',
      quietHoursEndLocal: '08:00',
      timeZone: 'UTC',
      alreadySentMotivationalToday: 3,
      dailyReminderCap: 3,
      now: new Date('2026-09-13T12:00:00Z'),
    });
    assert.equal(capped.eligible, false);
    assert.ok(capped.reasons.includes('DAILY_CAP_REACHED'));
  });
});
