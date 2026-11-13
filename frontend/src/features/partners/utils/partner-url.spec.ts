import { describe, expect, it } from 'vitest';
import { createPartnerSlug } from './partner-url';

describe('partner URL utilities', () => {
  it('creates a readable slug using only the partner name', () => {
    expect(createPartnerSlug('Motława Kayaks')).toBe('motlawa-kayaks');
  });

  it('normalizes whitespace and punctuation', () => {
    expect(createPartnerSlug('  Baltic  Bites! ')).toBe('baltic-bites');
  });

  it('uses a fallback for a name without URL-safe characters', () => {
    expect(createPartnerSlug('---')).toBe('partner');
  });
});
