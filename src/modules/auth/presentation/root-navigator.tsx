import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/core/theme';

import { useSession } from './session-provider';

// Screen names are the route files of the (app) and (auth) groups (AD-007).
// The groups have no layout of their own, so each route is listed by its full name.
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
        <Stack.Screen name="(app)/index" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)/sign-in" />
        <Stack.Screen name="(auth)/register" />
      </Stack.Protected>
    </Stack>
  );
}
