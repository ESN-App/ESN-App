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
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface FeatureFlagDto {
  key: string;
  enabled: boolean;
  updatedAt: string;
}

/** Admin endpoints add who created the item; null for legacy rows. Already formatted, e.g. "Jan K.". */
interface CreatedBy {
  createdBy: string | null;
}

export type AdminEventDto = EventDetailsDto & CreatedBy;
export type AdminNewsItemDto = NewsItemDto & CreatedBy;
export type AdminInfoArticleDto = InfoArticleDto & CreatedBy;
export type AdminPartnerDto = PartnerDto & CreatedBy;

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

export interface CreateNewsItemRequest {
  title: string;
  description: string;
}

export interface CreateInfoArticleRequest {
  title: string;
  slug: string;
  content: string;
  category: string;
  externalLinks: string[];
}

export interface CreatePartnerRequest {
  name: string;
  shortDescription: string;
  description: string;
  address: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DiscountDto {
  id: string;
  title: string;
  description: string;
  partnerId: string;
  partnerName: string | null;
}

export interface CreateDiscountRequest {
  title: string;
  description: string;
  partnerId: string;
}

export interface UpdateDiscountRequest {
  title: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin`;

  getEvents(): Observable<AdminEventDto[]> {
    return this.getEventsPage(1).pipe(
      expand((result) => (result.hasNextPage ? this.getEventsPage(result.page + 1) : EMPTY)),
      reduce((items, result) => [...items, ...result.items], [] as AdminEventDto[]),
    );
  }

  getNews(): Observable<AdminNewsItemDto[]> {
    return this.http.get<AdminNewsItemDto[]>(`${this.baseUrl}/news`);
  }

  getPartners(): Observable<AdminPartnerDto[]> {
    return this.http.get<AdminPartnerDto[]>(`${this.baseUrl}/partners`);
  }

  getInfo(): Observable<AdminInfoArticleDto[]> {
    return this.http.get<AdminInfoArticleDto[]>(`${this.baseUrl}/info`);
  }

  getFeatures(): Observable<FeatureFlagDto[]> {
    return this.http.get<FeatureFlagDto[]>(`${this.baseUrl}/features`);
  }

  updateFeature(key: string, enabled: boolean): Observable<FeatureFlagDto> {
    return this.http.put<FeatureFlagDto>(`${this.baseUrl}/features/${encodeURIComponent(key)}`, { enabled });
  }

  getAdmins(): Observable<AdminUserDto[]> {
    return this.http.get<AdminUserDto[]>(`${this.baseUrl}/admins`);
  }

  createAdmin(request: CreateAdminRequest): Observable<AdminUserDto> {
    return this.http.post<AdminUserDto>(`${this.baseUrl}/admins`, request);
  }

  deleteAdmin(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admins/${id}`);
  }

  requestPasswordReset(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/admins/${id}/reset-password`, {});
  }

  createEvent(request: CreateEventRequest, image: File | null): Observable<AdminEventDto> {
    return this.http.post<AdminEventDto>(
      `${this.baseUrl}/events`,
      this.eventFormData(request, image),
    );
  }

  getEvent(id: string): Observable<AdminEventDto> {
    return this.http.get<AdminEventDto>(`${this.baseUrl}/events/${id}`);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/events/${id}`);
  }

  updateEvent(
    id: string,
    request: CreateEventRequest,
    image: File | null,
    removeImage: boolean,
  ): Observable<AdminEventDto> {
    const formData = this.eventFormData(request, image);
    formData.append('removeImage', String(removeImage));
    return this.http.put<AdminEventDto>(`${this.baseUrl}/events/${id}`, formData);
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

  updateEventStatus(id: string, status: number): Observable<AdminEventDto> {
    return this.http.patch<AdminEventDto>(`${this.baseUrl}/events/${id}`, {
      status,
    });
  }

  getNewsItem(id: string): Observable<AdminNewsItemDto> {
    return this.http.get<AdminNewsItemDto>(`${this.baseUrl}/news/${id}`);
  }

  createNews(request: CreateNewsItemRequest, image: File | null): Observable<AdminNewsItemDto> {
    return this.http.post<AdminNewsItemDto>(`${this.baseUrl}/news`, this.newsFormData(request, image));
  }

  updateNews(
    id: string,
    request: CreateNewsItemRequest,
    image: File | null,
    removeImage: boolean,
  ): Observable<AdminNewsItemDto> {
    const formData = this.newsFormData(request, image);
    formData.append('removeImage', String(removeImage));
    return this.http.put<AdminNewsItemDto>(`${this.baseUrl}/news/${id}`, formData);
  }

  deleteNews(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/news/${id}`);
  }

  private newsFormData(request: CreateNewsItemRequest, image: File | null): FormData {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('description', request.description);
    if (image) {
      formData.append('image', image, image.name);
    }

    return formData;
  }

  reorderNews(newsItemIds: string[]): Observable<AdminNewsItemDto[]> {
    return this.http.put<AdminNewsItemDto[]>(`${this.baseUrl}/news/order`, { newsItemIds });
  }

  updateNewsStatus(id: string, status: number): Observable<AdminNewsItemDto> {
    return this.http.patch<AdminNewsItemDto>(`${this.baseUrl}/news/${id}/status`, { status });
  }

  updatePartnerStatus(id: string, status: number): Observable<AdminPartnerDto> {
    return this.http.patch<AdminPartnerDto>(`${this.baseUrl}/partners/${id}/status`, { status });
  }

  reorderPartners(partnerIds: string[]): Observable<AdminPartnerDto[]> {
    return this.http.put<AdminPartnerDto[]>(`${this.baseUrl}/partners/order`, { partnerIds });
  }

  createPartner(request: CreatePartnerRequest, logo: File): Observable<AdminPartnerDto> {
    return this.http.post<AdminPartnerDto>(`${this.baseUrl}/partners`, this.partnerFormData(request, logo));
  }

  getPartnerBySlug(slug: string): Observable<AdminPartnerDto> {
    return this.http.get<AdminPartnerDto>(`${this.baseUrl}/partners/by-slug/${slug}`);
  }

  updatePartner(id: string, request: CreatePartnerRequest, logo: File | null): Observable<AdminPartnerDto> {
    return this.http.put<AdminPartnerDto>(`${this.baseUrl}/partners/${id}`, this.partnerFormData(request, logo));
  }

  deletePartner(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/partners/${id}`);
  }

  private partnerFormData(request: CreatePartnerRequest, logo: File | null): FormData {
    const formData = new FormData();
    const entries: Record<string, string | number | null> = {
      name: request.name,
      shortDescription: request.shortDescription,
      description: request.description,
      address: request.address,
      websiteUrl: request.websiteUrl,
      googleMapsUrl: request.googleMapsUrl,
      latitude: request.latitude,
      longitude: request.longitude,
    };

    Object.entries(entries).forEach(([key, value]) => {
      if (value !== null) {
        formData.append(key, String(value));
      }
    });
    if (logo) {
      formData.append('logo', logo, logo.name);
    }

    return formData;
  }

  createDiscount(request: CreateDiscountRequest): Observable<DiscountDto> {
    return this.http.post<DiscountDto>(`${this.baseUrl}/discounts`, request);
  }

  getPartnerDiscounts(partnerId: string): Observable<DiscountDto[]> {
    return this.http.get<DiscountDto[]>(`${this.baseUrl}/partners/${partnerId}/discounts`);
  }

  updateDiscount(id: string, request: UpdateDiscountRequest): Observable<DiscountDto> {
    return this.http.put<DiscountDto>(`${this.baseUrl}/discounts/${id}`, request);
  }

  deleteDiscount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/discounts/${id}`);
  }

  updateInfoStatus(id: string, status: number): Observable<AdminInfoArticleDto> {
    return this.http.patch<AdminInfoArticleDto>(`${this.baseUrl}/info/${id}/status`, { status });
  }

  getInfoArticle(id: string): Observable<AdminInfoArticleDto> {
    return this.http.get<AdminInfoArticleDto>(`${this.baseUrl}/info/${id}`);
  }

  createInfo(request: CreateInfoArticleRequest, image: File | null): Observable<AdminInfoArticleDto> {
    return this.http.post<AdminInfoArticleDto>(`${this.baseUrl}/info`, this.infoFormData(request, image));
  }

  updateInfo(
    id: string,
    request: CreateInfoArticleRequest,
    image: File | null,
    removeImage: boolean,
  ): Observable<AdminInfoArticleDto> {
    const formData = this.infoFormData(request, image);
    formData.append('removeImage', String(removeImage));
    return this.http.put<AdminInfoArticleDto>(`${this.baseUrl}/info/${id}`, formData);
  }

  private infoFormData(request: CreateInfoArticleRequest, image: File | null): FormData {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('slug', request.slug);
    formData.append('content', request.content);
    formData.append('category', request.category);
    request.externalLinks.forEach((link) => formData.append('externalLinks', link));
    if (image) {
      formData.append('image', image, image.name);
    }

    return formData;
  }

  deleteInfo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/info/${id}`);
  }

  reorderInfo(articleIds: string[]): Observable<AdminInfoArticleDto[]> {
    return this.http.put<AdminInfoArticleDto[]>(`${this.baseUrl}/info/order`, { articleIds });
  }

  private getEventsPage(page: number): Observable<PagedResult<AdminEventDto>> {
    return this.http.get<PagedResult<AdminEventDto>>(`${this.baseUrl}/events`, {
      params: { page: String(page), pageSize: '100' },
    });
  }
}
