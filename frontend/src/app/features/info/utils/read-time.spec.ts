import { describe, expect, it } from 'vitest';
import { readMinutes } from './read-time';

describe('readMinutes', () => {
  it('rounds to whole minutes at 200 words per minute', () => {
    expect(readMinutes(Array(900).fill('word').join(' '))).toBe(5);
  });

  it('never returns less than one minute', () => {
    expect(readMinutes('')).toBe(1);
    expect(readMinutes('short text')).toBe(1);
  });
});
