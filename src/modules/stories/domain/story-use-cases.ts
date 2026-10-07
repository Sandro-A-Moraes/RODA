import type { Result } from '@/core/errors';

import type { Story, StoryRepository } from './story-repository';
import { validateStoryBody } from './story-validation';

// `today` is the local day at submit time, so a day rollover while the
// composer is open is evaluated against the new date.
export async function createStory(
  repo: StoryRepository,
  circleId: string,
  body: unknown,
  today: string,
): Promise<Result<Story>> {
  const valid = validateStoryBody(body);
  if (!valid.ok) return valid;
  return repo.create(circleId, valid.value, today);
}
