import { describe, expect, it } from 'vitest';
import { createEventSlug, extractEventId } from './event-url';

describe('event URL helpers', () => {
  const id = '019f9efd-1fe2-7d9f-9742-b2bae9e64ef5';

  it('creates a readable collision-free hybrid slug', () => {
    expect(createEventSlug('Welcome Week Opening', id)).toBe(
      `welcome-week-opening-${id}`,
    );
  });

  it('normalizes spaces, punctuation, and Polish characters', () => {
    expect(createEventSlug('  Łódź & Friends!  ', id)).toBe(`lodz-friends-${id}`);
  });

  it('extracts the GUID from hybrid and legacy URL segments', () => {
    expect(extractEventId(`welcome-week-opening-${id}`)).toBe(id);
    expect(extractEventId(id)).toBe(id);
  });

  it('rejects a segment without a complete GUID', () => {
    expect(extractEventId('welcome-week-opening-019f9efd')).toBeNull();
  });
});
