'use client';

import { useTranslations } from 'next-intl';

import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';

export default function AboutPage() {
  const t = useTranslations();

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      <SiteHeader />
      <main id="main" className="main">
        <section className="app-panel" aria-labelledby="about-title">
          <h1 id="about-title">{t('about.title')}</h1>
          <p>{t('about.ai')}</p>
          <p>{t('about.health')}</p>
          <p>{t('about.content')}</p>
          <p>
            <Link href="/">{t('nav.home')}</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
