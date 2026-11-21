import { NavigationError } from '@angular/router';

const CHUNK_ERROR =
  /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i;
const GUARD_KEY = 'chunk-reload';
const GUARD_MS = 10_000;

/**
 * A lazy chunk of an older build no longer exists after a redeploy: load the target URL
 * fully (once per URL within 10 s, so a genuinely broken deploy cannot loop).
 * Returns true when it reloaded.
 */
export function reloadOnChunkError(
  event: Pick<NavigationError, 'error' | 'url'>,
  reload: (url: string) => void = (url) => location.assign(url),
): boolean {
  const message = String((event.error as Error | undefined)?.message ?? event.error);
  if (!CHUNK_ERROR.test(message)) return false;
  try {
    const last = JSON.parse(sessionStorage.getItem(GUARD_KEY) ?? 'null') as {
      url: string;
      at: number;
    } | null;
    if (last?.url === event.url && Date.now() - last.at < GUARD_MS) return false;
    sessionStorage.setItem(GUARD_KEY, JSON.stringify({ url: event.url, at: Date.now() }));
  } catch {
    // Storage unavailable: reload anyway (worst case one extra load).
  }
  reload(event.url);
  return true;
}
