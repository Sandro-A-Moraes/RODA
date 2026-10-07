import { InMemoryPactRepository } from '../data/in-memory-pact-repository';
import { createPact, updatePact } from '../domain/pact-use-cases';

const DAY = '2026-10-07';
const NEXT_DAY = '2026-10-08';

// Circle membership: c1 has u1, u2, u3; c2 has u1 only; u9 belongs nowhere.
const circles: Record<string, string[]> = {
  c1: ['u1', 'u2', 'u3'],
  c2: ['u1'],
};

function setup() {
  let me: string | null = 'u1';
  const repo = new InMemoryPactRepository(
    () => me,
    (circleId) => circles[circleId]?.length ?? 0,
    (circleId, userId) => circles[circleId]?.includes(userId) ?? false,
  );
  return {
    repo,
    as: (id: string | null) => {
      me = id;
    },
  };
}

async function newPact(repo: InMemoryPactRepository, circleId = 'c1') {
  const created = await createPact(repo, circleId, {
    title: 'Sem celular nas refeições',
    description: 'Durante o almoço e o jantar',
  });
  if (!created.ok) throw new Error('setup failed');
  return created.value;
}

describe('create and list (PACT-01, PACT-02)', () => {
  it('creates the pact in the circle, owned by the creator, with zero progress', async () => {
    const { repo } = setup();

    const created = await createPact(repo, 'c1', {
      title: '  Sem celular  ',
      description: '',
    });

    expect(created.ok && created.value).toMatchObject({
      circleId: 'c1',
      title: 'Sem celular',
      createdBy: 'u1',
      doneCount: 0,
      memberCount: 3,
      checkedInByMe: false,
    });
  });

  it('shows the new pact in the list', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);

    const listed = await repo.listByCircle('c1', DAY);

    expect(listed.ok && listed.value.map((p) => p.id)).toEqual([pact.id]);
  });

  it('lists oldest first and only the requested circle', async () => {
    const { repo } = setup();
    await createPact(repo, 'c1', { title: 'Primeiro', description: '' });
    await createPact(repo, 'c2', { title: 'Outro círculo', description: '' });
    await createPact(repo, 'c1', { title: 'Segundo', description: '' });
    await createPact(repo, 'c1', { title: 'Terceiro', description: '' });

    const listed = await repo.listByCircle('c1', DAY);

    expect(listed.ok && listed.value.map((p) => p.title)).toEqual([
      'Primeiro',
      'Segundo',
      'Terceiro',
    ]);
  });

  it('returns an empty list for a circle without pacts', async () => {
    const { repo } = setup();

    const listed = await repo.listByCircle('c1', DAY);

    expect(listed.ok && listed.value).toEqual([]);
  });

  it('rejects creation by a user who is not in the circle', async () => {
    const { repo, as } = setup();
    as('u9');

    const created = await createPact(repo, 'c1', {
      title: 'Intruso',
      description: '',
    });

    expect(!created.ok && created.error.code).toBe('unauthorized');
    as('u1');
    const listed = await repo.listByCircle('c1', DAY);
    expect(listed.ok && listed.value).toEqual([]);
  });

  it('rejects creation when signed out', async () => {
    const { repo, as } = setup();
    as(null);

    const created = await repo.create('c1', { title: 'abc', description: '' });

    expect(!created.ok && created.error.code).toBe('unauthorized');
  });

  it('hides the pacts of a circle from non-members', async () => {
    const { repo, as } = setup();
    const pact = await newPact(repo);
    as('u9');

    const listed = await repo.listByCircle('c1', DAY);
    const got = await repo.get(pact.id, DAY);

    expect(listed.ok && listed.value).toEqual([]);
    expect(!got.ok && got.error.code).toBe('not_found');
  });
});

