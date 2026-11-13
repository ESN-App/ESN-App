import { authStore } from './auth-store';

/** Base URL for API calls. Empty in every environment: dev (Vite proxy) and prod (nginx) are same-origin. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Thrown for non-2xx responses. `error` holds the parsed response body, mirroring Angular's
 * HttpErrorResponse so callers can read `err.error?.error` / `err.error?.detail`.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly error: unknown,
  ) {
    super(`Request failed with status ${status}`);
  }
}

type QueryParams = Record<string, string | number | null | undefined>;

interface RequestOptions {
  params?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = `${API_BASE_URL}${path}`;
  if (!params) {
    return url;
  }

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  const token = authStore.token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    body,
    signal: options.signal,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new HttpError(response.status, payload);
  }

  return payload as T;
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};

/** Reads the most useful message from an API error, falling back to `fallback`. */
export function errorMessage(error: unknown, fallback: string, includeDetail = true): string {
  const body = error instanceof HttpError ? (error.error as Record<string, unknown> | null) : null;
  const detail = includeDetail && typeof body?.['detail'] === 'string' ? body['detail'] : null;
  const message = typeof body?.['error'] === 'string' ? body['error'] : null;
  return detail ?? message ?? fallback;
}
