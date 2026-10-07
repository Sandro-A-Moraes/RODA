export const typography = {
  fontFamily: undefined as string | undefined,
  sizes: {
    caption: 14,
    body: 16,
    subheading: 20,
    heading: 28,
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
} as const;

export const minTouchTarget = 44;
