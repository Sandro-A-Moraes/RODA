import { z } from 'zod';

import { createAppError, err } from '@/core/errors';
import type { Result } from '@/core/errors';

import type { Pact, PactInput, PactRepository } from './pact-repository';

const titleMessage = 'Título deve ter entre 3 e 60 caracteres';
const descriptionMessage = 'Descrição deve ter no máximo 280 caracteres';

export const pactSchema = z.object({
  title: z
    .string({ error: titleMessage })
    .trim()
    .min(3, titleMessage)
    .max(60, titleMessage),
  description: z
    .string({ error: descriptionMessage })
    .trim()
    .max(280, descriptionMessage),
});

export function progressPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function validatePact(input: unknown): Result<PactInput> {
  // A missing object is reported as the title rule, never in English.
  const parsed = pactSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return err(createAppError('validation', parsed.error.issues[0]?.message));
  }
  return { ok: true, value: parsed.data };
}

export async function createPact(
  repo: PactRepository,
  circleId: string,
  input: unknown,
): Promise<Result<Pact>> {
  const valid = validatePact(input);
  if (!valid.ok) return valid;
  return repo.create(circleId, valid.value);
}

export async function updatePact(
  repo: PactRepository,
  pactId: string,
  input: unknown,
): Promise<Result<Pact>> {
  const valid = validatePact(input);
  if (!valid.ok) return valid;
  return repo.update(pactId, valid.value);
}
