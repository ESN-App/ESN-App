import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { expand, reduce } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type { EventDetailsDto, PagedResult } from '../../events/data-access/events.models';
import type { NewsItemDto } from '../../home/data-access/news.models';
import type { InfoArticleDto } from '../../info/data-access/info-api';
import type { PartnerDto } from '../../partners/data-access/partners.models';

export interface AdminUserDto {
  id: string;
  email: string;
  createdAt: string;
}

export interface CreateEventRequest {
  title: string;
  shortDescription: string;
  description: string;
  location: string;
  googleMapsUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  registrationUrl: string | null;
  minimumParticipants: number | null;
  maximumParticipants: number | null;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin`;

  getEvents(): Observable<EventDetailsDto[]> {
    return this.getEventsPage(1).pipe(
      expand((result) => (result.hasNextPage ? this.getEventsPage(result.page + 1) : EMPTY)),
      reduce((items, result) => [...items, ...result.items], [] as EventDetailsDto[]),
    );
  }

  getNews(): Observable<NewsItemDto[]> {
    return this.http.get<NewsItemDto[]>(`${this.baseUrl}/news`);
  }

  getPartners(): Observable<PartnerDto[]> {
    return this.http.get<PartnerDto[]>(`${this.baseUrl}/partners`);
  }

  getInfo(): Observable<InfoArticleDto[]> {
    return this.http.get<InfoArticleDto[]>(`${this.baseUrl}/info`);
  }

  getAdmins(): Observable<AdminUserDto[]> {
    return this.http.get<AdminUserDto[]>(`${this.baseUrl}/admins`);
  }

  createEvent(request: CreateEventRequest, image: File | null): Observable<EventDetailsDto> {
    return this.http.post<EventDetailsDto>(
      `${this.baseUrl}/events`,
      this.eventFormData(request, image),
    );
  }

  getEvent(id: string): Observable<EventDetailsDto> {
    return this.http.get<EventDetailsDto>(`${this.baseUrl}/events/${id}`);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/events/${id}`);
  }

  updateEvent(
    id: string,
    request: CreateEventRequest,
    image: File | null,
    removeImage: boolean,
  ): Observable<EventDetailsDto> {
    const formData = this.eventFormData(request, image);
    formData.append('removeImage', String(removeImage));
    return this.http.put<EventDetailsDto>(`${this.baseUrl}/events/${id}`, formData);
  }

  private eventFormData(request: CreateEventRequest, image: File | null): FormData {
    const formData = new FormData();
    const entries: Record<string, string | number | null> = {
      title: request.title,
      shortDescription: request.shortDescription,
      description: request.description,
      location: request.location,
      googleMapsUrl: request.googleMapsUrl,
      startsAt: request.startsAt,
      endsAt: request.endsAt,
      registrationUrl: request.registrationUrl,
      minimumParticipants: request.minimumParticipants,
      maximumParticipants: request.maximumParticipants,
      price: request.price,
    };

    Object.entries(entries).forEach(([key, value]) => {
      if (value !== null) {
        formData.append(key, String(value));
      }
    });
    if (image) {
      formData.append('image', image, image.name);
    }

    return formData;
  }

  updateEventStatus(id: string, status: number): Observable<EventDetailsDto> {
    return this.http.patch<EventDetailsDto>(`${this.baseUrl}/events/${id}`, {
      status,
    });
  }

  updateNewsStatus(id: string, status: number): Observable<NewsItemDto> {
    return this.http.patch<NewsItemDto>(`${this.baseUrl}/news/${id}/status`, { status });
  }

  updatePartnerStatus(id: string, status: number): Observable<PartnerDto> {
    return this.http.patch<PartnerDto>(`${this.baseUrl}/partners/${id}/status`, { status });
  }

  updateInfoStatus(id: string, status: number): Observable<InfoArticleDto> {
    return this.http.patch<InfoArticleDto>(`${this.baseUrl}/info/${id}/status`, { status });
  }

  private getEventsPage(page: number): Observable<PagedResult<EventDetailsDto>> {
    return this.http.get<PagedResult<EventDetailsDto>>(`${this.baseUrl}/events`, {
      params: { page: String(page), pageSize: '100' },
    });
  }
}