describe('check-in (PACT-03, PACT-04)', () => {
  it('records one check-in for the member, pact and day', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);

    const result = await repo.checkIn(pact.id, DAY);

    const got = await repo.get(pact.id, DAY);
    expect(result.ok).toBe(true);
    expect(got.ok && got.value.doneCount).toBe(1);
    expect(got.ok && got.value.checkedInByMe).toBe(true);
  });

  it('rejects a second check-in on the same day and keeps one record', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);

    const second = await repo.checkIn(pact.id, DAY);

    expect(!second.ok && second.error).toEqual({
      code: 'conflict',
      message: 'Você já fez check-in hoje',
    });
    const got = await repo.get(pact.id, DAY);
    expect(got.ok && got.value.doneCount).toBe(1);
  });

  it('keeps exactly one record when two taps arrive together', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);

    const results = await Promise.all([
      repo.checkIn(pact.id, DAY),
      repo.checkIn(pact.id, DAY),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const got = await repo.get(pact.id, DAY);
    expect(got.ok && got.value.doneCount).toBe(1);
  });

  it('treats the next day as a new check-in (day rollover)', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);

    const next = await repo.checkIn(pact.id, NEXT_DAY);

    expect(next.ok).toBe(true);
    const today = await repo.get(pact.id, DAY);
    const tomorrow = await repo.get(pact.id, NEXT_DAY);
    expect(today.ok && today.value.doneCount).toBe(1);
    expect(tomorrow.ok && tomorrow.value.doneCount).toBe(1);
  });

  it('shows not checked in for a day without a record', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);

    const tomorrow = await repo.get(pact.id, NEXT_DAY);

    expect(tomorrow.ok && tomorrow.value.checkedInByMe).toBe(false);
  });

  it('lets each member check in once on the same day', async () => {
    const { repo, as } = setup();
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);
    as('u2');

    const result = await repo.checkIn(pact.id, DAY);

    expect(result.ok).toBe(true);
    const got = await repo.get(pact.id, DAY);
    expect(got.ok && got.value.doneCount).toBe(2);
    expect(got.ok && got.value.checkedInByMe).toBe(true);
  });

  it('rejects a check-in from a non-member with unauthorized', async () => {
    const { repo, as } = setup();
    const pact = await newPact(repo);
    as('u9');

    const result = await repo.checkIn(pact.id, DAY);

    expect(!result.ok && result.error.code).toBe('unauthorized');
    as('u1');
    const got = await repo.get(pact.id, DAY);
    expect(got.ok && got.value.doneCount).toBe(0);
  });

  it('rejects a check-in when signed out', async () => {
    const { repo, as } = setup();
    const pact = await newPact(repo);
    as(null);

    const result = await repo.checkIn(pact.id, DAY);

    expect(!result.ok && result.error.code).toBe('unauthorized');
  });

  it('reports not_found for a pact that does not exist', async () => {
    const { repo } = setup();

    const result = await repo.checkIn('nope', DAY);

    expect(!result.ok && result.error.code).toBe('not_found');
  });
});

describe('edit and delete (PACT-08, PACT-09)', () => {
  it('lets the creator save valid changes', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);

    const edit = await updatePact(repo, pact.id, {
      title: 'Novo título',
      description: 'Nova descrição',
    });

    expect(edit.ok && edit.value).toMatchObject({
      id: pact.id,
      title: 'Novo título',
      description: 'Nova descrição',
      createdBy: 'u1',
    });
    const got = await repo.get(pact.id, DAY);
    expect(got.ok && got.value.title).toBe('Novo título');
  });

  it('rejects an edit by another member and keeps the pact unchanged', async () => {
    const { repo, as } = setup();
    const pact = await newPact(repo);
    as('u2');

    const edit = await updatePact(repo, pact.id, {
      title: 'Outro título',
      description: '',
    });

    expect(!edit.ok && edit.error.code).toBe('unauthorized');
    const got = await repo.get(pact.id, DAY);
    expect(got.ok && got.value.title).toBe('Sem celular nas refeições');
  });

  it('rejects a delete by another member and keeps the pact', async () => {
    const { repo, as } = setup();
    const pact = await newPact(repo);
    as('u2');

    const remove = await repo.remove(pact.id);

    expect(!remove.ok && remove.error.code).toBe('unauthorized');
    const listed = await repo.listByCircle('c1', DAY);
    expect(listed.ok && listed.value).toHaveLength(1);
  });

  it('deletes the pact and its check-ins and removes it from the list', async () => {
    const { repo, as } = setup();
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);
    as('u2');
    await repo.checkIn(pact.id, DAY);
    as('u1');

    const remove = await repo.remove(pact.id);

    expect(remove.ok).toBe(true);
    const listed = await repo.listByCircle('c1', DAY);
    expect(listed.ok && listed.value).toEqual([]);
    const checkIn = await repo.checkIn(pact.id, DAY);
    expect(!checkIn.ok && checkIn.error.code).toBe('not_found');
  });

  it('does not leak the check-ins of a deleted pact into the next pact', async () => {
    const { repo } = setup();
    const first = await newPact(repo);
    await repo.checkIn(first.id, DAY);
    await repo.remove(first.id);

    const second = await newPact(repo);

    const got = await repo.get(second.id, DAY);
    expect(got.ok && got.value.doneCount).toBe(0);
    expect((await repo.checkIn(second.id, DAY)).ok).toBe(true);
  });

  it('reports not_found when editing or deleting a missing pact', async () => {
    const { repo } = setup();

    const edit = await updatePact(repo, 'nope', {
      title: 'Qualquer',
      description: '',
    });
    const remove = await repo.remove('nope');

    expect(!edit.ok && edit.error.code).toBe('not_found');
    expect(!remove.ok && remove.error.code).toBe('not_found');
  });

  it('reports not_found when the pact was deleted before the edit', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);
    await repo.remove(pact.id);

    const edit = await updatePact(repo, pact.id, {
      title: 'Tarde demais',
      description: '',
    });

    expect(!edit.ok && edit.error.code).toBe('not_found');
  });
});
