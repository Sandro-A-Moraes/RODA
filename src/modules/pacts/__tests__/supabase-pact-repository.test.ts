import type { SupabaseClient } from '@supabase/supabase-js';

import {
  SupabasePactRepository,
  mapPactError,
} from '../data/supabase-pact-repository';

interface Reply {
  data: unknown;
  error: unknown;
}

// Every query in a call resolves, in order, with the next queued reply.
function stubClient(replies: Reply[], userId: string | null = 'u1') {
  const queue = [...replies];
  const next = () =>
    Promise.resolve(queue.shift() ?? { data: null, error: null });
  const builder: Record<string, unknown> = {};
  for (const method of [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'order',
  ]) {
    builder[method] = () => builder;
  }
  builder.maybeSingle = next;
  builder.single = next;
  builder.then = (resolve: (r: Reply) => void, reject: (e: unknown) => void) =>
    next().then(resolve, reject);
  const client = {
    from: jest.fn(() => builder),
    rpc: jest.fn(() => builder),
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: userId ? { user: { id: userId } } : null },
        }),
    },
  };
  return client as unknown as SupabaseClient;
}

const row = {
  id: 'p1',
  circle_id: 'c1',
  title: 'Sem celular',
  description: '',
  created_by: 'u2',
};

describe('mapPactError', () => {
  it('maps the unique (pact, member, day) violation to a conflict (PACT-03 AC2)', () => {
    expect(
      mapPactError({
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      }),
    ).toEqual({ code: 'conflict', message: 'Você já fez check-in hoje' });
  });

  it('maps a row level security refusal to unauthorized (PACT-04 AC1)', () => {
    expect(
      mapPactError({
        code: '42501',
        message: 'new row violates row-level security policy',
      }),
    ).toEqual({
      code: 'unauthorized',
      message: 'Você precisa entrar para continuar.',
    });
  });

  it('maps a check constraint violation to validation without backend text', () => {
    const mapped = mapPactError({
      code: '23514',
      message: 'violates check constraint "pacts_title_check"',
    });

    expect(mapped.code).toBe('validation');
    expect(mapped.message).not.toMatch(/constraint/);
  });

  it('never leaks backend text for an unknown failure', () => {
    const mapped = mapPactError({ message: 'relation "x" does not exist' });

    expect(mapped).toEqual({
      code: 'unknown',
      message: 'Algo deu errado. Tente novamente.',
    });
  });

  it('maps a network failure', () => {
    expect(mapPactError(new TypeError('Network request failed')).code).toBe(
      'network',
    );
  });
});

describe('SupabasePactRepository.checkIn', () => {
  it('reports a second check-in as a conflict', async () => {
    const repo = new SupabasePactRepository(
      stubClient([{ data: null, error: { code: '23505', message: 'dup' } }]),
    );

    const result = await repo.checkIn('p1', '2026-10-07');

    expect(!result.ok && result.error.code).toBe('conflict');
  });

  it('reports a non-member check-in as unauthorized', async () => {
    const repo = new SupabasePactRepository(
      stubClient([{ data: null, error: { code: '42501', message: 'rls' } }]),
    );

    const result = await repo.checkIn('p1', '2026-10-07');

    expect(!result.ok && result.error.code).toBe('unauthorized');
  });

  it('is unauthorized without a session and sends nothing', async () => {
    const client = stubClient([], null);
    const repo = new SupabasePactRepository(client);

    const result = await repo.checkIn('p1', '2026-10-07');

    expect(!result.ok && result.error.code).toBe('unauthorized');
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe('SupabasePactRepository.update and remove (PACT-09 AC7)', () => {
  const input = { title: 'Novo título', description: '' };

  it('reports not_found when the pact no longer exists', async () => {
    const repo = new SupabasePactRepository(
      stubClient([
        { data: null, error: null }, // update changed nothing
        { data: null, error: null }, // probe: not visible
      ]),
    );

    const result = await repo.update('p1', input);

    expect(!result.ok && result.error.code).toBe('not_found');
  });

  it('reports unauthorized when the pact exists but belongs to another member', async () => {
    const repo = new SupabasePactRepository(
      stubClient([
        { data: null, error: null },
        { data: { id: 'p1' }, error: null },
      ]),
    );

    const result = await repo.update('p1', input);

    expect(!result.ok && result.error.code).toBe('unauthorized');
  });

  it('returns the updated pact for the creator', async () => {
    const repo = new SupabasePactRepository(
      stubClient([{ data: { ...row, created_by: 'u1' }, error: null }]),
    );

    const result = await repo.update('p1', input);

    expect(result.ok && result.value.createdBy).toBe('u1');
  });

  it('removes nothing and reports not_found for a missing pact', async () => {
    const repo = new SupabasePactRepository(
      stubClient([
        { data: [], error: null },
        { data: null, error: null },
      ]),
    );

    const result = await repo.remove('p1');

    expect(!result.ok && result.error.code).toBe('not_found');
  });

  it("reports unauthorized when deleting another member's pact", async () => {
    const repo = new SupabasePactRepository(
      stubClient([
        { data: [], error: null },
        { data: { id: 'p1' }, error: null },
      ]),
    );

    const result = await repo.remove('p1');

    expect(!result.ok && result.error.code).toBe('unauthorized');
  });

  it('succeeds when the creator deletes the pact', async () => {
    const repo = new SupabasePactRepository(
      stubClient([{ data: [{ id: 'p1' }], error: null }]),
    );

    const result = await repo.remove('p1');

    expect(result.ok).toBe(true);
  });
});
