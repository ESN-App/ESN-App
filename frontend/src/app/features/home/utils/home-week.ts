import { zonedDayKey } from '../../../shared/utils/time-zone';

export interface WeekDay {
  date: Date;
  key: string;
  isToday: boolean;
  hasEvents: boolean;
}

interface DatedEvent {
  startsAt: string;
  status: number;
}

const CANCELLED = 2;

/** Local calendar day as YYYY-MM-DD (for calendar dates, not instants). */
export function dayKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Monday 00:00 (local time) of the week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

/**
 * The seven days (Monday to Sunday) of the week containing `today` (a local calendar date,
 * see zonedCalendarDate), flagged with days that have events in `timeZone`.
 */
export function weekDays(today: Date, events: readonly DatedEvent[], timeZone: string): WeekDay[] {
  const monday = startOfWeek(today);
  const eventDays = new Set(events.map((event) => zonedDayKey(event.startsAt, timeZone)));
  const todayKey = dayKey(today);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const key = dayKey(date);
    return { date, key, isToday: key === todayKey, hasEvents: eventDays.has(key) };
  });
}

/** The earliest event that has not started yet and is not cancelled. */
export function nextUpcoming<T extends DatedEvent>(events: readonly T[], now: Date): T | null {
  return events
    .filter((event) => event.status !== CANCELLED && new Date(event.startsAt) >= now)
    .reduce<T | null>(
      (earliest, event) =>
        !earliest || new Date(event.startsAt) < new Date(earliest.startsAt) ? event : earliest,
      null,
    );
}
