import { describe, expect, it } from 'vitest';
import { dayKey, groupByDay, upcomingFrom } from './event-day';

describe('event-day', () => {
  it('groups events by day in the site zone, keeping their order', () => {
    const groups = groupByDay(
      [
        { id: 'a', startsAt: '2026-11-02T09:00:00Z' },
        { id: 'b', startsAt: '2026-11-02T17:00:00Z' },
        // 00:30 on 9 Nov in Warsaw.
        { id: 'c', startsAt: '2026-11-08T23:30:00Z' },
      ],
      'Europe/Warsaw',
    );

    expect(groups.map((group) => group.dateKey)).toEqual(['2026-11-02', '2026-11-09']);
    expect(groups[0].events.map((event) => event.id)).toEqual(['a', 'b']);
    expect(groups[1].date).toEqual(new Date(2026, 10, 9));
    expect(groupByDay([], 'Europe/Warsaw')).toEqual([]);
  });

  it('starts the upcoming list at midnight (site zone) after the selected day, never in the past', () => {
    const now = new Date('2026-11-06T18:30:00Z');
    const waw = 'Europe/Warsaw';

    expect(upcomingFrom('2026-11-12', waw, now)).toEqual(new Date('2026-11-12T23:00:00Z'));
    expect(upcomingFrom('2026-11-06', waw, now)).toEqual(new Date('2026-11-06T23:00:00Z'));
    expect(upcomingFrom('2026-11-02', waw, now)).toEqual(now);
    expect(upcomingFrom('2026-12-31', waw, now)).toEqual(new Date('2026-12-31T23:00:00Z'));
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
