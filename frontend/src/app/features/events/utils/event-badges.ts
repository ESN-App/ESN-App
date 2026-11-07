// en-CA formats as YYYY-MM-DD, so the result parses straight back as a UTC date.
const warsawDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 'today' / 'tomorrow' when the event starts on that calendar day in Europe/Warsaw, else null. */
export function relativeEventDay(
  startsAt: string | Date | null,
  now = new Date(),
): 'today' | 'tomorrow' | null {
  if (startsAt === null) {
    return null;
  }

  const days =
    (Date.parse(warsawDay.format(new Date(startsAt))) - Date.parse(warsawDay.format(now))) /
    86_400_000;

  return days === 0 ? 'today' : days === 1 ? 'tomorrow' : null;
}

/** "3 spots left" / "1 spot left" when 1–5 places remain, else null (no limit, plenty, or full). */
export function spotsLeftLabel(event: {
  currentParticipants: number | null;
  maximumParticipants: number | null;
}): string | null {
  if (event.maximumParticipants === null) {
    return null;
  }

  const left = event.maximumParticipants - (event.currentParticipants ?? 0);

  return left >= 1 && left <= 5 ? `${left} ${left === 1 ? 'spot' : 'spots'} left` : null;
}
