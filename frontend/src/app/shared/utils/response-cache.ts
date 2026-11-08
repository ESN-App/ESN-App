import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, concat, defer, EMPTY, filter, Observable, of, tap, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';

/**
 * Stale-while-revalidate cache for GET responses, so a details page opened from a list (and
 * the list on Back) renders in the same frame and the route transition can morph the image.
 * Entries are per role and dropped whenever the session token changes (login, logout,
 * another account), so a visitor never sees data an administrator loaded.
 * shortcut: in memory, unbounded, until reload; add eviction if keys start to grow with
 * user input (e.g. per search term).
 */
@Injectable({ providedIn: 'root' })
export class ResponseCache {
  private readonly auth = inject(AuthService);
  private readonly values = new Map<string, unknown>();
  private sessionToken: string | null = this.auth.token;

  /** Stores a value that later seeds `get` (e.g. a listed item for its details page). */
  remember(key: string, value: unknown): void {
    this.entries().set(this.scoped(key), value);
  }

  /**
   * Emits the cached value (else the remembered `seedKey` value, through `fromSeed`)
   * synchronously, then the fresh response when it differs. On 404/410 the entry and its
   * seed are dropped and the error is passed on ("not found"); other failures keep showing
   * a cached value, and are passed on when only a seed or nothing was shown.
   */
  get<T, S = T>(
    key: string,
    request: Observable<T>,
    seedKey?: string,
    fromSeed: (seed: S) => T = (seed) => seed as unknown as T,
  ): Observable<T> {
    return defer(() => {
      const values = this.entries();
      const scopedKey = this.scoped(key);
      const scopedSeedKey = seedKey === undefined ? undefined : this.scoped(seedKey);
      const cached = values.has(scopedKey);
      const seed = scopedSeedKey === undefined ? undefined : (values.get(scopedSeedKey) as S);
      const shown = cached
        ? (values.get(scopedKey) as T)
        : seed === undefined
          ? undefined
          : fromSeed(seed);
      const fresh = request.pipe(
        tap((value) => values.set(scopedKey, value)),
        filter((value) => shown === undefined || JSON.stringify(value) !== JSON.stringify(shown)),
        catchError((error: unknown) => {
          const gone =
            error instanceof HttpErrorResponse && (error.status === 404 || error.status === 410);
          if (gone) {
            values.delete(scopedKey);
            if (scopedSeedKey !== undefined) {
              values.delete(scopedSeedKey);
            }
          }
          return cached && !gone ? EMPTY : throwError(() => error);
        }),
      );
      return shown === undefined ? fresh : concat(of(shown), fresh);
    });
  }

  private scoped(key: string): string {
    return `${this.auth.isAdmin() ? 'admin' : 'public'}|${key}`;
  }

  // Checked on every use rather than in an effect, so no request can run in between.
  private entries(): Map<string, unknown> {
    if (this.auth.token !== this.sessionToken) {
      this.values.clear();
      this.sessionToken = this.auth.token;
    }
    return this.values;
  }
}
