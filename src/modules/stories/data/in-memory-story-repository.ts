import { createAppError, err, ok } from '@/core/errors';
import type { Result } from '@/core/errors';
import { daysAgo } from '@/shared/date/local-day';

import type {
  ReactionKind,
  Story,
  StoryRepository,
} from '../domain/story-repository';

interface StoredStory {
  id: string;
  circleId: string;
  authorId: string;
  body: string;
  day: string;
  sequence: number;
}

interface StoredReaction {
  storyId: string;
  userId: string;
  kind: ReactionKind;
}

const FEED_DAYS = 7;
const KIND_ORDER: ReactionKind[] = ['with_you', 'inspired'];

// Parses YYYY-MM-DD as a local date (new Date('YYYY-MM-DD') would be UTC).
function fromLocalDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

// Same rules as the SQL schema, for tests and early development (AD-002).
export class InMemoryStoryRepository implements StoryRepository {
  private readonly stories: StoredStory[] = [];
  // One per (story, user), like the story_reactions primary key.
  private readonly reactions: StoredReaction[] = [];
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

  private view(stored: StoredStory): Story {
    const me = this.currentUserId();
    const isMine = stored.authorId === me;
    const onStory = this.reactions.filter((r) => r.storyId === stored.id);
    return {
      id: stored.id,
      circleId: stored.circleId,
      authorId: stored.authorId,
      authorName: this.displayName(stored.authorId),
      body: stored.body,
      day: stored.day,
      isMine,
      myReaction: onStory.find((r) => r.userId === me)?.kind ?? null,
      // Kinds only, never counts, and only for the author.
      receivedKinds: isMine
        ? KIND_ORDER.filter((k) => onStory.some((r) => r.kind === k))
        : [],
    };
  }

  async listByCircle(
    circleId: string,
    today: string,
  ): Promise<Result<Story[]>> {
    const me = this.currentUserId();
    if (!me || !this.isMember(circleId, me)) return ok([]);
    const oldest = daysAgo(FEED_DAYS - 1, fromLocalDay(today));
    return ok(
      this.stories
        .filter((s) => s.circleId === circleId && s.day >= oldest)
        .sort((a, b) =>
          a.day === b.day
            ? b.sequence - a.sequence
            : b.day.localeCompare(a.day),
        )
        .map((s) => this.view(s)),
    );
  }

  async create(
    circleId: string,
    body: string,
    today: string,
  ): Promise<Result<Story>> {
    const me = this.currentUserId();
    // Same refusal as the stories insert policy.
    if (!me || !this.isMember(circleId, me)) {
      return err(createAppError('unauthorized'));
    }
    // Same as unique (circle_id, author_id, day).
    if (
      this.stories.some(
        (s) => s.circleId === circleId && s.authorId === me && s.day === today,
      )
    ) {
      return err(createAppError('conflict', 'Você já compartilhou hoje'));
    }
    this.sequence += 1;
    const stored: StoredStory = {
      id: `story-${this.sequence}`,
      circleId,
      authorId: me,
      body,
      day: today,
      sequence: this.sequence,
    };
    this.stories.push(stored);
    return ok(this.view(stored));
  }

  async react(
    storyId: string,
    kind: ReactionKind | null,
  ): Promise<Result<void>> {
    const me = this.currentUserId();
    if (!me) return err(createAppError('unauthorized'));
    const story = this.stories.find((s) => s.id === storyId);
    if (!story) return err(createAppError('not_found'));
    // Same refusal as the reactions insert policy: members only, never
    // on the own story.
    if (!this.isMember(story.circleId, me) || story.authorId === me) {
      return err(createAppError('unauthorized'));
    }
    const index = this.reactions.findIndex(
      (r) => r.storyId === storyId && r.userId === me,
    );
    if (index >= 0) this.reactions.splice(index, 1);
    if (kind !== null) this.reactions.push({ storyId, userId: me, kind });
    return ok(undefined);
  }
}
