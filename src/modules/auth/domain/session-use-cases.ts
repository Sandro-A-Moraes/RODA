import type { Result } from '@/core/errors';

import type { AuthRepository, AuthUser } from './auth-repository';

export function signOutUser(repo: AuthRepository): Promise<Result<void>> {
  return repo.signOut();
}

// Any failure (expired or invalid stored session) counts as signed out.
export async function restoreSession(
  repo: AuthRepository,
): Promise<AuthUser | null> {
  try {
    const result = await repo.getCurrentUser();
    return result.ok ? result.value : null;
  } catch {
    return null;
  }
}
