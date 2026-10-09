import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import type { MeetupInput } from './meetup-repository';

const titleMessage = 'Título deve ter entre 3 e 60 caracteres';
const placeMessage = 'Local deve ter entre 3 e 100 caracteres';
const invalidMessage = 'Data ou hora inválida';
const pastMessage = 'A data deve ser no futuro';

function fail(message: string): Result<never> {
  return err(createAppError('validation', message));
}

function lengthBetween(
  value: unknown,
  min: number,
  max: number,
): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max ? trimmed : null;
}

// DD/MM/AAAA and HH:MM in the device's local time. The Date constructor rolls
// 31/02 over to 03/03, so the parts are compared back to reject it.
function parseMoment(date: unknown, time: unknown): Date | null {
  if (typeof date !== 'string' || typeof time !== 'string') return null;
  const d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date.trim());
  const t = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!d || !t) return null;
  const [day, month, year, hour, minute] = [d[1], d[2], d[3], t[1], t[2]].map(
    Number,
  );
  const moment = new Date(year, month - 1, day, hour, minute);
  const same =
    moment.getFullYear() === year &&
    moment.getMonth() === month - 1 &&
    moment.getDate() === day &&
    moment.getHours() === hour &&
    moment.getMinutes() === minute;
  return same ? moment : null;
}

export function validateMeetupInput(
  input: unknown,
  now: Date,
): Result<MeetupInput> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const title = lengthBetween(raw.title, 3, 60);
  if (title === null) return fail(titleMessage);
  const place = lengthBetween(raw.place, 3, 100);
  if (place === null) return fail(placeMessage);
  const startsAt = parseMoment(raw.date, raw.time);
  if (startsAt === null) return fail(invalidMessage);
  if (startsAt.getTime() <= now.getTime()) return fail(pastMessage);
  return ok({ title, place, startsAt });
}
