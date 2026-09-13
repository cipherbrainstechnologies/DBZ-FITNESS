import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { FeedbackBanner, PrimaryButton, Screen } from '@/src/components/ui';
import { useI18n, type Locale } from '@/src/i18n';
import { colors, fonts, spacing } from '@/src/theme';

const LOCALES: Locale[] = ['en', 'fr', 'es'];

export default function ProfileScreen() {
  const { user, logout, error, success, clearFeedback } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    clearFeedback();
    setPending(true);
    await logout();
    setPending(false);
  }

  const successMessage = success === 'LOGOUT_SUCCESS' ? t('logoutSuccess') : null;

  return (
    <Screen>
      <Text style={styles.title}>{t('profileTitle')}</Text>
      <FeedbackBanner error={error} success={successMessage} />

      <View style={styles.card}>
        <Row label={t('profileEmail')} value={user?.email ?? '—'} />
        <Row label={t('profileDisplayName')} value={user?.displayName ?? '—'} />
        <Row label={t('profileStatus')} value={user?.status ?? '—'} />
        <Row label={t('profileLocale')} value={user?.locale ?? '—'} />
        <Row label={t('profileTimeZone')} value={user?.currentTimeZone ?? '—'} />
        <Row label={t('profileRoles')} value={user?.roles?.join(', ') || '—'} />
      </View>

      <Text style={styles.langLabel}>{t('language')}</Text>
      <View style={styles.langRow}>
        {LOCALES.map((code) => {
          const active = locale === code;
          return (
            <Pressable
              key={code}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setLocale(code)}
              style={[styles.langChip, active ? styles.langChipActive : null]}
            >
              <Text style={[styles.langText, active ? styles.langTextActive : null]}>
                {code.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        label={pending ? t('loggingOut') : t('logout')}
        onPress={() => {
          void onLogout();
        }}
        loading={pending}
      />
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.raised,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted,
  },
  rowValue: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  langLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  langChip: {
    minHeight: 44,
    minWidth: 56,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.raised,
  },
  langChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.raised,
  },
  langText: {
    fontFamily: fonts.semibold,
    color: colors.muted,
  },
  langTextActive: {
    color: colors.primary,
  },
});
