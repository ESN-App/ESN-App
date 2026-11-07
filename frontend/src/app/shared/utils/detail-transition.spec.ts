import { describe, expect, it } from 'vitest';
import { detailDirection } from './detail-transition';

describe('detailDirection', () => {
  it('goes forward from a list (or home) to a details page', () => {
    expect(detailDirection('events', 'events/party-1', false)).toBe('forward');
    expect(detailDirection('', 'news/42', false)).toBe('forward');
    expect(detailDirection('', 'events/party-1', false)).toBe('forward');
  });

  it('goes back from a details page to its list', () => {
    expect(detailDirection('partners/pueblo-7', 'partners', false)).toBe('back');
    expect(detailDirection('news/42', '', false)).toBe('back');
  });

  it('goes back on browser back to any non-details page', () => {
    expect(detailDirection('events/party-1', '', true)).toBe('back');
  });

  it('keeps the cross-fade for tab switches and details-to-details', () => {
    expect(detailDirection('events', 'partners', false)).toBeNull();
    expect(detailDirection('', 'events', false)).toBeNull();
    expect(detailDirection('events/party-1', 'partners', false)).toBeNull();
    expect(detailDirection('events/a', 'events/b', true)).toBeNull();
    expect(detailDirection('admin', 'admin/events/new', false)).toBeNull();
  });
});
