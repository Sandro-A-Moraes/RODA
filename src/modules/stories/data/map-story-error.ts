import { createAppError, mapError } from '@/core/errors';
import type { AppError } from '@/core/errors';

export function mapStoryError(thrown: unknown): AppError {
  const code =
    typeof thrown === 'object' && thrown !== null && 'code' in thrown
      ? String((thrown as { code: unknown }).code)
      : '';
  // 23505 is the unique (circle, author, day) constraint: a second story.
  if (code === '23505') {
    return createAppError('conflict', 'Você já compartilhou hoje');
  }
  // 42501 is a row level security refusal (non-member, own-story reaction).
  if (code === '42501') return createAppError('unauthorized');
  // 23514 is a check constraint (body bounds or reaction kind).
  if (code === '23514') return createAppError('validation');
  return mapError(thrown);
}
