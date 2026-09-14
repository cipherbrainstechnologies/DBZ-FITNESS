import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCharacterSelection, type CharacterPresentation } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthContext';
import { FeedbackBanner, LoadingBlock, PrimaryButton, Screen } from '@/src/components/ui';
import { localCharacterArt } from '@/src/characters/art';
import { useI18n } from '@/src/i18n';
import { colors, fonts, spacing } from '@/src/theme';

export default function TodayScreen() {
  const { user, refreshMe } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<CharacterPresentation | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshMe();
      const { selection } = await getCharacterSelection();
      setTheme(selection?.presentation ?? null);
    } catch {
      setError(t('todayError'));
    } finally {
      setLoading(false);
    }
  }, [refreshMe, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !user) {
    return <LoadingBlock label={t('todayLoading')} />;
  }

  const name = user?.displayName?.trim() || user?.email || '';
  const art = theme ? localCharacterArt(theme.archetypeKey) : undefined;

  return (
    <Screen>
      <FeedbackBanner error={error} />
      <Text style={styles.greeting}>{t('todayGreeting')}</Text>
      <Text style={styles.name}>{name}</Text>
      {theme ? (
        <View style={styles.themeCard}>
          {art ? (
            <Image source={art} style={styles.portrait} accessibilityLabel={theme.approvedName} />
          ) : null}
          <View style={styles.themeCopy}>
            <Text style={styles.kicker}>{t('todayTheme')}</Text>
            <Text style={styles.cardTitle}>{theme.approvedName}</Text>
            {theme.inspiredByLabel ? (
              <Text style={styles.inspired}>
                {t('inspiredByPrefix')} {theme.inspiredByLabel}
              </Text>
            ) : null}
            <Text style={styles.cardBody}>{theme.emphasis}</Text>
            <Text style={styles.note}>{t('originalArtNote')}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('tabTrain')}</Text>
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
  themeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  portrait: {
    width: 88,
    height: 118,
    borderRadius: 10,
  },
  themeCopy: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inspired: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
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
