import type { SupabaseClient } from '@supabase/supabase-js';

import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import type {
  AuthRepository,
  AuthUser,
  RegisterInput,
  SignInInput,
} from '../domain/auth-repository';
import { mapAuthError } from './map-auth-error';
import { mapAuthUser } from './map-auth-user';

// Thin adapter: every failure goes through mapAuthError, so no backend
// message reaches callers. Covered manually against the real project (AD-002).
export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async signUp(input: RegisterInput): Promise<Result<AuthUser>> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { display_name: input.displayName } },
      });
      if (error) return err(mapAuthError(error));
      // No session means "Confirm email" is on; the app cannot continue.
      if (!data.session) return err(createAppError('unknown'));
      return ok(mapAuthUser(data.session.user));
    } catch (thrown) {
      return err(mapAuthError(thrown));
    }
  }

  async signIn(input: SignInInput): Promise<Result<AuthUser>> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) return err(mapAuthError(error));
      return ok(mapAuthUser(data.user));
    } catch (thrown) {
      return err(mapAuthError(thrown));
    }
  }

  async signOut(): Promise<Result<void>> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) return err(mapAuthError(error));
      return ok(undefined);
    } catch (thrown) {
      return err(mapAuthError(thrown));
    }
  }

  async getCurrentUser(): Promise<Result<AuthUser | null>> {
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) return err(mapAuthError(error));
      return ok(data.session ? mapAuthUser(data.session.user) : null);
    } catch (thrown) {
      return err(mapAuthError(thrown));
    }
  }

  subscribe(listener: (user: AuthUser | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      listener(session ? mapAuthUser(session.user) : null);
    });
    return () => data.subscription.unsubscribe();
  }
}
