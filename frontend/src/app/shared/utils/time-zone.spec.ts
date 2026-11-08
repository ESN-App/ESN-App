import { describe, expect, it } from 'vitest';
import {
  formatInZone,
  isTimeZone,
  utcOffsetLabel,
  zonedCalendarDate,
  zonedDayKey,
  zonedMidnight,
  zonedTimeToUtc,
} from './time-zone';

const iso = (date: Date) => date.toISOString();

describe('zonedTimeToUtc', () => {
  it('converts Warsaw wall-clock time in winter (UTC+1) and summer (UTC+2)', () => {
    expect(iso(zonedTimeToUtc(2026, 11, 8, 18, 0, 'Europe/Warsaw'))).toBe('2026-11-08T17:00:00.000Z');
    expect(iso(zonedTimeToUtc(2026, 7, 1, 18, 0, 'Europe/Warsaw'))).toBe('2026-07-01T16:00:00.000Z');
  });

  it('handles midnight and day/year boundaries', () => {
    expect(iso(zonedTimeToUtc(2026, 11, 9, 0, 30, 'Europe/Warsaw'))).toBe('2026-11-08T23:30:00.000Z');
    expect(iso(zonedTimeToUtc(2027, 1, 1, 0, 0, 'Europe/Warsaw'))).toBe('2026-12-31T23:00:00.000Z');
    expect(iso(zonedTimeToUtc(2026, 12, 31, 23, 0, 'America/New_York'))).toBe('2027-01-01T04:00:00.000Z');
  });

  it('picks the earlier instant for a time that happens twice (25 Oct 2026, 02:30)', () => {
    expect(iso(zonedTimeToUtc(2026, 10, 25, 2, 30, 'Europe/Warsaw'))).toBe('2026-10-25T00:30:00.000Z');
    // Either side of the repeated hour is unambiguous.
    expect(iso(zonedTimeToUtc(2026, 10, 25, 1, 59, 'Europe/Warsaw'))).toBe('2026-10-24T23:59:00.000Z');
    expect(iso(zonedTimeToUtc(2026, 10, 25, 3, 0, 'Europe/Warsaw'))).toBe('2026-10-25T02:00:00.000Z');
  });

  it('moves a skipped time forward (29 Mar 2026, 02:30 becomes 03:30)', () => {
    expect(iso(zonedTimeToUtc(2026, 3, 29, 2, 30, 'Europe/Warsaw'))).toBe('2026-03-29T01:30:00.000Z');
    expect(iso(zonedTimeToUtc(2026, 3, 29, 2, 0, 'Europe/Warsaw'))).toBe('2026-03-29T01:00:00.000Z');
    expect(iso(zonedTimeToUtc(2026, 3, 29, 3, 0, 'Europe/Warsaw'))).toBe('2026-03-29T01:00:00.000Z');
    expect(iso(zonedTimeToUtc(2026, 3, 29, 1, 59, 'Europe/Warsaw'))).toBe('2026-03-29T00:59:00.000Z');
  });

  it('handles US DST, UTC and half-hour offsets', () => {
    expect(iso(zonedTimeToUtc(2026, 3, 8, 2, 30, 'America/New_York'))).toBe('2026-03-08T07:30:00.000Z');
    expect(iso(zonedTimeToUtc(2026, 11, 1, 1, 30, 'America/New_York'))).toBe('2026-11-01T05:30:00.000Z');
    expect(iso(zonedTimeToUtc(2026, 11, 8, 18, 0, 'UTC'))).toBe('2026-11-08T18:00:00.000Z');
    expect(iso(zonedTimeToUtc(2026, 11, 8, 18, 0, 'Asia/Kolkata'))).toBe('2026-11-08T12:30:00.000Z');
  });

  it('round-trips with zonedDayKey/formatInZone for every hour of a DST day', () => {
    for (let hour = 0; hour < 24; hour++) {
      if (hour === 2) continue; // skipped on 29 Mar
      const instant = zonedTimeToUtc(2026, 3, 29, hour, 15, 'Europe/Warsaw');
      expect(formatInZone(instant, 'd HH:mm', 'Europe/Warsaw')).toBe(`29 ${String(hour).padStart(2, '0')}:15`);
    }
  });
});

