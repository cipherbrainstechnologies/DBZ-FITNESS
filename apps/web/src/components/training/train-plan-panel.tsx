'use client';

import type {
  PlannedSession,
  PreviewTrainingPlanResponse,
  TrainingPlanSummary,
} from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { api, ApiClientError, newIdempotencyKey } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';
import {
  isShortenablePlannedSession,
  isStartablePlannedSession,
} from '@/lib/training-ui';
import { useAuth } from '@/lib/auth-context';

type LoadState = 'loading' | 'ready' | 'error';
type ActionStatus = 'idle' | 'pending' | 'success' | 'error';

function explainList(
  codes: string[],
  t: ReturnType<typeof useTranslations>,
): string[] {
  return codes.map((code) => {
    const key = `train.explanations.${code}`;
    if (t.has(key)) {
      return t(key);
    }
    // Template key codes like TEMPLATE_KEY:beginner_bw
    if (code.startsWith('TEMPLATE_KEY:')) {
      return t('train.explanations.TEMPLATE_KEY', {
        key: code.slice('TEMPLATE_KEY:'.length),
      });
    }
    return code;
  });
}

export function TrainPlanPanel() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [plan, setPlan] = useState<TrainingPlanSummary | null>(null);
  const [sessions, setSessions] = useState<PlannedSession[]>([]);

  const [preview, setPreview] = useState<PreviewTrainingPlanResponse | null>(null);
  const [previewStatus, setPreviewStatus] = useState<ActionStatus>('idle');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewSuccess, setPreviewSuccess] = useState<string | null>(null);

  const [activateStatus, setActivateStatus] = useState<ActionStatus>('idle');
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activateSuccess, setActivateSuccess] = useState<string | null>(null);

  const [sessionActionId, setSessionActionId] = useState<string | null>(null);
  const [sessionActionStatus, setSessionActionStatus] = useState<ActionStatus>('idle');
  const [sessionActionError, setSessionActionError] = useState<string | null>(null);
  const [shortenMinutes, setShortenMinutes] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    try {
      const [current, planned] = await Promise.all([
        api.getCurrentTrainingPlan(),
        api.listPlannedSessions(),
      ]);
      setPlan(current.plan);
      setSessions(planned.sessions);
      setLoadState('ready');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setLoadError(mapApiError(err, t).message);
      setLoadState('error');
    }
  }, [router, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handlePreview() {
    setPreviewStatus('pending');
    setPreviewError(null);
    setPreviewSuccess(null);
    setActivateStatus('idle');
    setActivateError(null);
    setActivateSuccess(null);

    try {
      const [me, { progress }] = await Promise.all([
        api.me(),
        api.getOnboarding(),
      ]);
      if (!me.profile?.id) {
        setPreviewStatus('error');
        setPreviewError(t('train.errors.missingProfile'));
        return;
      }
      if (!progress.screeningRecordId) {
        setPreviewStatus('error');
        setPreviewError(t('train.errors.missingScreening'));
        return;
      }

      const timeZone = me.user.currentTimeZone || user?.currentTimeZone || 'UTC';
      const startLocalDate = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const result = await api.previewTrainingPlan({
        profileVersionId: me.profile.id,
        screeningRecordId: progress.screeningRecordId,
        startLocalDate,
        timeZone,
      });
      setPreview(result);
      setPreviewStatus('success');
      setPreviewSuccess(t('train.preview.success'));
    } catch (err) {
      setPreviewStatus('error');
      setPreviewError(mapApiError(err, t).message);
    }
  }

  async function handleActivate() {
    if (!preview?.previewToken) {
      setActivateStatus('error');
      setActivateError(t('train.activate.noToken'));
      return;
    }
    setActivateStatus('pending');
    setActivateError(null);
    setActivateSuccess(null);
    try {
      const result = await api.activateTrainingPlan(
        { previewToken: preview.previewToken },
        newIdempotencyKey(),
      );
      setPlan(result.plan);
      setPreview(null);
      setActivateStatus('success');
      setActivateSuccess(t('train.activate.success'));
      await refresh();
    } catch (err) {
      setActivateStatus('error');
      setActivateError(mapApiError(err, t).message);
    }
  }

  async function handleStart(session: PlannedSession) {
    setSessionActionId(session.id);
    setSessionActionStatus('pending');
    setSessionActionError(null);
    try {
      await api.startWorkoutSession({ plannedSessionId: session.id });
      setSessionActionStatus('success');
      router.push(`/app/train/session/${session.id}`);
    } catch (err) {
      setSessionActionStatus('error');
      setSessionActionError(mapApiError(err, t).message);
    }
  }

  async function handleShorten(session: PlannedSession) {
    const minutes =
      shortenMinutes[session.id] ??
      Math.max(10, Math.min(session.durationBudget - 5, 20));
    setSessionActionId(session.id);
    setSessionActionStatus('pending');
    setSessionActionError(null);
    try {
      const { session: updated } = await api.shortenPlannedSession(session.id, {
        targetDurationMinutes: minutes,
      });
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setSessionActionStatus('success');
    } catch (err) {
      setSessionActionStatus('error');
      setSessionActionError(mapApiError(err, t).message);
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="loading-block" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>{t('train.loading')}</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <section className="app-panel" aria-labelledby="train-error-title">
        <h1 id="train-error-title">{t('train.title')}</h1>
        <div className="form-status" data-tone="error" role="alert">
          {loadError ?? t('errors.generic')}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void refresh()}>
          {t('train.retry')}
        </button>
      </section>
    );
  }

  const eligibilityLabel = preview
    ? t.has(`train.eligibility.${preview.eligibilityStatus}`)
      ? t(`train.eligibility.${preview.eligibilityStatus}`)
      : preview.eligibilityStatus
    : null;

  return (
    <section className="app-panel train-panel" aria-labelledby="train-title">
      <div className="train-header">
        <h1 id="train-title">{t('train.title')}</h1>
        <p className="note">{t('train.subtitle')}</p>
      </div>

      {plan ? (
        <div className="train-block">
          <h2>{t('train.current.title')}</h2>
          <ul className="meta-list">
            <li>
              <strong>{t('train.current.template')}:</strong> {plan.templateKey}{' '}
              (v{plan.templateVersion})
            </li>
            <li>
              <strong>{t('train.current.policy')}:</strong> {plan.policyVersion}
            </li>
            <li>
              <strong>{t('train.current.status')}:</strong> {plan.status}
            </li>
            <li>
              <strong>{t('train.current.effective')}:</strong>{' '}
              {new Date(plan.effectiveFrom).toLocaleString()}
            </li>
          </ul>
          {plan.explanationCodes.length > 0 ? (
            <ul className="explain-list" aria-label={t('train.explanationsLabel')}>
              {explainList(plan.explanationCodes, t).map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="train-block train-empty">
          <h2>{t('train.empty.title')}</h2>
          <p className="note">{t('train.empty.body')}</p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={previewStatus === 'pending'}
            onClick={() => void handlePreview()}
          >
            {previewStatus === 'pending'
              ? t('train.preview.pending')
              : t('train.preview.cta')}
          </button>
          {previewStatus === 'error' && previewError ? (
            <div className="form-status" data-tone="error" role="alert">
              {previewError}
            </div>
          ) : null}
          {previewStatus === 'success' && previewSuccess ? (
            <div className="form-status" data-tone="success" role="status">
              {previewSuccess}
            </div>
          ) : null}
        </div>
      )}

      {preview ? (
        <div className="train-block" aria-live="polite">
          <h2>{t('train.preview.resultTitle')}</h2>
          <p>
            <strong>{t('train.preview.eligibility')}:</strong> {eligibilityLabel}
          </p>
          <ul className="explain-list" aria-label={t('train.explanationsLabel')}>
            {explainList(preview.explanationCodes, t).map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
          {preview.warnings.length > 0 ? (
            <ul className="explain-list explain-list--warn">
              {preview.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
          {preview.candidatePlan ? (
            <>
              <p>
                <strong>{t('train.preview.candidate')}:</strong>{' '}
                {preview.candidatePlan.templateName} (
                {preview.candidatePlan.templateKey})
              </p>
              <p className="note">
                {t('train.preview.weeklyMinutes', {
                  minutes: preview.candidatePlan.estimatedWeeklyMinutes,
                })}
              </p>
              {preview.previewToken ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={activateStatus === 'pending'}
                  onClick={() => void handleActivate()}
                >
                  {activateStatus === 'pending'
                    ? t('train.activate.pending')
                    : t('train.activate.cta')}
                </button>
              ) : (
                <p className="note">{t('train.preview.notActivatable')}</p>
              )}
            </>
          ) : (
            <p className="note">{t('train.preview.noCandidate')}</p>
          )}
          {activateStatus === 'error' && activateError ? (
            <div className="form-status" data-tone="error" role="alert">
              {activateError}
            </div>
          ) : null}
          {activateStatus === 'success' && activateSuccess ? (
            <div className="form-status" data-tone="success" role="status">
              {activateSuccess}
            </div>
          ) : null}
          {!plan ? (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={previewStatus === 'pending'}
              onClick={() => void handlePreview()}
            >
              {t('train.preview.refresh')}
            </button>
          ) : null}
        </div>
      ) : null}

      {plan && !preview ? (
        <div className="train-block">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={previewStatus === 'pending'}
            onClick={() => void handlePreview()}
          >
            {previewStatus === 'pending'
              ? t('train.preview.pending')
              : t('train.preview.replaceCta')}
          </button>
          {previewStatus === 'error' && previewError ? (
            <div className="form-status" data-tone="error" role="alert">
              {previewError}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="train-block">
        <h2>{t('train.sessions.title')}</h2>
        {sessions.length === 0 ? (
          <p className="note">{t('train.sessions.empty')}</p>
        ) : (
          <ul className="session-list">
            {sessions.map((session) => {
              const busy =
                sessionActionId === session.id && sessionActionStatus === 'pending';
              return (
                <li key={session.id} className="session-row">
                  <div className="session-row__meta">
                    <strong>{session.localDate}</strong>
                    <span>
                      {t.has(`train.sessions.status.${session.status}`)
                        ? t(`train.sessions.status.${session.status}`)
                        : session.status}
                    </span>
                    <span>
                      {t('train.sessions.duration', {
                        minutes: session.durationBudget,
                      })}
                    </span>
                  </div>
                  <div className="session-row__actions">
                    {isStartablePlannedSession(session) ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busy}
                        onClick={() => void handleStart(session)}
                      >
                        {session.status === 'IN_PROGRESS'
                          ? t('train.sessions.resume')
                          : t('train.sessions.start')}
                      </button>
                    ) : null}
                    {isShortenablePlannedSession(session) ? (
                      <div className="shorten-row">
                        <label className="visually-hidden" htmlFor={`shorten-${session.id}`}>
                          {t('train.sessions.shortenMinutes')}
                        </label>
                        <input
                          id={`shorten-${session.id}`}
                          type="number"
                          min={10}
                          max={180}
                          value={
                            shortenMinutes[session.id] ??
                            Math.max(10, Math.min(session.durationBudget - 5, 20))
                          }
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setShortenMinutes((prev) => ({
                              ...prev,
                              [session.id]: value,
                            }));
                          }}
                          disabled={busy}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={busy}
                          onClick={() => void handleShorten(session)}
                        >
                          {t('train.sessions.shorten')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {sessionActionStatus === 'error' && sessionActionError ? (
          <div className="form-status" data-tone="error" role="alert">
            {sessionActionError}
          </div>
        ) : null}
      </div>

      <p>
        <Link href="/app" className="btn btn-ghost">
          {t('train.backToToday')}
        </Link>
      </p>
    </section>
  );
}
