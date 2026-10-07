import { InMemoryPactRepository } from '../data/in-memory-pact-repository';
import { createPact, updatePact, validatePact } from '../domain/pact-use-cases';

const TITLE_RULE = 'Título deve ter entre 3 e 60 caracteres';
const DESCRIPTION_RULE = 'Descrição deve ter no máximo 280 caracteres';

function setup() {
  const repo = new InMemoryPactRepository(
    () => 'u1',
    () => 3,
  );
  const create = jest.spyOn(repo, 'create');
  const update = jest.spyOn(repo, 'update');
  return { repo, create, update };
}

describe('pact title (PACT-01 AC2)', () => {
  it.each([
    ['abc', 'abc'],
    ['  abc  ', 'abc'],
    ['x'.repeat(60), 'x'.repeat(60)],
    [` ${'x'.repeat(60)} `, 'x'.repeat(60)],
  ])('accepts %p and stores it trimmed', async (raw, stored) => {
    const { repo } = setup();

    const result = await createPact(repo, 'c1', {
      title: raw,
      description: '',
    });

    expect(result.ok && result.value.title).toBe(stored);
  });

  it.each(['', '  ', 'ab', '  ab  ', 'x'.repeat(61), ` ${'x'.repeat(61)} `])(
    'rejects %p with the title rule and never calls the repository',
    async (raw) => {
      const { repo, create, update } = setup();

      const created = await createPact(repo, 'c1', {
        title: raw,
        description: '',
      });
      const updated = await updatePact(repo, 'p1', {
        title: raw,
        description: '',
      });

      expect(!created.ok && created.error).toEqual({
        code: 'validation',
        message: TITLE_RULE,
      });
      expect(!updated.ok && updated.error.message).toBe(TITLE_RULE);
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, null, 123, {}])(
    'shows the Portuguese title rule for the non-string title %p',
    (title) => {
      const result = validatePact({ title, description: '' });

      expect(!result.ok && result.error.message).toBe(TITLE_RULE);
    },
  );
});

describe('pact description (PACT-01 AC3)', () => {
  it.each([[''], ['x'.repeat(280)], [`  ${'x'.repeat(280)}  `]])(
    'accepts a description of %#',
    async (description) => {
      const { repo } = setup();

      const result = await createPact(repo, 'c1', {
        title: 'Pacto válido',
        description,
      });

      expect(result.ok).toBe(true);
    },
  );

  it('rejects 281 characters and never calls the repository', async () => {
    const { repo, create, update } = setup();
    const input = { title: 'Pacto válido', description: 'x'.repeat(281) };

    const created = await createPact(repo, 'c1', input);
    const updated = await updatePact(repo, 'p1', input);

    expect(!created.ok && created.error).toEqual({
      code: 'validation',
      message: DESCRIPTION_RULE,
    });
    expect(!updated.ok && updated.error.message).toBe(DESCRIPTION_RULE);
    expect(create).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 5])(
    'shows the Portuguese description rule for the non-string %p',
    (description) => {
      const result = validatePact({ title: 'Pacto válido', description });

      expect(!result.ok && result.error.message).toBe(DESCRIPTION_RULE);
    },
  );
});
