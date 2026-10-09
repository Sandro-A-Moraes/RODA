import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';

import { DependencyProvider, provide } from '@/core/di';
import { supabase } from '@/core/supabase';
import {
  authRepositoryToken,
  SessionProvider,
  SupabaseAuthRepository,
} from '@/modules/auth';
import {
  circleRepositoryToken,
  SupabaseCircleRepository,
} from '@/modules/circles';
import {
  meetupRepositoryToken,
  SupabaseMeetupRepository,
} from '@/modules/meetups';
import {
  AsyncStorageOnboardingStore,
  LaunchNavigator,
  OnboardingProvider,
  onboardingStoreToken,
} from '@/modules/onboarding';
import { pactRepositoryToken, SupabasePactRepository } from '@/modules/pacts';
import {
  storyRepositoryToken,
  SupabaseStoryRepository,
} from '@/modules/stories';

// The only place that knows which repository implementation runs (design.md).
const provisions = [
  provide(authRepositoryToken, new SupabaseAuthRepository(supabase)),
  provide(circleRepositoryToken, new SupabaseCircleRepository(supabase)),
  provide(pactRepositoryToken, new SupabasePactRepository(supabase)),
  provide(storyRepositoryToken, new SupabaseStoryRepository(supabase)),
  provide(meetupRepositoryToken, new SupabaseMeetupRepository(supabase)),
  provide(onboardingStoreToken, new AsyncStorageOnboardingStore(AsyncStorage)),
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
        <OnboardingProvider>
          <LaunchNavigator />
        </OnboardingProvider>
      </SessionProvider>
    </DependencyProvider>
  );
}
