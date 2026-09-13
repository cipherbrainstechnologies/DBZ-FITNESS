/**
 * Notification scheduling helpers — quiet hours, daily caps, timezone (docs/07).
 * Pure TypeScript; no Prisma / push SDKs.
 */

export const DEFAULT_DAILY_MOTIVATIONAL_CAP = 3;
export const DEFAULT_QUIET_HOURS_START = '22:00';
export const DEFAULT_QUIET_HOURS_END = '08:00';

export type NotificationCategoryValue =
  | 'WORKOUT_REMINDER'
  | 'MEAL_REMINDER'
  | 'WEEKLY_REVIEW'
  | 'MOVEMENT_BREAK'
  | 'MOTIVATION'
  | 'ACCOUNT_SECURITY';

/** Categories that count toward the motivational daily cap. */
export const CAP_COUNTED_CATEGORIES: ReadonlySet<NotificationCategoryValue> =
  new Set([
    'WORKOUT_REMINDER',
    'MEAL_REMINDER',
    'WEEKLY_REVIEW',
    'MOVEMENT_BREAK',
    'MOTIVATION',
  ]);

export type QuietHoursInput = {
  /** Local wall-clock HH:mm (24h). */
  quietHoursStartLocal: string;
  quietHoursEndLocal: string;
  /** Optional sleep window overrides quiet hours for shift workers. */
  sleepWindowStartLocal?: string | null;
  sleepWindowEndLocal?: string | null;
  /** Local time being evaluated as HH:mm. */
  localTimeHhMm: string;
};

/**
 * Quiet hours crossing midnight (e.g. 22:00–08:00) are inside when
 * time >= start OR time < end. Same-day windows use start <= time < end.
 */
export function isWithinQuietHours(input: QuietHoursInput): boolean {
  const start =
    input.sleepWindowStartLocal?.trim() || input.quietHoursStartLocal;
  const end = input.sleepWindowEndLocal?.trim() || input.quietHoursEndLocal;
  return isWithinLocalWindow(input.localTimeHhMm, start, end);
}

export function isWithinLocalWindow(
  localTimeHhMm: string,
  startHhMm: string,
  endHhMm: string,
): boolean {
  const t = parseHhMmToMinutes(localTimeHhMm);
  const start = parseHhMmToMinutes(startHhMm);
  const end = parseHhMmToMinutes(endHhMm);
  if (t == null || start == null || end == null) {
    return false;
  }
  if (start === end) {
    // Degenerate: treat as always quiet (full-day pause).
    return true;
  }
  if (start < end) {
    return t >= start && t < end;
  }
  // Crosses midnight.
  return t >= start || t < end;
}

export function parseHhMmToMinutes(value: string): number | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

export type DailyCapInput = {
  category: NotificationCategoryValue;
  alreadySentMotivationalToday: number;
  dailyReminderCap: number;
};

export type DailyCapResult = {
  countsTowardCap: boolean;
  allowed: boolean;
  reason: string;
};

/**
 * Account security never counts toward the motivational cap.
 * When cap is reached, lower-priority motivational messages are dropped.
 */
export function evaluateDailyCap(input: DailyCapInput): DailyCapResult {
  const countsTowardCap = CAP_COUNTED_CATEGORIES.has(input.category);
  if (!countsTowardCap) {
    return {
      countsTowardCap: false,
      allowed: true,
      reason: 'ACCOUNT_SECURITY_EXCLUDED_FROM_CAP',
    };
  }
  const cap = Math.max(0, input.dailyReminderCap);
  if (input.alreadySentMotivationalToday >= cap) {
    return {
      countsTowardCap: true,
      allowed: false,
      reason: 'DAILY_CAP_REACHED',
    };
  }
  return {
    countsTowardCap: true,
    allowed: true,
    reason: 'UNDER_CAP',
  };
}

export type ScheduleLocalInput = {
  /** YYYY-MM-DD in the member's IANA zone. */
  localDate: string;
  /** HH:mm local wall clock. */
  localTimeHhMm: string;
  timeZone: string;
};

/**
 * Convert intended local schedule to a UTC Date.
 * DST: nonexistent local times move forward to the next valid minute;
 * repeated local times deliver once (first offset that matches).
 */
