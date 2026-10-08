export const typography = {
  fontFamily: undefined as string | undefined,
  fonts: {
    display: 'Fraunces_600SemiBold',
    body: 'DMSans_400Regular',
    bodyBold: 'DMSans_700Bold',
  },
  sizes: {
    label: 12,
    caption: 14,
    body: 16,
    bodyLg: 18,
    subheading: 20,
    h2: 24,
    heading: 32,
    display: 40,
    numeral: 56,
    wordmark: 64,
  },
  weights: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const minTouchTarget = 44;
