'use client';

import type { PlannedMealSummary, RecipeSummary } from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { pickNextPlannedMeal } from '@/lib/nutrition-ui';
import { useAuth } from '@/lib/auth-context';

type LoadState = 'loading' | 'ready' | 'error' | 'empty';

/**
 * Compact next-meal snippet for Today. Hidden when there is no active meal plan.
 */
export function TodayFuelSnippet() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [nextMeal, setNextMeal] = useState<PlannedMealSummary | null>(null);
  const [recipeName, setRecipeName] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    try {
      const [current, recipes] = await Promise.all([
        api.getCurrentMealPlan(),
        api.listRecipes(),
      ]);
      if (!current.plan) {
        setNextMeal(null);
        setRecipeName(null);
        setLoadState('empty');
        return;
      }
      const next = pickNextPlannedMeal(
        current.meals,
        user.currentTimeZone || 'UTC',
      );
      setNextMeal(next);
      if (next) {
        const map = new Map<string, RecipeSummary>(
          recipes.recipes.map((r) => [r.id, r]),
        );
        setRecipeName(map.get(next.recipeId)?.name ?? null);
      } else {
        setRecipeName(null);
      }
      setLoadState('ready');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      // Keep Today uncluttered — fail soft without an error banner.
      setLoadState('empty');
    }
  }, [router, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!user || loadState === 'loading' || loadState === 'empty' || !nextMeal) {
    return null;
  }

  const mealTypeLabel = t.has(`fuel.mealType.${nextMeal.mealType}`)
    ? t(`fuel.mealType.${nextMeal.mealType}`)
    : nextMeal.mealType;

  return (
    <div className="today-fuel">
      <h2>{t('today.fuel.title')}</h2>
      <p className="note">
        {t('today.fuel.nextMeal', {
          meal: mealTypeLabel,
          name: recipeName ?? t('fuel.recipeFallback'),
          date: nextMeal.localDate,
        })}
      </p>
      <div className="cta-row">
        <Link href="/app/fuel" className="btn btn-ghost">
          {t('today.fuel.view')}
        </Link>
        <Link href="/app/fuel" className="btn btn-ghost">
          {t('today.fuel.swap')}
        </Link>
      </div>
    </div>
  );
}
