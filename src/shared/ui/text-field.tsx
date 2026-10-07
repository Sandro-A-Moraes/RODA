import { StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { minTouchTarget, useTheme } from '@/core/theme';

import { Text } from './text';

export interface TextFieldProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  style,
  ...rest
}: TextFieldProps) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="secondary">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundAlt,
            borderColor: error ? colors.accent : colors.decorative,
            color: colors.textPrimary,
            fontSize: typography.sizes.body,
            paddingHorizontal: spacing.md,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text
          style={{ color: colors.accent, fontSize: typography.sizes.caption }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderRadius: 8,
  },
});
