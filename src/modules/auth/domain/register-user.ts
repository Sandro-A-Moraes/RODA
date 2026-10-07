import { createAppError, err } from '@/core/errors';
import type { Result } from '@/core/errors';

import type { AuthRepository, AuthUser } from './auth-repository';
import { registerSchema } from './auth-schemas';

export async function registerUser(
  repo: AuthRepository,
  input: unknown,
): Promise<Result<AuthUser>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return err(createAppError('validation', parsed.error.issues[0]?.message));
  }
  return repo.signUp(parsed.data);
}
