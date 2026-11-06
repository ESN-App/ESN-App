import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryInterceptor } from './retry.interceptor';

describe('retryInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([retryInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.useRealTimers();
  });

  it('retries a GET on 503 and then succeeds', () => {
    let result: unknown;
    http.get('/api/events').subscribe((body) => (result = body));

    controller.expectOne('/api/events').flush(null, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(1000);
    controller.expectOne('/api/events').flush(null, { status: 502, statusText: 'Bad Gateway' });
    vi.advanceTimersByTime(2000);
    controller.expectOne('/api/events').flush([{ id: 1 }]);

    expect(result).toEqual([{ id: 1 }]);
  });

  it('does not retry a POST', () => {
    let status: number | undefined;
    http.post('/api/auth/login', {}).subscribe({ error: (e) => (status = e.status) });

    controller.expectOne('/api/auth/login').flush(null, { status: 503, statusText: 'Unavailable' });
    vi.advanceTimersByTime(60_000);
    controller.expectNone('/api/auth/login');

    expect(status).toBe(503);
  });

  it('does not retry a 404', () => {
    let status: number | undefined;
    http.get('/api/events/x').subscribe({ error: (e) => (status = e.status) });

    controller.expectOne('/api/events/x').flush(null, { status: 404, statusText: 'Not Found' });
    vi.advanceTimersByTime(60_000);
    controller.expectNone('/api/events/x');

    expect(status).toBe(404);
  });
});
