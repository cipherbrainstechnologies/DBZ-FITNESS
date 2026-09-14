import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CharacterStrip } from '@/components/character-strip';
import { SiteHeader } from '@/components/site-header';
import { Link } from '@/i18n/navigation';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      <SiteHeader />
      <main id="main" className="main">
        <section className="hero" aria-labelledby="home-brand">
          <h1 id="home-brand" className="hero-brand">
            Saiyan <em>Ascend</em>
          </h1>
          <p className="hero-copy">{t('home.supporting')}</p>
          <CharacterStrip />
          <div className="cta-row">
            <Link href="/login" className="btn btn-primary">
              {t('home.ctaLogin')}
            </Link>
            <Link href="/register" className="btn btn-ghost">
              {t('home.ctaRegister')}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
