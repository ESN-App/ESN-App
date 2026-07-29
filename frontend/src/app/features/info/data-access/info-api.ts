import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface InfoArticleDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  imageUrl: string;
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
  private readonly baseUrl = `${environment.apiBaseUrl}/api/info`;

  getAll(): Observable<InfoArticleDto[]> {
    return this.http.get<InfoArticleDto[]>(this.baseUrl);
  }

  getBySlug(slug: string): Observable<InfoArticleDto> {
    return this.http.get<InfoArticleDto>(`${this.baseUrl}/by-slug/${encodeURIComponent(slug)}`);
  }
}
