import { useCallback } from 'react';
import { View } from 'react-native';

import { useDependency } from '@/core/di';
import { useTheme } from '@/core/theme';
import { Button, ErrorBanner, Screen, Text } from '@/shared/ui';

import { authRepositoryToken } from '../domain/auth-repository';
import { signOutUser } from '../domain/session-use-cases';
import { useSession } from './session-provider';
import { useAuthAction } from './use-auth-action';

// Placeholder main area until the circles list owns this route.
export function HomeScreen() {
  const repo = useDependency(authRepositoryToken);
  const { user } = useSession();
  const { spacing, typography } = useTheme();
  const signOut = useCallback(() => signOutUser(repo), [repo]);
  const { run, pending, error } = useAuthAction(signOut);

  return (
    <Screen>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Text
          accessibilityRole="header"
          style={{ fontSize: typography.sizes.heading }}
        >
          {`Olá, ${user?.displayName ?? ''}`}
        </Text>
        <ErrorBanner error={error} />
        <Button label="Sair" loading={pending} onPress={() => void run()} />
      </View>
    </Screen>
  );
}
