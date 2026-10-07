import { mapStoryError } from '../data/map-story-error';

describe('mapStoryError', () => {
  it('maps the unique (circle, author, day) violation to a conflict (STORY-02 AC4)', () => {
    expect(
      mapStoryError({
        code: '23505',
        message: 'duplicate key value violates unique constraint',
      }),
    ).toEqual({ code: 'conflict', message: 'Você já compartilhou hoje' });
  });

  it('maps a row level security refusal to unauthorized (STORY-02 AC6, STORY-06 AC4)', () => {
    expect(
      mapStoryError({
        code: '42501',
        message: 'new row violates row-level security policy',
      }),
    ).toEqual({
      code: 'unauthorized',
      message: 'Você precisa entrar para continuar.',
    });
  });

  it('maps a check constraint violation to validation without backend text', () => {
    const mapped = mapStoryError({
      code: '23514',
      message: 'violates check constraint "stories_body_check"',
    });

    expect(mapped.code).toBe('validation');
    expect(mapped.message).not.toMatch(/constraint/);
  });

  it('never leaks backend text for an unknown failure', () => {
    expect(mapStoryError({ message: 'relation "x" does not exist' })).toEqual({
      code: 'unknown',
      message: 'Algo deu errado. Tente novamente.',
    });
  });

  it('maps a network failure', () => {
    expect(mapStoryError(new TypeError('Network request failed')).code).toBe(
      'network',
    );
  });
});
