'use client';

import { useTranslations } from 'next-intl';

import { RequireAuth } from '@/components/require-auth';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';

function AdminHome() {
  const t = useTranslations();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <section className="app-panel" aria-labelledby="admin-title">
      <p className="note">{t('admin.subtitle')}</p>
      <h1 id="admin-title">{t('admin.title')}</h1>
      <p className="note">{t('admin.body')}</p>
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
