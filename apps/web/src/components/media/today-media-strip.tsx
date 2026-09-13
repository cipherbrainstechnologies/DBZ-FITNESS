'use client';

import type { MediaAssetSummary, QuoteSummary } from '@saiyan/contracts';
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
  const [art, setArt] = useState<MediaAssetSummary | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoadState('loading');
    try {
      const content = await api.getContentToday(user.locale || 'en');
      const firstQuote = content.quotes[0] ?? null;
      const firstArt =
        content.media.find((item) => item.type === 'IMAGE' && item.publicUrl) ?? null;
      setQuote(firstQuote);
      setArt(firstArt);
      setLoadState(firstQuote || firstArt ? 'ready' : 'empty');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setQuote(null);
      setArt(null);
      setLoadState('empty');
    }
  }, [router, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!user || loadState === 'loading' || loadState === 'empty') {
    return null;
  }

  return (
    <div className="today-media" aria-label={t('today.media.title')}>
      <h2>{t('today.media.title')}</h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="today-media__art"
        src="/media/motivational-card.png"
        alt={art?.altText ?? t('today.media.artAlt')}
        width={1280}
        height={720}
      />
      {quote ? (
        <blockquote className="today-media__quote">
          <p>{quote.text}</p>
          <footer>
            <cite>{quote.attribution}</cite>
            <span className="note"> {t('today.media.notAuthentic')}</span>
          </footer>
        </blockquote>
      ) : null}
    </div>
  );
}
