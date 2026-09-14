import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CharacterStrip } from '@/components/character-strip';
import { RegisterForm } from '@/components/register-form';
import { SiteHeader } from '@/components/site-header';

export default async function RegisterPage({
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
        <div className="auth-layout">
          <section className="auth-hero" aria-labelledby="register-brand">
            <h1 id="register-brand" className="hero-brand">
              Saiyan <em>Ascend</em>
            </h1>
            <p className="hero-copy">{t('brand.tagline')}</p>
            <CharacterStrip />
          </section>
          <section className="auth-panel" aria-labelledby="register-title">
            <h2 id="register-title">{t('register.title')}</h2>
            <p className="lede">{t('register.subtitle')}</p>
            <RegisterForm />
          </section>
        </div>
      </main>
    </div>
  );
}
