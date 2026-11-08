import { newsTileColour } from './news-tile-colour';

describe('newsTileColour', () => {
  it('returns the same section colour for the same id', () => {
    expect(newsTileColour('abc-123')).toBe(newsTileColour('abc-123'));
  });

  it('spreads ids over all three section colours', () => {
    const colours = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map(newsTileColour));
    expect(colours).toEqual(new Set(['var(--c-cyan)', 'var(--c-orange)', 'var(--c-green)']));
  });
});
