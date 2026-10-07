import { InMemoryPactRepository } from '../data/in-memory-pact-repository';
import {
  createPact,
  progressPercent,
  updatePact,
} from '../domain/pact-use-cases';

const DAY = '2026-10-07';

function setup(members = 7) {
  let me: string | null = 'u1';
  const repo = new InMemoryPactRepository(
    () => me,
    () => members,
  );
  return {
    repo,
    as: (id: string) => {
      me = id;
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

describe('progressPercent', () => {
  it.each([
    [5, 7, 71],
    [3, 7, 43],
    [6, 7, 86],
    [0, 0, 0],
    [1, 0, 0],
  ])('%i of %i is %i%%', (done, total, expected) => {
    expect(progressPercent(done, total)).toBe(expected);
  });
});

describe('createPact', () => {
  it.each(['ab', ' ab ', 'x'.repeat(61)])('rejects the title %p', async (t) => {
    const { repo } = setup();

    const result = await createPact(repo, 'c1', { title: t, description: '' });

    expect(!result.ok && result.error.message).toBe(
      'Título deve ter entre 3 e 60 caracteres',
    );
  });

  it('rejects a description over 280 characters', async () => {
    const { repo } = setup();

    const result = await createPact(repo, 'c1', {
      title: 'Pacto válido',
      description: 'x'.repeat(281),
    });

    expect(!result.ok && result.error.message).toBe(
      'Descrição deve ter no máximo 280 caracteres',
    );
  });

  it('lists only the pacts of the circle, oldest first', async () => {
    const { repo } = setup();
    await createPact(repo, 'c1', { title: 'Primeiro', description: '' });
    await createPact(repo, 'c2', { title: 'Outro círculo', description: '' });
    await createPact(repo, 'c1', { title: 'Segundo', description: '' });

    const listed = await repo.listByCircle('c1', DAY);

    expect(listed.ok && listed.value.map((p) => p.title)).toEqual([
      'Primeiro',
      'Segundo',
    ]);
  });
});

describe('check-in', () => {
  it('records one check-in per member and day', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);

    expect((await repo.checkIn(pact.id, DAY)).ok).toBe(true);
    const second = await repo.checkIn(pact.id, DAY);

    expect(!second.ok && second.error.code).toBe('conflict');
    const got = await repo.get(pact.id, DAY);
    expect(got.ok && got.value.doneCount).toBe(1);
    expect(got.ok && got.value.checkedInByMe).toBe(true);
  });

  it('counts distinct members and allows a new day', async () => {
    const { repo, as } = setup();
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);
    as('u2');
    await repo.checkIn(pact.id, DAY);

    const today = await repo.get(pact.id, DAY);
    const tomorrow = await repo.get(pact.id, '2026-10-08');

    expect(today.ok && today.value.doneCount).toBe(2);
    expect(tomorrow.ok && tomorrow.value.doneCount).toBe(0);
    expect((await repo.checkIn(pact.id, '2026-10-08')).ok).toBe(true);
  });
});

describe('edit and delete', () => {
  it('lets only the creator edit and delete', async () => {
    const { repo, as } = setup();
    const pact = await newPact(repo);
    as('u2');

    const edit = await updatePact(repo, pact.id, {
      title: 'Outro título',
      description: '',
    });
    const remove = await repo.remove(pact.id);

    expect(!edit.ok && edit.error.code).toBe('unauthorized');
    expect(!remove.ok && remove.error.code).toBe('unauthorized');
  });

  it('updates for the creator and removes check-ins on delete', async () => {
    const { repo } = setup();
    const pact = await newPact(repo);
    await repo.checkIn(pact.id, DAY);

    const edit = await updatePact(repo, pact.id, {
      title: 'Novo título',
      description: 'Nova descrição',
    });
    const remove = await repo.remove(pact.id);

    expect(edit.ok && edit.value.title).toBe('Novo título');
    expect(remove.ok).toBe(true);
    const got = await repo.get(pact.id, DAY);
    expect(!got.ok && got.error.code).toBe('not_found');
  });

  it('reports not_found for a missing pact', async () => {
    const { repo } = setup();

    const remove = await repo.remove('nope');

    expect(!remove.ok && remove.error.code).toBe('not_found');
  });
});
