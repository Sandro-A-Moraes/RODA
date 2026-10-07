import { View } from 'react-native';

import type { AppError } from '@/core/errors';
import { radius, useTheme } from '@/core/theme';

import { Button } from './button';
import { Text } from './text';

export interface ErrorBannerProps {
  error?: AppError | null;
  onRetry?: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  const { colors, spacing } = useTheme();
  if (!error) {
    return null;
  }
  return (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: colors.accent,
        padding: spacing.md,
        gap: spacing.sm,
        borderRadius: radius.md,
      }}
    >
      <Text type="bodyStrong" style={{ color: colors.onAccent }}>
        {error.message}
      </Text>
      {onRetry ? (
        <Button
          label="Tentar novamente"
          variant="secondary"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}