describe('zonedDayKey / zonedCalendarDate', () => {
  it('uses the zone, not UTC or the device', () => {
    expect(zonedDayKey('2026-11-08T23:30:00Z', 'Europe/Warsaw')).toBe('2026-11-09');
    expect(zonedDayKey('2026-11-08T23:30:00Z', 'Europe/London')).toBe('2026-11-08');
    expect(zonedDayKey('2026-11-09T03:00:00Z', 'America/New_York')).toBe('2026-11-08');
    const date = zonedCalendarDate('2026-11-08T23:30:00Z', 'Europe/Warsaw');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 9, 0]);
  });
});

describe('zonedMidnight', () => {
  it('is midnight in the zone on the local calendar day', () => {
    expect(iso(zonedMidnight(new Date(2026, 10, 9), 'Europe/Warsaw'))).toBe('2026-11-08T23:00:00.000Z');
    expect(iso(zonedMidnight(new Date(2026, 6, 1), 'America/New_York'))).toBe('2026-07-01T04:00:00.000Z');
  });
});

describe('formatInZone', () => {
  const instant = '2026-11-08T23:30:00Z';

  it('formats the tokens the templates use, in the zone', () => {
    expect(formatInZone(instant, 'EEE d MMM, HH:mm', 'Europe/Warsaw')).toBe('Mon 9 Nov, 00:30');
    expect(formatInZone(instant, 'EEE d MMM, HH:mm', 'Europe/London')).toBe('Sun 8 Nov, 23:30');
    expect(formatInZone(instant, 'EEEE, d MMMM yyyy', 'Europe/Warsaw')).toBe('Monday, 9 November 2026');
    expect(formatInZone(instant, 'd MMM y, HH:mm', 'America/New_York')).toBe('8 Nov 2026, 18:30');
    expect(formatInZone('2026-09-03T10:05:00Z', 'EEE d MMM HH:mm', 'UTC')).toBe('Thu 3 Sep 10:05');
  });

  it('shows midnight as 00, not 24', () => {
    expect(formatInZone('2026-11-08T23:00:00Z', 'HH:mm', 'Europe/Warsaw')).toBe('00:00');
  });

  it('returns an empty string for missing or invalid values', () => {
    expect(formatInZone(null, 'HH:mm', 'UTC')).toBe('');
    expect(formatInZone('', 'HH:mm', 'UTC')).toBe('');
    expect(formatInZone('nope', 'HH:mm', 'UTC')).toBe('');
  });
});

describe('isTimeZone / utcOffsetLabel', () => {
  it('accepts IANA ids only', () => {
    expect(isTimeZone('Europe/Warsaw')).toBe(true);
    expect(isTimeZone('Mars/Olympus')).toBe(false);
    expect(isTimeZone('')).toBe(false);
    expect(isTimeZone(42)).toBe(false);
  });

  it('labels the offset at the given instant', () => {
    expect(utcOffsetLabel('Europe/Warsaw', '2026-11-08T12:00:00Z')).toBe('UTC+01:00');
    expect(utcOffsetLabel('Europe/Warsaw', '2026-07-08T12:00:00Z')).toBe('UTC+02:00');
    expect(utcOffsetLabel('America/New_York', '2026-11-08T12:00:00Z')).toBe('UTC-05:00');
    expect(utcOffsetLabel('Asia/Kolkata', '2026-11-08T12:00:00Z')).toBe('UTC+05:30');
    expect(utcOffsetLabel('UTC', '2026-11-08T12:00:00Z')).toBe('UTC+00:00');
  });
});
