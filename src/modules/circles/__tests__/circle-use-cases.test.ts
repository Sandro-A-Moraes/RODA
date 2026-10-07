import { InMemoryCircleRepository } from '../data/in-memory-circle-repository';
import type { CurrentUser } from '../data/in-memory-circle-repository';
import { createCircle, joinCircle } from '../domain/circle-use-cases';

function setup() {
  let current: CurrentUser = { id: 'u1', displayName: 'Ana' };
  const repo = new InMemoryCircleRepository(() => current);
  const as = (user: CurrentUser) => {
    current = user;
  };
  return { repo, as };
}

describe('createCircle', () => {
  it('creates a circle with a 6 character code and the creator as member', async () => {
    const { repo } = setup();

    const result = await createCircle(repo, '  Família ');

    expect(result.ok && result.value.name).toBe('Família');
    expect(result.ok && result.value.inviteCode).toMatch(
      /^[A-HJKMNP-Z2-9]{6}$/,
    );
    expect(result.ok && result.value.memberCount).toBe(1);
  });

  it.each(['a', ' a ', 'x'.repeat(41)])('rejects the name %p', async (name) => {
    const { repo } = setup();

    const result = await createCircle(repo, name);

    expect(!result.ok && result.error.message).toBe(
      'Nome deve ter entre 2 e 40 caracteres',
    );
    expect(await repo.listMine()).toEqual({ ok: true, value: [] });
  });
});

describe('joinCircle', () => {
  async function circleWithCode() {
    const ctx = setup();
    const created = await createCircle(ctx.repo, 'Família');
    if (!created.ok) throw new Error('setup failed');
    return { ...ctx, code: created.value.inviteCode, id: created.value.id };
  }

  it('joins with a lowercase, padded code', async () => {
    const { repo, as, code } = await circleWithCode();
    as({ id: 'u2', displayName: 'Beto' });

    const result = await joinCircle(repo, ` ${code.toLowerCase()} `);

    expect(result.ok && result.value.memberCount).toBe(2);
  });

  it('rejects an empty code without calling the repository', async () => {
    const { repo } = await circleWithCode();
    const join = jest.spyOn(repo, 'join');

    const result = await joinCircle(repo, '   ');

    expect(!result.ok && result.error.message).toBe('Informe o código');
    expect(join).not.toHaveBeenCalled();
  });

  it('reports an unknown code', async () => {
    const { repo } = await circleWithCode();

    const result = await joinCircle(repo, 'ZZZZZZ');

    expect(!result.ok && result.error.message).toBe('Código não encontrado');
  });

  it('rejects a duplicate join', async () => {
    const { repo, code } = await circleWithCode();

    const result = await joinCircle(repo, code);

    expect(!result.ok && result.error.message).toBe(
      'Você já faz parte deste círculo',
    );
  });

  it('rejects the 13th member and accepts the 12th', async () => {
    const { repo, as, code } = await circleWithCode();
    for (let i = 2; i <= 12; i += 1) {
      as({ id: `u${i}`, displayName: `M${i}` });
      expect((await joinCircle(repo, code)).ok).toBe(true);
    }
    as({ id: 'u13', displayName: 'M13' });

    const result = await joinCircle(repo, code);

    expect(!result.ok && result.error.message).toBe('Este círculo está cheio');
  });

  it('lists only the circles of the current user', async () => {
    const { repo, as } = await circleWithCode();
    as({ id: 'u9', displayName: 'Outra' });

    expect(await repo.listMine()).toEqual({ ok: true, value: [] });
  });
});
