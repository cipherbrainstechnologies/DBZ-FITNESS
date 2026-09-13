'use client';

import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { RegisterRequestSchema } from '@saiyan/contracts';

import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { mapApiError } from '@/lib/map-api-error';

export function RegisterForm() {
  const t = useTranslations();
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    const payload = {
      email,
      password,
      ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
    };

    const parsed = RegisterRequestSchema.safeParse(payload);
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
      await register(parsed.data);
      setSuccess(true);
      router.replace('/app/onboarding');
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
        <label htmlFor="register-email">{t('register.email')}</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
        />
        {fieldErrors.email ? (
          <p id="register-email-error" className="field-error" role="alert">
            {t('errors.validation')}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="register-password">{t('register.password')}</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          disabled={pending}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby="register-password-hint"
        />
        <p id="register-password-hint" className="field-hint">
          {t('register.passwordHint')}
        </p>
        {fieldErrors.password ? (
          <p className="field-error" role="alert">
            {t('register.passwordHint')}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="register-display-name">{t('register.displayName')}</label>
        <input
          id="register-display-name"
          name="displayName"
          type="text"
          autoComplete="nickname"
          disabled={pending}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          aria-invalid={Boolean(fieldErrors.displayName)}
        />
        {fieldErrors.displayName ? (
          <p className="field-error" role="alert">
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
          {t('register.success')}
        </div>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? t('register.submitting') : t('register.submit')}
      </button>

      <p className="form-footer">
        {t('register.hasAccount')}{' '}
        <Link href="/login">{t('register.loginLink')}</Link>
      </p>
    </form>
  );
}
