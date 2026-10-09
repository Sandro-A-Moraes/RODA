import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { minTouchTarget, radius, useTheme } from '@/core/theme';

import { Icon } from './icon';
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
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const { colors, spacing, typography } = useTheme();
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      <Text type="captionStrong">{label}</Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry && !revealed}
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
            secureTextEntry
              ? { paddingRight: minTouchTarget + spacing.xs }
              : null,
            style,
          ]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setRevealed((current) => !current)}
            style={styles.toggle}
          >
            <Icon
              name={revealed ? 'eye-off' : 'eye'}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
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
  toggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minHeight: Math.max(52, minTouchTarget),
    borderWidth: 1,
    borderRadius: radius.md,
  },
});
