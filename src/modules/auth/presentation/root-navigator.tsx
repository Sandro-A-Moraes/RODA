import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { useSession } from './session-provider';

// Screen names are the route files of the (app) and (auth) groups (AD-007).
// (app) has its own stack layout (tabs plus circle screens); (auth) lists each route.
export function RootNavigator() {
  const { status } = useSession();
  const { colors } = useTheme();

  if (status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator
          accessibilityLabel="Carregando"
          color={colors.accent}
          size="large"
        />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)/sign-in" />
        <Stack.Screen name="(auth)/register" />
      </Stack.Protected>
    </Stack>
  );
}
