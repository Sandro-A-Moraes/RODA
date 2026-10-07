import { Pressable } from 'react-native';

import { radius, useTheme } from '@/core/theme';

import { Icon } from './icon';
import { Text } from './text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.full,
        backgroundColor: selected ? colors.brand : 'transparent',
        borderWidth: selected ? 0 : 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {selected ? <Icon name="check" color={colors.onBrand} size={16} /> : null}
      <Text
        type="captionStrong"
        style={{ color: selected ? colors.onBrand : colors.textPrimary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
