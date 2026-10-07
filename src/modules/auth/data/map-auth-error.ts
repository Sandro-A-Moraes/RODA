import { createAppError, mapError } from '@/core/errors';
import type { AppError } from '@/core/errors';

const wrongCredentials = 'E-mail ou senha incorretos';
const emailTaken = 'Este e-mail já está cadastrado';

// Codes from the Supabase Auth error code reference. Mapping is by code and
// error class only: the backend `message` never reaches the user (AUTH-06).
const byCode = new Map<string, () => AppError>([
  [
    'invalid_credentials',
    () => createAppError('unauthorized', wrongCredentials),
  ],
  ['user_already_exists', () => createAppError('conflict', emailTaken)],
  ['email_exists', () => createAppError('conflict', emailTaken)],
  ['weak_password', () => createAppError('validation')],
]);

export function mapAuthError(thrownOrAuthError: unknown): AppError {
  if (thrownOrAuthError instanceof TypeError) {
    return mapError(thrownOrAuthError);
  }
  if (typeof thrownOrAuthError !== 'object' || thrownOrAuthError === null) {
    return createAppError('unknown');
  }
  const { code, name } = thrownOrAuthError as Record<string, unknown>;
  if (name === 'AuthRetryableFetchError') {
    return createAppError('network');
  }
  const mapped = typeof code === 'string' ? byCode.get(code) : undefined;
  return mapped ? mapped() : createAppError('unknown');
}
