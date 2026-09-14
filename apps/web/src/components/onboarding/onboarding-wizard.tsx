'use client';

import type {
  OnboardingProgress,
  OnboardingStep,
  SaveOnboardingStep,
  ScreeningOutcome,
} from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';

/** Mirrors packages/domain onboarding step order. */
const ONBOARDING_STEPS = [
  'WELCOME',
  'CHARACTER',
  'GOALS',
  'EXPERIENCE',
  'AVAILABILITY',
  'SCREENING',
  'DIET',
  'MEASUREMENTS',
  'NOTIFICATIONS',
  'PLAN_PREVIEW',
  'CONFIRM',
] as const satisfies readonly OnboardingStep[];

const CONSENT_POLICIES = [
  { purpose: 'TERMS_OF_SERVICE' as const, policyVersion: 'tos-v1', key: 'terms' },
  { purpose: 'PRIVACY_POLICY' as const, policyVersion: 'privacy-v1', key: 'privacy' },
  {
    purpose: 'HEALTH_DATA_PROCESSING' as const,
    policyVersion: 'health-data-v1',
    key: 'health',
  },
] as const;

const GOAL_OPTIONS = [
  'strength',
  'conditioning',
  'consistency',
  'mobility',
  'body_composition',
] as const;

const EXPERIENCE_OPTIONS = [
  'BEGINNER',
  'RETURNING',
  'INTERMEDIATE',
  'ADVANCED',
] as const;

const DAY_OPTIONS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

const EQUIPMENT_OPTIONS = [
  'none',
  'dumbbells',
  'barbell',
  'bands',
  'pullup_bar',
  'machines',
] as const;

const DIET_OPTIONS = [
  'VEGETARIAN',
  'EGGETARIAN',
  'NON_VEGETARIAN',
  'VEGAN',
] as const;

