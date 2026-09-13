import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, spacing } from '@/src/theme';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function BrandTitle({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.brandBlock}>
      <Text style={styles.brand}>Saiyan Ascend</Text>
      {subtitle ? <Text style={styles.tagline}>{subtitle}</Text> : null}
    </View>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.linkButton}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

export function FeedbackBanner({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (!error && !success) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, error ? styles.bannerError : styles.bannerSuccess]}
    >
      <Text style={styles.bannerText}>{error ?? success}</Text>
    </View>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ComingLater({ title, detail }: { title: string; detail: string }) {
  return (
    <Screen style={styles.centerPad}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.muted}>{detail}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  brandBlock: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 36,
    lineHeight: 42,
    color: colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
  },
  field: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.muted,
  },
  input: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.raised,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.background,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  linkButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.secondary,
  },
  banner: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerError: {
    backgroundColor: '#3A1F28',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  bannerSuccess: {
    backgroundColor: '#16352C',
    borderWidth: 1,
    borderColor: colors.positive,
  },
  bannerText: {
    fontFamily: fonts.medium,
    color: colors.text,
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  centerPad: {
    justifyContent: 'center',
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 24,
    color: colors.text,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
  },
});
