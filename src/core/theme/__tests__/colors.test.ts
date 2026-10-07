import { darkColors, lightColors, palette } from '@/core/theme/colors';

const roles = [
  'background',
  'backgroundAlt',
  'surface',
  'textPrimary',
  'textSecondary',
  'accent',
  'onAccent',
  'decorative',
  'brand',
  'onBrand',
  'card',
  'inverse',
  'onInverse',
  'onInverseSecondary',
  'inverseTrack',
  'track',
  'border',
];

describe('palette', () => {
  it.each([
    ['forest', '#10261F'],
    ['forest2', '#1B3B30'],
    ['cream', '#F5EEDF'],
    ['sand', '#E9DCC3'],
    ['terra', '#BD401C'],
    ['glow', '#F28047'],
    ['sage', '#9EBF9E'],
    ['ink', '#14201B'],
    ['muted', '#45544D'],
  ])('%s is %s', (name, hex) => {
    expect(palette[name as keyof typeof palette]).toBe(hex);
  });

  it('has exactly 9 colors', () => {
    expect(Object.keys(palette)).toHaveLength(9);
  });
});

describe('lightColors', () => {
  it('has exactly the 17 semantic roles', () => {
    expect(Object.keys(lightColors).sort()).toEqual([...roles].sort());
  });

  it('maps roles to the palette as in the design system', () => {
    expect(lightColors).toEqual({
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
      inverseTrack: palette.forest2,
      track: palette.cream,
      border: palette.muted,
    });
  });
});

describe('darkColors', () => {
  it('has the same 17 role keys as lightColors', () => {
    expect(Object.keys(darkColors).sort()).toEqual(
      Object.keys(lightColors).sort(),
    );
  });

  it('maps roles to the palette as in the design system', () => {
    expect(darkColors).toEqual({
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
      inverseTrack: palette.forest,
      track: palette.forest,
      border: palette.sage,
    });
  });
});
