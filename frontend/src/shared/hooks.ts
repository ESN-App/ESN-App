import { useEffect, useRef, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading'; data: null }
  | { status: 'loaded'; data: T }
  | { status: 'error'; data: null };

/**
 * Runs `load` whenever `deps` change and tracks loading/loaded/error. Stale responses
 * (from a previous deps value) are ignored, like RxJS switchMap.
 */
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading', data: null });
  const [prevDeps, setPrevDeps] = useState(deps);

  // Reset to loading during render when deps change (React's "adjust state on prop change" pattern).
  if (prevDeps.length !== deps.length || prevDeps.some((value, index) => !Object.is(value, deps[index]))) {
    setPrevDeps(deps);
    setState({ status: 'loading', data: null });
  }

  useEffect(() => {
    let active = true;
    load().then(
      (data) => active && setState({ status: 'loaded', data }),
      () => active && setState({ status: 'error', data: null }),
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

/** Calls `handler` on Escape while `enabled` is true. */
export function useEscapeKey(handler: () => void, enabled = true): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handlerRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}

/** Tracks a media query, like the CDK BreakpointObserver. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}
