import { colors, motion, spacing, typography } from '@saiyan/design-tokens';

/**
 * Maps shared design tokens into CSS custom properties for the web shell.
 */
export function tokenCssVariables(): string {
  const lines: string[] = [
    `--color-background: ${colors.background};`,
    `--color-surface: ${colors.surface};`,
    `--color-raised: ${colors.raised};`,
    `--color-primary: ${colors.primary};`,
    `--color-secondary: ${colors.secondary};`,
    `--color-text: ${colors.text};`,
    `--color-muted: ${colors.muted};`,
    `--color-positive: ${colors.positive};`,
    `--color-warning: ${colors.warning};`,
    `--font-size-xs: ${typography.fontSize.xs};`,
    `--font-size-sm: ${typography.fontSize.sm};`,
    `--font-size-md: ${typography.fontSize.md};`,
    `--font-size-lg: ${typography.fontSize.lg};`,
    `--font-size-xl: ${typography.fontSize.xl};`,
    `--font-size-2xl: ${typography.fontSize['2xl']};`,
    `--font-size-3xl: ${typography.fontSize['3xl']};`,
    `--font-size-hero: ${typography.fontSize.hero};`,
    `--space-xs: ${spacing.xs}rem;`,
    `--space-sm: ${spacing.sm}rem;`,
    `--space-md: ${spacing.md}rem;`,
    `--space-lg: ${spacing.lg}rem;`,
    `--space-xl: ${spacing.xl}rem;`,
    `--space-2xl: ${spacing['2xl']}rem;`,
    `--space-3xl: ${spacing['3xl']}rem;`,
    `--motion-fast: ${motion.duration.fast}ms;`,
    `--motion-normal: ${motion.duration.normal}ms;`,
    `--motion-slow: ${motion.duration.slow}ms;`,
    `--ease-standard: ${motion.easing.standard};`,
    `--ease-entrance: ${motion.easing.entrance};`,
  ];

  return `:root {\n  ${lines.join('\n  ')}\n}`;
}
