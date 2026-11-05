const WORDS_PER_MINUTE = 200;

/** Estimated reading time in whole minutes (at least 1) for an article body. */
export function readMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
