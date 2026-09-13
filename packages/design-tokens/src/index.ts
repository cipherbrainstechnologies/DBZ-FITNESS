/**
 * Design tokens from docs/02-user-flows-and-design.md.
 * Accent colours may vary by character; interaction patterns stay constant.
 */

export const colors = {
  background: '#0B1020',
  surface: '#151D30',
  raised: '#202B43',
  primary: '#FF8A3D',
  secondary: '#5CB8FF',
  text: '#F5F7FC',
  muted: '#B7C2D5',
  positive: '#5AD3A0',
  warning: '#F6C86B',
} as const;

export type ColorToken = keyof typeof colors;

/** Spacing scale in rem (4px base). Stub for M1 layout consistency. */
export const spacing = {
  none: 0,
  xs: 0.25,
  sm: 0.5,
  md: 1,
  lg: 1.5,
  xl: 2,
  '2xl': 3,
  '3xl': 4,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Typography stubs — expressive fonts chosen at app shell level. */
export const typography = {
  fontFamily: {
    display: 'system-ui, sans-serif',
    body: 'system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    hero: '2.5rem',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.65,
  },
} as const;

/** Motion stubs — selective presence, not constant animation. */
export const motion = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    entrance: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  reducedMotion: {
    duration: 0,
  },
} as const;

export const tokens = {
  colors,
  spacing,
  typography,
  motion,
} as const;

export default tokens;
