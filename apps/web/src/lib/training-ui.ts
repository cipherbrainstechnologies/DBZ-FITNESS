import type { PlannedSession } from '@saiyan/contracts';

import { localDateInTimeZone } from './api';

const STARTABLE = new Set(['PLANNED', 'SHORTENED', 'IN_PROGRESS']);

/** Prefer an in-progress session for the member's local today, else a startable one. */
export function pickTodaysPlannedSession(
  sessions: PlannedSession[],
  timeZone: string,
): PlannedSession | null {
  const today = localDateInTimeZone(timeZone);
  const forToday = sessions.filter((s) => s.localDate === today && STARTABLE.has(s.status));
  if (forToday.length === 0) return null;
  return (
    forToday.find((s) => s.status === 'IN_PROGRESS') ??
    forToday.find((s) => s.status === 'SHORTENED') ??
    forToday.find((s) => s.status === 'PLANNED') ??
    null
  );
}

export function isStartablePlannedSession(session: PlannedSession): boolean {
  return STARTABLE.has(session.status);
}

export function isShortenablePlannedSession(session: PlannedSession): boolean {
  return session.status === 'PLANNED' || session.status === 'SHORTENED';
}
