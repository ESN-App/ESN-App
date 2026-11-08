import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { expand, map, reduce, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core';
import { ResponseCache } from '../../../shared';
import {
  EventDetailsDto,
  EventListItemDto,
  EventsQuery,
  PagedResult,
} from './events.models';

@Injectable({ providedIn: 'root' })
export class EventsApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/events`;
  private readonly adminBaseUrl = `${environment.apiBaseUrl}/api/admin/events`;
  private readonly cache = new ResponseCache();
  /** Listed events by id: seed a details page opened from a list. */
  private readonly listed = new Map<string, EventListItemDto>();

  getAll(query?: EventsQuery): Observable<PagedResult<EventListItemDto>> {
    const params = query
      ? {
          from: query.from,
          to: query.to,
          page: String(query.page ?? 1),
          pageSize: String(query.pageSize ?? 20),
        }
      : undefined;

    const url = this.auth.isAdmin() ? this.adminBaseUrl : this.baseUrl;
    return this.cache.get(
      JSON.stringify([url, params]),
      this.http.get<unknown>(url, { params }).pipe(
        map((response) => this.toPagedResult(response)),
        tap((result) => result.items.forEach((item) => this.listed.set(item.id, item))),
      ),
    );
  }

  getById(id: string): Observable<EventDetailsDto> {
    const baseUrl = this.auth.isAdmin() ? this.adminBaseUrl : this.baseUrl;
    const listed = this.listed.get(id);
    // The list item stands in until the full event arrives (description, links).
    const seed: EventDetailsDto | undefined = listed && {
      description: listed.shortDescription,
      googleMapsUrl: null,
      registrationUrl: null,
      publishedAt: null,
      minimumParticipants: null,
      createdAt: '',
      updatedAt: null,
      ...listed,
    };
    return this.cache.get(
      `${baseUrl}/${id}`,
      this.http.get<EventDetailsDto>(`${baseUrl}/${id}`),
      seed,
    );
  }

  getAvailableMonths(): Observable<string[]> {
    if (this.auth.isAdmin()) {
      return this.cache.get('admin-months', this.getAdminPage(1)
        .pipe(
          expand((result) =>
            result.hasNextPage ? this.getAdminPage(result.page + 1) : EMPTY,
          ),
          reduce((items, result) => [...items, ...result.items], [] as EventListItemDto[]),
          map((items) => [
            ...new Set(
              items.map((event) => event.startsAt.slice(0, 7)),
            ),
          ].sort()),
        ));
    }

    return this.cache.get(`${this.baseUrl}/months`, this.http.get<string[]>(`${this.baseUrl}/months`));
  }

  private getAdminPage(page: number): Observable<PagedResult<EventListItemDto>> {
    return this.http
      .get<unknown>(this.adminBaseUrl, { params: { page: String(page), pageSize: '100' } })
      .pipe(map((response) => this.toPagedResult(response)));
  }

  private toPagedResult(response: unknown): PagedResult<EventListItemDto> {
    if (Array.isArray(response)) {
      return {
        items: response as EventListItemDto[],
        page: 1,
        pageSize: response.length,
        totalCount: response.length,
        hasNextPage: false,
      };
    }

    const paged = (response ?? {}) as Record<string, unknown>;
    const serializedItems = paged['items'];
    const wrappedItems = (serializedItems ?? {}) as Record<string, unknown>;
    const items = (
      Array.isArray(serializedItems)
        ? serializedItems
        : Array.isArray(wrappedItems['$values'])
          ? wrappedItems['$values']
          : []
    ) as EventListItemDto[];

    return {
      items,
      page: typeof paged['page'] === 'number' ? paged['page'] : 1,
      pageSize: typeof paged['pageSize'] === 'number' ? paged['pageSize'] : items.length,
      totalCount: typeof paged['totalCount'] === 'number' ? paged['totalCount'] : items.length,
      hasNextPage: paged['hasNextPage'] === true,
    };
  }
}
