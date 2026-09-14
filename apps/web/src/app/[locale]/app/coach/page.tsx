'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { CoachSelectForm } from '@/components/coach/coach-select-form';
import { RequireAuth } from '@/components/require-auth';
import { RequireMemberJourney } from '@/components/require-member-journey';
import { SiteHeader } from '@/components/site-header';

function CoachPageInner() {
  const searchParams = useSearchParams();
  const changeMode = searchParams.get('change') === '1';

  return (
    <RequireAuth>
      <RequireMemberJourney allow={['SELECT_COACH']} allowChangeCoach={changeMode}>
        <CoachSelectForm changeMode={changeMode} />
      </RequireMemberJourney>
    </RequireAuth>
  );
}

export default function CoachPage() {
  const t = useTranslations();

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      <SiteHeader variant="app" />
      <main id="main" className="main">
        <Suspense
          fallback={
            <div className="loading-block" role="status">
              <p>{t('auth.loading')}</p>
            </div>
          }
        >
          <CoachPageInner />
        </Suspense>
      </main>
    </div>
  );
}
