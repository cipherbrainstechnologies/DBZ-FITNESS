import { ApiClientError } from './api';

type Translate = (key: string) => string;

export function mapApiError(
  error: unknown,
  t: Translate,
): {
  message: string;
  fieldErrors?: Record<string, string[]>;
} {
  if (!(error instanceof ApiClientError)) {
    return { message: t('errors.generic') };
  }

  if (error.code === 'NETWORK_ERROR' || error.status === 0) {
    return { message: t('errors.network') };
  }

  if (error.code === 'VALIDATION_ERROR' || error.status === 400) {
    if (error.fieldErrors !== undefined) {
      return {
        message: t('errors.validation'),
        fieldErrors: error.fieldErrors,
      };
    }
    return { message: error.message || t('errors.generic') };
  }

  if (error.status === 401 || error.code === 'UNAUTHORIZED') {
    return { message: t('errors.unauthorized') };
  }

  if (error.status === 403 || error.code === 'FORBIDDEN') {
    return { message: t('errors.forbidden') };
  }

  if (error.status === 409 || error.code === 'CONFLICT') {
    return { message: t('errors.conflict') };
  }

  return { message: error.message || t('errors.generic') };
}
