import { View } from 'react-native';

import { radius, useTheme } from '@/core/theme';

import { Text } from './text';

export type AvatarTone = 'brand' | 'accent' | 'sage';

export interface AvatarProps {
  name: string;
  tone?: AvatarTone;
  size?: number;
}

export function Avatar({ name, tone = 'brand', size = 40 }: AvatarProps) {
  const { colors } = useTheme();
  const look = {
    brand: { bg: colors.brand, fg: colors.onBrand },
    accent: { bg: colors.accent, fg: colors.onAccent },
    sage: { bg: colors.decorative, fg: colors.textPrimary },
  }[tone];
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        backgroundColor: look.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text type="captionStrong" style={{ color: look.fg }}>
        {name.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
