import { describe, expect, it } from 'vitest';
import { hasEventEnded, isSameCalendarDay } from './event-date';

describe('isSameCalendarDay', () => {
  it('returns true for times on the same calendar day', () => {
    expect(isSameCalendarDay('2026-07-12T08:00:00', '2026-07-12T20:00:00')).toBe(true);
  });

  it('returns false for different calendar days', () => {
    expect(isSameCalendarDay('2026-07-12T23:00:00', '2026-07-13T01:00:00')).toBe(false);
  });
});

describe('hasEventEnded', () => {
  // 18:00 to 21:00 in Warsaw (UTC+1 in November).
  const event = { startsAt: '2026-11-05T18:00:00+01:00', endsAt: '2026-11-05T21:00:00+01:00', status: 1 };

  it('turns true exactly at the end time', () => {
    expect(hasEventEnded(event, new Date('2026-11-05T20:59:59+01:00'))).toBe(false);
    expect(hasEventEnded(event, new Date('2026-11-05T20:00:00Z'))).toBe(true);
  });

  it('uses the start time when there is no end time', () => {
    const noEnd = { ...event, endsAt: null };

    expect(hasEventEnded(noEnd, new Date('2026-11-05T17:59:00+01:00'))).toBe(false);
    expect(hasEventEnded(noEnd, new Date('2026-11-05T18:00:00+01:00'))).toBe(true);
  });

  it('never marks cancelled or undated events', () => {
    const later = new Date('2026-12-01T00:00:00Z');

    expect(hasEventEnded({ ...event, status: 2 }, later)).toBe(false);
    expect(hasEventEnded({ ...event, startsAt: null, endsAt: null }, later)).toBe(false);
  });
});
