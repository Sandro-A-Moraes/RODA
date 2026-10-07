import { StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { minTouchTarget, radius, useTheme } from '@/core/theme';

import { Text } from './text';

export interface TextFieldProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  helper,
  style,
  ...rest
}: TextFieldProps) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text type="captionStrong">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.accent : colors.border,
            color: colors.textPrimary,
            fontFamily: typography.fonts.body,
            fontSize: typography.sizes.body,
            paddingHorizontal: spacing.md,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text type="caption" style={{ color: colors.accent }}>
          {error}
        </Text>
      ) : helper ? (
        <Text type="caption" variant="secondary">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: Math.max(52, minTouchTarget),
    borderWidth: 1,
    borderRadius: radius.md,
  },
});
