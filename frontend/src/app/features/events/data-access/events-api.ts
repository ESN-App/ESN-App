import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  EventDetailsDto,
  EventListItemDto,
  EventsQuery,
  PagedResult,
} from './events.models';

@Injectable({ providedIn: 'root' })
export class EventsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/events`;

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
      .get<unknown>(this.baseUrl, { params })
      .pipe(map((response) => this.toPagedResult(response)));
  }

  getById(id: string): Observable<EventDetailsDto> {
    return this.http.get<EventDetailsDto>(`${this.baseUrl}/${id}`);
  }

  getAvailableMonths(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/months`);
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
