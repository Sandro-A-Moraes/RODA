import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

describe('Result helpers', () => {
  it('ok wraps a value with ok: true', () => {
    const result = ok(5);
    expect(result.ok).toBe(true);
    expect(result).toEqual({ ok: true, value: 5 });
  });

  it('err wraps the same error with ok: false', () => {
    const error = createAppError('not_found');
    const result = err(error);
    expect(result.ok).toBe(false);
    expect(result).toEqual({ ok: false, error });
    expect(!result.ok && result.error).toBe(error);
  });

  it('ok(undefined) is still ok: true with an undefined value', () => {
    const result = ok(undefined);
    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toBeUndefined();
  });

  it('narrows on result.ok without type assertions', () => {
    const parse = (input: string): Result<number> =>
      input === '' ? err(createAppError('validation')) : ok(input.length);

    const success = parse('abc');
    if (success.ok) {
      const value: number = success.value;
      expect(value).toBe(3);
    } else {
      throw new Error('expected ok');
    }

    const failure = parse('');
    if (!failure.ok) {
      expect(failure.error.code).toBe('validation');
    } else {
      throw new Error('expected err');
    }
  });
});
