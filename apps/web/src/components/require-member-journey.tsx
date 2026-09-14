'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';

import { useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';
import type { MemberJourney } from '@saiyan/contracts';

type JourneyAllow = MemberJourney['destination'];

type RequireMemberJourneyProps = {
  children: ReactNode;
  allow: readonly JourneyAllow[];
  /** When true, members already on Today may stay (Change Coach). */
  allowChangeCoach?: boolean;
};

/**
 * Shared post-auth gate. Loading never redirects. Fetch errors keep the session.
 */
export function RequireMemberJourney({
  children,
  allow,
  allowChangeCoach = false,
}: RequireMemberJourneyProps) {
  const t = useTranslations();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const allowKey = allow.join(',');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { journey } = await api.getOnboarding();
        if (cancelled) return;
        const permitted =
          allow.includes(journey.destination) ||
          (allowChangeCoach && journey.destination === 'TODAY');
        if (!permitted) {
          router.replace(journey.path);
          return;
        }
        setState('ready');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.status === 401) {
          router.replace('/login');
          return;
        }
        setError(mapApiError(err, t).message);
        setState('error');
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [allow, allowChangeCoach, allowKey, router, t]);

  if (state === 'loading') {
    return (
      <div className="loading-block" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>{t('onboarding.checking')}</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="form-status" data-tone="error" role="alert">
        <p>{error ?? t('errors.generic')}</p>
        <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
          {t('coach.retry')}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
