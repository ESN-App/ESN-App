import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InfoArticleDto {
  id: string;
  title: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class InfoApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/info`;

  getAll(): Observable<InfoArticleDto[]> {
    return this.http.get<InfoArticleDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<InfoArticleDto> {
    return this.http.get<InfoArticleDto>(`${this.baseUrl}/${id}`);
  }
}
