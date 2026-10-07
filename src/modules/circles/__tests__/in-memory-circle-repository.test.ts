import { InMemoryCircleRepository } from '../data/in-memory-circle-repository';
import type { CurrentUser } from '../data/in-memory-circle-repository';
import { MAX_CIRCLE_MEMBERS } from '../domain/circle-repository';

function setup(initial: CurrentUser | null = { id: 'u1', displayName: 'Ana' }) {
  let current: CurrentUser | null = initial;
  const repo = new InMemoryCircleRepository(() => current);
  const as = (user: CurrentUser | null) => {
    current = user;
  };
  return { repo, as };
}

async function created(repo: InMemoryCircleRepository, name = 'Família') {
  const result = await repo.create(name);
  if (!result.ok) throw new Error('setup failed');
  return result.value;
}

function fakeRandom(sequence: number[]) {
  const queue = [...sequence];
  return jest
    .spyOn(Math, 'random')
    .mockImplementation(() => queue.shift() ?? 0.5);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('InMemoryCircleRepository.create (CIR-01, CIR-02)', () => {
  it('adds the creator as the first member and lists them by name', async () => {
    const { repo } = setup();

    const circle = await created(repo);
    const members = await repo.members(circle.id);

    expect(circle.memberCount).toBe(1);
    expect(members).toEqual({
      ok: true,
      value: [{ userId: 'u1', displayName: 'Ana' }],
    });
  });

  it('requires a signed-in user', async () => {
    const { repo } = setup(null);

    const result = await repo.create('Família');

    expect(!result.ok && result.error.code).toBe('unauthorized');
  });

  it('draws the code from the A-Z 2-9 alphabet without O, I and L', async () => {
    const { repo } = setup();
    // 0 -> first symbol, 0.999 -> last symbol of the alphabet.
    fakeRandom([0, 0, 0, 0.999, 0.999, 0.999]);

    const circle = await created(repo);

    expect(circle.inviteCode).toBe('AAA999');
  });

  it('draws a new code when the first one collides (CIR-02)', async () => {
    const { repo } = setup();
    fakeRandom([0, 0, 0, 0, 0, 0]);
    const first = await created(repo, 'Primeiro');
    fakeRandom([0, 0, 0, 0, 0, 0, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999]);

    const second = await created(repo, 'Segundo');

    expect(first.inviteCode).toBe('AAAAAA');
    expect(second.inviteCode).toBe('999999');
  });
});

describe('InMemoryCircleRepository.join (CIR-03, CIR-04, CIR-05)', () => {
  it('requires a signed-in user', async () => {
    const { repo, as } = setup();
    const circle = await created(repo);
    as(null);

    const result = await repo.join(circle.inviteCode);

    expect(!result.ok && result.error.code).toBe('unauthorized');
  });

  it('adds the member and returns the updated count', async () => {
    const { repo, as } = setup();
    const circle = await created(repo);
    as({ id: 'u2', displayName: 'Beto' });

    const result = await repo.join(` ${circle.inviteCode.toLowerCase()} `);

    expect(result.ok && result.value.memberCount).toBe(2);
    expect(result.ok && result.value.id).toBe(circle.id);
  });

  it('reports an unknown code as not found', async () => {
    const { repo } = setup();

    const result = await repo.join('ZZZZZZ');

    expect(!result.ok && result.error).toEqual({
      code: 'not_found',
      message: 'Código não encontrado',
    });
  });

  it('keeps one membership per user when joining twice', async () => {
    const { repo } = setup();
    const circle = await created(repo);

    const result = await repo.join(circle.inviteCode);
    const members = await repo.members(circle.id);

    expect(!result.ok && result.error).toEqual({
      code: 'conflict',
      message: 'Você já faz parte deste círculo',
    });
    expect(members.ok && members.value).toHaveLength(1);
  });

  it('accepts the 12th member, then reports the circle as full', async () => {
    const { repo, as } = setup();
    const circle = await created(repo);
    for (let i = 2; i <= MAX_CIRCLE_MEMBERS; i += 1) {
      as({ id: `u${i}`, displayName: `M${i}` });
      const joined = await repo.join(circle.inviteCode);
      expect(joined.ok && joined.value.memberCount).toBe(i);
    }

    as({ id: 'u13', displayName: 'M13' });
    const rejected = await repo.join(circle.inviteCode);
    as({ id: 'u1', displayName: 'Ana' });
    const after = await repo.get(circle.id);

    expect(!rejected.ok && rejected.error).toEqual({
      code: 'conflict',
      message: 'Este círculo está cheio',
    });
    expect(after.ok && after.value.memberCount).toBe(12);
  });

  it('tells a current member of a full circle they are already in', async () => {
    const { repo, as } = setup();
    const circle = await created(repo);
    for (let i = 2; i <= MAX_CIRCLE_MEMBERS; i += 1) {
      as({ id: `u${i}`, displayName: `M${i}` });
      await repo.join(circle.inviteCode);
    }

    const result = await repo.join(circle.inviteCode);

    expect(!result.ok && result.error.message).toBe(
      'Você já faz parte deste círculo',
    );
  });
});

describe('InMemoryCircleRepository visibility (CIR-06, CIR-07, CIR-08)', () => {
  it('lists only circles the user belongs to, oldest first', async () => {
    const { repo, as } = setup();
    const a = await created(repo, 'Família');
    const b = await created(repo, 'Trabalho');
    as({ id: 'u2', displayName: 'Beto' });
    await created(repo, 'Outro grupo');
    await repo.join(a.inviteCode);

    const mine = await repo.listMine();

    expect(mine.ok && mine.value.map((c) => c.name)).toEqual([
      'Família',
      'Outro grupo',
    ]);
    expect(mine.ok && mine.value.map((c) => c.id)).not.toContain(b.id);
  });

  it('lists nothing for a signed-in user without circles', async () => {
    const { repo } = setup();
    await created(repo);

    const other = setup({ id: 'u9', displayName: 'Zé' });

    expect(await other.repo.listMine()).toEqual({ ok: true, value: [] });
  });

  it('requires a signed-in user to list', async () => {
    const { repo } = setup(null);

    const result = await repo.listMine();

    expect(!result.ok && result.error.code).toBe('unauthorized');
  });

  it('hides a circle and its members from non-members', async () => {
    const { repo, as } = setup();
    const circle = await created(repo);
    as({ id: 'u2', displayName: 'Beto' });

    const got = await repo.get(circle.id);
    const members = await repo.members(circle.id);

    expect(!got.ok && got.error.code).toBe('not_found');
    expect(!members.ok && members.error.code).toBe('not_found');
  });

  it('lists members in join order with their display names', async () => {
    const { repo, as } = setup();
    const circle = await created(repo);
    as({ id: 'u2', displayName: 'Beto' });
    await repo.join(circle.inviteCode);

    const members = await repo.members(circle.id);

    expect(members.ok && members.value).toEqual([
      { userId: 'u1', displayName: 'Ana' },
      { userId: 'u2', displayName: 'Beto' },
    ]);
  });
});
