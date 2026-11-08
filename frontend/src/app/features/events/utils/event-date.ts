import { zonedDayKey } from '../../../shared/utils/time-zone';

/** Both instants fall on the same calendar day in `timeZone`. */
export function isSameCalendarDay(start: string | Date, end: string | Date, timeZone: string): boolean {
  return zonedDayKey(start, timeZone) === zonedDayKey(end, timeZone);
}

const CANCELLED = 2;

/**
 * True once the event's end (or its start when there is no end) has passed, unless it was
 * cancelled. The API sends instants with an offset, so the result is the same as checking
 * in Europe/Warsaw whatever the device's time zone.
 */
export function hasEventEnded(
  event: { startsAt: string | Date | null; endsAt: string | Date | null; status: number },
  now = new Date(),
): boolean {
  const end = event.endsAt ?? event.startsAt;

  return event.status !== CANCELLED && end !== null && new Date(end).getTime() <= now.getTime();
}
