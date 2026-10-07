import { View } from 'react-native';
import type { ViewProps } from 'react-native';

import { radius, useTheme } from '@/core/theme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
        style,
      ]}
      {...rest}
    />
  );
}
