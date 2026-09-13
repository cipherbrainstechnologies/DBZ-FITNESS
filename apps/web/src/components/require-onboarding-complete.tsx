'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';

import { useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';

type RequireOnboardingCompleteProps = {
  children: ReactNode;
};

/**
 * Gates the member Today shell: incomplete onboarding redirects to the wizard.
 */
export function RequireOnboardingComplete({ children }: RequireOnboardingCompleteProps) {
  const t = useTranslations();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { progress } = await api.getOnboarding();
        if (cancelled) return;
        if (!progress.completedAt) {
          router.replace('/app/onboarding');
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
  }, [router, t]);

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
        {error ?? t('errors.generic')}
      </div>
    );
  }

  return <>{children}</>;
}
