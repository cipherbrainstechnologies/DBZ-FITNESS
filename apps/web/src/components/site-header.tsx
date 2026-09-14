'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';

import { LocaleSwitcher } from './locale-switcher';

type SiteHeaderProps = {
  variant?: 'marketing' | 'app';
};

export function SiteHeader({ variant = 'marketing' }: SiteHeaderProps) {
  const t = useTranslations();
  const { status, user, logout } = useAuth();

  return (
    <header className="shell-header">
      <Link href="/" className="brand-mark">
        Saiyan <span>Ascend</span>
      </Link>
      <div className="header-actions">
        <LocaleSwitcher />
        {variant === 'marketing' && status !== 'authenticated' && (
          <>
            <Link href="/about">{t('about.title')}</Link>
            <Link href="/login">{t('nav.login')}</Link>
            <Link href="/register" className="btn btn-primary">
              {t('nav.register')}
            </Link>
          </>
        )}
        {status === 'authenticated' && user && (
          <>
            <Link href="/app">{t('nav.today')}</Link>
            <Link href="/app/train">{t('nav.train')}</Link>
            <Link href="/app/fuel">{t('nav.fuel')}</Link>
            <Link href="/app/progress">{t('nav.progress')}</Link>
            <Link href="/app/profile">{t('nav.profile')}</Link>
            {user.roles.includes('ADMIN') && (
              <Link href="/admin">{t('nav.admin')}</Link>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                void logout();
              }}
            >
              {t('nav.logout')}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
