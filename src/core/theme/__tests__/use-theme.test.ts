import { renderHook } from '@testing-library/react-native';

import {
  lightColors,
  palette,
  spacing,
  typography,
  useTheme,
} from '@/core/theme';

describe('useTheme', () => {
  it('returns colors deeply equal to lightColors', async () => {
    const { result } = await renderHook(useTheme);
    expect(result.current.colors).toEqual(lightColors);
    expect(result.current.colors.background).toBe(palette.cream);
  });

  it('returns the spacing and typography token objects', async () => {
    const { result } = await renderHook(useTheme);
    expect(result.current.spacing).toBe(spacing);
    expect(result.current.typography).toBe(typography);
  });
});
