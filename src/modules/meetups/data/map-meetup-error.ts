import { createAppError, mapError } from '@/core/errors';
import type { AppError } from '@/core/errors';

export function mapMeetupError(thrown: unknown): AppError {
  const code =
    typeof thrown === 'object' && thrown !== null && 'code' in thrown
      ? String((thrown as { code: unknown }).code)
      : '';
  // 42501 is a row level security refusal (non-member, past start time).
  if (code === '42501') return createAppError('unauthorized');
  // 23514 is a check constraint (title or place bounds, RSVP status).
  if (code === '23514') return createAppError('validation');
  return mapError(thrown);
}
