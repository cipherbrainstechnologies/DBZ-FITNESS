'use client';

import { useTranslations } from 'next-intl';

import { FuelPanel } from '@/components/fuel/fuel-panel';
import { RequireAuth } from '@/components/require-auth';
import { RequireOnboardingComplete } from '@/components/require-onboarding-complete';
import { SiteHeader } from '@/components/site-header';

export default function FuelPage() {
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
            <FuelPanel />
          </RequireOnboardingComplete>
        </RequireAuth>
      </main>
    </div>
  );
}
