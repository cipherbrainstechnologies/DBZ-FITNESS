import { Redirect } from 'expo-router';

import { LoadingBlock } from '@/src/components/ui';
import { useAuth } from '@/src/auth/AuthContext';
import { useI18n } from '@/src/i18n';

export default function Index() {
  const { status } = useAuth();
  const { t } = useI18n();

  if (status === 'loading') {
    return <LoadingBlock label={t('todayLoading')} />;
  }

  if (status === 'authenticated') {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
