/** Local calendar day as YYYY-MM-DD. */
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

/** Groups events (already sorted by start) into one entry per local day, in order. */
export function groupByDay<T extends { startsAt: string }>(events: T[]): EventDayGroup<T>[] {
  const groups = new Map<string, EventDayGroup<T>>();

  for (const event of events) {
    const key = dayKey(new Date(event.startsAt));
    const group = groups.get(key) ?? { dateKey: key, date: dateFromDayKey(key), events: [] };
    group.events.push(event);
    groups.set(key, group);
  }

  return [...groups.values()];
}

/** Start of the "Coming up next" list: the day after the selected one, but never in the past. */
export function upcomingFrom(selectedDayKey: string, now = new Date()): Date {
  const nextDay = dateFromDayKey(selectedDayKey);
  nextDay.setDate(nextDay.getDate() + 1);

  return nextDay > now ? nextDay : now;
}
