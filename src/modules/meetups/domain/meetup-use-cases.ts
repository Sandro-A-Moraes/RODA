import type { Result } from '@/core/errors';

import type { Meetup, MeetupRepository } from './meetup-repository';
import { validateMeetupInput } from './meetup-validation';

// `now` is read at submit time so a stale form is checked against the clock.
export async function createMeetup(
  repo: MeetupRepository,
  circleId: string,
  input: unknown,
  now: Date,
): Promise<Result<Meetup>> {
  const valid = validateMeetupInput(input, now);
  if (!valid.ok) return valid;
  return repo.create(circleId, valid.value);
}
