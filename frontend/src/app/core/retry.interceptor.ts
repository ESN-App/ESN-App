import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment';

// Statuses the hosting proxy returns while the sleeping API wakes up (status 0 = network error).
const RETRYABLE_STATUSES = new Set([0, 502, 503, 504]);

/** Retries API GETs with backoff (1s, 2s, 4s, 8s, 16s, 20s ≈ 51 s total) so cold starts don't show an error. */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || !req.url.startsWith(`${environment.apiBaseUrl}/api/`)) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: 6,
      delay: (error, retryCount) =>
        error instanceof HttpErrorResponse && RETRYABLE_STATUSES.has(error.status)
          ? timer(Math.min(1000 * 2 ** (retryCount - 1), 20_000))
          : throwError(() => error),
    }),
  );
};
