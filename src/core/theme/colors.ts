export const palette = {
  forest: '#10261F',
  forest2: '#1B3B30',
  cream: '#F5EEDF',
  sand: '#E9DCC3',
  terra: '#BD401C',
  glow: '#F28047',
  sage: '#9EBF9E',
  ink: '#14201B',
  muted: '#45544D',
} as const;

export type Palette = typeof palette;

export const lightColors = {
  background: palette.cream,
  backgroundAlt: palette.sand,
  surface: palette.cream,
  textPrimary: palette.ink,
  textSecondary: palette.muted,
  accent: palette.terra,
  onAccent: palette.cream,
  decorative: palette.sage,
  brand: palette.forest,
  onBrand: palette.cream,
  card: palette.sand,
  inverse: palette.forest,
  onInverse: palette.cream,
  onInverseSecondary: palette.sage,
  track: palette.cream,
  border: palette.muted,
} as const;

export const darkColors = {
  background: palette.forest,
  backgroundAlt: palette.forest2,
  surface: palette.forest2,
  textPrimary: palette.cream,
  textSecondary: palette.sage,
  accent: palette.glow,
  onAccent: palette.forest,
  decorative: palette.glow,
  brand: palette.cream,
  onBrand: palette.forest,
  card: palette.forest2,
  inverse: palette.forest2,
  onInverse: palette.cream,
  onInverseSecondary: palette.sage,
  track: palette.forest,
  border: palette.sage,
} as const;

export type ColorRole = keyof typeof lightColors;
