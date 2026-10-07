import { createAppError, err } from '@/core/errors';
import type { Result } from '@/core/errors';

import type { AuthRepository, AuthUser } from './auth-repository';
import { signInSchema } from './auth-schemas';

export async function signInUser(
  repo: AuthRepository,
  input: unknown,
): Promise<Result<AuthUser>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return err(createAppError('validation', parsed.error.issues[0]?.message));
  }
  return repo.signIn(parsed.data);
}
