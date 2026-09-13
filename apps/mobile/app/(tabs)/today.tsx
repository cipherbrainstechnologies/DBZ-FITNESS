import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { FeedbackBanner, LoadingBlock, PrimaryButton, Screen } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors, fonts, spacing } from '@/src/theme';

export default function TodayScreen() {
  const { user, refreshMe } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshMe();
    } catch {
      setError(t('todayError'));
    } finally {
      setLoading(false);
    }
  }, [refreshMe, t]);

  useEffect(() => {
    if (!user) {
      void load();
    } else {
      setLoading(false);
    }
  }, [user, load]);

  if (loading && !user) {
    return <LoadingBlock label={t('todayLoading')} />;
  }

  const name = user?.displayName?.trim() || user?.email || '';

  return (
    <Screen>
      <FeedbackBanner error={error} />
      <Text style={styles.greeting}>{t('todayGreeting')}</Text>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('comingLater')}</Text>
        <Text style={styles.cardBody}>{t('todayEmptyMission')}</Text>
      </View>
      {error ? (
        <PrimaryButton label={t('retry')} onPress={() => void load()} />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => void load()}
          style={styles.refresh}
        >
          <Text style={styles.refreshText}>{t('retry')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  name: {
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
    gap: spacing.sm,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.secondary,
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  refresh: {
    marginTop: spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  refreshText: {
    fontFamily: fonts.medium,
    color: colors.secondary,
  },
});
