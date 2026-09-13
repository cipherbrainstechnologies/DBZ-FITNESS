'use client';

import type { QuoteSummary } from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

/**
 * Compact motivational strip for Today.
 * Missing or failed media must never break the workout CTA above.
 */
export function TodayMediaStrip() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [quote, setQuote] = useState<QuoteSummary | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    try {
      const content = await api.getContentToday(user.locale || 'en');
      const first = content.quotes[0] ?? null;
      setQuote(first);
      setLoadState(first ? 'ready' : 'empty');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      // Soft-fail: hide strip; workout UI remains usable.
      setQuote(null);
      setLoadState('empty');
    }
  }, [router, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!user || loadState === 'loading' || loadState === 'empty' || !quote) {
    return null;
  }

  return (
    <div className="today-media" aria-label={t('today.media.title')}>
      <h2>{t('today.media.title')}</h2>
      <blockquote className="today-media__quote">
        <p>{quote.text}</p>
        <footer>
          <cite>{quote.attribution}</cite>
          <span className="note"> {t('today.media.notAuthentic')}</span>
        </footer>
      </blockquote>
    </div>
  );
}
