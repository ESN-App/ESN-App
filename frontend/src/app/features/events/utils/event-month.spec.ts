import { describe, expect, it } from 'vitest';
import {
  closestAvailableMonth,
  monthFromKey,
  monthKey,
  monthRange,
  moveMonth,
  normalizeAvailableMonths,
  normalizeMonthKey,
} from './event-month';

describe('event month helpers', () => {
  it('formats and parses a month key', () => {
    const july = new Date(2026, 6, 1);

    expect(monthKey(july)).toBe('2026-07');
    expect(monthFromKey('2026-07')).toEqual(july);
  });

  it('falls back to the current month for invalid query values', () => {
    expect(normalizeMonthKey('not-a-month', new Date(2026, 7, 15))).toBe('2026-08');
  });

  it('moves across year boundaries', () => {
    expect(monthKey(moveMonth(new Date(2026, 11, 1), 1))).toBe('2027-01');
    expect(monthKey(moveMonth(new Date(2026, 0, 1), -1))).toBe('2025-12');
  });

  it('creates an exclusive range from midnight on the 1st in the site zone', () => {
    expect(monthRange(new Date(2026, 8, 1), 'UTC')).toEqual({
      from: '2026-09-01T00:00:00.000Z',
      to: '2026-10-01T00:00:00.000Z',
    });
    // CEST in October, CET in November.
    expect(monthRange(new Date(2026, 9, 1), 'Europe/Warsaw')).toEqual({
      from: '2026-09-30T22:00:00.000Z',
      to: '2026-10-31T23:00:00.000Z',
    });
    expect(monthRange(new Date(2026, 11, 1), 'Europe/Warsaw').to).toBe('2026-12-31T23:00:00.000Z');
  });

  it('normalizes months returned by the API', () => {
    expect(
      normalizeAvailableMonths(['2026-09', 'invalid', '2026-07', '2026-09']),
    ).toEqual(['2026-07', '2026-09']);
  });

  it('selects the closest month that contains events', () => {
    const available = ['2026-07', '2026-09'];

    expect(closestAvailableMonth('2026-08', available)).toBe('2026-07');
    expect(closestAvailableMonth('2026-10', available)).toBe('2026-09');
    expect(closestAvailableMonth('2026-06', available)).toBe('2026-07');
    expect(closestAvailableMonth('2026-07', available)).toBe('2026-07');
    expect(closestAvailableMonth('2026-07', [])).toBeNull();
  });
});
