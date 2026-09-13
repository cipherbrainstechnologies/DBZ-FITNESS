'use client';

import type {
  ProgressHistoryResponse,
  ProgressSummaryResponse,
  ProgressXpLedgerResponse,
} from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';

type LoadState = 'loading' | 'ready' | 'error';

export function ProgressPanel() {
  const t = useTranslations();
  const router = useRouter();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProgressSummaryResponse | null>(null);
  const [ledger, setLedger] = useState<ProgressXpLedgerResponse | null>(null);
  const [history, setHistory] = useState<ProgressHistoryResponse | null>(null);

  const refresh = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    try {
      const [summaryRes, ledgerRes, historyRes] = await Promise.all([
        api.getProgressSummary(),
        api.getProgressXpLedger(),
        api.getProgressHistory(),
      ]);
      setSummary(summaryRes);
      setLedger(ledgerRes);
      setHistory(historyRes);
      setLoadState('ready');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setLoadState('error');
      setLoadError(mapApiError(err, t).message);
    }
  }, [router, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loadState === 'loading') {
    return (
      <div className="loading-block" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>{t('progress.loading')}</p>
      </div>
    );
  }

  if (loadState === 'error' || !summary || !ledger) {
    return (
      <section className="app-panel" aria-labelledby="progress-error-title">
        <h1 id="progress-error-title">{t('progress.title')}</h1>
        <div className="form-status" data-tone="error" role="alert">
          {loadError ?? t('errors.generic')}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void refresh()}>
          {t('progress.retry')}
        </button>
      </section>
    );
  }

  return (
    <section className="app-panel progress-panel" aria-labelledby="progress-title">
      <div className="train-header">
        <h1 id="progress-title">{t('progress.title')}</h1>
        <p className="note">{t('progress.subtitle')}</p>
      </div>

      <div className="form-status" data-tone="info" role="note">
        {t('progress.disclaimer')}
      </div>

      <div className="train-block">
        <h2>{t('progress.summary.title')}</h2>
        <ul className="meta-list">
          <li>
            <strong>{t('progress.summary.totalXp')}:</strong> {summary.totalXp}
          </li>
          <li>
            <strong>{t('progress.summary.gameLevel')}:</strong> {summary.gameLevel}
          </li>
          <li>
            <strong>{t('progress.summary.towardNext')}:</strong>{' '}
            {t('progress.summary.towardNextValue', {
              current: summary.xpTowardNextLevel,
              perLevel: summary.xpPerLevel,
            })}
          </li>
          <li>
            <strong>{t('progress.summary.today')}:</strong>{' '}
            {t('progress.summary.todayValue', {
              total: summary.todayTotal,
              max: summary.dailyMaximum,
              date: summary.todayLocalDate,
            })}
          </li>
          <li>
            <strong>{t('progress.summary.policy')}:</strong> v{summary.policyVersion}
          </li>
        </ul>

        <h3>{t('progress.summary.categoriesTitle')}</h3>
        <ul className="meta-list">
          {summary.todayByCategory.map((row) => (
            <li key={row.category}>
              <strong>
                {t.has(`progress.categories.${row.category}`)
                  ? t(`progress.categories.${row.category}`)
                  : row.category}
                :
              </strong>{' '}
              {row.awardedAmount} / {row.categoryCap}
            </li>
          ))}
        </ul>
      </div>

      {summary.milestoneUnlocks.length > 0 && (
        <div className="train-block">
          <h2>{t('progress.milestones.title')}</h2>
          <p className="note">{t('progress.milestones.body')}</p>
          <ul className="meta-list">
            {summary.milestoneUnlocks.map((m) => (
              <li key={m.milestoneDefinitionId}>
                <strong>{m.milestoneDefinitionId}</strong>
                {m.levelAtUnlock != null
                  ? ` · ${t('progress.milestones.atLevel', { level: m.levelAtUnlock })}`
                  : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="train-block">
        <h2>{t('progress.ledger.title')}</h2>
        <p className="note">{t('progress.ledger.body')}</p>
        {ledger.entries.length === 0 ? (
          <p className="note">{t('progress.ledger.empty')}</p>
        ) : (
          <ul className="progress-ledger-list">
            {ledger.entries.map((entry) => (
              <li key={entry.id}>
                <span className="progress-ledger-delta">+{entry.delta}</span>
                <span>
                  {t.has(`progress.events.${entry.eventType}`)
                    ? t(`progress.events.${entry.eventType}`)
                    : entry.eventType}
                </span>
                <span className="note">
                  {entry.localDate} ·{' '}
                  {t.has(`progress.categories.${entry.category}`)
                    ? t(`progress.categories.${entry.category}`)
                    : entry.category}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {history && history.days.length > 0 && (
        <div className="train-block">
          <h2>{t('progress.history.title')}</h2>
          <ul className="meta-list">
            {history.days.map((day) => (
              <li key={day.localDate}>
                <strong>{day.localDate}:</strong>{' '}
                {t('progress.history.dayValue', {
                  xp: day.totalDelta,
                  count: day.entryCount,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
