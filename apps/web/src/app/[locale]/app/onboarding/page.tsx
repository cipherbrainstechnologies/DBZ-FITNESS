'use client';

import { useTranslations } from 'next-intl';

import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { RequireAuth } from '@/components/require-auth';
import { SiteHeader } from '@/components/site-header';

export default function OnboardingPage() {
  const t = useTranslations();

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      <SiteHeader variant="app" />
      <main id="main" className="main">
        <RequireAuth>
          <OnboardingWizard />
        </RequireAuth>
      </main>
    </div>
  );
}
