import type { AuthUser } from '../domain/auth-repository';

// Structural subset of the Supabase `User` the app reads.
export interface SupabaseUserLike {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export function mapAuthUser(user: SupabaseUserLike): AuthUser {
  const email = user.email ?? '';
  const metadataName = user.user_metadata?.display_name;
  const displayName =
    typeof metadataName === 'string' && metadataName.length > 0
      ? metadataName
      : email.split('@')[0];
  return { id: user.id, email, displayName };
}
