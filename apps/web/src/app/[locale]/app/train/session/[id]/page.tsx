'use client';

import { useTranslations } from 'next-intl';
import { use } from 'react';

import { RequireAuth } from '@/components/require-auth';
import { RequireOnboardingComplete } from '@/components/require-onboarding-complete';
import { SiteHeader } from '@/components/site-header';
import { WorkoutPlayer } from '@/components/training/workout-player';

export default function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations();
  const { id } = use(params);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      <SiteHeader variant="app" />
      <main id="main" className="main">
        <RequireAuth>
          <RequireOnboardingComplete>
            <WorkoutPlayer plannedSessionId={id} />
          </RequireOnboardingComplete>
        </RequireAuth>
      </main>
    </div>
  );
}
