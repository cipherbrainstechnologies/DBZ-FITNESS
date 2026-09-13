'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, type AppLocale } from '@/i18n/routing';

export function LocaleSwitcher() {
  const t = useTranslations('locale');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className="locale-switch">
      <span className="visually-hidden">{t('label')}</span>
      <span aria-hidden="true">{t('label')}</span>
      <select
        value={locale}
        disabled={pending}
        aria-label={t('label')}
        onChange={(event) => {
          const next = event.target.value as AppLocale;
          startTransition(() => {
            router.replace(pathname, { locale: next });
          });
        }}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
