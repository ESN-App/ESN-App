import { zonedDayKey, zonedMidnight } from '../../../shared/utils/time-zone';

/** Local calendar day as YYYY-MM-DD (for calendar dates, not instants: use zonedDayKey). */
export function dayKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function dateFromDayKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export interface EventDayGroup<T> {
  dateKey: string;
  date: Date;
  events: T[];
}

/** Groups events (already sorted by start) into one entry per day in `timeZone`, in order. */
export function groupByDay<T extends { startsAt: string }>(
  events: T[],
  timeZone: string,
): EventDayGroup<T>[] {
  const groups = new Map<string, EventDayGroup<T>>();

  for (const event of events) {
    const key = zonedDayKey(event.startsAt, timeZone);
    const group = groups.get(key) ?? { dateKey: key, date: dateFromDayKey(key), events: [] };
    group.events.push(event);
    groups.set(key, group);
  }

  return [...groups.values()];
}

/** Start of the "Coming up next" list: the day after the selected one, but never in the past. */
export function upcomingFrom(selectedDayKey: string, timeZone: string, now = new Date()): Date {
  const day = dateFromDayKey(selectedDayKey);
  const nextDay = zonedMidnight(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1), timeZone);

  return nextDay > now ? nextDay : now;
}
