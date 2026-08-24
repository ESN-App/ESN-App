import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core';

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

export enum InfoArticleStatus {
  Draft = 0,
  Published = 1,
}

@Injectable({ providedIn: 'root' })
export class InfoApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/info`;

  getAll(): Observable<InfoArticleDto[]> {
    const url = this.auth.isAdmin()
      ? `${environment.apiBaseUrl}/api/admin/info`
      : this.baseUrl;
    return this.http.get<InfoArticleDto[]>(url);
  }

  getBySlug(slug: string): Observable<InfoArticleDto> {
    if (this.auth.isAdmin()) {
      return this.getAll().pipe(
        map((articles) => {
          const article = articles.find((item) => item.slug === slug);

          if (!article) {
            throw new Error(`Info article '${slug}' was not found.`);
          }

          return article;
        }),
      );
    }

    return this.http.get<InfoArticleDto>(`${this.baseUrl}/by-slug/${encodeURIComponent(slug)}`);
  }
}
