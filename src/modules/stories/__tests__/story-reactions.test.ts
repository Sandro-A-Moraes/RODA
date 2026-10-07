import { InMemoryStoryRepository } from '../data/in-memory-story-repository';
import type { Story } from '../domain/story-repository';

const TODAY = '2026-10-07';

// Circle membership: c1 has u1, u2, u3; u9 belongs nowhere.
const circles: Record<string, string[]> = { c1: ['u1', 'u2', 'u3'] };

function setup() {
  let me: string | null = 'u1';
  const repo = new InMemoryStoryRepository(
    () => me,
    (userId) => `Nome ${userId}`,
    (circleId, userId) => circles[circleId]?.includes(userId) ?? false,
  );
  const as = (id: string | null) => {
    me = id;
  };
  // u1 posts the story every test reacts to.
  const post = async () => {
    as('u1');
    const created = await repo.create('c1', 'Caminhei sem fone', TODAY);
    if (!created.ok) throw new Error('setup failed');
    return created.value.id;
  };
  const seenBy = async (userId: string, storyId: string): Promise<Story> => {
    as(userId);
    const listed = await repo.listByCircle('c1', TODAY);
    const found = listed.ok && listed.value.find((s) => s.id === storyId);
    if (!found) throw new Error('story not listed');
    return found;
  };
  return { repo, as, post, seenBy };
}

describe('reacting (STORY-06 AC1-3)', () => {
  it("records the reaction on another member's story and shows it as selected", async () => {
    const { repo, as, post, seenBy } = setup();
    const id = await post();
    as('u2');

    const result = await repo.react(id, 'with_you');

    expect(result.ok).toBe(true);
    expect((await seenBy('u2', id)).myReaction).toBe('with_you');
  });

  it('replaces the previous reaction when another kind is chosen', async () => {
    const { repo, as, post, seenBy } = setup();
    const id = await post();
    as('u2');
    await repo.react(id, 'with_you');

    await repo.react(id, 'inspired');

    expect((await seenBy('u2', id)).myReaction).toBe('inspired');
    expect((await seenBy('u1', id)).receivedKinds).toEqual(['inspired']);
  });

  it('removes the reaction when null is sent', async () => {
    const { repo, as, post, seenBy } = setup();
    const id = await post();
    as('u2');
    await repo.react(id, 'with_you');

    const result = await repo.react(id, null);

    expect(result.ok).toBe(true);
    expect((await seenBy('u2', id)).myReaction).toBeNull();
    expect((await seenBy('u1', id)).receivedKinds).toEqual([]);
  });

  it("keeps each member's reaction separate", async () => {
    const { repo, as, post, seenBy } = setup();
    const id = await post();
    as('u2');
    await repo.react(id, 'with_you');
    as('u3');
    await repo.react(id, 'inspired');

    expect((await seenBy('u2', id)).myReaction).toBe('with_you');
    expect((await seenBy('u3', id)).myReaction).toBe('inspired');
  });
});

describe('own story (STORY-06 AC4)', () => {
  it('rejects a reaction to the own story with unauthorized and stores nothing', async () => {
    const { repo, post, seenBy } = setup();
    const id = await post();

    const result = await repo.react(id, 'with_you');

    expect(!result.ok && result.error.code).toBe('unauthorized');
    const mine = await seenBy('u1', id);
    expect(mine.myReaction).toBeNull();
    expect(mine.receivedKinds).toEqual([]);
  });
});

describe('membership', () => {
  it('rejects a reaction from a non-member and stores nothing', async () => {
    const { repo, as, post, seenBy } = setup();
    const id = await post();
    as('u9');

    const result = await repo.react(id, 'with_you');

    expect(!result.ok && result.error.code).toBe('unauthorized');
    expect((await seenBy('u1', id)).receivedKinds).toEqual([]);
  });

  it('rejects a reaction when signed out', async () => {
    const { repo, as, post } = setup();
    const id = await post();
    as(null);

    const result = await repo.react(id, 'with_you');

    expect(!result.ok && result.error.code).toBe('unauthorized');
  });

  it('reports not_found for a story that does not exist', async () => {
    const { repo, as } = setup();
    as('u2');

    const result = await repo.react('nope', 'with_you');

    expect(!result.ok && result.error.code).toBe('not_found');
  });
});

describe('received kinds (STORY-07 AC5)', () => {
  it('shows the author each kind once, however many members chose it', async () => {
    const { repo, as, post, seenBy } = setup();
    const id = await post();
    as('u2');
    await repo.react(id, 'with_you');
    as('u3');
    await repo.react(id, 'with_you');

    expect((await seenBy('u1', id)).receivedKinds).toEqual(['with_you']);
  });

  it('shows the author every kind received', async () => {
    const { repo, as, post, seenBy } = setup();
    const id = await post();
    as('u2');
    await repo.react(id, 'inspired');
    as('u3');
    await repo.react(id, 'with_you');

    const kinds = (await seenBy('u1', id)).receivedKinds;

    expect([...kinds].sort()).toEqual(['inspired', 'with_you']);
  });

  it("does not show received kinds on another member's story", async () => {
    const { repo, as, post, seenBy } = setup();
    const id = await post();
    as('u2');
    await repo.react(id, 'with_you');

    expect((await seenBy('u3', id)).receivedKinds).toEqual([]);
    expect((await seenBy('u2', id)).receivedKinds).toEqual([]);
  });

  it('exposes no numeric field on a story', async () => {
    const { repo, as, post, seenBy } = setup();
    const id = await post();
    as('u2');
    await repo.react(id, 'with_you');
    as('u3');
    await repo.react(id, 'inspired');

    for (const viewer of ['u1', 'u2']) {
      const story = await seenBy(viewer, id);
      expect(
        Object.values(story).filter((v) => typeof v === 'number'),
      ).toEqual([]);
    }
  });
});
