import { useCallback } from 'react';
import { View } from 'react-native';

import { useDependency } from '@/core/di';
import { useTheme } from '@/core/theme';
import {
  Avatar,
  Button,
  Card,
  ErrorBanner,
  Header,
  Screen,
  Text,
} from '@/shared/ui';

import { authRepositoryToken } from '../domain/auth-repository';
import { signOutUser } from '../domain/session-use-cases';
import { useSession } from './session-provider';
import { useAuthAction } from './use-auth-action';

// Profile tab: who is signed in and the sign-out action.
export function HomeScreen() {
  const repo = useDependency(authRepositoryToken);
  const { user } = useSession();
  const { spacing } = useTheme();
  const signOut = useCallback(() => signOutUser(repo), [repo]);
  const { run, pending, error } = useAuthAction(signOut);

  return (
    <Screen>
      <Header title="Perfil" />
      <View style={{ padding: spacing.md, gap: spacing.lg }}>
        <Card
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <Avatar name={user?.displayName ?? '?'} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text type="h3">{user?.displayName ?? ''}</Text>
            <Text type="caption" variant="secondary">
              {user?.email ?? ''}
            </Text>
          </View>
        </Card>
        <ErrorBanner error={error} />
        <Button
          label="Sair"
          variant="secondary"
          loading={pending}
          onPress={() => void run()}
        />
      </View>
    </Screen>
  );
}
