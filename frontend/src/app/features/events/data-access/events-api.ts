import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core';
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

  getAll(query?: EventsQuery): Observable<PagedResult<EventListItemDto>> {
    const params = query
      ? {
          from: query.from,
          to: query.to,
          page: String(query.page ?? 1),
          pageSize: String(query.pageSize ?? 20),
        }
      : undefined;

    return this.http
      .get<unknown>(this.auth.isAdmin() ? this.adminBaseUrl : this.baseUrl, { params })
      .pipe(map((response) => this.toPagedResult(response)));
  }

  getById(id: string): Observable<EventDetailsDto> {
    const baseUrl = this.auth.isAdmin() ? this.adminBaseUrl : this.baseUrl;
    return this.http.get<EventDetailsDto>(`${baseUrl}/${id}`);
  }

  getAvailableMonths(): Observable<string[]> {
    if (this.auth.isAdmin()) {
      return this.getAdminPage(1)
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
        );
    }

    return this.http.get<string[]>(`${this.baseUrl}/months`);
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
