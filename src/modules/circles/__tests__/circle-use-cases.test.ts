import { InMemoryCircleRepository } from '../data/in-memory-circle-repository';
import type { CurrentUser } from '../data/in-memory-circle-repository';
import {
  circleNameSchema,
  createCircle,
  joinCircle,
  normalizeInviteCode,
} from '../domain/circle-use-cases';

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

describe('createCircle validation (CIR-01)', () => {
  it.each(['ab', 'x'.repeat(40), '  ab  '])(
    'accepts the boundary name %p',
    async (name) => {
      const { repo } = setup();

      const result = await createCircle(repo, name);

      expect(result.ok && result.value.name).toBe(name.trim());
    },
  );

  it.each([undefined, null, 42, '', '   '])(
    'rejects the non-name %p with the name message',
    async (name) => {
      const { repo } = setup();
      const create = jest.spyOn(repo, 'create');

      const result = await createCircle(repo, name);

      expect(!result.ok && result.error.code).toBe('validation');
      expect(!result.ok && result.error.message).toBe(
        'Nome deve ter entre 2 e 40 caracteres',
      );
      expect(create).not.toHaveBeenCalled();
    },
  );

  it('counts the length after trimming', () => {
    expect(circleNameSchema.safeParse(`  ${'x'.repeat(40)}  `).success).toBe(
      true,
    );
    expect(circleNameSchema.safeParse(` ${'x'.repeat(41)} `).success).toBe(
      false,
    );
  });

  it('generates distinct 6 character codes for many circles (CIR-02)', async () => {
    const { repo } = setup();
    const codes = new Set<string>();

    for (let i = 0; i < 200; i += 1) {
      const result = await createCircle(repo, `Círculo ${i}`);
      if (!result.ok) throw new Error('create failed');
      expect(result.value.inviteCode).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
      codes.add(result.value.inviteCode);
    }

    expect(codes.size).toBe(200);
  });
});

describe('normalizeInviteCode (CIR-03)', () => {
  it.each([
    ['abc234', 'ABC234'],
    ['  abc234 ', 'ABC234'],
    ['ABC234', 'ABC234'],
    ['   ', ''],
  ])('normalizes %p to %p', (raw, expected) => {
    expect(normalizeInviteCode(raw)).toBe(expected);
  });
});

describe('joinCircle repository contract', () => {
  it('passes the normalized code to the repository (CIR-03)', async () => {
    const { repo } = setup();
    const join = jest.spyOn(repo, 'join');

    await joinCircle(repo, '  abc234 ');

    expect(join).toHaveBeenCalledWith('ABC234');
  });

  it('reports an empty code as a validation error (CIR-03)', async () => {
    const { repo } = setup();

    const result = await joinCircle(repo, '');

    expect(!result.ok && result.error.code).toBe('validation');
  });
});
