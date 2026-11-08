import { describe, expect, it } from 'vitest';
import { nextUpcoming, startOfWeek, weekDays } from './home-week';

describe('startOfWeek', () => {
  it('returns the Monday of the week', () => {
    expect(startOfWeek(new Date(2026, 2, 4, 15))).toEqual(new Date(2026, 2, 2));
  });

  it('treats Sunday as the last day of the week', () => {
    expect(startOfWeek(new Date(2026, 2, 8))).toEqual(new Date(2026, 2, 2));
  });
});

describe('weekDays', () => {
  it('lists Monday to Sunday and flags today and event days', () => {
    const days = weekDays(
      new Date(2026, 2, 4),
      [
        { startsAt: '2026-03-06T17:00:00Z', status: 1 },
        // 00:30 on Sunday 8 Mar in Warsaw.
        { startsAt: '2026-03-07T23:30:00Z', status: 1 },
      ],
      'Europe/Warsaw',
    );

    expect(days.map((day) => day.date.getDate())).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(days.filter((day) => day.isToday).map((day) => day.key)).toEqual(['2026-03-04']);
    expect(days.filter((day) => day.hasEvents).map((day) => day.key)).toEqual(['2026-03-06', '2026-03-08']);
  });

  it('crosses a month boundary', () => {
    const days = weekDays(new Date(2026, 3, 1), [], 'Europe/Warsaw');
    expect(days[0].key).toBe('2026-03-30');
    expect(days[6].key).toBe('2026-04-05');
  });
});

describe('nextUpcoming', () => {
  const now = new Date(2026, 2, 2, 12);

  it('picks the earliest future event that is not cancelled', () => {
    const events = [
      { id: 'past', startsAt: new Date(2026, 2, 1).toISOString(), status: 1 },
      { id: 'cancelled', startsAt: new Date(2026, 2, 2, 14).toISOString(), status: 2 },
      { id: 'later', startsAt: new Date(2026, 2, 5).toISOString(), status: 1 },
      { id: 'next', startsAt: new Date(2026, 2, 2, 18).toISOString(), status: 1 },
    ];

    expect(nextUpcoming(events, now)?.id).toBe('next');
  });

  it('returns null when nothing is coming up', () => {
    expect(nextUpcoming([], now)).toBeNull();
  });
});
