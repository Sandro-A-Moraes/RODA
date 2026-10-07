import { lightColors } from './colors';
import { radius, spacing, typography } from './tokens';

export function useTheme() {
  return { colors: lightColors, spacing, typography, radius };
}
