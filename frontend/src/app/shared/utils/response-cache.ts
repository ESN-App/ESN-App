import { catchError, concat, defer, EMPTY, filter, Observable, of, tap, throwError } from 'rxjs';

/**
 * Stale-while-revalidate cache for GET responses, so a details page opened from a list (and
 * the list on Back) renders in the same frame and the route transition can morph the image.
 * shortcut: in memory, unbounded, until reload; add eviction if keys start to grow with
 * user input (e.g. per search term).
 */
export class ResponseCache {
  private readonly values = new Map<string, unknown>();

  /**
   * Emits the cached value (else `seed`) synchronously, then the fresh response when it
   * differs. A failed refresh is ignored while a cached value is shown; with only a seed
   * (e.g. the item was deleted meanwhile) or nothing shown, the error is passed on.
   */
  get<T>(key: string, request: Observable<T>, seed?: T): Observable<T> {
    return defer(() => {
      const cached = this.values.has(key);
      const shown = cached ? (this.values.get(key) as T) : seed;
      const fresh = request.pipe(
        tap((value) => this.values.set(key, value)),
        filter((value) => shown === undefined || JSON.stringify(value) !== JSON.stringify(shown)),
        catchError((error: unknown) => (cached ? EMPTY : throwError(() => error))),
      );
      return shown === undefined ? fresh : concat(of(shown), fresh);
    });
  }
}
