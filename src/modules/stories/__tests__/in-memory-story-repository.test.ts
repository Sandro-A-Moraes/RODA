import { daysAgo, localDay } from '@/shared/date/local-day';

import { InMemoryStoryRepository } from '../data/in-memory-story-repository';
import { createStory } from '../domain/story-use-cases';

const NOW = new Date(2026, 9, 7, 12, 0, 0);
const TODAY = localDay(NOW); // 2026-10-07
const day = (n: number) => daysAgo(n, NOW);

// Circle membership: c1 has u1, u2, u3; c2 has u1 only; u9 belongs nowhere.
const circles: Record<string, string[]> = {
  c1: ['u1', 'u2', 'u3'],
  c2: ['u1'],
};
const names: Record<string, string> = {
  u1: 'Ana',
  u2: 'Bruno',
  u3: 'Carla',
  u9: 'Intruso',
};

function setup() {
  let me: string | null = 'u1';
  const repo = new InMemoryStoryRepository(
    () => me,
    (userId) => names[userId] ?? '',
    (circleId, userId) => circles[circleId]?.includes(userId) ?? false,
  );
  return {
    repo,
    as: (id: string | null) => {
      me = id;
    },
  };
}

describe('posting (STORY-01 AC1)', () => {
  it('saves the story to the circle for the local day and shows it in the feed', async () => {
    const { repo } = setup();

    const created = await createStory(repo, 'c1', '  Li um livro no parque  ', TODAY);

    expect(created.ok && created.value).toMatchObject({
      circleId: 'c1',
      authorId: 'u1',
      authorName: 'Ana',
      body: 'Li um livro no parque',
      day: TODAY,
      isMine: true,
      myReaction: null,
      receivedKinds: [],
    });
    const listed = await repo.listByCircle('c1', TODAY);
    expect(listed.ok && listed.value.map((s) => s.body)).toEqual([
      'Li um livro no parque',
    ]);
  });
});

describe('one story per day (STORY-02 AC4)', () => {
  it('rejects a second story on the same day and keeps a single record', async () => {
    const { repo } = setup();
    await repo.create('c1', 'Primeiro', TODAY);

    const second = await repo.create('c1', 'Segundo', TODAY);

    expect(!second.ok && second.error).toEqual({
      code: 'conflict',
      message: 'Você já compartilhou hoje',
    });
    const listed = await repo.listByCircle('c1', TODAY);
    expect(listed.ok && listed.value.map((s) => s.body)).toEqual(['Primeiro']);
  });

  it('allows the same author to post on another day (day rollover)', async () => {
    const { repo } = setup();
    await repo.create('c1', 'Ontem', day(1));

    const today = await repo.create('c1', 'Hoje', TODAY);

    expect(today.ok && today.value.day).toBe(TODAY);
    const listed = await repo.listByCircle('c1', TODAY);
    expect(listed.ok && listed.value.map((s) => s.body)).toEqual([
      'Hoje',
      'Ontem',
    ]);
  });

  it('lets each member post once on the same day', async () => {
    const { repo, as } = setup();
    await repo.create('c1', 'Da Ana', TODAY);
    as('u2');

    const result = await repo.create('c1', 'Do Bruno', TODAY);

    expect(result.ok).toBe(true);
  });

  it('counts the one-per-day rule per circle', async () => {
    const { repo } = setup();
    await repo.create('c1', 'No c1', TODAY);

    const result = await repo.create('c2', 'No c2', TODAY);

    expect(result.ok).toBe(true);
  });
});

describe('membership (STORY-02 AC6)', () => {
  it('rejects a post from a non-member with unauthorized and stores nothing', async () => {
    const { repo, as } = setup();
    as('u9');

    const result = await repo.create('c1', 'Intrusão', TODAY);

    expect(!result.ok && result.error.code).toBe('unauthorized');
    as('u1');
    const listed = await repo.listByCircle('c1', TODAY);
    expect(listed.ok && listed.value).toEqual([]);
  });

  it('rejects a post when signed out', async () => {
    const { repo, as } = setup();
    as(null);

    const result = await repo.create('c1', 'Sem sessão', TODAY);

    expect(!result.ok && result.error.code).toBe('unauthorized');
  });
});

describe('feed window and order (STORY-03 AC1, AC7)', () => {
  it('returns only the last 7 days of a 9-day seed, newest first', async () => {
    const { repo } = setup();
    for (let n = 8; n >= 0; n -= 1) {
      await repo.create('c1', `Dia ${n}`, day(n));
    }

    const listed = await repo.listByCircle('c1', TODAY);

    expect(listed.ok && listed.value.map((s) => s.day)).toEqual([
      '2026-10-07',
      '2026-10-06',
      '2026-10-05',
      '2026-10-04',
      '2026-10-03',
      '2026-10-02',
      '2026-10-01',
    ]);
  });

  it('includes the story of today minus 6 and excludes today minus 7', async () => {
    const { repo } = setup();
    await repo.create('c1', 'Seis dias', day(6));
    await repo.create('c1', 'Sete dias', day(7));

    const listed = await repo.listByCircle('c1', TODAY);

    expect(listed.ok && listed.value.map((s) => s.body)).toEqual(['Seis dias']);
  });

  it('orders stories of the same day newest first', async () => {
    const { repo, as } = setup();
    await repo.create('c1', 'Primeira', TODAY);
    as('u2');
    await repo.create('c1', 'Segunda', TODAY);
    as('u3');
    await repo.create('c1', 'Terceira', TODAY);

    const listed = await repo.listByCircle('c1', TODAY);

    expect(listed.ok && listed.value.map((s) => s.body)).toEqual([
      'Terceira',
      'Segunda',
      'Primeira',
    ]);
  });

  it("shows each story's author display name and day", async () => {
    const { repo, as } = setup();
    as('u2');
    await repo.create('c1', 'Do Bruno', day(2));
    as('u1');

    const listed = await repo.listByCircle('c1', TODAY);

    expect(listed.ok && listed.value).toEqual([
      expect.objectContaining({
        authorId: 'u2',
        authorName: 'Bruno',
        day: '2026-10-05',
        isMine: false,
      }),
    ]);
  });

  it('hides the stories of other circles', async () => {
    const { repo } = setup();
    await repo.create('c2', 'Outro círculo', TODAY);

    const listed = await repo.listByCircle('c1', TODAY);

    expect(listed.ok && listed.value).toEqual([]);
  });

  it('hides the stories of a circle from non-members', async () => {
    const { repo, as } = setup();
    await repo.create('c1', 'Só membros', TODAY);
    as('u9');

    const listed = await repo.listByCircle('c1', TODAY);

    expect(listed.ok && listed.value).toEqual([]);
  });
});
