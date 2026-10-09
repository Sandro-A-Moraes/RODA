import { createToken } from '@/core/di';
import type { Token } from '@/core/di';
import type { Result } from '@/core/errors';

export type Rsvp = 'going' | 'not_going';

export interface Attendee {
  userId: string;
  name: string;
}

export interface Meetup {
  id: string;
  circleId: string;
  title: string;
  place: string;
  /** Absolute instant; shown in the device's local time. */
  startsAt: Date;
  createdBy: string;
  /** Members going, in the order they answered; the count is its length. */
  going: Attendee[];
  /** The current user's answer, null until they answer. */
  myRsvp: Rsvp | null;
}

export interface MeetupInput {
  title: string;
  place: string;
  startsAt: Date;
}

export interface MeetupRepository {
  /** Meetups starting after `now`, soonest first. */
  listUpcoming(circleId: string, now: Date): Promise<Result<Meetup[]>>;
  /** Creates the meetup; the creator is marked as going. */
  create(circleId: string, input: MeetupInput): Promise<Result<Meetup>>;
  /** Sets or replaces the current user's answer. */
  setRsvp(meetupId: string, rsvp: Rsvp): Promise<Result<void>>;
}

export const meetupRepositoryToken: Token<MeetupRepository> =
  createToken<MeetupRepository>('MeetupRepository');
