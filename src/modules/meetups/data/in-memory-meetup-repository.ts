import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import type {
  Meetup,
  MeetupInput,
  MeetupRepository,
  Rsvp,
} from '../domain/meetup-repository';

interface StoredMeetup extends MeetupInput {
  id: string;
  circleId: string;
  createdBy: string;
}

interface StoredRsvp {
  meetupId: string;
  userId: string;
  rsvp: Rsvp;
  // Insertion order keeps the "going" names stable.
  sequence: number;
}

// Same rules as the SQL schema, for tests and early development (AD-002).
export class InMemoryMeetupRepository implements MeetupRepository {
  private readonly meetups: StoredMeetup[] = [];
  // One per (meetup, user), like the meetup_rsvps primary key.
  private readonly rsvps: StoredRsvp[] = [];
  private sequence = 0;

  constructor(
    private readonly currentUserId: () => string | null,
    private readonly displayName: (userId: string) => string,
    // Mirrors is_circle_member. Omitted means every user belongs to every
    // circle, which keeps callers that do not model membership working.
    private readonly isMember: (
      circleId: string,
      userId: string,
    ) => boolean = () => true,
  ) {}

  private view(stored: StoredMeetup): Meetup {
    const me = this.currentUserId();
    const answers = this.rsvps
      .filter((r) => r.meetupId === stored.id)
      .sort((a, b) => a.sequence - b.sequence);
    return {
      id: stored.id,
      circleId: stored.circleId,
      title: stored.title,
      place: stored.place,
      startsAt: stored.startsAt,
      createdBy: stored.createdBy,
      going: answers
        .filter((r) => r.rsvp === 'going')
        .map((r) => ({ userId: r.userId, name: this.displayName(r.userId) })),
      myRsvp: answers.find((r) => r.userId === me)?.rsvp ?? null,
    };
  }

  private answer(meetupId: string, userId: string, rsvp: Rsvp) {
    const index = this.rsvps.findIndex(
      (r) => r.meetupId === meetupId && r.userId === userId,
    );
    const sequence =
      index >= 0 ? this.rsvps[index].sequence : (this.sequence += 1);
    const entry = { meetupId, userId, rsvp, sequence };
    if (index >= 0) this.rsvps[index] = entry;
    else this.rsvps.push(entry);
  }

  async listUpcoming(circleId: string, now: Date): Promise<Result<Meetup[]>> {
    const me = this.currentUserId();
    if (!me || !this.isMember(circleId, me)) return ok([]);
    return ok(
      this.meetups
        .filter(
          (m) =>
            m.circleId === circleId && m.startsAt.getTime() > now.getTime(),
        )
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
        .map((m) => this.view(m)),
    );
  }

  async create(circleId: string, input: MeetupInput): Promise<Result<Meetup>> {
    const me = this.currentUserId();
    // Same refusal as the meetups insert policy.
    if (!me || !this.isMember(circleId, me)) {
      return err(createAppError('unauthorized'));
    }
    this.sequence += 1;
    const stored: StoredMeetup = {
      ...input,
      id: `meetup-${this.sequence}`,
      circleId,
      createdBy: me,
    };
    this.meetups.push(stored);
    // Same as the creator-going trigger.
    this.answer(stored.id, me, 'going');
    return ok(this.view(stored));
  }

  async setRsvp(meetupId: string, rsvp: Rsvp): Promise<Result<void>> {
    const me = this.currentUserId();
    if (!me) return err(createAppError('unauthorized'));
    const meetup = this.meetups.find((m) => m.id === meetupId);
    if (!meetup) return err(createAppError('not_found'));
    if (!this.isMember(meetup.circleId, me)) {
      return err(createAppError('unauthorized'));
    }
    this.answer(meetupId, me, rsvp);
    return ok(undefined);
  }
}
