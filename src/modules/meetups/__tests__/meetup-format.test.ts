import {
  dayBadge,
  goingSummary,
  longMoment,
  weekdayTime,
} from '../domain/meetup-format';

const OCT_12 = new Date(2026, 9, 12, 17, 0);

describe('meetup formatting', () => {
  it('builds the calendar badge', () => {
    expect(dayBadge(OCT_12)).toEqual({ day: '12', month: 'OUT' });
    expect(dayBadge(new Date(2026, 2, 3))).toEqual({ day: '03', month: 'MAR' });
  });

  it('names the weekday with the time', () => {
    // 12/10/2026 is a Monday; 17/10/2026 is a Saturday.
    expect(weekdayTime(new Date(2026, 9, 17, 17, 0))).toBe('sábado, 17:00');
    expect(weekdayTime(new Date(2026, 9, 18, 15, 5))).toBe('domingo, 15:05');
  });

  it('writes the long moment', () => {
    expect(longMoment(new Date(2026, 9, 17, 17, 0))).toBe(
      'sábado, 17 de outubro · 17:00',
    );
  });
});

describe('goingSummary', () => {
  const a = { userId: 'u1', name: 'Ana Souza' };
  const b = { userId: 'u2', name: 'Beto Lima' };
  const c = { userId: 'u3', name: 'Carla Alves' };

  it('says nobody confirmed for an empty list', () => {
    expect(goingSummary([], 'u1')).toBe('Ninguém confirmou ainda');
  });

  it('lists first names with the count', () => {
    expect(goingSummary([a, b, c], 'u9')).toBe('3 vão: Ana, Beto e Carla');
  });

  it('names a single person without a conjunction', () => {
    expect(goingSummary([a], 'u9')).toBe('1 vão: Ana');
  });

  it('names the viewer last as "você"', () => {
    expect(goingSummary([a, c], 'u1')).toBe('2 vão: Carla e você');
    expect(goingSummary([a], 'u1')).toBe('1 vão: você');
  });
});
