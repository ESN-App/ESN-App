import { describe, expect, it } from 'vitest';
import { buildIcs, foldLine, googleCalendarUrl, type CalendarEvent } from './add-to-calendar';

const event: CalendarEvent = {
  id: 'abc',
  title: 'Pub; quiz, night',
  description: 'Line1\nLine2 \\ end',
  location: 'Gdansk',
  // 20:00-22:00 in Warsaw summer time (UTC+2).
  startsAt: '2026-07-12T20:00:00+02:00',
  endsAt: '2026-07-12T22:00:00+02:00',
  url: 'https://app.test/events/pub-quiz-abc',
};

describe('buildIcs', () => {
  const ics = buildIcs(event, new Date('2026-07-01T10:00:00Z'));

  it('converts Warsaw DST times to UTC with CRLF endings', () => {
    expect(ics).toContain('\r\nDTSTART:20260712T180000Z\r\n');
    expect(ics).toContain('\r\nDTEND:20260712T200000Z\r\n');
    expect(ics).toContain('\r\nDTSTAMP:20260701T100000Z\r\n');
    expect(ics).toContain('UID:abc@esngdansk');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('escapes backslash, semicolon, comma and newline', () => {
    expect(ics).toContain('SUMMARY:Pub\\; quiz\\, night');
    expect(ics).toContain('Line1\\nLine2 \\\\ end');
  });

  it('defaults to a 2 hour duration without an end time', () => {
    const open = buildIcs({ ...event, endsAt: null });

    expect(open).toContain('DTEND:20260712T200000Z');
  });
});

describe('foldLine', () => {
  it('folds at 75 octets and never splits a multibyte character', () => {
    const folded = foldLine('X:' + 'ł'.repeat(100));

    for (const part of folded.split('\r\n')) {
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(folded.split('\r\n').slice(1).every((p) => p.startsWith(' '))).toBe(true);
    expect(folded.replace(/\r\n /g, '')).toBe('X:' + 'ł'.repeat(100));
  });
});

describe('googleCalendarUrl', () => {
  it('carries encoded title, UTC dates, details and location', () => {
    const url = new URL(googleCalendarUrl(event));

    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Pub; quiz, night');
    expect(url.searchParams.get('dates')).toBe('20260712T180000Z/20260712T200000Z');
    expect(url.searchParams.get('details')).toContain(event.url);
    expect(url.searchParams.get('location')).toBe('Gdansk');
  });
});
