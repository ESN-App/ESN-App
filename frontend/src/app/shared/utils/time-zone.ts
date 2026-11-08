/** Used until (and whenever) the site setting can't be loaded. */
export const DEFAULT_TIME_ZONE = 'Europe/Warsaw';

export interface ZonedParts {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** "Sunday" */
  weekday: string;
  /** "November" */
  monthName: string;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let result = formatters.get(timeZone);
  if (!result) {
    result = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, result);
  }
  return result;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** True for an IANA id the browser knows (e.g. "Europe/Warsaw"). */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value === '') {
    return false;
  }
  try {
    formatter(value);
    return true;
  } catch {
    return false;
  }
}

/** The wall-clock fields of an instant in `timeZone`. */
export function zonedParts(instant: Date | string | number, timeZone: string): ZonedParts {
  const parts: Record<string, string> = {};
  for (const part of formatter(timeZone).formatToParts(new Date(instant))) {
    parts[part.type] = part.value;
  }
  return {
    year: Number(parts['year']),
    month: MONTHS.indexOf(parts['month']) + 1,
    day: Number(parts['day']),
    hour: Number(parts['hour']),
    minute: Number(parts['minute']),
    second: Number(parts['second']),
    weekday: parts['weekday'],
    monthName: parts['month'],
  };
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** Calendar day of the instant in `timeZone`, as YYYY-MM-DD. */
export function zonedDayKey(instant: Date | string | number, timeZone: string): string {
  const { year, month, day } = zonedParts(instant, timeZone);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * The calendar day of the instant in `timeZone` as a device-local midnight Date, for
 * calendar code (strips, month grids, MatCalendar) that does local date arithmetic.
 */
export function zonedCalendarDate(instant: Date | string | number, timeZone: string): Date {
  const { year, month, day } = zonedParts(instant, timeZone);
  return new Date(year, month - 1, day);
}

/** UTC offset of `timeZone` at the instant, in minutes (Warsaw in winter: 60). */
export function utcOffsetMinutes(instant: Date | string | number, timeZone: string): number {
  const time = Math.floor(new Date(instant).getTime() / 1000) * 1000;
  const p = zonedParts(time, timeZone);
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - time) / 60_000;
}

/** "UTC+01:00", "UTC-05:00", "UTC+05:30" */
export function utcOffsetLabel(timeZone: string, instant: Date | string | number = new Date()): string {
  const offset = utcOffsetMinutes(instant, timeZone);
  const abs = Math.abs(offset);
  return `UTC${offset < 0 ? '-' : '+'}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/**
 * The instant at which clocks in `timeZone` show the given wall-clock time (month 1–12).
 * A time that happens twice (clocks going back) gives the earlier instant; a time that is
 * skipped (clocks going forward) is moved forward by the gap, e.g. 02:30 becomes 03:30.
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const dayMs = 86_400_000;
  // Assumes at most one offset change within a day of the given time (true for every IANA zone).
  const before = wall - utcOffsetMinutes(wall - dayMs, timeZone) * 60_000;
  const after = wall - utcOffsetMinutes(wall + dayMs, timeZone) * 60_000;
  const matches = [before, after].filter(
    (candidate) => candidate + utcOffsetMinutes(candidate, timeZone) * 60_000 === wall,
  );
  // No match = skipped time: the pre-change offset lands the gap's length later.
  return new Date(matches.length ? Math.min(...matches) : before);
}

/** Midnight in `timeZone` on the calendar day of a device-local Date (see zonedCalendarDate). */
export function zonedMidnight(calendarDate: Date, timeZone: string): Date {
  return zonedTimeToUtc(calendarDate.getFullYear(), calendarDate.getMonth() + 1, calendarDate.getDate(), 0, 0, timeZone);
}

const TOKENS = /EEEE|EEE|MMMM|MMM|yyyy|y|d|HH|mm/g;

/**
 * Formats like Angular's DatePipe (en-US) for the tokens the app uses
 * (EEEE EEE d MMMM MMM y yyyy HH mm), but in an IANA zone, so DST is handled.
 */
export function formatInZone(
  value: Date | string | number | null | undefined,
  format: string,
  timeZone: string,
): string {
  if (value === null || value === undefined || value === '' || Number.isNaN(new Date(value).getTime())) {
    return '';
  }
  const p = zonedParts(value, timeZone);
  const fields: Record<string, string> = {
    EEEE: p.weekday,
    // en-US short names are the first three letters of the long ones ("Sep", "Thu").
    EEE: p.weekday.slice(0, 3),
    MMMM: p.monthName,
    MMM: p.monthName.slice(0, 3),
    yyyy: String(p.year),
    y: String(p.year),
    d: String(p.day),
    HH: pad(p.hour),
    mm: pad(p.minute),
  };
  return format.replace(TOKENS, (token) => fields[token]);
}
