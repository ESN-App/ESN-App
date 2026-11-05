import { describe, expect, it } from 'vitest';
import { discountLabel, discountParts, initials } from './partner-offer';

describe('discountParts', () => {
  it('splits a percentage into value and "off"', () => {
    expect(discountParts('20 %')).toEqual({ main: '20%', sub: 'off' });
  });

  it('keeps other values whole', () => {
    expect(discountParts('2 for 1')).toEqual({ main: '2 for 1', sub: '' });
  });

  it('returns null for empty values', () => {
    expect(discountParts('  ')).toBeNull();
    expect(discountParts(null)).toBeNull();
  });
});

describe('discountLabel', () => {
  it('formats a single line', () => {
    expect(discountLabel('15%')).toBe('15% off');
    expect(discountLabel('2 for 1')).toBe('2 for 1');
    expect(discountLabel(undefined)).toBeNull();
  });
});

describe('initials', () => {
  it('takes the first letters of up to two words', () => {
    expect(initials('pueblo burrito mexicano')).toBe('PB');
    expect(initials('Climb')).toBe('C');
  });
});
