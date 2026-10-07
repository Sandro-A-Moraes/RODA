import { View } from 'react-native';

import { useTheme } from '@/core/theme';

import { Ring } from './ring';
import { Text } from './text';

export function EmptyState({ title, body }: { title: string; body: string }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{ alignItems: 'center', gap: spacing.sm, padding: spacing.lg }}
    >
      <Ring size={96} filled={0} sage />
      <Text type="h2" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      <Text variant="secondary" style={{ textAlign: 'center' }}>
        {body}
      </Text>
    </View>
  );
}
