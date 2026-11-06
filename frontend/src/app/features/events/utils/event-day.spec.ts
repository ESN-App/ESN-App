import { describe, expect, it } from 'vitest';
import { dayKey, groupByDay, upcomingFrom } from './event-day';

describe('event-day', () => {
  it('groups events by local day, keeping their order', () => {
    const at = (day: number, hour: number) => new Date(2026, 10, day, hour).toISOString();
    const groups = groupByDay([
      { id: 'a', startsAt: at(2, 10) },
      { id: 'b', startsAt: at(2, 18) },
      { id: 'c', startsAt: at(5, 9) },
    ]);

    expect(groups.map((group) => group.dateKey)).toEqual(['2026-11-02', '2026-11-05']);
    expect(groups[0].events.map((event) => event.id)).toEqual(['a', 'b']);
    expect(groupByDay([])).toEqual([]);
  });

  it('starts the upcoming list the day after the selected day, never in the past', () => {
    const now = new Date(2026, 10, 6, 19, 30);

    expect(upcomingFrom('2026-11-12', now)).toEqual(new Date(2026, 10, 13));
    expect(upcomingFrom('2026-11-06', now)).toEqual(new Date(2026, 10, 7));
    expect(upcomingFrom('2026-11-02', now)).toEqual(now);
    expect(upcomingFrom('2026-12-31', now)).toEqual(new Date(2027, 0, 1));
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
