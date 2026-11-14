export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string | Date;
  endsAt: string | Date | null;
  /** Absolute link to the event page. */
  url: string;
}

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;
const MAX_DETAILS = 300;

/** `YYYYMMDDTHHMMSSZ` in UTC. */
function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function range(event: CalendarEvent): [Date, Date] {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);

  return [start, end];
}

function shortDescription(event: CalendarEvent): string {
  const text = event.description.trim();
  const short = text.length > MAX_DETAILS ? `${text.slice(0, MAX_DETAILS).trimEnd()}…` : text;

  return short ? `${short}\n\n${event.url}` : event.url;
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const [start, end] = range(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${utcStamp(start)}/${utcStamp(end)}`,
    details: shortDescription(event),
    location: event.location,
  });

  // URLSearchParams encodes spaces as '+', which Google Calendar also accepts.
  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Folds a content line at 75 octets (RFC 5545 3.1) without splitting a UTF-8 character. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let size = 0;
  let limit = 75;

  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > limit) {
      parts.push(current);
      current = '';
      size = 0;
      limit = 74; // continuation lines start with a space
    }
    current += char;
    size += bytes;
  }
  parts.push(current);

  return parts.join('\r\n ');
}

export function buildIcs(event: CalendarEvent, now = new Date()): string {
  const [start, end] = range(event);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ESN Gdansk//App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@esngdansk`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DESCRIPTION:${escapeText(shortDescription(event))}`,
    `URL:${event.url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.map(foldLine).join('\r\n') + '\r\n';
}
