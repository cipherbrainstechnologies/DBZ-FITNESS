'use client';

import type { ContentReadinessResponse } from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { RequireAuth } from '@/components/require-auth';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function AdminHome() {
  const t = useTranslations();
  const { user } = useAuth();
  const [readiness, setReadiness] = useState<ContentReadinessResponse | null>(null);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .getContentReadiness()
      .then(setReadiness)
      .catch((err: unknown) => {
        setReadinessError(err instanceof Error ? err.message : t('errors.generic'));
      });
  }, [t]);

  if (!user) return null;

  return (
    <section className="app-panel" aria-labelledby="admin-title">
      <p className="note">{t('admin.subtitle')}</p>
      <h1 id="admin-title">{t('admin.title')}</h1>
      <p className="note">{t('admin.body')}</p>
      <h2>{t('admin.contentReadiness')}</h2>
      {readinessError ? (
        <div className="form-status" data-tone="error" role="alert">
          {readinessError}
        </div>
      ) : null}
      {readiness ? (
        <ul className="meta-list">
          <li>
            <strong>{t('admin.mode')}:</strong> {readiness.contentMode}
          </li>
          <li>
            <strong>{t('admin.locale')}:</strong> {readiness.locale}
          </li>
          <li>
            <strong>{t('admin.pack')}:</strong> {readiness.packKey ?? t('admin.missing')}
          </li>
          <li>
            <strong>{t('admin.publishedCoaches')}:</strong> {readiness.publishedPresentationCount}
          </li>
          <li>
            <strong>{t('admin.diagnostic')}:</strong> {readiness.diagnosticCode ?? t('admin.none')}
          </li>
          <li>
            <strong>{t('admin.repair')}:</strong> {readiness.repairAction}
          </li>
        </ul>
      ) : (
        <p className="note">{t('admin.loadingReadiness')}</p>
      )}
      <ul className="meta-list">
        <li>
          <strong>{t('admin.signedInAs')}:</strong> {user.email}
        </li>
        <li>
          <strong>{t('today.roles')}:</strong> {user.roles.join(', ')}
        </li>
      </ul>
      <p>
        <Link href="/app" className="btn btn-ghost">
          {t('admin.backToApp')}
        </Link>
      </p>
    </section>
  );
}

export default function AdminPage() {
  const t = useTranslations();

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      <SiteHeader variant="app" />
      <main id="main" className="main">
        <RequireAuth requireAdmin>
          <AdminHome />
        </RequireAuth>
      </main>
    </div>
  );
}
