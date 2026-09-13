import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/src/i18n';
import { colors, fonts, spacing } from '@/src/theme';

export default function NotFoundScreen() {
  const { t } = useI18n();

  return (
    <>
      <Stack.Screen options={{ title: t('notFoundTitle'), headerShown: true }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('notFoundTitle')}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('notFoundAction')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    color: colors.text,
  },
  link: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.secondary,
  },
});
