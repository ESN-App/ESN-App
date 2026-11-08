import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core';
import { ResponseCache } from '../../../shared';

export interface InfoArticleDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  imagePath: string | null;
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
  private readonly cache = inject(ResponseCache);

  getAll(): Observable<InfoArticleDto[]> {
    const url = this.auth.isAdmin()
      ? `${environment.apiBaseUrl}/api/admin/info`
      : this.baseUrl;
    return this.cache.get(
      url,
      this.http
        .get<InfoArticleDto[]>(url)
        .pipe(tap((articles) => articles.forEach((item) => this.cache.remember(`info:${item.slug}`, item)))),
    );
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

    const url = `${this.baseUrl}/by-slug/${encodeURIComponent(slug)}`;
    return this.cache.get(url, this.http.get<InfoArticleDto>(url), `info:${slug}`);
  }
}
