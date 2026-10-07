import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { minTouchTarget, useTheme } from '@/core/theme';

import { Text } from './text';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const { colors, spacing } = useTheme();
  const inactive = loading || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: colors.accent,
          paddingHorizontal: spacing.lg,
          opacity: inactive ? 0.6 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={colors.onAccent} /> : null}
      <Text style={{ color: colors.onAccent }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
  },
});
