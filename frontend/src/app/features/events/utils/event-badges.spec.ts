import { describe, expect, it } from 'vitest';
import { relativeEventDay, spotsLeftLabel } from './event-badges';

describe('relativeEventDay', () => {
  // 23:30 Warsaw on 7 Nov 2026 (UTC+1).
  const now = new Date('2026-11-07T22:30:00Z');

  it('returns today for a later time on the same Warsaw day', () => {
    expect(relativeEventDay('2026-11-07T23:59:00+01:00', now)).toBe('today');
    expect(relativeEventDay('2026-11-07T00:00:00+01:00', now)).toBe('today');
  });

  it('switches to tomorrow at Warsaw midnight, not UTC midnight', () => {
    // 00:30 Warsaw on 8 Nov, stored as UTC the previous day.
    expect(relativeEventDay('2026-11-07T23:30:00Z', now)).toBe('tomorrow');
    expect(relativeEventDay('2026-11-08T23:59:00+01:00', now)).toBe('tomorrow');
  });

  it('returns null for other days and undated events', () => {
    expect(relativeEventDay('2026-11-09T00:00:00+01:00', now)).toBeNull();
    expect(relativeEventDay('2026-11-06T20:00:00+01:00', now)).toBeNull();
    expect(relativeEventDay(null, now)).toBeNull();
  });

  it('handles the DST change (CEST to CET on 25 Oct 2026)', () => {
    // 23:30 Warsaw on 24 Oct (UTC+2); event at 00:30 Warsaw on 25 Oct, still UTC+2.
    const beforeDst = new Date('2026-10-24T21:30:00Z');

    expect(relativeEventDay('2026-10-24T22:30:00Z', beforeDst)).toBe('tomorrow');
    // 23:30 UTC on 25 Oct is 00:30 Warsaw on 26 Oct (UTC+1 after the change).
    expect(relativeEventDay('2026-10-25T23:30:00Z', beforeDst)).toBeNull();
    expect(relativeEventDay('2026-10-25T22:30:00Z', beforeDst)).toBe('tomorrow');
  });
});

describe('spotsLeftLabel', () => {
  const spots = (current: number | null, max: number | null) =>
    spotsLeftLabel({ currentParticipants: current, maximumParticipants: max });

  it('shows 1 to 5 free spots with singular and plural', () => {
    expect(spots(19, 20)).toBe('1 spot left');
    expect(spots(17, 20)).toBe('3 spots left');
    expect(spots(15, 20)).toBe('5 spots left');
  });

  it('hides when full, plenty left, no limit or unknown registrations', () => {
    expect(spots(20, 20)).toBeNull();
    expect(spots(14, 20)).toBeNull();
    expect(spots(5, null)).toBeNull();
    expect(spots(null, 3)).toBeNull();
  });
});
