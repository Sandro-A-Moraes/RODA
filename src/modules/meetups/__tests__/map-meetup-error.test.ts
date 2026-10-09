import { mapMeetupError } from '../data/map-meetup-error';

describe('mapMeetupError', () => {
  it('maps a row level security refusal to unauthorized (MEET-05 AC7)', () => {
    expect(
      mapMeetupError({
        code: '42501',
        message: 'new row violates row-level security policy',
      }),
    ).toEqual({
      code: 'unauthorized',
      message: 'Você precisa entrar para continuar.',
    });
  });

  it('maps a check constraint violation to validation without backend text', () => {
    const mapped = mapMeetupError({
      code: '23514',
      message: 'violates check constraint "meetups_title_check"',
    });

    expect(mapped.code).toBe('validation');
    expect(mapped.message).not.toMatch(/constraint/);
  });

  it('never leaks backend text for an unknown failure', () => {
    expect(mapMeetupError({ message: 'relation "x" does not exist' })).toEqual({
      code: 'unknown',
      message: 'Algo deu errado. Tente novamente.',
    });
  });
});
