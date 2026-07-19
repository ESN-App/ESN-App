import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EventDto {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class EventsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/events`;

  getAll(): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<EventDto> {
    return this.http.get<EventDto>(`${this.baseUrl}/${id}`);
  }
}
