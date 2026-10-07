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

const FEED_DAYS = 7;

// Parses YYYY-MM-DD as a local date (new Date('YYYY-MM-DD') would be UTC).
function fromLocalDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

// Same rules as the SQL schema, for tests and early development (AD-002).
export class InMemoryStoryRepository implements StoryRepository {
  private readonly stories: StoredStory[] = [];
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
    return {
      id: stored.id,
      circleId: stored.circleId,
      authorId: stored.authorId,
      authorName: this.displayName(stored.authorId),
      body: stored.body,
      day: stored.day,
      isMine: stored.authorId === me,
      myReaction: null,
      receivedKinds: [],
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

  // Implemented with the reaction rules in the next task (T4).
  async react(
    _storyId: string,
    _kind: ReactionKind | null,
  ): Promise<Result<void>> {
    return err(createAppError('unknown'));
  }
}
