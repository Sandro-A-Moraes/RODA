import { DependencyProvider, provide } from '@/core/di';
import { supabase } from '@/core/supabase';
import {
  authRepositoryToken,
  RootNavigator,
  SessionProvider,
  SupabaseAuthRepository,
} from '@/modules/auth';

// The only place that knows which repository implementation runs (design.md).
const provisions = [
  provide(authRepositoryToken, new SupabaseAuthRepository(supabase)),
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
