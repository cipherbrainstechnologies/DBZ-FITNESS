import { colors as tokenColors } from '@saiyan/design-tokens';

/** Dark theme tokens from @saiyan/design-tokens (docs/02). */
export const colors = {
  background: tokenColors.background,
  surface: tokenColors.surface,
  raised: tokenColors.raised,
  primary: tokenColors.primary,
  secondary: tokenColors.secondary,
  text: tokenColors.text,
  muted: tokenColors.muted,
  positive: tokenColors.positive,
  warning: tokenColors.warning,
  danger: '#F07178',
} as const;

export const fonts = {
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semibold: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;
