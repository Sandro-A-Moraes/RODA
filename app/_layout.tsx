import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';

import { DependencyProvider, provide } from '@/core/di';
import { supabase } from '@/core/supabase';
import {
  authRepositoryToken,
  RootNavigator,
  SessionProvider,
  SupabaseAuthRepository,
} from '@/modules/auth';
import {
  circleRepositoryToken,
  SupabaseCircleRepository,
} from '@/modules/circles';
import { pactRepositoryToken, SupabasePactRepository } from '@/modules/pacts';

// The only place that knows which repository implementation runs (design.md).
const provisions = [
  provide(authRepositoryToken, new SupabaseAuthRepository(supabase)),
  provide(circleRepositoryToken, new SupabaseCircleRepository(supabase)),
  provide(pactRepositoryToken, new SupabasePactRepository(supabase)),
];

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    DMSans_400Regular,
    DMSans_700Bold,
  });

  // A failed font load falls back to system fonts instead of blocking the app.
  if (!fontsLoaded && !fontError) return null;

  return (
    <DependencyProvider provisions={provisions}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </DependencyProvider>
  );
}
