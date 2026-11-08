import { Observable, Subject, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ResponseCache } from './response-cache';

function collect<T>(cache: ResponseCache, key: string, request: Observable<T>, seed?: T) {
  const values: T[] = [];
  const errors: unknown[] = [];
  cache.get(key, request, seed).subscribe({
    next: (value) => values.push(value),
    error: (error: unknown) => errors.push(error),
  });
  return { values, errors };
}

describe('ResponseCache', () => {
  it('fetches on a miss, then serves the cached value synchronously and refreshes', () => {
    const cache = new ResponseCache();
    expect(collect(cache, 'a', of([1])).values).toEqual([[1]]);

    const refresh = new Subject<number[]>();
    const second = collect(cache, 'a', refresh);
    expect(second.values).toEqual([[1]]);
    refresh.next([1, 2]);
    expect(second.values).toEqual([[1], [1, 2]]);
    expect(collect(cache, 'a', new Subject<number[]>()).values).toEqual([[1, 2]]);
  });

  it('skips a refresh equal to what is shown', () => {
    const cache = new ResponseCache();
    collect(cache, 'a', of({ id: 1 }));
    expect(collect(cache, 'a', of({ id: 1 })).values).toEqual([{ id: 1 }]);
  });

  it('shows the seed first, then the full response', () => {
    const cache = new ResponseCache();
    const { values } = collect(cache, 'item', of({ id: 1, full: true }), { id: 1, full: false });
    expect(values).toEqual([
      { id: 1, full: false },
      { id: 1, full: true },
    ]);
  });

  it('keeps the cached value when the refresh fails, but passes errors on otherwise', () => {
    const cache = new ResponseCache();
    expect(collect(cache, 'a', throwError(() => 'down')).errors).toEqual(['down']);
    expect(collect(cache, 'b', throwError(() => 'gone'), 'seed')).toEqual({
      values: ['seed'],
      errors: ['gone'],
    });

    collect(cache, 'c', of('ok'));
    expect(collect(cache, 'c', throwError(() => 'down'))).toEqual({ values: ['ok'], errors: [] });
  });
});
