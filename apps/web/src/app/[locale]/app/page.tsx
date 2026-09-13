'use client';

import { useTranslations } from 'next-intl';

import { RequireAuth } from '@/components/require-auth';
import { RequireOnboardingComplete } from '@/components/require-onboarding-complete';
import { SiteHeader } from '@/components/site-header';
import { TodayTrainingPanel } from '@/components/training/today-training-panel';

export default function AppPage() {
  const t = useTranslations();

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      <SiteHeader variant="app" />
      <main id="main" className="main">
        <RequireAuth>
          <RequireOnboardingComplete>
            <TodayTrainingPanel />
          </RequireOnboardingComplete>
        </RequireAuth>
      </main>
    </div>
  );
}
