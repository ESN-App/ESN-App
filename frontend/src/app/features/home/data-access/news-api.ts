import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core';
import { NewsItemDto } from './news.models';

@Injectable({ providedIn: 'root' })
export class NewsApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/news`;

  getAll(): Observable<NewsItemDto[]> {
    const url = this.auth.isAdmin()
      ? `${environment.apiBaseUrl}/api/admin/news`
      : this.baseUrl;
    return this.http.get<NewsItemDto[]>(url);
  }
}
