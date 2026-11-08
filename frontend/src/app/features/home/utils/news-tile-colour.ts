const TILE_COLOURS = ['var(--c-cyan)', 'var(--c-orange)', 'var(--c-green)'];

/**
 * Section colour for a news item's no-image tile, fixed per id so the carousel tile and
 * the details placeholder match during the list -> details morph.
 */
export function newsTileColour(id: string): string {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003;
  }
  return TILE_COLOURS[hash % TILE_COLOURS.length];
}
