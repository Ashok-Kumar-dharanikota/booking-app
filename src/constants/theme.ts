import { Platform } from 'react-native';

export const Palette = {
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceVariant: '#F1F3F5',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderFocused: '#18181B',
    primary: '#18181B',
    primaryText: '#FFFFFF',
    accent: '#059669',
    accentLight: '#ECFDF5',
    accentText: '#065F46',
    error: '#DC2626',
    errorLight: '#FEF2F2',
    errorText: '#991B1B',
    cardShadow: '#000000',
  },
  dark: {
    background: '#09090B',
    surface: '#18181B',
    surfaceElevated: '#27272A',
    surfaceVariant: '#27272A',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#27272A',
    borderFocused: '#F9FAFB',
    primary: '#F9FAFB',
    primaryText: '#09090B',
    accent: '#10B981',
    accentLight: '#064E3B',
    accentText: '#A7F3D0',
    error: '#EF4444',
    errorLight: '#450A0A',
    errorText: '#FCA5A5',
    cardShadow: '#000000',
  },
} as const;

export const Typography = {
  hero: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  display: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  micro: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
};

export const Radii = {
  card: 14,
  input: 12,
  button: 12,
  chip: 8,
  pill: 999,
};

export const Elevation = {
  card: Platform.select({
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
  }),
  cardElevated: Platform.select({
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
  }),
};

export const Colors = {
  light: {
    text: Palette.light.text,
    background: Palette.light.background,
    backgroundElement: Palette.light.surfaceVariant,
    backgroundSelected: Palette.light.border,
    textSecondary: Palette.light.textSecondary,
  },
  dark: {
    text: Palette.dark.text,
    background: Palette.dark.background,
    backgroundElement: Palette.dark.surfaceVariant,
    backgroundSelected: Palette.dark.border,
    textSecondary: Palette.dark.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
