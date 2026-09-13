'use client';

import type { ExerciseSummary, WorkoutSession, WorkoutSet } from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { api, ApiClientError, newIdempotencyKey } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';

type LoadState = 'loading' | 'ready' | 'error' | 'finished';
type ActionStatus = 'idle' | 'pending' | 'success' | 'error';

type SetDraft = {
  repetitions: string;
  resistanceKg: string;
  completed: boolean;
};

type WorkoutPlayerProps = {
  plannedSessionId: string;
};

function groupSets(sets: WorkoutSet[]): { exerciseId: string; sets: WorkoutSet[] }[] {
  const order: string[] = [];
  const map = new Map<string, WorkoutSet[]>();
  for (const set of sets) {
    if (!map.has(set.exerciseId)) {
      order.push(set.exerciseId);
      map.set(set.exerciseId, []);
    }
    map.get(set.exerciseId)!.push(set);
  }
  return order.map((exerciseId) => ({
    exerciseId,
    sets: map.get(exerciseId)!,
  }));
}

function draftsFromSession(session: WorkoutSession): Record<string, SetDraft> {
  const drafts: Record<string, SetDraft> = {};
  for (const set of session.sets) {
    drafts[set.id] = {
      repetitions: set.repetitions != null ? String(set.repetitions) : '',
      resistanceKg: set.resistanceKg != null ? String(set.resistanceKg) : '',
      completed: set.completed,
    };
  }
  return drafts;
}

