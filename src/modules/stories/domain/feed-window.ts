import { daysAgo } from '@/shared/date/local-day';

/** The feed shows the last 7 days including today. */
export const FEED_DAYS = 7;

/** Oldest day (YYYY-MM-DD) still inside the feed window ending on `today`. */
export function oldestFeedDay(today: string): string {
  // Built from parts so the day is local; new Date('YYYY-MM-DD') is UTC.
  const [year, month, day] = today.split('-').map(Number);
  return daysAgo(FEED_DAYS - 1, new Date(year, month - 1, day));
}
