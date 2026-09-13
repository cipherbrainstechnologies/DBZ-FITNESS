'use client';

import type {
  CurrentGroceryListResponse,
  MealLogSummary,
  MealPlanSummary,
  NutritionTargetSummary,
  PlannedMealSummary,
  PreviewMealPlanResponse,
  PreviewNutritionTargetResponse,
  RecipeSummary,
  SwapMealPreviewResponse,
} from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import {
  api,
  ApiClientError,
  localDateInTimeZone,
  newIdempotencyKey,
} from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';
import {
  pickNextPlannedMeal,
  showsCalorieEstimates,
  sortPlannedMeals,
} from '@/lib/nutrition-ui';
import { useAuth } from '@/lib/auth-context';

type LoadState = 'loading' | 'ready' | 'error';
type ActionStatus = 'idle' | 'pending' | 'success' | 'error';

function explainList(
  codes: string[],
  t: ReturnType<typeof useTranslations>,
): string[] {
  return codes.map((code) => {
    const key = `fuel.explanations.${code}`;
    if (t.has(key)) {
      return t(key);
    }
    return code;
  });
}

function recipeLabel(
  recipeId: string,
  recipesById: Map<string, RecipeSummary>,
  fallback: string,
): string {
  return recipesById.get(recipeId)?.name ?? fallback;
}

