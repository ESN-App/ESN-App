import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core';
import { ResponseCache } from '../../../shared';
import { NewsItemDto } from './news.models';

@Injectable({ providedIn: 'root' })
export class NewsApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/news`;
  private readonly cache = new ResponseCache();
  /** Listed items by id: seed a details page opened from the list. */
  private readonly listed = new Map<string, NewsItemDto>();

  getAll(): Observable<NewsItemDto[]> {
    const url = this.auth.isAdmin()
      ? `${environment.apiBaseUrl}/api/admin/news`
      : this.baseUrl;
    return this.cache.get(
      url,
      this.http
        .get<NewsItemDto[]>(url)
        .pipe(tap((items) => items.forEach((item) => this.listed.set(item.id, item)))),
    );
  }

  getById(id: string): Observable<NewsItemDto> {
    // Drafts are filtered out of the public endpoint, so administrators read through the
    // admin one to be able to preview an unpublished article, mirroring getAll().
    const url = this.auth.isAdmin()
      ? `${environment.apiBaseUrl}/api/admin/news/${id}`
      : `${this.baseUrl}/${id}`;
    return this.cache.get(url, this.http.get<NewsItemDto>(url), this.listed.get(id));
  }
}
