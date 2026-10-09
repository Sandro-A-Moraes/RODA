import type { Attendee } from './meetup-repository';

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const WEEKDAYS = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

const pad = (n: number) => String(n).padStart(2, '0');
const time = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Calendar badge: "12" over "OUT". */
export function dayBadge(date: Date): { day: string; month: string } {
  return {
    day: pad(date.getDate()),
    month: MONTHS[date.getMonth()].slice(0, 3).toUpperCase(),
  };
}

/** "sábado, 17:00". */
export function weekdayTime(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${time(date)}`;
}

/** "sábado, 12 de outubro · 17:00". */
export function longMoment(date: Date): string {
  return (
    `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ` +
    `${MONTHS[date.getMonth()]} · ${time(date)}`
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** "3 vão: Ana, Beto e você"; the viewer is named last as "você". */
export function goingSummary(going: Attendee[], currentUserId: string): string {
  if (going.length === 0) return 'Ninguém confirmou ainda';
  const others = going
    .filter((a) => a.userId !== currentUserId)
    .map((a) => a.name.trim().split(/\s+/)[0]);
  const names = going.some((a) => a.userId === currentUserId)
    ? [...others, 'você']
    : others;
  return `${going.length} vão: ${joinNames(names)}`;
}
