'use client';

import type { PlannedSession } from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { TodayFuelSnippet } from '@/components/fuel/today-fuel-snippet';
import { TodayMediaStrip } from '@/components/media/today-media-strip';
import { TodayCoachBriefing } from '@/components/today-coach-briefing';
import { Link, useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';
import { pickTodaysPlannedSession } from '@/lib/training-ui';
import { isAdmin, useAuth } from '@/lib/auth-context';

type LoadState = 'loading' | 'ready' | 'error';
type ActionStatus = 'idle' | 'pending' | 'error';

export function TodayTrainingPanel() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [todaySession, setTodaySession] = useState<PlannedSession | null>(null);
  const [startStatus, setStartStatus] = useState<ActionStatus>('idle');
  const [startError, setStartError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    setLoadError(null);
    try {
      const [current, planned] = await Promise.all([
        api.getCurrentTrainingPlan(),
        api.listPlannedSessions(),
      ]);
      setHasPlan(Boolean(current.plan));
      setTodaySession(
        pickTodaysPlannedSession(planned.sessions, user.currentTimeZone || 'UTC'),
      );
      setLoadState('ready');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setLoadError(mapApiError(err, t).message);
      setLoadState('error');
    }
  }, [router, t, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleStart() {
    if (!todaySession) return;
    setStartStatus('pending');
    setStartError(null);
    try {
      await api.startWorkoutSession({ plannedSessionId: todaySession.id });
      router.push(`/app/train/session/${todaySession.id}`);
    } catch (err) {
      setStartStatus('error');
      setStartError(mapApiError(err, t).message);
    }
  }

  if (!user) return null;

  const nameSuffix = user.displayName
    ? t('today.greetingNamed', { name: user.displayName })
    : '';

  return (
    <section className="app-panel" aria-labelledby="today-title">
      <h1 id="today-title">{t('today.title')}</h1>
      <p>{t('today.greeting', { name: nameSuffix })}</p>

      <TodayCoachBriefing />

      {loadState === 'loading' ? (
        <div className="loading-block loading-block--compact" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>{t('today.training.loading')}</p>
        </div>
      ) : null}

      {loadState === 'error' ? (
        <div className="form-status" data-tone="error" role="alert">
          {loadError ?? t('errors.generic')}
        </div>
      ) : null}

      {loadState === 'ready' && todaySession ? (
        <div className="today-mission">
          <h2>{t('today.training.missionTitle')}</h2>
          <p className="note">
            {t('today.training.missionBody', {
              date: todaySession.localDate,
              minutes: todaySession.durationBudget,
            })}
          </p>
          <div className="cta-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={startStatus === 'pending'}
              onClick={() => void handleStart()}
            >
              {startStatus === 'pending'
                ? t('today.training.starting')
                : todaySession.status === 'IN_PROGRESS'
                  ? t('today.training.resume')
                  : t('today.training.start')}
            </button>
            <Link href="/app/train" className="btn btn-ghost">
              {t('today.training.openTrain')}
            </Link>
          </div>
          {startStatus === 'error' && startError ? (
            <div className="form-status" data-tone="error" role="alert">
              {startError}
            </div>
          ) : null}
        </div>
      ) : null}

      {loadState === 'ready' && !todaySession && !hasPlan ? (
        <div className="today-mission">
          <h2>{t('today.training.noPlanTitle')}</h2>
          <p className="note">{t('today.training.noPlanBody')}</p>
          <Link href="/app/train" className="btn btn-primary">
            {t('today.training.setupPlan')}
          </Link>
        </div>
      ) : null}

      {loadState === 'ready' && !todaySession && hasPlan ? (
        <div className="today-mission">
          <h2>{t('today.training.restTitle')}</h2>
          <p className="note">{t('today.training.restBody')}</p>
          <Link href="/app/train" className="btn btn-ghost">
            {t('today.training.openTrain')}
          </Link>
        </div>
      ) : null}

      <TodayFuelSnippet />

      <TodayMediaStrip />

      <p className="note">{t('today.noStats')}</p>

      <ul className="meta-list">
        <li>
          <strong>{t('today.signedInAs')}:</strong> {user.email}
        </li>
        <li>
          <strong>{t('today.roles')}:</strong> {user.roles.join(', ')}
        </li>
        <li>
          <strong>{t('today.locale')}:</strong> {user.locale}
        </li>
        <li>
          <strong>{t('today.timezone')}:</strong> {user.currentTimeZone}
        </li>
      </ul>

      {isAdmin(user) ? (
        <p>
          <Link href="/admin" className="btn btn-ghost">
            {t('today.openAdmin')}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
