import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { NewsItemDto } from './news.models';

@Injectable({ providedIn: 'root' })
export class NewsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/news`;

  getAll(): Observable<NewsItemDto[]> {
    return this.http.get<NewsItemDto[]>(this.baseUrl);
  }
}
