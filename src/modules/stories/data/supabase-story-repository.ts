import type { SupabaseClient } from '@supabase/supabase-js';

import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';

import { oldestFeedDay } from '../domain/feed-window';
import { REACTION_KINDS } from '../domain/story-repository';
import type {
  ReactionKind,
  Story,
  StoryRepository,
} from '../domain/story-repository';

import { mapStoryError } from './map-story-error';

interface StoryRow {
  id: string;
  circle_id: string;
  author_id: string;
  body: string;
  day: string;
  // Many-to-one embed through stories.author_id; null if RLS hides it.
  profiles: { display_name: string } | null;
}

interface ReactionRow {
  story_id: string;
  user_id: string;
  kind: ReactionKind;
}

const columns = 'id, circle_id, author_id, body, day, profiles(display_name)';

// Thin adapter, validated manually against the real project (AD-002).
export class SupabaseStoryRepository implements StoryRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async uid(): Promise<string | null> {
    const { data } = await this.client.auth.getSession();
    return data.session?.user.id ?? null;
  }

  // RLS returns the user's own reactions plus every reaction on their own
  // stories (reactions_select_own_or_author), which is all this needs.
  private toStory(row: StoryRow, uid: string, reactions: ReactionRow[]): Story {
    const isMine = row.author_id === uid;
    const onStory = reactions.filter((r) => r.story_id === row.id);
    return {
      id: row.id,
      circleId: row.circle_id,
      authorId: row.author_id,
      authorName: row.profiles?.display_name ?? '',
      body: row.body,
      day: row.day,
      isMine,
      myReaction: onStory.find((r) => r.user_id === uid)?.kind ?? null,
      receivedKinds: isMine
        ? REACTION_KINDS.filter((k) => onStory.some((r) => r.kind === k))
        : [],
    };
  }

  async listByCircle(
    circleId: string,
    today: string,
  ): Promise<Result<Story[]>> {
    try {
      const uid = await this.uid();
      if (!uid) return err(createAppError('unauthorized'));
      const stories = await this.client
        .from('stories')
        .select(columns)
        .eq('circle_id', circleId)
        .gte('day', oldestFeedDay(today))
        .order('day', { ascending: false })
        .order('created_at', { ascending: false });
      if (stories.error) return err(mapStoryError(stories.error));
      const rows = (stories.data ?? []) as unknown as StoryRow[];
      if (rows.length === 0) return ok([]);
      const reactions = await this.client
        .from('story_reactions')
        .select('story_id, user_id, kind')
        .in(
          'story_id',
          rows.map((r) => r.id),
        );
      if (reactions.error) return err(mapStoryError(reactions.error));
      const given = (reactions.data ?? []) as ReactionRow[];
      return ok(rows.map((row) => this.toStory(row, uid, given)));
    } catch (thrown) {
      return err(mapStoryError(thrown));
    }
  }

  async create(
    circleId: string,
    body: string,
    today: string,
  ): Promise<Result<Story>> {
    try {
      const uid = await this.uid();
      if (!uid) return err(createAppError('unauthorized'));
      const { data, error } = await this.client
        .from('stories')
        .insert({ circle_id: circleId, author_id: uid, body, day: today })
        .select(columns)
        .single();
      if (error) return err(mapStoryError(error));
      return ok(this.toStory(data as unknown as StoryRow, uid, []));
    } catch (thrown) {
      return err(mapStoryError(thrown));
    }
  }

  async react(
    storyId: string,
    kind: ReactionKind | null,
  ): Promise<Result<void>> {
    try {
      const uid = await this.uid();
      if (!uid) return err(createAppError('unauthorized'));
      // The primary key (story_id, user_id) keeps one reaction per member;
      // the insert policy refuses non-members and the own story (42501).
      const { error } =
        kind === null
          ? await this.client
              .from('story_reactions')
              .delete()
              .eq('story_id', storyId)
              .eq('user_id', uid)
          : await this.client
              .from('story_reactions')
              .upsert(
                { story_id: storyId, user_id: uid, kind },
                { onConflict: 'story_id,user_id' },
              );
      if (error) return err(mapStoryError(error));
      return ok(undefined);
    } catch (thrown) {
      return err(mapStoryError(thrown));
    }
  }
}
