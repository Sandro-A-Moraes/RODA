import { createMeetup } from '../domain/meetup-use-cases';
import { validateMeetupInput } from '../domain/meetup-validation';
import type { MeetupRepository } from '../domain/meetup-repository';

const NOW = new Date(2026, 9, 9, 12, 0); // 09/10/2026 12:00 local
const TITLE_RULE = 'Título deve ter entre 3 e 60 caracteres';
const PLACE_RULE = 'Local deve ter entre 3 e 100 caracteres';
const INVALID = 'Data ou hora inválida';
const PAST = 'A data deve ser no futuro';

const valid = {
  title: 'Piquenique',
  place: 'Praça da República',
  date: '10/10/2026',
  time: '09:30',
};

function fail(input: Record<string, unknown>) {
  const result = validateMeetupInput(input, NOW);
  if (result.ok) throw new Error('expected a validation error');
  return result.error;
}

describe('validateMeetupInput', () => {
  it('returns trimmed text and a local-time instant (MEET-01 AC1)', () => {
    const result = validateMeetupInput(
      { ...valid, title: '  Piquenique ', place: ' Praça da República  ' },
      NOW,
    );

    expect(result).toEqual({
      ok: true,
      value: {
        title: 'Piquenique',
        place: 'Praça da República',
        startsAt: new Date(2026, 9, 10, 9, 30),
      },
    });
  });

  it.each([
    ['', true],
    ['ab', true],
    ['  ab  ', true],
    ['abc', false],
    ['a'.repeat(60), false],
    ['a'.repeat(61), true],
  ])('title %j: rejected=%s (MEET-02 AC4)', (title, rejected) => {
    const result = validateMeetupInput({ ...valid, title }, NOW);
    expect(!result.ok).toBe(rejected);
    if (!result.ok) {
      expect(result.error).toEqual({ code: 'validation', message: TITLE_RULE });
    }
  });

  it.each([
    ['ab', true],
    ['abc', false],
    ['a'.repeat(100), false],
    ['a'.repeat(101), true],
  ])('place %j: rejected=%s (MEET-02 AC5)', (place, rejected) => {
    const result = validateMeetupInput({ ...valid, place }, NOW);
    expect(!result.ok).toBe(rejected);
    if (!result.ok) {
      expect(result.error).toEqual({ code: 'validation', message: PLACE_RULE });
    }
  });

  it.each([
    ['2026-10-10', '09:30'],
    ['10/10/26', '09:30'],
    ['1/10/2026', '09:30'],
    ['31/02/2027', '09:30'],
    ['32/10/2026', '09:30'],
    ['10/13/2026', '09:30'],
    ['10/10/2026', '9:30'],
    ['10/10/2026', '24:00'],
    ['10/10/2026', '12:60'],
    ['10/10/2026', ''],
    ['', '09:30'],
  ])('date %j and time %j are invalid (MEET-02 AC3)', (date, time) => {
    expect(fail({ ...valid, date, time })).toEqual({
      code: 'validation',
      message: INVALID,
    });
  });

  it('accepts 29/02 on a leap year and 23:59', () => {
    const result = validateMeetupInput(
      { ...valid, date: '29/02/2028', time: '23:59' },
      NOW,
    );
    expect(result.ok).toBe(true);
  });

  it('rejects a moment in the past and the current minute (MEET-02 AC2)', () => {
    expect(fail({ ...valid, date: '09/10/2026', time: '11:59' })).toEqual({
      code: 'validation',
      message: PAST,
    });
    expect(fail({ ...valid, date: '09/10/2026', time: '12:00' })).toEqual({
      code: 'validation',
      message: PAST,
    });
  });

  it('accepts one minute in the future', () => {
    expect(
      validateMeetupInput({ ...valid, date: '09/10/2026', time: '12:01' }, NOW)
        .ok,
    ).toBe(true);
  });

  it('reports the title before the place before the date', () => {
    expect(fail({ title: '', place: '', date: 'x', time: 'x' }).message).toBe(
      TITLE_RULE,
    );
    expect(fail({ ...valid, place: '', date: 'x' }).message).toBe(PLACE_RULE);
  });

  it('reports a Portuguese rule for non-string input', () => {
    expect(fail({}).message).toBe(TITLE_RULE);
    expect(fail({ title: 'Piquenique', place: 'Praça' }).message).toBe(INVALID);
  });
});

describe('createMeetup', () => {
  function repo(): jest.Mocked<MeetupRepository> {
    return {
      listUpcoming: jest.fn(),
      create: jest.fn().mockResolvedValue({ ok: true, value: {} }),
      setRsvp: jest.fn(),
    };
  }

  it('does not call the repository when the input is invalid', async () => {
    const r = repo();
    const result = await createMeetup(r, 'c1', { ...valid, title: '' }, NOW);

    expect(result.ok).toBe(false);
    expect(r.create).not.toHaveBeenCalled();
  });

  it('forwards the validated input to the repository', async () => {
    const r = repo();
    await createMeetup(r, 'c1', { ...valid, title: ' Piquenique ' }, NOW);

    expect(r.create).toHaveBeenCalledWith('c1', {
      title: 'Piquenique',
      place: 'Praça da República',
      startsAt: new Date(2026, 9, 10, 9, 30),
    });
  });
});
