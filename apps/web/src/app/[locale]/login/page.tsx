import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CharacterStrip } from '@/components/character-strip';
import { LoginForm } from '@/components/login-form';
import { SiteHeader } from '@/components/site-header';

export default async function LoginPage({
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
          <section className="auth-hero" aria-labelledby="login-brand">
            <h1 id="login-brand" className="hero-brand">
              Saiyan <em>Ascend</em>
            </h1>
            <p className="hero-copy">{t('brand.tagline')}</p>
            <CharacterStrip />
          </section>
          <section className="auth-panel" aria-labelledby="login-title">
            <h2 id="login-title">{t('login.title')}</h2>
            <p className="lede">{t('login.subtitle')}</p>
            <LoginForm />
          </section>
        </div>
      </main>
    </div>
  );
}
