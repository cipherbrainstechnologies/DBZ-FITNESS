import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import {
  BrandTitle,
  FeedbackBanner,
  Field,
  LinkButton,
  PrimaryButton,
  Screen,
} from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors } from '@/src/theme';

function mapAuthError(
  codeOrMessage: string | null,
  t: (
    k:
      | 'networkError'
      | 'unknownError'
      | 'invalidCredentials'
      | 'emailInUse'
      | 'validationEmail',
  ) => string,
) {
  if (!codeOrMessage) return null;
  if (codeOrMessage === 'NETWORK_ERROR') return t('networkError');
  if (codeOrMessage === 'UNKNOWN_ERROR') return t('unknownError');
  if (codeOrMessage === 'INVALID_CREDENTIALS') return t('invalidCredentials');
  if (codeOrMessage === 'EMAIL_IN_USE') return t('emailInUse');
  if (codeOrMessage === 'VALIDATION_ERROR') return t('validationEmail');
  return t('unknownError');
}

export default function RegisterScreen() {
  const { status, register, error, success, clearFeedback } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)/today" />;
  }

  async function onSubmit() {
    clearFeedback();
    setLocalError(null);
    const trimmed = email.trim();
    if (!trimmed.includes('@')) {
      setLocalError(t('validationEmail'));
      return;
    }
    if (password.length < 10) {
      setLocalError(t('validationPasswordRegister'));
      return;
    }
    setPending(true);
    const ok = await register(trimmed, password, displayName.trim() || undefined);
    setPending(false);
    if (ok) {
      router.replace('/(tabs)/today');
    }
  }

  const successMessage = success === 'REGISTER_SUCCESS' ? t('registerSuccess') : null;

  return (
    <Screen style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BrandTitle subtitle={t('registerTitle')} />
          <FeedbackBanner
            error={localError ?? mapAuthError(error, t)}
            success={successMessage}
          />
          <Field
            label={t('email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            editable={!pending}
          />
          <Field
            label={t('displayName')}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            textContentType="name"
            editable={!pending}
          />
          <Field
            label={t('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="password-new"
            editable={!pending}
          />
          <PrimaryButton
            label={pending ? t('registering') : t('registerAction')}
            onPress={() => {
              void onSubmit();
            }}
            loading={pending}
          />
          <LinkButton
            label={t('goToLogin')}
            onPress={() => {
              clearFeedback();
              router.replace('/(auth)/login');
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
});
