import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { minTouchTarget, radius, useTheme } from '@/core/theme';

import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  const { colors, spacing } = useTheme();
  const inactive = loading || disabled;
  const look = {
    primary: { bg: colors.brand, fg: colors.onBrand, border: undefined },
    secondary: {
      bg: 'transparent',
      fg: colors.textPrimary,
      border: colors.brand,
    },
    ghost: { bg: 'transparent', fg: colors.accent, border: undefined },
    destructive: { bg: colors.accent, fg: colors.onAccent, border: undefined },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: look.bg,
          borderColor: look.border,
          borderWidth: look.border ? 1.5 : 0,
          paddingHorizontal: spacing.lg,
          opacity: inactive ? 0.6 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {loading ? <ActivityIndicator color={look.fg} /> : null}
      <Text type="bodyStrong" style={{ color: look.fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(52, minTouchTarget),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
  },
});
