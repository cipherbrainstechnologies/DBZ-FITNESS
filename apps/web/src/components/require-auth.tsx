'use client';

import { useTranslations } from 'next-intl';
import { useEffect, type ReactNode } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { isAdmin, useAuth } from '@/lib/auth-context';

type RequireAuthProps = {
  children: ReactNode;
  /** When true, only ADMIN role may proceed; MEMBER is denied. */
  requireAdmin?: boolean;
};

export function RequireAuth({ children, requireAdmin = false }: RequireAuthProps) {
  const t = useTranslations();
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === 'anonymous') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="loading-block" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>{t('auth.loading')}</p>
      </div>
    );
  }

  if (status === 'anonymous' || !user) {
    return (
      <div className="loading-block" role="status" aria-live="polite">
        <p>{t('auth.required')}</p>
      </div>
    );
  }

  if (requireAdmin && !isAdmin(user)) {
    return (
      <section className="app-panel denied-panel" aria-labelledby="admin-denied-title">
        <h1 id="admin-denied-title">{t('admin.deniedTitle')}</h1>
        <p className="note">{t('admin.deniedBody')}</p>
        <p>
          <Link className="btn btn-ghost" href="/app">
            {t('admin.backToApp')}
          </Link>
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
