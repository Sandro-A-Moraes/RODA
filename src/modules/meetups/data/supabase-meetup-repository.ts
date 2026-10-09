import type { SupabaseClient } from '@supabase/supabase-js';

import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import type {
  Meetup,
  MeetupInput,
  MeetupRepository,
  Rsvp,
} from '../domain/meetup-repository';

import { mapMeetupError } from './map-meetup-error';

interface RsvpRow {
  user_id: string;
  status: Rsvp;
  // Many-to-one embed through meetup_rsvps.user_id; null if RLS hides it. The
  // FK hint keeps the embed unambiguous (see stories for the PostgREST 300).
  profiles: { display_name: string } | null;
}

interface MeetupRow {
  id: string;
  circle_id: string;
  title: string;
  place: string;
  starts_at: string;
  created_by: string;
  meetup_rsvps: RsvpRow[];
}

const columns =
  'id, circle_id, title, place, starts_at, created_by, ' +
  'meetup_rsvps(user_id, status, profiles!meetup_rsvps_user_id_fkey(display_name))';

// Thin adapter, validated manually against the real project (AD-002).
export class SupabaseMeetupRepository implements MeetupRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async uid(): Promise<string | null> {
    const { data } = await this.client.auth.getSession();
    return data.session?.user.id ?? null;
  }

  private toMeetup(row: MeetupRow, uid: string): Meetup {
    const answers = row.meetup_rsvps ?? [];
    return {
      id: row.id,
      circleId: row.circle_id,
      title: row.title,
      place: row.place,
      startsAt: new Date(row.starts_at),
      createdBy: row.created_by,
      going: answers
        .filter((r) => r.status === 'going')
        .map((r) => ({
          userId: r.user_id,
          name: r.profiles?.display_name ?? '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      myRsvp: answers.find((r) => r.user_id === uid)?.status ?? null,
    };
  }

  async listUpcoming(circleId: string, now: Date): Promise<Result<Meetup[]>> {
    try {
      const uid = await this.uid();
      if (!uid) return err(createAppError('unauthorized'));
      const { data, error } = await this.client
        .from('meetups')
        .select(columns)
        .eq('circle_id', circleId)
        .gt('starts_at', now.toISOString())
        .order('starts_at', { ascending: true });
      if (error) return err(mapMeetupError(error));
      const rows = (data ?? []) as unknown as MeetupRow[];
      return ok(rows.map((row) => this.toMeetup(row, uid)));
    } catch (thrown) {
      return err(mapMeetupError(thrown));
    }
  }

  async create(circleId: string, input: MeetupInput): Promise<Result<Meetup>> {
    try {
      const uid = await this.uid();
      if (!uid) return err(createAppError('unauthorized'));
      // The AFTER INSERT trigger marks the creator as going, so the select
      // below already returns that answer.
      const inserted = await this.client
        .from('meetups')
        .insert({
          circle_id: circleId,
          created_by: uid,
          title: input.title,
          place: input.place,
          starts_at: input.startsAt.toISOString(),
        })
        .select('id')
        .single();
      if (inserted.error) return err(mapMeetupError(inserted.error));
      const id = (inserted.data as { id: string }).id;
      const { data, error } = await this.client
        .from('meetups')
        .select(columns)
        .eq('id', id)
        .single();
      if (error) return err(mapMeetupError(error));
      return ok(this.toMeetup(data as unknown as MeetupRow, uid));
    } catch (thrown) {
      return err(mapMeetupError(thrown));
    }
  }

  async setRsvp(meetupId: string, rsvp: Rsvp): Promise<Result<void>> {
    try {
      const uid = await this.uid();
      if (!uid) return err(createAppError('unauthorized'));
      // The primary key (meetup_id, user_id) keeps one answer per member.
      const { error } = await this.client
        .from('meetup_rsvps')
        .upsert(
          { meetup_id: meetupId, user_id: uid, status: rsvp },
          { onConflict: 'meetup_id,user_id' },
        );
      if (error) return err(mapMeetupError(error));
      return ok(undefined);
    } catch (thrown) {
      return err(mapMeetupError(thrown));
    }
  }
}
