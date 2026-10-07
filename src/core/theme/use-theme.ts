import { lightColors } from './colors';
import { spacing, typography } from './tokens';

export function useTheme() {
  return { colors: lightColors, spacing, typography };
}
