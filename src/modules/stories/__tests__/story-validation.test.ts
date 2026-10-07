import { ok } from '@/core/errors';

import type { Story, StoryRepository } from '../domain/story-repository';
import { createStory } from '../domain/story-use-cases';
import { validateStoryBody } from '../domain/story-validation';

const EMPTY_RULE = 'Escreva algo para compartilhar';
const LENGTH_RULE = 'Máximo de 280 caracteres';
const TODAY = '2026-10-07';

function setup() {
  const create = jest.fn(
    async (circleId: string, body: string, today: string) =>
      ok<Story>({
        id: 's1',
        circleId,
        authorId: 'u1',
        authorName: 'Ana',
        body,
        day: today,
        isMine: true,
        myReaction: null,
        receivedKinds: [],
      }),
  );
  const repo: StoryRepository = {
    listByCircle: jest.fn(),
    create,
    react: jest.fn(),
  };
  return { repo, create };
}

describe('story body accepted (STORY-01 AC1)', () => {
  it.each([
    ['x', 'x'],
    ['  x  ', 'x'],
    ['x'.repeat(280), 'x'.repeat(280)],
    [`\n ${'x'.repeat(280)} \n`, 'x'.repeat(280)],
  ])(
    'saves %p trimmed for the circle and the local day',
    async (raw, stored) => {
      const { repo, create } = setup();

      const result = await createStory(repo, 'c1', raw, TODAY);

      expect(result.ok && result.value.body).toBe(stored);
      expect(create).toHaveBeenCalledWith('c1', stored, TODAY);
    },
  );
});

describe('empty story body (STORY-01 AC2)', () => {
  it.each(['', ' ', '   ', '\n', ' \n\t \n '])(
    'rejects %p with the empty rule and never calls the repository',
    async (raw) => {
      const { repo, create } = setup();

      const result = await createStory(repo, 'c1', raw, TODAY);

      expect(!result.ok && result.error).toEqual({
        code: 'validation',
        message: EMPTY_RULE,
      });
      expect(create).not.toHaveBeenCalled();
    },
  );
});

describe('too long story body (STORY-01 AC3)', () => {
  it.each(['x'.repeat(281), ` ${'x'.repeat(281)} `])(
    'rejects 281 characters after trim and never calls the repository',
    async (raw) => {
      const { repo, create } = setup();

      const result = await createStory(repo, 'c1', raw, TODAY);

      expect(!result.ok && result.error).toEqual({
        code: 'validation',
        message: LENGTH_RULE,
      });
      expect(create).not.toHaveBeenCalled();
    },
  );
});

describe('non-string story body', () => {
  it.each([undefined, null, 123, {}])(
    'shows the Portuguese empty rule for %p',
    async (raw) => {
      const { repo, create } = setup();

      const validated = validateStoryBody(raw);
      const created = await createStory(repo, 'c1', raw, TODAY);

      expect(!validated.ok && validated.error).toEqual({
        code: 'validation',
        message: EMPTY_RULE,
      });
      expect(!created.ok && created.error.message).toBe(EMPTY_RULE);
      expect(create).not.toHaveBeenCalled();
    },
  );
});