export function localScheduleToUtc(input: ScheduleLocalInput): Date | null {
  const minutes = parseHhMmToMinutes(input.localTimeHhMm);
  if (minutes == null) return null;
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.localDate);
  if (!dateMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  // Probe UTC candidates around the nominal civil time.
  const nominalUtcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const candidates: Date[] = [];
  for (let offsetHours = -14; offsetHours <= 14; offsetHours += 1) {
    candidates.push(new Date(nominalUtcGuess - offsetHours * 3_600_000));
  }
  // Also try half-hour offsets common in some zones.
  for (let offsetMinutes = -14 * 60; offsetMinutes <= 14 * 60; offsetMinutes += 30) {
    candidates.push(new Date(nominalUtcGuess - offsetMinutes * 60_000));
  }

  const matches: Date[] = [];
  for (const candidate of candidates) {
    const parts = getZonedParts(candidate, input.timeZone);
    if (
      parts &&
      parts.year === year &&
      parts.month === month &&
      parts.day === day &&
      parts.hour === hour &&
      parts.minute === minute
    ) {
      matches.push(candidate);
    }
  }

  if (matches.length > 0) {
    // Repeated local time (fall-back): deliver once — earliest UTC.
    matches.sort((a, b) => a.getTime() - b.getTime());
    return matches[0]!;
  }

  // Nonexistent local time (spring-forward): move to next valid local minute.
  for (let add = 1; add <= 120; add += 1) {
    const advancedMinutes = minutes + add;
    const dayOffset = Math.floor(advancedMinutes / (24 * 60));
    const rem = ((advancedMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const nextDate = addCalendarDays(input.localDate, dayOffset);
    if (!nextDate) continue;
    const hh = String(Math.floor(rem / 60)).padStart(2, '0');
    const mm = String(rem % 60).padStart(2, '0');
    const resolved = localScheduleToUtc({
      localDate: nextDate,
      localTimeHhMm: `${hh}:${mm}`,
      timeZone: input.timeZone,
    });
    if (resolved) return resolved;
  }

  return null;
}

export function localDateInTimeZone(timeZone: string, at: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}

export function localTimeHhMmInTimeZone(
  timeZone: string,
  at: Date = new Date(),
): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  } catch {
    return at.toISOString().slice(11, 16);
  }
}

export type DispatchEligibilityInput = {
  category: NotificationCategoryValue;
  categoriesEnabled: Partial<Record<NotificationCategoryValue, boolean>>;
  pauseUntil?: Date | null;
  quietHoursStartLocal: string;
  quietHoursEndLocal: string;
  sleepWindowStartLocal?: string | null;
  sleepWindowEndLocal?: string | null;
  timeZone: string;
  alreadySentMotivationalToday: number;
  dailyReminderCap: number;
  expiresAt?: Date | null;
  now?: Date;
};

export type DispatchEligibilityResult = {
  eligible: boolean;
  reasons: string[];
};

/**
 * Recheck at dispatch time: pause, quiet hours, cap, expiry, category toggle.
 * Does not flush deferred reminders after quiet hours end.
 */
export function evaluateDispatchEligibility(
  input: DispatchEligibilityInput,
): DispatchEligibilityResult {
  const now = input.now ?? new Date();
  const reasons: string[] = [];

  if (input.pauseUntil != null && input.pauseUntil.getTime() > now.getTime()) {
    reasons.push('PAUSED');
  }
  if (input.expiresAt != null && input.expiresAt.getTime() <= now.getTime()) {
    reasons.push('EXPIRED');
  }

  const enabled = input.categoriesEnabled[input.category];
  if (enabled === false) {
    reasons.push('CATEGORY_DISABLED');
  }

  const localTime = localTimeHhMmInTimeZone(input.timeZone, now);
  const quietInput: QuietHoursInput = {
    quietHoursStartLocal: input.quietHoursStartLocal,
    quietHoursEndLocal: input.quietHoursEndLocal,
    localTimeHhMm: localTime,
  };
  if (input.sleepWindowStartLocal !== undefined) {
    quietInput.sleepWindowStartLocal = input.sleepWindowStartLocal;
  }
  if (input.sleepWindowEndLocal !== undefined) {
    quietInput.sleepWindowEndLocal = input.sleepWindowEndLocal;
  }
  if (isWithinQuietHours(quietInput)) {
    reasons.push('QUIET_HOURS');
  }

  const cap = evaluateDailyCap({
    category: input.category,
    alreadySentMotivationalToday: input.alreadySentMotivationalToday,
    dailyReminderCap: input.dailyReminderCap,
  });
  if (!cap.allowed) {
    reasons.push(cap.reason);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getZonedParts(at: Date, timeZone: string): ZonedParts | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value;
    const year = Number(get('year'));
    const month = Number(get('month'));
    const day = Number(get('day'));
    const hour = Number(get('hour'));
    const minute = Number(get('minute'));
    if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) {
      return null;
    }
    return { year, month, day, hour, minute };
  } catch {
    return null;
  }
}

function addCalendarDays(localDate: string, days: number): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) return null;
  const utc = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]) + days,
  );
  const d = new Date(utc);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
