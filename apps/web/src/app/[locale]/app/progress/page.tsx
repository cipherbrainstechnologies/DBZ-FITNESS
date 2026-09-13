'use client';

import { useTranslations } from 'next-intl';

import { ProgressPanel } from '@/components/progress/progress-panel';
import { RequireAuth } from '@/components/require-auth';
import { RequireOnboardingComplete } from '@/components/require-onboarding-complete';
import { SiteHeader } from '@/components/site-header';

export default function ProgressPage() {
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
            <ProgressPanel />
          </RequireOnboardingComplete>
        </RequireAuth>
      </main>
    </div>
  );
}
