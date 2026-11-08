import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../../core/auth.service';
import { ResponseCache } from './response-cache';

const session = signal<{ token: string | null; admin: boolean }>({ token: null, admin: false });

function collect<T>(
  cache: ResponseCache,
  key: string,
  request: Observable<T>,
  seedKey?: string,
): { values: T[]; errors: unknown[] } {
  const values: T[] = [];
  const errors: unknown[] = [];
  cache.get(key, request, seedKey).subscribe({
    next: (value) => values.push(value),
    error: (error: unknown) => errors.push(error),
  });
  return { values, errors };
}

const notFound = () => throwError(() => new HttpErrorResponse({ status: 404 }));
const serverDown = () => throwError(() => new HttpErrorResponse({ status: 503 }));

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    session.set({ token: null, admin: false });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            get token() {
              return session().token;
            },
            isAdmin: () => session().admin,
          },
        },
      ],
    });
    cache = TestBed.inject(ResponseCache);
  });

  it('fetches on a miss, then serves the cached value synchronously and refreshes', () => {
    expect(collect(cache, 'a', of([1])).values).toEqual([[1]]);

    const refresh = new Subject<number[]>();
    const second = collect(cache, 'a', refresh);
    expect(second.values).toEqual([[1]]);
    refresh.next([1, 2]);
    expect(second.values).toEqual([[1], [1, 2]]);
    expect(collect(cache, 'a', new Subject<number[]>()).values).toEqual([[1, 2]]);
  });

  it('skips a refresh equal to what is shown', () => {
    collect(cache, 'a', of({ id: 1 }));
    expect(collect(cache, 'a', of({ id: 1 })).values).toEqual([{ id: 1 }]);
  });

  it('shows a remembered seed first, then the full response', () => {
    cache.remember('item:1', { id: 1, full: false });
    expect(collect(cache, 'item', of({ id: 1, full: true }), 'item:1').values).toEqual([
      { id: 1, full: false },
      { id: 1, full: true },
    ]);
  });

  it('keeps the cached value on a network or server error', () => {
    collect(cache, 'c', of('ok'));
    expect(collect(cache, 'c', serverDown())).toEqual({ values: ['ok'], errors: [] });
    expect(collect(cache, 'd', serverDown()).errors).toHaveLength(1);
  });

  it('drops the entry and its seed on 404 and reports it, so the page shows "not found"', () => {
    cache.remember('item:1', 'seed');
    collect(cache, 'item', of('cached'));
    const gone = collect(cache, 'item', notFound(), 'item:1');
    expect(gone.values).toEqual(['cached']);
    expect(gone.errors).toHaveLength(1);

    const next = new Subject<string>();
    expect(collect(cache, 'item', next, 'item:1').values).toEqual([]);
  });

  it('never returns an item an administrator loaded after logout', () => {
    session.set({ token: 'admin-token', admin: true });
    cache.remember('news:1', { id: 1, status: 'draft' });
    collect(cache, 'list', of(['draft']));

    session.set({ token: null, admin: false });
    expect(collect(cache, 'news', new Subject(), 'news:1').values).toEqual([]);
    expect(collect(cache, 'list', new Subject()).values).toEqual([]);
  });

  it('keeps administrator and visitor entries apart within a session', () => {
    session.set({ token: 't', admin: true });
    collect(cache, 'list', of(['admin']));
    session.set({ token: 't', admin: false });
    expect(collect(cache, 'list', new Subject()).values).toEqual([]);
  });
});
