import { mapCircleError } from '../data/supabase-circle-repository';

describe('mapCircleError', () => {
  it.each([
    ['circle_full', { code: 'conflict', message: 'Este círculo está cheio' }],
    [
      'already_member',
      { code: 'conflict', message: 'Você já faz parte deste círculo' },
    ],
    ['not_found', { code: 'not_found', message: 'Código não encontrado' }],
    [
      'unauthorized',
      { code: 'unauthorized', message: 'Você precisa entrar para continuar.' },
    ],
  ])('translates the SQL code %p', (raised, expected) => {
    expect(mapCircleError({ message: raised, code: 'P0001' })).toEqual(
      expected,
    );
  });

  it('reports a concurrent duplicate membership as already a member (CIR-04)', () => {
    const duplicate = {
      code: '23505',
      message:
        'duplicate key value violates unique constraint "circle_members_pkey"',
    };

    expect(mapCircleError(duplicate)).toEqual({
      code: 'conflict',
      message: 'Você já faz parte deste círculo',
    });
  });

  it('never leaks backend text for an unknown failure', () => {
    const mapped = mapCircleError({ message: 'relation "x" does not exist' });

    expect(mapped.code).toBe('unknown');
    expect(mapped.message).toBe('Algo deu errado. Tente novamente.');
  });

  it('maps a network failure', () => {
    expect(mapCircleError(new TypeError('Network request failed')).code).toBe(
      'network',
    );
  });
});