export function FuelPanel() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [plan, setPlan] = useState<MealPlanSummary | null>(null);
  const [meals, setMeals] = useState<PlannedMealSummary[]>([]);
  const [recipesById, setRecipesById] = useState<Map<string, RecipeSummary>>(
    () => new Map(),
  );
  const [grocery, setGrocery] = useState<
    CurrentGroceryListResponse['groceryList']
  >(null);

  const [sessionLogs, setSessionLogs] = useState<MealLogSummary[]>([]);
  const [activeTarget, setActiveTarget] = useState<NutritionTargetSummary | null>(
    null,
  );

  const [planPreview, setPlanPreview] = useState<PreviewMealPlanResponse | null>(
    null,
  );
  const [planPreviewStatus, setPlanPreviewStatus] = useState<ActionStatus>('idle');
  const [planPreviewError, setPlanPreviewError] = useState<string | null>(null);
  const [planPreviewSuccess, setPlanPreviewSuccess] = useState<string | null>(null);

  const [activateStatus, setActivateStatus] = useState<ActionStatus>('idle');
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activateSuccess, setActivateSuccess] = useState<string | null>(null);

  const [targetPreview, setTargetPreview] =
    useState<PreviewNutritionTargetResponse | null>(null);
  const [targetPreviewStatus, setTargetPreviewStatus] =
    useState<ActionStatus>('idle');
  const [targetPreviewError, setTargetPreviewError] = useState<string | null>(null);
  const [targetActivateStatus, setTargetActivateStatus] =
    useState<ActionStatus>('idle');
  const [targetActivateError, setTargetActivateError] = useState<string | null>(
    null,
  );

  const [swapMealId, setSwapMealId] = useState<string | null>(null);
  const [swapPreview, setSwapPreview] = useState<SwapMealPreviewResponse | null>(
    null,
  );
  const [swapStatus, setSwapStatus] = useState<ActionStatus>('idle');
  const [swapError, setSwapError] = useState<string | null>(null);
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null);

  const [logMealId, setLogMealId] = useState<string | null>(null);
  const [logStatus, setLogStatus] = useState<ActionStatus>('idle');
  const [logError, setLogError] = useState<string | null>(null);
  const [logSuccess, setLogSuccess] = useState<string | null>(null);

  const timeZone = user?.currentTimeZone || 'UTC';

  const loggedPlannedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const log of sessionLogs) {
      if (log.plannedMealId) {
        ids.add(log.plannedMealId);
      }
    }
    return ids;
  }, [sessionLogs]);

  const sortedMeals = useMemo(() => sortPlannedMeals(meals), [meals]);
  const plannedRemaining = useMemo(
    () => sortedMeals.filter((meal) => !loggedPlannedIds.has(meal.id)),
    [sortedMeals, loggedPlannedIds],
  );

  const refresh = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    try {
      const [current, groceryRes, recipesRes] = await Promise.all([
        api.getCurrentMealPlan(),
        api.getCurrentGroceryList(),
        api.listRecipes(),
      ]);
      setPlan(current.plan);
      setMeals(current.meals);
      setGrocery(groceryRes.groceryList);
      setRecipesById(new Map(recipesRes.recipes.map((r) => [r.id, r])));
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

  async function handlePreviewPlan() {
    setPlanPreviewStatus('pending');
    setPlanPreviewError(null);
    setPlanPreviewSuccess(null);
    setActivateStatus('idle');
    setActivateError(null);
    setActivateSuccess(null);

    try {
      const startLocalDate = localDateInTimeZone(timeZone);
      const result = await api.previewMealPlan({
        startLocalDate,
        timeZone,
        useSoftEnergyProximity: Boolean(
          activeTarget &&
            showsCalorieEstimates(activeTarget.mode, activeTarget.energyKcal),
        ),
        nutritionTargetId: activeTarget?.id ?? null,
      });
      setPlanPreview(result);
      setPlanPreviewStatus('success');
      setPlanPreviewSuccess(t('fuel.planPreview.success'));
    } catch (err) {
      setPlanPreviewStatus('error');
      setPlanPreviewError(mapApiError(err, t).message);
    }
  }

  async function handleActivatePlan() {
    if (!planPreview?.previewToken) {
      setActivateStatus('error');
      setActivateError(t('fuel.activate.noToken'));
      return;
    }
    setActivateStatus('pending');
    setActivateError(null);
    setActivateSuccess(null);
    try {
      const result = await api.activateMealPlan(
        { previewToken: planPreview.previewToken },
        newIdempotencyKey(),
      );
      setPlan(result.plan);
      setMeals(result.meals);
      setPlanPreview(null);
      setActivateStatus('success');
      setActivateSuccess(t('fuel.activate.success'));
      await refresh();
    } catch (err) {
      setActivateStatus('error');
      setActivateError(mapApiError(err, t).message);
    }
  }

  async function handlePreviewHabitTarget() {
    setTargetPreviewStatus('pending');
    setTargetPreviewError(null);
    setTargetActivateStatus('idle');
    setTargetActivateError(null);
    try {
      const result = await api.previewNutritionTarget({ mode: 'HABIT_ONLY' });
      setTargetPreview(result);
      setTargetPreviewStatus('success');
    } catch (err) {
      setTargetPreviewStatus('error');
      setTargetPreviewError(mapApiError(err, t).message);
    }
  }

  async function handleActivateTarget() {
    if (!targetPreview?.previewToken) {
      setTargetActivateStatus('error');
      setTargetActivateError(t('fuel.targets.noToken'));
      return;
    }
    setTargetActivateStatus('pending');
    setTargetActivateError(null);
    try {
      const result = await api.activateNutritionTarget({
        previewToken: targetPreview.previewToken,
      });
      setActiveTarget(result.target);
      setTargetPreview(null);
      setTargetActivateStatus('success');
    } catch (err) {
      setTargetActivateStatus('error');
      setTargetActivateError(mapApiError(err, t).message);
    }
  }

  async function handleMarkEaten(meal: PlannedMealSummary) {
    setLogMealId(meal.id);
    setLogStatus('pending');
    setLogError(null);
    setLogSuccess(null);
    try {
      const { log } = await api.createMealLog({
        consumedAt: new Date().toISOString(),
        localDate: meal.localDate,
        timeZone,
        source: 'PLANNED',
        mealType: meal.mealType,
        plannedMealId: meal.id,
        recipeId: meal.recipeId,
        portions: meal.portions,
        estimateStatus: 'RECIPE_CALCULATED',
      });
      setSessionLogs((prev) => [...prev, log]);
      setLogStatus('success');
      setLogSuccess(t('fuel.log.success'));
    } catch (err) {
      setLogStatus('error');
      setLogError(mapApiError(err, t).message);
    } finally {
      setLogMealId(null);
    }
  }

  async function handleSwapPreview(meal: PlannedMealSummary) {
    setSwapMealId(meal.id);
    setSwapStatus('pending');
    setSwapError(null);
    setSwapSuccess(null);
    setSwapPreview(null);
    try {
      const result = await api.previewMealSwap(meal.id, {});
      setSwapPreview(result);
      setSwapStatus('success');
    } catch (err) {
      setSwapStatus('error');
      setSwapError(mapApiError(err, t).message);
    }
  }

  async function handleSwapConfirm(recipeId: string) {
    if (!swapMealId || !swapPreview?.previewToken) {
      setSwapStatus('error');
      setSwapError(t('fuel.swap.noToken'));
      return;
    }
    setSwapStatus('pending');
    setSwapError(null);
    setSwapSuccess(null);
    try {
      const { meal } = await api.confirmMealSwap(swapMealId, {
        previewToken: swapPreview.previewToken,
        recipeId,
      });
      setMeals((prev) => prev.map((m) => (m.id === meal.id ? meal : m)));
      setSwapPreview(null);
      setSwapMealId(null);
      setSwapStatus('success');
      setSwapSuccess(t('fuel.swap.success'));
      const groceryRes = await api.getCurrentGroceryList();
      setGrocery(groceryRes.groceryList);
    } catch (err) {
      setSwapStatus('error');
      setSwapError(mapApiError(err, t).message);
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="loading-block" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>{t('fuel.loading')}</p>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <section className="app-panel" aria-labelledby="fuel-error-title">
        <h1 id="fuel-error-title">{t('fuel.title')}</h1>
        <div className="form-status" data-tone="error" role="alert">
          {loadError ?? t('errors.generic')}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void refresh()}>
          {t('fuel.retry')}
        </button>
      </section>
    );
  }

  const showTargetCalories =
    activeTarget != null &&
    showsCalorieEstimates(activeTarget.mode, activeTarget.energyKcal);

  const previewTargetCalories =
    targetPreview != null &&
    showsCalorieEstimates(targetPreview.mode, targetPreview.targets.energyKcal);

  const nextMeal = pickNextPlannedMeal(meals, timeZone, loggedPlannedIds);

  return (
    <section className="app-panel fuel-panel" aria-labelledby="fuel-title">
      <div className="fuel-header">
        <h1 id="fuel-title">{t('fuel.title')}</h1>
        <p className="note">{t('fuel.subtitle')}</p>
      </div>

      <div className="fuel-block">
        <h2>{t('fuel.targets.title')}</h2>
        <p className="note">{t('fuel.targets.body')}</p>
        {activeTarget ? (
          <ul className="meta-list">
            <li>
              <strong>{t('fuel.targets.mode')}:</strong> {activeTarget.mode}
            </li>
            <li>
              <strong>{t('fuel.targets.policy')}:</strong> {activeTarget.policyVersion}
            </li>
            {showTargetCalories ? (
              <li>
                <strong>{t('fuel.targets.energyEstimate')}:</strong>{' '}
                {t('fuel.targets.kcal', { value: Math.round(activeTarget.energyKcal!) })}
                <span className="note"> — {t('fuel.targets.estimateDisclaimer')}</span>
              </li>
            ) : (
              <li className="note">{t('fuel.targets.habitOnlyNote')}</li>
            )}
          </ul>
        ) : (
          <p className="note">{t('fuel.targets.empty')}</p>
        )}
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={targetPreviewStatus === 'pending'}
            onClick={() => void handlePreviewHabitTarget()}
          >
            {targetPreviewStatus === 'pending'
              ? t('fuel.targets.previewPending')
              : t('fuel.targets.previewHabit')}
          </button>
        </div>
        {targetPreviewStatus === 'error' && targetPreviewError ? (
          <div className="form-status" data-tone="error" role="alert">
            {targetPreviewError}
          </div>
        ) : null}
        {targetPreview ? (
          <div className="fuel-subblock" aria-live="polite">
            <p>
              <strong>{t('fuel.targets.previewMode')}:</strong> {targetPreview.mode}
            </p>
            {previewTargetCalories ? (
              <p>
                {t('fuel.targets.kcal', {
                  value: Math.round(targetPreview.targets.energyKcal!),
                })}{' '}
                — {t('fuel.targets.estimateDisclaimer')}
              </p>
            ) : (
              <p className="note">{t('fuel.targets.habitOnlyNote')}</p>
            )}
            <ul className="explain-list">
              {explainList(targetPreview.explanationCodes, t).map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
            {targetPreview.disclaimers.length > 0 ? (
              <ul className="explain-list explain-list--warn">
                {targetPreview.disclaimers.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            ) : null}
            {targetPreview.previewToken ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={targetActivateStatus === 'pending'}
                onClick={() => void handleActivateTarget()}
              >
                {targetActivateStatus === 'pending'
                  ? t('fuel.targets.activatePending')
                  : t('fuel.targets.activate')}
              </button>
            ) : (
              <p className="note">{t('fuel.targets.notActivatable')}</p>
            )}
            {targetActivateStatus === 'error' && targetActivateError ? (
              <div className="form-status" data-tone="error" role="alert">
                {targetActivateError}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {plan ? (
        <div className="fuel-block">
          <h2>{t('fuel.current.title')}</h2>
          <ul className="meta-list">
            <li>
              <strong>{t('fuel.current.start')}:</strong> {plan.startLocalDate}
            </li>
            <li>
              <strong>{t('fuel.current.policy')}:</strong> {plan.policyVersion}
            </li>
            <li>
              <strong>{t('fuel.current.status')}:</strong> {plan.status}
            </li>
            {plan.isPartial ? (
              <li className="note">{t('fuel.current.partial')}</li>
            ) : null}
          </ul>
          {plan.explanationCodes.length > 0 ? (
            <ul className="explain-list" aria-label={t('fuel.explanationsLabel')}>
              {explainList(plan.explanationCodes, t).map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          ) : null}
          {nextMeal ? (
            <p className="note">
              {t('fuel.current.nextMeal', {
                meal: t.has(`fuel.mealType.${nextMeal.mealType}`)
                  ? t(`fuel.mealType.${nextMeal.mealType}`)
                  : nextMeal.mealType,
                name: recipeLabel(
                  nextMeal.recipeId,
                  recipesById,
                  t('fuel.recipeFallback'),
                ),
                date: nextMeal.localDate,
              })}
            </p>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost"
            disabled={planPreviewStatus === 'pending'}
            onClick={() => void handlePreviewPlan()}
          >
            {planPreviewStatus === 'pending'
              ? t('fuel.planPreview.pending')
              : t('fuel.planPreview.replaceCta')}
          </button>
          {planPreviewStatus === 'error' && planPreviewError ? (
            <div className="form-status" data-tone="error" role="alert">
              {planPreviewError}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="fuel-block fuel-empty">
          <h2>{t('fuel.empty.title')}</h2>
          <p className="note">{t('fuel.empty.body')}</p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={planPreviewStatus === 'pending'}
            onClick={() => void handlePreviewPlan()}
          >
            {planPreviewStatus === 'pending'
              ? t('fuel.planPreview.pending')
              : t('fuel.planPreview.cta')}
          </button>
          {planPreviewStatus === 'error' && planPreviewError ? (
            <div className="form-status" data-tone="error" role="alert">
              {planPreviewError}
            </div>
          ) : null}
          {planPreviewStatus === 'success' && planPreviewSuccess ? (
            <div className="form-status" data-tone="success" role="status">
              {planPreviewSuccess}
            </div>
          ) : null}
        </div>
      )}

      {planPreview ? (
        <div className="fuel-block" aria-live="polite">
          <h2>{t('fuel.planPreview.resultTitle')}</h2>
          <p className="note">
            {t('fuel.planPreview.eligibleCount', {
              count: planPreview.eligibleRecipeCount,
            })}
          </p>
          {planPreview.isPartial ? (
            <p className="note">{t('fuel.planPreview.partial')}</p>
          ) : null}
          <ul className="explain-list" aria-label={t('fuel.explanationsLabel')}>
            {explainList(planPreview.explanationCodes, t).map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
          {planPreview.warnings.length > 0 ? (
            <ul className="explain-list explain-list--warn">
              {planPreview.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
          <ul className="meal-list meal-list--preview">
            {planPreview.days.slice(0, 9).map((slot) => (
              <li
                key={`${slot.localDate}-${slot.mealType}-${slot.recipeId}`}
                className="meal-row meal-row--planned"
              >
                <div className="meal-row__meta">
                  <strong>{slot.localDate}</strong>
                  <span>
                    {t.has(`fuel.mealType.${slot.mealType}`)
                      ? t(`fuel.mealType.${slot.mealType}`)
                      : slot.mealType}
                  </span>
                  <span>{slot.recipeName}</span>
                </div>
              </li>
            ))}
          </ul>
          {planPreview.days.length > 9 ? (
            <p className="note">
              {t('fuel.planPreview.moreSlots', {
                count: planPreview.days.length - 9,
              })}
            </p>
          ) : null}
          {planPreview.previewToken ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={activateStatus === 'pending'}
              onClick={() => void handleActivatePlan()}
            >
              {activateStatus === 'pending'
                ? t('fuel.activate.pending')
                : t('fuel.activate.cta')}
            </button>
          ) : (
            <p className="note">{t('fuel.planPreview.notActivatable')}</p>
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
        </div>
      ) : null}

      {plan ? (
        <>
          <div className="fuel-block">
            <h2>{t('fuel.planned.title')}</h2>
            <p className="note">{t('fuel.planned.subtitle')}</p>
            {plannedRemaining.length === 0 ? (
              <p className="note">{t('fuel.planned.empty')}</p>
            ) : (
              <ul className="meal-list">
                {plannedRemaining.map((meal) => {
                  const busyLog =
                    logMealId === meal.id && logStatus === 'pending';
                  const busySwap =
                    swapMealId === meal.id && swapStatus === 'pending';
                  return (
                    <li key={meal.id} className="meal-row meal-row--planned">
                      <div className="meal-row__meta">
                        <strong>{meal.localDate}</strong>
                        <span>
                          {t.has(`fuel.mealType.${meal.mealType}`)
                            ? t(`fuel.mealType.${meal.mealType}`)
                            : meal.mealType}
                        </span>
                        <span>
                          {recipeLabel(
                            meal.recipeId,
                            recipesById,
                            t('fuel.recipeFallback'),
                          )}
                        </span>
                        <span className="meal-row__lane">
                          {t('fuel.planned.lane')}
                        </span>
                      </div>
                      <div className="meal-row__actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={busyLog || busySwap}
                          onClick={() => void handleMarkEaten(meal)}
                        >
                          {busyLog ? t('fuel.log.pending') : t('fuel.log.cta')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          disabled={busyLog || busySwap}
                          onClick={() => void handleSwapPreview(meal)}
                        >
                          {busySwap ? t('fuel.swap.pending') : t('fuel.swap.cta')}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {logStatus === 'error' && logError ? (
              <div className="form-status" data-tone="error" role="alert">
                {logError}
              </div>
            ) : null}
            {logStatus === 'success' && logSuccess ? (
              <div className="form-status" data-tone="success" role="status">
                {logSuccess}
              </div>
            ) : null}
          </div>

          <div className="fuel-block">
            <h2>{t('fuel.consumed.title')}</h2>
            <p className="note">{t('fuel.consumed.subtitle')}</p>
            {sessionLogs.length === 0 ? (
              <p className="note">{t('fuel.consumed.empty')}</p>
            ) : (
              <ul className="meal-list">
                {sessionLogs.map((log) => (
                  <li key={log.id} className="meal-row meal-row--consumed">
                    <div className="meal-row__meta">
                      <strong>{log.localDate}</strong>
                      <span>
                        {log.mealType && t.has(`fuel.mealType.${log.mealType}`)
                          ? t(`fuel.mealType.${log.mealType}`)
                          : (log.mealType ?? t('fuel.consumed.untyped'))}
                      </span>
                      <span>
                        {log.recipeId
                          ? recipeLabel(
                              log.recipeId,
                              recipesById,
                              t('fuel.recipeFallback'),
                            )
                          : t('fuel.consumed.loggedMeal')}
                      </span>
                      <span className="meal-row__lane meal-row__lane--consumed">
                        {t('fuel.consumed.lane')}
                      </span>
                    </div>
                    <p className="note">
                      {t('fuel.consumed.macrosNote', {
                        kcal: Math.round(log.nutrientSnapshot.energyKcal),
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}

      {swapPreview && swapMealId ? (
        <div className="fuel-block" aria-live="polite">
          <h2>{t('fuel.swap.resultTitle')}</h2>
          <ul className="explain-list">
            {explainList(swapPreview.explanationCodes, t).map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
          {swapPreview.candidates.length === 0 ? (
            <p className="note">{t('fuel.swap.noCandidates')}</p>
          ) : (
            <ul className="meal-list">
              {swapPreview.candidates.map((candidate) => (
                <li key={candidate.recipeId} className="meal-row">
                  <div className="meal-row__meta">
                    <strong>{candidate.recipeName}</strong>
                    <span>
                      {t('fuel.swap.score', {
                        score: candidate.score.toFixed(2),
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      swapStatus === 'pending' || !swapPreview.previewToken
                    }
                    onClick={() => void handleSwapConfirm(candidate.recipeId)}
                  >
                    {swapStatus === 'pending'
                      ? t('fuel.swap.confirming')
                      : t('fuel.swap.confirm')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSwapPreview(null);
              setSwapMealId(null);
              setSwapStatus('idle');
            }}
          >
            {t('fuel.swap.cancel')}
          </button>
          {swapStatus === 'error' && swapError ? (
            <div className="form-status" data-tone="error" role="alert">
              {swapError}
            </div>
          ) : null}
        </div>
      ) : null}

      {swapStatus === 'success' && swapSuccess && !swapPreview ? (
        <div className="form-status" data-tone="success" role="status">
          {swapSuccess}
        </div>
      ) : null}

      <div className="fuel-block">
        <h2>{t('fuel.grocery.title')}</h2>
        {!plan ? (
          <p className="note">{t('fuel.grocery.needsPlan')}</p>
        ) : !grocery || grocery.items.length === 0 ? (
          <p className="note">{t('fuel.grocery.empty')}</p>
        ) : (
          <ul className="grocery-list">
            {grocery.items
              .filter((item) => !item.excluded)
              .map((item) => (
                <li key={item.id}>
                  <strong>{item.displayName}</strong>
                  <span>
                    {t('fuel.grocery.grams', {
                      grams: Math.round(item.quantityGrams),
                    })}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>

      <p>
        <Link href="/app" className="btn btn-ghost">
          {t('fuel.backToToday')}
        </Link>
      </p>
    </section>
  );
}
