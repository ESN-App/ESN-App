import { authStore } from '../../../core/auth-store';
import { http } from '../../../core/http';

export const InfoArticleStatus = {
  Draft: 0,
  Published: 1,
} as const;

export type InfoArticleStatus = (typeof InfoArticleStatus)[keyof typeof InfoArticleStatus];

export interface InfoArticleDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  imagePath: string;
  externalLinks: string[];
  displayOrder: number;
  status: InfoArticleStatus;
  createdAt: string;
  updatedAt: string | null;
}

export const infoApi = {
  getAll(): Promise<InfoArticleDto[]> {
    return http.get<InfoArticleDto[]>(authStore.isAdmin ? '/api/admin/info' : '/api/info');
  },

  async getBySlug(slug: string): Promise<InfoArticleDto> {
    if (authStore.isAdmin) {
      const article = (await infoApi.getAll()).find((item) => item.slug === slug);
      if (!article) {
        throw new Error(`Info article '${slug}' was not found.`);
      }
      return article;
    }

    return http.get<InfoArticleDto>(`/api/info/by-slug/${encodeURIComponent(slug)}`);
  },
};
