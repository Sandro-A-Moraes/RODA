import { Stack } from 'expo-router';
import type { ReactNode } from 'react';

import { useSession } from './session-provider';

export interface RootNavigatorProps {
  /** Shown instead of any route while the session restores (and while held); nothing by default. */
  splash?: ReactNode;
  /** Keeps the splash after the session resolves, for launch work auth does not know. */
  holdSplash?: boolean;
  /** Adds the signed-out `(auth)/onboarding` screen as the first, initial route. */
  showOnboarding?: boolean;
}

// Screen names are the route files of the (app) and (auth) groups (AD-007).
// (app) has its own stack layout (tabs plus circle screens); (auth) lists each route.
// The launch pieces come in as props so auth never imports onboarding (AD-008).
export function RootNavigator({
  splash = null,
  holdSplash = false,
  showOnboarding = false,
}: RootNavigatorProps) {
  const { status } = useSession();

  if (status === 'loading' || holdSplash) return <>{splash}</>;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut' && showOnboarding}>
        <Stack.Screen name="(auth)/onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)/sign-in" />
        <Stack.Screen name="(auth)/register" />
      </Stack.Protected>
    </Stack>
  );
}
