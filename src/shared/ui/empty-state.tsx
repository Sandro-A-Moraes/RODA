import { View } from 'react-native';

import { useTheme } from '@/core/theme';

import { Ring } from './ring';
import { Text } from './text';

export interface EmptyStateProps {
  title: string;
  body: string;
  /** Dots drawn in the accent tone; the rest stay sage. */
  accentDots?: number;
}

export function EmptyState({ title, body, accentDots = 0 }: EmptyStateProps) {
  const { spacing } = useTheme();
  return (
    <View
      style={{ alignItems: 'center', gap: spacing.sm, padding: spacing.lg }}
    >
      <Ring size={96} filled={accentDots} tone="accent" sage />
      <Text type="h2" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text variant="secondary" style={{ textAlign: 'center' }}>
        {body}
      </Text>
    </View>
  );
}
