import { View } from 'react-native';

import type { AppError } from '@/core/errors';
import { useTheme } from '@/core/theme';

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
        borderRadius: 8,
      }}
    >
      <Text style={{ color: colors.onAccent }}>{error.message}</Text>
      {onRetry ? <Button label="Tentar novamente" onPress={onRetry} /> : null}
    </View>
  );
}