type SaveStatus = 'idle' | 'pending' | 'success' | 'error';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function OnboardingWizard() {
  const t = useTranslations();
  const router = useRouter();

  const [bootStatus, setBootStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [bootError, setBootError] = useState<string | null>(null);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [activeStep, setActiveStep] = useState<OnboardingStep>('WELCOME');

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // WELCOME
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [consents, setConsents] = useState<Record<string, boolean>>({
    terms: false,
    privacy: false,
    health: false,
  });

  // GOALS
  const [goals, setGoals] = useState<string[]>([]);
  const [motivation, setMotivation] = useState('');

  // EXPERIENCE
  const [experience, setExperience] =
    useState<(typeof EXPERIENCE_OPTIONS)[number]>('BEGINNER');
  const [activityNotes, setActivityNotes] = useState('');

  // AVAILABILITY
  const [weeklyMinutes, setWeeklyMinutes] = useState(150);
  const [availableDays, setAvailableDays] = useState<string[]>(['MON', 'WED', 'FRI']);
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [equipment, setEquipment] = useState<string[]>(['none']);

  // SCREENING
  const [screening, setScreening] = useState({
    reportsUrgentSymptoms: false,
    reportsChestPain: false,
    reportsFainting: false,
    reportsSevereBreathingDifficulty: false,
    reportsActiveInjuryAffectingExercise: false,
    reportsClinicianRestriction: false,
    requiresMovementAdaptations: false,
    requiresTemporaryPause: false,
  });

  // DIET
  const [dietPattern, setDietPattern] =
    useState<(typeof DIET_OPTIONS)[number]>('NON_VEGETARIAN');
  const [exclusions, setExclusions] = useState('');

  // MEASUREMENTS
  const [skipMeasurements, setSkipMeasurements] = useState(true);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // NOTIFICATIONS
  const [enablePush, setEnablePush] = useState(false);
  const [enableEmail, setEnableEmail] = useState(false);

  // PLAN_PREVIEW / CONFIRM
  const [ackPlan, setAckPlan] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);

  const loadProgress = useCallback(async () => {
    const { progress: next } = await api.getOnboarding();
    setProgress(next);
    if (next.completedAt) {
      router.replace('/app');
      return next;
    }
    if (next.currentStep === 'CHARACTER' || (!next.hasValidCoachSelection && next.welcomeComplete)) {
      router.replace('/app/coach');
      return next;
    }
    setActiveStep(next.currentStep);
    return next;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        await loadProgress();
        if (!cancelled) setBootStatus('ready');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setBootError(mapApiError(err, t).message);
        setBootStatus('error');
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadProgress, router, t]);

  const completedSet = useMemo(
    () => new Set(progress?.completedSteps ?? []),
    [progress],
  );

  async function persistStep(body: SaveOnboardingStep): Promise<OnboardingProgress> {
    setSaveStatus('pending');
    setSaveError(null);
    setSaveSuccess(null);
    try {
      if (body.step === 'CHARACTER') {
        await api.selectCharacter({ presentationId: body.payload.presentationId });
      }
      const { progress: next } = await api.saveOnboardingStep(body);
      setProgress(next);
      setSaveStatus('success');
      setSaveSuccess(t('onboarding.saveSuccess'));
      if (next.currentStep === 'CHARACTER' || body.step === 'WELCOME') {
        if (!next.hasValidCoachSelection && next.welcomeComplete) {
          router.replace('/app/coach');
          return next;
        }
      }
      setActiveStep(next.currentStep);
      return next;
    } catch (err) {
      const mapped = mapApiError(err, t);
      setSaveStatus('error');
      setSaveError(mapped.message);
      throw err;
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveStatus === 'pending') return;

    try {
      switch (activeStep) {
        case 'WELCOME': {
          const granted = CONSENT_POLICIES.every((item) => consents[item.key]);
          if (!dateOfBirth || !granted) {
            setSaveStatus('error');
            setSaveError(t('errors.validation'));
            return;
          }
          await persistStep({
            step: 'WELCOME',
            payload: {
              dateOfBirth,
              asOfDate: todayIsoDate(),
              consents: CONSENT_POLICIES.map((item) => ({
                purpose: item.purpose,
                policyVersion: item.policyVersion,
                granted: true as const,
              })),
            },
          });
          break;
        }
        case 'GOALS': {
          if (goals.length === 0) {
            setSaveStatus('error');
            setSaveError(t('errors.validation'));
            return;
          }
          const payload: SaveOnboardingStep = {
            step: 'GOALS',
            payload: {
              goals,
              ...(motivation.trim() ? { motivation: motivation.trim() } : {}),
            },
          };
          await persistStep(payload);
          break;
        }
        case 'EXPERIENCE': {
          const payload: SaveOnboardingStep = {
            step: 'EXPERIENCE',
            payload: {
              experience,
              ...(activityNotes.trim()
                ? { currentActivityNotes: activityNotes.trim() }
                : {}),
            },
          };
          await persistStep(payload);
          break;
        }
        case 'AVAILABILITY': {
          if (availableDays.length === 0 || equipment.length === 0) {
            setSaveStatus('error');
            setSaveError(t('errors.validation'));
            return;
          }
          await persistStep({
            step: 'AVAILABILITY',
            payload: {
              weeklyAvailabilityMinutes: weeklyMinutes,
              availableDays: availableDays as Array<(typeof DAY_OPTIONS)[number]>,
              sessionDurationMinutes: sessionMinutes,
              equipment,
            },
          });
          break;
        }
        case 'SCREENING': {
          await persistStep({
            step: 'SCREENING',
            payload: {
              questionnaireVersion: 'screening-v1',
              ...screening,
            },
          });
          break;
        }
        case 'DIET': {
          const list = exclusions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 40);
          await persistStep({
            step: 'DIET',
            payload: {
              pattern: dietPattern,
              ...(list.length > 0 ? { ingredientExclusions: list } : {}),
            },
          });
          break;
        }
        case 'MEASUREMENTS': {
          if (skipMeasurements) {
            await persistStep({
              step: 'MEASUREMENTS',
              payload: {
                skip: true,
                nutritionCalculationPreference: 'SKIP',
              },
            });
          } else {
            const height = Number(heightCm);
            const weight = Number(weightKg);
            if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) {
              setSaveStatus('error');
              setSaveError(t('errors.validation'));
              return;
            }
            await persistStep({
              step: 'MEASUREMENTS',
              payload: {
                skip: false,
                heightCm: height,
                weightKg: weight,
                nutritionCalculationPreference: 'TARGETS_WHEN_ELIGIBLE',
              },
            });
          }
          break;
        }
        case 'CHARACTER': {
          router.replace('/app/coach');
          return;
        }
        case 'NOTIFICATIONS': {
          await persistStep({
            step: 'NOTIFICATIONS',
            payload: {
              enablePush,
              enableEmail,
            },
          });
          break;
        }
        case 'PLAN_PREVIEW': {
          if (!ackPlan) {
            setSaveStatus('error');
            setSaveError(t('errors.validation'));
            return;
          }
          await persistStep({
            step: 'PLAN_PREVIEW',
            payload: { acknowledgedExplanation: true },
          });
          break;
        }
        case 'CONFIRM': {
          if (!confirmReady) {
            setSaveStatus('error');
            setSaveError(t('errors.validation'));
            return;
          }
          await persistStep({
            step: 'CONFIRM',
            payload: { confirm: true },
          });
          setSaveStatus('pending');
          setSaveError(null);
          const completed = await api.completeOnboarding();
          setProgress(completed.progress);
          setSaveStatus('success');
          setSaveSuccess(t('onboarding.completeSuccess'));
          router.replace('/app');
          break;
        }
        default:
          break;
      }
    } catch {
      // Error already surfaced via persistStep / mapApiError
    }
  }

  function toggleInList(
    value: string,
    list: string[],
    setList: (next: string[]) => void,
  ) {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  }

  if (bootStatus === 'loading') {
    return (
      <div className="loading-block" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>{t('onboarding.loading')}</p>
      </div>
    );
  }

  if (bootStatus === 'error') {
    return (
      <div className="form-status" data-tone="error" role="alert">
        {bootError ?? t('errors.generic')}
      </div>
    );
  }

  const currentIndex = stepIndex(activeStep);
  const totalSteps = ONBOARDING_STEPS.length;
  const pending = saveStatus === 'pending';

  return (
    <section className="onboarding-panel" aria-labelledby="onboarding-title">
      <header className="onboarding-header">
        <p className="onboarding-kicker">{t('onboarding.kicker')}</p>
        <h1 id="onboarding-title">{t('onboarding.title')}</h1>
        <p className="note">{t('onboarding.subtitle')}</p>
        <div
          className="onboarding-progress"
          role="status"
          aria-label={t('onboarding.progressLabel', {
            current: currentIndex + 1,
            total: totalSteps,
          })}
        >
          <div className="onboarding-progress-track" aria-hidden="true">
            <div
              className="onboarding-progress-fill"
              style={{ width: `${((currentIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <p className="onboarding-step-meta">
            {t(`onboarding.steps.${activeStep}`)} ·{' '}
            {t('onboarding.progressLabel', {
              current: currentIndex + 1,
              total: totalSteps,
            })}
          </p>
        </div>
      </header>

      <ol className="onboarding-step-list" aria-hidden="true">
        {ONBOARDING_STEPS.map((step) => (
          <li
            key={step}
            data-complete={completedSet.has(step) ? 'true' : 'false'}
            data-current={step === activeStep ? 'true' : 'false'}
          >
            {t(`onboarding.steps.${step}`)}
          </li>
        ))}
      </ol>

      <form className="form onboarding-form" onSubmit={onSubmit} noValidate>
        {activeStep === 'WELCOME' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.welcome.legend')}</legend>
            <p className="note">{t('onboarding.welcome.ageNote')}</p>
            <div className="field">
              <label htmlFor="dob">{t('onboarding.welcome.dateOfBirth')}</label>
              <input
                id="dob"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={todayIsoDate()}
              />
            </div>
            <div className="choice-stack" role="group" aria-label={t('onboarding.welcome.consents')}>
              {CONSENT_POLICIES.map((item) => (
                <label key={item.key} className="choice-row">
                  <input
                    type="checkbox"
                    checked={Boolean(consents[item.key])}
                    onChange={(e) =>
                      setConsents((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                  />
                  <span>{t(`onboarding.welcome.consent.${item.key}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {activeStep === 'GOALS' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.goals.legend')}</legend>
            <p className="note">{t('onboarding.goals.hint')}</p>
            <div className="choice-stack" role="group" aria-label={t('onboarding.goals.legend')}>
              {GOAL_OPTIONS.map((goal) => (
                <label key={goal} className="choice-row">
                  <input
                    type="checkbox"
                    checked={goals.includes(goal)}
                    onChange={() => toggleInList(goal, goals, setGoals)}
                  />
                  <span>{t(`onboarding.goals.options.${goal}`)}</span>
                </label>
              ))}
            </div>
            <div className="field">
              <label htmlFor="motivation">{t('onboarding.goals.motivation')}</label>
              <input
                id="motivation"
                type="text"
                maxLength={500}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
              />
            </div>
          </fieldset>
        ) : null}

        {activeStep === 'EXPERIENCE' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.experience.legend')}</legend>
            <div className="choice-stack" role="radiogroup" aria-label={t('onboarding.experience.legend')}>
              {EXPERIENCE_OPTIONS.map((option) => (
                <label key={option} className="choice-row">
                  <input
                    type="radio"
                    name="experience"
                    checked={experience === option}
                    onChange={() => setExperience(option)}
                  />
                  <span>{t(`onboarding.experience.options.${option}`)}</span>
                </label>
              ))}
            </div>
            <div className="field">
              <label htmlFor="activity-notes">{t('onboarding.experience.notes')}</label>
              <input
                id="activity-notes"
                type="text"
                maxLength={500}
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
              />
            </div>
          </fieldset>
        ) : null}

        {activeStep === 'AVAILABILITY' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.availability.legend')}</legend>
            <div className="field">
              <label htmlFor="weekly-minutes">
                {t('onboarding.availability.weeklyMinutes')}
              </label>
              <input
                id="weekly-minutes"
                type="number"
                min={0}
                max={10080}
                required
                value={weeklyMinutes}
                onChange={(e) => setWeeklyMinutes(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="session-minutes">
                {t('onboarding.availability.sessionMinutes')}
              </label>
              <input
                id="session-minutes"
                type="number"
                min={1}
                max={180}
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
              />
            </div>
            <div className="choice-stack" role="group" aria-label={t('onboarding.availability.days')}>
              {DAY_OPTIONS.map((day) => (
                <label key={day} className="choice-row">
                  <input
                    type="checkbox"
                    checked={availableDays.includes(day)}
                    onChange={() => toggleInList(day, availableDays, setAvailableDays)}
                  />
                  <span>{t(`onboarding.availability.day.${day}`)}</span>
                </label>
              ))}
            </div>
            <div
              className="choice-stack"
              role="group"
              aria-label={t('onboarding.availability.equipment')}
            >
              {EQUIPMENT_OPTIONS.map((item) => (
                <label key={item} className="choice-row">
                  <input
                    type="checkbox"
                    checked={equipment.includes(item)}
                    onChange={() => toggleInList(item, equipment, setEquipment)}
                  />
                  <span>{t(`onboarding.availability.equipmentOptions.${item}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {activeStep === 'SCREENING' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.screening.legend')}</legend>
            <p className="note">{t('onboarding.screening.disclaimer')}</p>
            {(
              [
                'reportsUrgentSymptoms',
                'reportsChestPain',
                'reportsFainting',
                'reportsSevereBreathingDifficulty',
                'reportsActiveInjuryAffectingExercise',
                'reportsClinicianRestriction',
                'requiresMovementAdaptations',
                'requiresTemporaryPause',
              ] as const
            ).map((key) => (
              <label key={key} className="choice-row">
                <input
                  type="checkbox"
                  checked={screening[key]}
                  onChange={(e) =>
                    setScreening((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                />
                <span>{t(`onboarding.screening.${key}`)}</span>
              </label>
            ))}
            {progress?.screeningOutcome ? (
              <p className="screening-outcome" role="status">
                {t('onboarding.screening.outcomeLabel')}:{' '}
                {t(`onboarding.screening.outcomes.${progress.screeningOutcome as ScreeningOutcome}`)}
              </p>
            ) : null}
          </fieldset>
        ) : null}

        {activeStep === 'DIET' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.diet.legend')}</legend>
            <div className="choice-stack" role="radiogroup" aria-label={t('onboarding.diet.legend')}>
              {DIET_OPTIONS.map((option) => (
                <label key={option} className="choice-row">
                  <input
                    type="radio"
                    name="diet"
                    checked={dietPattern === option}
                    onChange={() => setDietPattern(option)}
                  />
                  <span>{t(`onboarding.diet.options.${option}`)}</span>
                </label>
              ))}
            </div>
            <div className="field">
              <label htmlFor="exclusions">{t('onboarding.diet.exclusions')}</label>
              <input
                id="exclusions"
                type="text"
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                placeholder={t('onboarding.diet.exclusionsHint')}
              />
            </div>
          </fieldset>
        ) : null}

        {activeStep === 'MEASUREMENTS' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.measurements.legend')}</legend>
            <p className="note">{t('onboarding.measurements.hint')}</p>
            <label className="choice-row">
              <input
                type="checkbox"
                checked={skipMeasurements}
                onChange={(e) => setSkipMeasurements(e.target.checked)}
              />
              <span>{t('onboarding.measurements.skip')}</span>
            </label>
            {!skipMeasurements ? (
              <>
                <div className="field">
                  <label htmlFor="height">{t('onboarding.measurements.height')}</label>
                  <input
                    id="height"
                    type="number"
                    min={1}
                    max={300}
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="weight">{t('onboarding.measurements.weight')}</label>
                  <input
                    id="weight"
                    type="number"
                    min={1}
                    max={500}
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </div>
              </>
            ) : null}
          </fieldset>
        ) : null}

        {activeStep === 'CHARACTER' ? (
          <fieldset className="step-fieldset">
            <legend>{t('coach.title')}</legend>
            <p>{t('coach.supporting')}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => router.replace('/app/coach')}
            >
              {t('coach.title')}
            </button>
          </fieldset>
        ) : null}

        {activeStep === 'NOTIFICATIONS' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.notifications.legend')}</legend>
            <p className="note">{t('onboarding.notifications.hint')}</p>
            <label className="choice-row">
              <input
                type="checkbox"
                checked={enablePush}
                onChange={(e) => setEnablePush(e.target.checked)}
              />
              <span>{t('onboarding.notifications.push')}</span>
            </label>
            <label className="choice-row">
              <input
                type="checkbox"
                checked={enableEmail}
                onChange={(e) => setEnableEmail(e.target.checked)}
              />
              <span>{t('onboarding.notifications.email')}</span>
            </label>
            <p className="note">{t('onboarding.notifications.simulated')}</p>
          </fieldset>
        ) : null}

        {activeStep === 'PLAN_PREVIEW' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.planPreview.legend')}</legend>
            <p className="note">{t('onboarding.planPreview.body')}</p>
            <p className="note">{t('onboarding.planPreview.noFakeStats')}</p>
            <label className="choice-row">
              <input
                type="checkbox"
                checked={ackPlan}
                onChange={(e) => setAckPlan(e.target.checked)}
                required
              />
              <span>{t('onboarding.planPreview.acknowledge')}</span>
            </label>
          </fieldset>
        ) : null}

        {activeStep === 'CONFIRM' ? (
          <fieldset className="step-fieldset" disabled={pending}>
            <legend>{t('onboarding.confirm.legend')}</legend>
            <p className="note">{t('onboarding.confirm.body')}</p>
            <ul className="meta-list">
              <li>
                <strong>{t('onboarding.confirm.screening')}:</strong>{' '}
                {progress?.screeningOutcome
                  ? t(`onboarding.screening.outcomes.${progress.screeningOutcome}`)
                  : t('onboarding.confirm.pending')}
              </li>
              <li>
                <strong>{t('onboarding.confirm.diet')}:</strong>{' '}
                {progress?.hasDietPreference
                  ? t('onboarding.confirm.saved')
                  : t('onboarding.confirm.pending')}
              </li>
              <li>
                <strong>{t('onboarding.confirm.character')}:</strong>{' '}
                {progress?.hasCharacterSelection
                  ? t('onboarding.confirm.saved')
                  : t('onboarding.confirm.pending')}
              </li>
            </ul>
            <p className="note">{t('onboarding.confirm.noStats')}</p>
            <label className="choice-row">
              <input
                type="checkbox"
                checked={confirmReady}
                onChange={(e) => setConfirmReady(e.target.checked)}
                required
              />
              <span>{t('onboarding.confirm.acknowledge')}</span>
            </label>
          </fieldset>
        ) : null}

        {saveError ? (
          <div className="form-status" data-tone="error" role="alert" aria-live="assertive">
            <span className="visually-hidden">{t('a11y.formError')}: </span>
            {saveError}
          </div>
        ) : null}

        {saveSuccess ? (
          <div className="form-status" data-tone="success" role="status" aria-live="polite">
            <span className="visually-hidden">{t('a11y.success')}: </span>
            {saveSuccess}
          </div>
        ) : null}

        <div className="onboarding-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending
              ? t('onboarding.saving')
              : activeStep === 'CONFIRM'
                ? t('onboarding.finish')
                : t('onboarding.continue')}
          </button>
        </div>
      </form>
    </section>
  );
}