export function WorkoutPlayer({ plannedSessionId }: WorkoutPlayerProps) {
  const t = useTranslations();
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<Record<string, ExerciseSummary>>({});
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});

  const [setBusyId, setSetBusyId] = useState<string | null>(null);
  const [setStatus, setSetStatus] = useState<ActionStatus>('idle');
  const [setError, setSetError] = useState<string | null>(null);
  const [setSuccess, setSetSuccess] = useState<string | null>(null);

  const [finishStatus, setFinishStatus] = useState<ActionStatus>('idle');
  const [finishError, setFinishError] = useState<string | null>(null);
  const [finishSuccess, setFinishSuccess] = useState<string | null>(null);

  const boot = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    try {
      const { session: started } = await api.startWorkoutSession({
        plannedSessionId,
      });
      setSession(started);
      setDrafts(draftsFromSession(started));

      if (started.status !== 'IN_PROGRESS') {
        setLoadState('finished');
        return;
      }

      const exerciseIds = [...new Set(started.sets.map((s) => s.exerciseId))];
      const loaded: Record<string, ExerciseSummary> = {};
      await Promise.all(
        exerciseIds.map(async (id) => {
          try {
            const { exercise } = await api.getExercise(id);
            loaded[id] = exercise;
          } catch {
            // Optional — show id fallback if catalogue lookup fails.
          }
        }),
      );
      setExercises(loaded);
      setLoadState('ready');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setLoadError(mapApiError(err, t).message);
      setLoadState('error');
    }
  }, [plannedSessionId, router, t]);

  useEffect(() => {
    void boot();
  }, [boot]);

  const groups = useMemo(
    () => (session ? groupSets(session.sets) : []),
    [session],
  );

  async function saveSet(set: WorkoutSet) {
    if (!session) return;
    const draft = drafts[set.id];
    if (!draft) return;

    setSetBusyId(set.id);
    setSetStatus('pending');
    setSetError(null);
    setSetSuccess(null);

    const body: {
      repetitions?: number;
      resistanceKg?: number;
      completed?: boolean;
      expectedVersion: number;
    } = {
      completed: draft.completed,
      expectedVersion: set.version,
    };
    if (draft.repetitions.trim() !== '') {
      body.repetitions = Number(draft.repetitions);
    }
    if (draft.resistanceKg.trim() !== '') {
      body.resistanceKg = Number(draft.resistanceKg);
    }

    try {
      const { set: updated } = await api.updateWorkoutSet(session.id, set.id, body);
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sets: prev.sets.map((s) => (s.id === updated.id ? updated : s)),
        };
      });
      setDrafts((prev) => ({
        ...prev,
        [updated.id]: {
          repetitions:
            updated.repetitions != null ? String(updated.repetitions) : '',
          resistanceKg:
            updated.resistanceKg != null ? String(updated.resistanceKg) : '',
          completed: updated.completed,
        },
      }));
      setSetStatus('success');
      setSetSuccess(t('train.player.setSaved'));
    } catch (err) {
      setSetStatus('error');
      setSetError(mapApiError(err, t).message);
    } finally {
      setSetBusyId(null);
    }
  }

  async function completeSession() {
    if (!session) return;
    setFinishStatus('pending');
    setFinishError(null);
    setFinishSuccess(null);
    try {
      const startedMs = Date.parse(session.startedAt);
      const elapsedMin =
        Number.isFinite(startedMs)
          ? Math.max(1, Math.round((Date.now() - startedMs) / 60_000))
          : undefined;
      const { session: updated } = await api.completeWorkoutSession(
        session.id,
        elapsedMin ? { actualDurationMinutes: elapsedMin } : {},
        newIdempotencyKey(),
      );
      setSession(updated);
      setFinishStatus('success');
      setFinishSuccess(t('train.player.completeSuccess'));
      setLoadState('finished');
    } catch (err) {
      setFinishStatus('error');
      setFinishError(mapApiError(err, t).message);
    }
  }

  async function abandonSession() {
    if (!session) return;
    setFinishStatus('pending');
    setFinishError(null);
    setFinishSuccess(null);
    try {
      const { session: updated } = await api.abandonWorkoutSession(session.id, {});
      setSession(updated);
      setFinishStatus('success');
      setFinishSuccess(t('train.player.abandonSuccess'));
      setLoadState('finished');
    } catch (err) {
      setFinishStatus('error');
      setFinishError(mapApiError(err, t).message);
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="loading-block" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>{t('train.player.loading')}</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <section className="app-panel" aria-labelledby="player-error-title">
        <h1 id="player-error-title">{t('train.player.title')}</h1>
        <div className="form-status" data-tone="error" role="alert">
          {loadError ?? t('errors.generic')}
        </div>
        <div className="cta-row">
          <button type="button" className="btn btn-primary" onClick={() => void boot()}>
            {t('train.retry')}
          </button>
          <Link href="/app/train" className="btn btn-ghost">
            {t('train.player.backToTrain')}
          </Link>
        </div>
      </section>
    );
  }

  if (!session) {
    return null;
  }

  if (loadState === 'finished') {
    return (
      <section className="app-panel" aria-labelledby="player-done-title">
        <h1 id="player-done-title">{t('train.player.title')}</h1>
        <p>
          {t('train.player.finishedStatus', {
            status: session.status,
          })}
        </p>
        {finishSuccess ? (
          <div className="form-status" data-tone="success" role="status">
            {finishSuccess}
          </div>
        ) : null}
        <p className="note">{t('train.player.noMedia')}</p>
        <div className="cta-row">
          <Link href="/app/train" className="btn btn-primary">
            {t('train.player.backToTrain')}
          </Link>
          <Link href="/app" className="btn btn-ghost">
            {t('train.backToToday')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="app-panel workout-player" aria-labelledby="player-title">
      <div className="train-header">
        <h1 id="player-title">{t('train.player.title')}</h1>
        <p className="note">{t('train.player.subtitle')}</p>
        <p className="note">{t('train.player.noMedia')}</p>
      </div>

      {groups.map((group) => {
        const exercise = exercises[group.exerciseId];
        return (
          <article key={group.exerciseId} className="exercise-block">
            <h2>{exercise?.name ?? t('train.player.exerciseFallback')}</h2>
            {exercise?.instructions ? (
              <p className="note">{exercise.instructions}</p>
            ) : null}
            <ul className="set-list">
              {group.sets.map((set) => {
                const draft = drafts[set.id] ?? {
                  repetitions: '',
                  resistanceKg: '',
                  completed: false,
                };
                const busy = setBusyId === set.id && setStatus === 'pending';
                return (
                  <li key={set.id} className="set-row">
                    <span className="set-row__index">
                      {t('train.player.setLabel', { index: set.setIndex + 1 })}
                    </span>
                    <label className="field">
                      <span>{t('train.player.reps')}</span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={draft.repetitions}
                        disabled={busy || finishStatus === 'pending'}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDrafts((prev) => ({
                            ...prev,
                            [set.id]: { ...draft, repetitions: value },
                          }));
                        }}
                      />
                    </label>
                    <label className="field">
                      <span>{t('train.player.resistance')}</span>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        inputMode="decimal"
                        value={draft.resistanceKg}
                        disabled={busy || finishStatus === 'pending'}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDrafts((prev) => ({
                            ...prev,
                            [set.id]: { ...draft, resistanceKg: value },
                          }));
                        }}
                      />
                    </label>
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={draft.completed}
                        disabled={busy || finishStatus === 'pending'}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setDrafts((prev) => ({
                            ...prev,
                            [set.id]: { ...draft, completed: checked },
                          }));
                        }}
                      />
                      <span>{t('train.player.completed')}</span>
                    </label>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy || finishStatus === 'pending'}
                      onClick={() => void saveSet(set)}
                    >
                      {busy ? t('train.player.savingSet') : t('train.player.saveSet')}
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}

      {setStatus === 'error' && setError ? (
        <div className="form-status" data-tone="error" role="alert">
          {setError}
        </div>
      ) : null}
      {setStatus === 'success' && setSuccess ? (
        <div className="form-status" data-tone="success" role="status">
          {setSuccess}
        </div>
      ) : null}

      <div className="cta-row player-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={finishStatus === 'pending'}
          onClick={() => void completeSession()}
        >
          {finishStatus === 'pending'
            ? t('train.player.finishing')
            : t('train.player.complete')}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={finishStatus === 'pending'}
          onClick={() => void abandonSession()}
        >
          {t('train.player.abandon')}
        </button>
        <Link href="/app/train" className="btn btn-ghost">
          {t('train.player.backToTrain')}
        </Link>
      </div>

      {finishStatus === 'error' && finishError ? (
        <div className="form-status" data-tone="error" role="alert">
          {finishError}
        </div>
      ) : null}
    </section>
  );
}
