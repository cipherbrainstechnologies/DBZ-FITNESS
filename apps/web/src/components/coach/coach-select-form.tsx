'use client';

import type { CharacterPresentationSummary, CoachingTone } from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';

import { CharacterPortrait } from '@/components/character-portrait';
import { useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';

const TONES: CoachingTone[] = ['GENTLE', 'BALANCED', 'DIRECT'];

export function CoachSelectForm({ changeMode = false }: { changeMode?: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const headingId = useId();

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [presentations, setPresentations] = useState<CharacterPresentationSummary[]>([]);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [tone, setTone] = useState<CoachingTone>('BALANCED');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    setUnavailable(false);
    try {
      const [list, existing] = await Promise.all([
        api.listCharacters(),
        api.getCharacterSelection().catch(() => ({ selection: null })),
      ]);
      setPresentations(list.presentations);
      setUnavailable(list.unavailable || list.presentations.length === 0);
      if (existing.selection?.presentationId) {
        setPresentationId(existing.selection.presentationId);
        if (existing.selection.coachingTone) {
          setTone(existing.selection.coachingTone);
        }
        if (existing.selection.replacementRequired) {
          setConflict(t('coach.replacementRequired'));
        }
      }
      if (list.unavailable || list.presentations.length === 0) {
        setLoadError(t('coach.catalogueError'));
        setLoadState('error');
        return;
      }
      setLoadState('ready');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setLoadError(t('coach.catalogueError'));
      setLoadState('error');
    }
  }, [router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = presentations.find((item) => item.id === presentationId) ?? null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFieldError(null);
    setSubmitError(null);
    if (!presentationId) {
      setFieldError(t('coach.chooseToContinue'));
      return;
    }
    if (unavailable || presentations.length === 0) {
      setLoadError(t('coach.catalogueError'));
      return;
    }
    setPending(true);
    try {
      const saved = await api.selectCharacter({
        presentationId,
        coachingTone: tone,
      });
      if (!changeMode) {
        try {
          await api.saveOnboardingStep({
            step: 'CHARACTER',
            payload: { presentationId, coachingTone: tone },
          });
        } catch (stepErr) {
          if (
            stepErr instanceof ApiClientError &&
            (stepErr.code === 'ONBOARDING_ALREADY_COMPLETE' ||
              stepErr.code === 'ONBOARDING_STEP_OUT_OF_ORDER')
          ) {
            // Selection persisted; routing still uses the journey.
          } else {
            throw stepErr;
          }
        }
      }
      const { journey } = await api.getOnboarding();
      void saved;
      router.replace(changeMode ? '/app/profile' : journey.path);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'CHARACTER_PRESENTATION_UNAVAILABLE') {
        setConflict(t('coach.replacementRequired'));
      } else {
        setSubmitError(t('coach.saveError'));
      }
    } finally {
      setPending(false);
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="loading-block" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>{t('coach.loading')}</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <section className="app-panel" aria-labelledby={headingId}>
        <h1 id={headingId}>{t('coach.title')}</h1>
        <div className="form-status" data-tone="error" role="alert">
          {loadError ?? t('coach.catalogueError')}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void load()}>
          {t('coach.retry')}
        </button>
      </section>
    );
  }

  return (
    <section className="app-panel" aria-labelledby={headingId}>
      <h1 id={headingId}>{t('coach.title')}</h1>
      <p>{t('coach.supporting')}</p>
      {conflict ? (
        <div className="form-status" data-tone="error" role="alert">
          {conflict}
        </div>
      ) : null}

      <form className="form" onSubmit={(event) => void onSubmit(event)} noValidate>
        <fieldset className="step-fieldset" disabled={pending}>
          <legend className="visually-hidden">{t('coach.title')}</legend>
          <div className="character-grid" role="radiogroup" aria-labelledby={headingId}>
            {presentations.map((item) => (
              <label
                key={item.id}
                className="character-option"
                data-selected={presentationId === item.id ? 'true' : 'false'}
              >
                <input
                  type="radio"
                  name="coach"
                  value={item.id}
                  checked={presentationId === item.id}
                  onChange={() => {
                    setPresentationId(item.id);
                    setFieldError(null);
                  }}
                />
                <span className="character-option-body">
                  <CharacterPortrait
                    className="character-portrait"
                    archetypeKey={item.archetypeKey}
                    artworkUrl={item.artworkUrl}
                    name={item.approvedName}
                  />
                  <span className="character-name">{item.approvedName}</span>
                  <span className="character-meta">{item.coachingDescription}</span>
                </span>
              </label>
            ))}
          </div>
          {fieldError ? (
            <p className="field-error" role="alert">
              {fieldError}
            </p>
          ) : null}
        </fieldset>

        {selected ? (
          <aside className="coach-preview" aria-live="polite">
            <p className="today-character__kicker">{t('coach.samplePreview')}</p>
            <p>{selected.sampleGreeting}</p>
          </aside>
        ) : null}

        <fieldset className="step-fieldset" disabled={pending}>
          <legend>{t('coach.toneLegend')}</legend>
          <div className="tone-row" role="radiogroup" aria-label={t('coach.toneLegend')}>
            {TONES.map((value) => (
              <label key={value} className="choice-row">
                <input
                  type="radio"
                  name="coachingTone"
                  value={value}
                  checked={tone === value}
                  onChange={() => setTone(value)}
                />
                <span>{t(`coach.tones.${value}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {submitError ? (
          <div className="form-status" data-tone="error" role="alert">
            {submitError}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending
            ? t('coach.saving')
            : selected
              ? t('coach.startWith', { name: selected.approvedName })
              : t('coach.start')}
        </button>
      </form>
      <p className="note">{t('coach.aiDisclosure')}</p>
    </section>
  );
}
