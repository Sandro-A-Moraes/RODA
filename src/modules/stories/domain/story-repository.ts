import { createToken } from '@/core/di';
import type { Token } from '@/core/di';
import type { Result } from '@/core/errors';

export type ReactionKind = 'with_you' | 'inspired';

/** The fixed reaction set, in display order. */
export const REACTION_KINDS: readonly ReactionKind[] = ['with_you', 'inspired'];

export interface Story {
  id: string;
  circleId: string;
  authorId: string;
  authorName: string;
  body: string;
  /** Local calendar day the story belongs to, as YYYY-MM-DD. */
  day: string;
  isMine: boolean;
  /** Reaction the current user gave; always null on their own story. */
  myReaction: ReactionKind | null;
  /** Kinds received, filled only on the user's own stories. Never a count. */
  receivedKinds: ReactionKind[];
}

export interface StoryRepository {
  /** Stories of the last 7 days including `today`, newest first. */
  listByCircle(circleId: string, today: string): Promise<Result<Story[]>>;
  create(circleId: string, body: string, today: string): Promise<Result<Story>>;
  /** Sets or replaces the current user's reaction; null removes it. */
  react(storyId: string, kind: ReactionKind | null): Promise<Result<void>>;
}

export const storyRepositoryToken: Token<StoryRepository> =
  createToken<StoryRepository>('StoryRepository');
