import { createAppError } from '@/core/errors';

import { mapAuthError } from '../data/map-auth-error';

const RAW = 'RAW-BACKEND-TEXT-42 do not show';

// Shape of a Supabase AuthError: an Error carrying `code` and `name`.
function authError(code: string | undefined, name = 'AuthApiError'): Error {
  const error = new Error(RAW) as Error & { code?: string; status?: number };
  error.name = name;
  error.code = code;
  error.status = 400;
  return error;
}

describe('mapAuthError', () => {
  it('maps invalid_credentials to unauthorized with the fixed message', () => {
    expect(mapAuthError(authError('invalid_credentials'))).toEqual({
      code: 'unauthorized',
      message: 'E-mail ou senha incorretos',
    });
  });

  it.each(['user_already_exists', 'email_exists'])(
    'maps %s to conflict with the fixed message',
    (code) => {
      expect(mapAuthError(authError(code))).toEqual({
        code: 'conflict',
        message: 'Este e-mail já está cadastrado',
      });
    },
  );

  it('maps weak_password to validation', () => {
    expect(mapAuthError(authError('weak_password'))).toEqual(
      createAppError('validation'),
    );
  });

  it('maps AuthRetryableFetchError to network', () => {
    expect(
      mapAuthError(authError(undefined, 'AuthRetryableFetchError')),
    ).toEqual(createAppError('network'));
  });

  it('maps a "network request failed" TypeError to network', () => {
    expect(mapAuthError(new TypeError('Network request failed'))).toEqual(
      createAppError('network'),
    );
  });

  it('maps an unknown code to unknown', () => {
    expect(mapAuthError(authError('unexpected_failure'))).toEqual(
      createAppError('unknown'),
    );
  });

  it.each([null, undefined, 'boom', 42, {}])(
    'maps the non-error value %p to unknown',
    (value) => {
      expect(mapAuthError(value)).toEqual(createAppError('unknown'));
    },
  );

  it.each([
    ['invalid_credentials', authError('invalid_credentials')],
    ['user_already_exists', authError('user_already_exists')],
    ['email_exists', authError('email_exists')],
    ['weak_password', authError('weak_password')],
    ['retryable fetch', authError(undefined, 'AuthRetryableFetchError')],
    ['network TypeError', new TypeError(`Network request failed ${RAW}`)],
    ['unknown code', authError('unexpected_failure')],
    // Supabase also has a "conflict" code; it must not pass through as an AppError.
    ['backend code named like an AppError code', authError('conflict')],
    ['plain object with code and message', { code: 'conflict', message: RAW }],
  ])('never copies the raw backend message (%s)', (_branch, error) => {
    const result = mapAuthError(error);

    expect(result.message).not.toContain(RAW);
    expect(result.message).not.toContain('RAW-BACKEND');
  });
});
