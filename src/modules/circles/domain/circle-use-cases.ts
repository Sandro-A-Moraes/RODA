import { z } from 'zod';

import { createAppError, err } from '@/core/errors';
import type { Result } from '@/core/errors';

import type { Circle, CircleRepository } from './circle-repository';

const nameMessage = 'Nome deve ter entre 2 e 40 caracteres';

export const circleNameSchema = z
  .string({ error: nameMessage })
  .trim()
  .min(2, nameMessage)
  .max(40, nameMessage);

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export async function createCircle(
  repo: CircleRepository,
  name: unknown,
): Promise<Result<Circle>> {
  const parsed = circleNameSchema.safeParse(name);
  if (!parsed.success) {
    return err(createAppError('validation', parsed.error.issues[0]?.message));
  }
  return repo.create(parsed.data);
}

export async function joinCircle(
  repo: CircleRepository,
  code: string,
): Promise<Result<Circle>> {
  const normalized = normalizeInviteCode(code);
  if (!normalized) {
    return err(createAppError('validation', 'Informe o código'));
  }
  return repo.join(normalized);
}
