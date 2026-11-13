import { authStore } from '../../../core/auth-store';
import { http } from '../../../core/http';
import type { NewsItemDto } from './news.models';

export const newsApi = {
  getAll(): Promise<NewsItemDto[]> {
    return http.get<NewsItemDto[]>(authStore.isAdmin ? '/api/admin/news' : '/api/news');
  },

  getById(id: string): Promise<NewsItemDto> {
    // Drafts are filtered out of the public endpoint, so administrators read through the
    // admin one to be able to preview an unpublished article, mirroring getAll().
    return http.get<NewsItemDto>(authStore.isAdmin ? `/api/admin/news/${id}` : `/api/news/${id}`);
  },
};
