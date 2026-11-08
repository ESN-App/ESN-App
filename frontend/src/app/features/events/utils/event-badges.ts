import { zonedDayKey } from '../../../shared/utils/time-zone';

/** 'today' / 'tomorrow' when the event starts on that calendar day in `timeZone`, else null. */
export function relativeEventDay(
  startsAt: string | Date | null,
  timeZone: string,
  now = new Date(),
): 'today' | 'tomorrow' | null {
  if (startsAt === null) {
    return null;
  }

  const days =
    // YYYY-MM-DD keys parse as UTC midnights, so the difference is whole days.
    (Date.parse(zonedDayKey(startsAt, timeZone)) - Date.parse(zonedDayKey(now, timeZone))) /
    86_400_000;

  return days === 0 ? 'today' : days === 1 ? 'tomorrow' : null;
}

/**
 * "3 spots left" / "1 spot left" when 1–5 places remain, else null (no limit, plenty, full,
 * or registrations unknown).
 */
export function spotsLeftLabel(event: {
  currentParticipants: number | null;
  maximumParticipants: number | null;
}): string | null {
  if (event.maximumParticipants === null || event.currentParticipants === null) {
    return null;
  }

  const left = event.maximumParticipants - event.currentParticipants;

  return left >= 1 && left <= 5 ? `${left} ${left === 1 ? 'spot' : 'spots'} left` : null;
}
