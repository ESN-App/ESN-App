import { authStore } from '../../../core/auth-store';
import { http } from '../../../core/http';
import type { EventDetailsDto, EventListItemDto, EventsQuery, PagedResult } from './events.models';

const PUBLIC_URL = '/api/events';
const ADMIN_URL = '/api/admin/events';

function toPagedResult(response: unknown): PagedResult<EventListItemDto> {
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

async function getAdminPage(page: number): Promise<PagedResult<EventListItemDto>> {
  return toPagedResult(await http.get<unknown>(ADMIN_URL, { params: { page, pageSize: 100 } }));
}

export const eventsApi = {
  async getAll(query?: EventsQuery): Promise<PagedResult<EventListItemDto>> {
    const params = query
      ? { from: query.from, to: query.to, page: query.page ?? 1, pageSize: query.pageSize ?? 20 }
      : undefined;
    const response = await http.get<unknown>(authStore.isAdmin ? ADMIN_URL : PUBLIC_URL, { params });
    return toPagedResult(response);
  },

  getById(id: string): Promise<EventDetailsDto> {
    return http.get<EventDetailsDto>(`${authStore.isAdmin ? ADMIN_URL : PUBLIC_URL}/${id}`);
  },

  async getAvailableMonths(): Promise<string[]> {
    if (!authStore.isAdmin) {
      return http.get<string[]>(`${PUBLIC_URL}/months`);
    }

    // Administrators also see drafts, which the public months endpoint leaves out.
    const items: EventListItemDto[] = [];
    let result = await getAdminPage(1);
    items.push(...result.items);
    while (result.hasNextPage) {
      result = await getAdminPage(result.page + 1);
      items.push(...result.items);
    }
    return [...new Set(items.map((event) => event.startsAt.slice(0, 7)))].sort();
  },
};
