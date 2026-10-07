import { createAppError } from './app-error';
import type { AppError, ErrorCode } from './app-error';

const errorCodes: readonly string[] = [
  'network',
  'validation',
  'unauthorized',
  'not_found',
  'conflict',
  'unknown',
] satisfies ErrorCode[];

const networkMessage = /network request failed|failed to fetch|network error/i;

function isAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) return false;
  const { code, message } = value as Record<string, unknown>;
  return (
    typeof code === 'string' &&
    errorCodes.includes(code) &&
    typeof message === 'string'
  );
}

export function mapError(thrown: unknown): AppError {
  if (isAppError(thrown)) return thrown;
  if (thrown instanceof TypeError && networkMessage.test(thrown.message)) {
    return createAppError('network');
  }
  return createAppError('unknown');
}
