import { Text as RNText } from 'react-native';
import type { TextProps } from 'react-native';

import { useTheme } from '@/core/theme';

export interface Props extends TextProps {
  variant?: 'primary' | 'secondary';
}

export function Text({ variant = 'primary', style, ...rest }: Props) {
  const { colors, typography } = useTheme();
  const color =
    variant === 'secondary' ? colors.textSecondary : colors.textPrimary;
  return (
    <RNText
      style={[{ color, fontSize: typography.sizes.body }, style]}
      {...rest}
    />
  );
}
