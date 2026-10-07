import { InMemoryPactRepository } from '../data/in-memory-pact-repository';
import { createPact, progressPercent } from '../domain/pact-use-cases';

const DAY = '2026-10-07';

function setup(initialMembers: number) {
  let me = 'u1';
  let members = initialMembers;
  const repo = new InMemoryPactRepository(
    () => me,
    () => members,
  );
  return {
    repo,
    as: (id: string) => {
      me = id;
    },
    setMembers: (n: number) => {
      members = n;
    },
  };
}

async function newPact(repo: InMemoryPactRepository) {
  const created = await createPact(repo, 'c1', {
    title: 'Sem celular nas refeições',
    description: '',
  });
  if (!created.ok) throw new Error('setup failed');
  return created.value;
}

describe('progressPercent (PACT-06 AC2, AC3)', () => {
  it.each([
    [2, 3, 67],
    [1, 3, 33],
    [3, 3, 100],
    [0, 3, 0],
    [1, 2, 50],
    [1, 8, 13],
    [0, 0, 0],
    [2, 0, 0],
  ])('%i of %i is %i%%', (done, total, expected) => {
    expect(progressPercent(done, total)).toBe(expected);
  });

  it('never divides by zero', () => {
    expect(Number.isFinite(progressPercent(1, 0))).toBe(true);
  });
});

describe('collective progress (PACT-06 AC1)', () => {
  it('shows 2 of 3 with 67% after two members check in', async () => {
    const { repo, as } = setup(3);
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);
    as('u2');
    await repo.checkIn(pact.id, DAY);

    const got = await repo.get(pact.id, DAY);

    expect(got.ok && got.value.doneCount).toBe(2);
    expect(got.ok && got.value.memberCount).toBe(3);
    expect(
      got.ok && progressPercent(got.value.doneCount, got.value.memberCount),
    ).toBe(67);
  });

  it('is the same on every list entry as on get', async () => {
    const { repo } = setup(3);
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);

    const listed = await repo.listByCircle('c1', DAY);

    expect(listed.ok && listed.value[0].doneCount).toBe(1);
    expect(listed.ok && listed.value[0].memberCount).toBe(3);
  });

  it('counts a member who joins after the check-ins in N (edge case)', async () => {
    let members = 2;
    const repo = new InMemoryPactRepository(
      () => 'u1',
      () => members,
    );
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);

    members = 3;
    const after = await repo.get(pact.id, DAY);

    expect(after.ok && after.value.doneCount).toBe(1);
    expect(after.ok && after.value.memberCount).toBe(3);
  });

  it('reports 0% for an empty circle', async () => {
    const { repo } = setup(0);
    const pact = await newPact(repo);

    const got = await repo.get(pact.id, DAY);

    expect(
      got.ok && progressPercent(got.value.doneCount, got.value.memberCount),
    ).toBe(0);
  });

  it('updates after a new check-in on the next read (PACT-07)', async () => {
    const { repo, as } = setup(3);
    const pact = await newPact(repo);
    const before = await repo.get(pact.id, DAY);
    as('u2');
    await repo.checkIn(pact.id, DAY);

    const after = await repo.get(pact.id, DAY);

    expect(before.ok && before.value.doneCount).toBe(0);
    expect(after.ok && after.value.doneCount).toBe(1);
  });
});

describe('no per-person data (PACT-05)', () => {
  it('exposes only aggregates and the own flag', async () => {
    const { repo, as } = setup(3);
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);
    as('u2');

    const got = await repo.get(pact.id, DAY);

    expect(got.ok && Object.keys(got.value).sort()).toEqual([
      'checkedInByMe',
      'circleId',
      'createdBy',
      'description',
      'doneCount',
      'id',
      'memberCount',
      'title',
    ]);
    expect(got.ok && got.value.checkedInByMe).toBe(false);
  });
});
