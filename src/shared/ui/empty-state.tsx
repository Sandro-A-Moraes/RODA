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

const RING_SIZE = 140;

export function EmptyState({ title, body, accentDots = 0 }: EmptyStateProps) {
  const { spacing } = useTheme();
  // Figma component EmptyState (3:120): ring 140, gap 16, vertical padding 32.
  return (
    <View
      testID="empty-state"
      style={{
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.xl,
      }}
    >
      <Ring size={RING_SIZE} filled={accentDots} tone="accent" sage />
      <Text type="h2" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text variant="secondary" style={{ textAlign: 'center' }}>
        {body}
      </Text>
    </View>
  );
}
