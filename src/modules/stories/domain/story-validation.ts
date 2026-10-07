import { z } from 'zod';

import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

export const STORY_MAX_LENGTH = 280;

const emptyMessage = 'Escreva algo para compartilhar';
const lengthMessage = 'Máximo de 280 caracteres';

// trim() also strips newlines and tabs, so a body of only whitespace is empty.
export const storyBodySchema = z
  .string({ error: emptyMessage })
  .trim()
  .min(1, emptyMessage)
  .max(STORY_MAX_LENGTH, lengthMessage);

export function validateStoryBody(input: unknown): Result<string> {
  const parsed = storyBodySchema.safeParse(input);
  if (!parsed.success) {
    return err(createAppError('validation', parsed.error.issues[0]?.message));
  }
  return ok(parsed.data);
}
