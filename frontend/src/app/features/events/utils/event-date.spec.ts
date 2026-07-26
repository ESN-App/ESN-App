import { describe, expect, it } from 'vitest';
import { isSameCalendarDay } from './event-date';

describe('isSameCalendarDay', () => {
  it('returns true for times on the same calendar day', () => {
    expect(isSameCalendarDay('2026-07-12T08:00:00', '2026-07-12T20:00:00')).toBe(true);
  });

  it('returns false for different calendar days', () => {
    expect(isSameCalendarDay('2026-07-12T23:00:00', '2026-07-13T01:00:00')).toBe(false);
  });
});
