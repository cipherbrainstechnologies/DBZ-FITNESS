'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { LoginRequestSchema } from '@saiyan/contracts';

import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiClientError } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    const parsed = LoginRequestSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_root';
        const list = next[key] ?? [];
        list.push(issue.message);
        next[key] = list;
      }
      setFieldErrors(next);
      setError(t('errors.validation'));
      return;
    }

    setPending(true);
    try {
      await login(parsed.data);
      let next: '/app' | '/app/onboarding' = '/app';
      try {
        const { progress } = await api.getOnboarding();
        next = progress.completedAt ? '/app' : '/app/onboarding';
      } catch (afterAuth) {
        if (afterAuth instanceof ApiClientError && afterAuth.status === 401) {
          setError(t('errors.sessionCookie'));
          return;
        }
        throw afterAuth;
      }
      setSuccess(true);
      router.replace(next);
    } catch (err) {
      const mapped = mapApiError(err, t);
      setError(mapped.message);
      if (mapped.fieldErrors) setFieldErrors(mapped.fieldErrors);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="login-email">{t('login.email')}</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
        />
        {fieldErrors.email ? (
          <p id="login-email-error" className="field-error" role="alert">
            {t('errors.validation')}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="login-password">{t('login.password')}</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
        />
        {fieldErrors.password ? (
          <p id="login-password-error" className="field-error" role="alert">
            {t('errors.validation')}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="form-status" data-tone="error" role="alert" aria-live="assertive">
          <span className="visually-hidden">{t('a11y.formError')}: </span>
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="form-status" data-tone="success" role="status" aria-live="polite">
          <span className="visually-hidden">{t('a11y.success')}: </span>
          {t('login.success')}
        </div>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? t('login.submitting') : t('login.submit')}
      </button>

      <p className="form-footer">
        {t('login.noAccount')}{' '}
        <Link href="/register">{t('login.registerLink')}</Link>
      </p>
    </form>
  );
}
