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
  return (
    <DependencyProvider provisions={provisions}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </DependencyProvider>
  );
}
