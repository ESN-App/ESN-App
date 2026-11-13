import { http } from '../../../core/http';
import type { EventDetailsDto, PagedResult } from '../../events/data-access/events.models';
import type { NewsItemDto } from '../../home/data-access/news.models';
import type { InfoArticleDto } from '../../info/data-access/info-api';
import type { PartnerDto } from '../../partners/data-access/partners.models';

const BASE_URL = '/api/admin';

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

function appendEntries(formData: FormData, entries: Record<string, string | number | null>): FormData {
  Object.entries(entries).forEach(([key, value]) => {
    if (value !== null) {
      formData.append(key, String(value));
    }
  });
  return formData;
}

function eventFormData(request: CreateEventRequest, image: File | null): FormData {
  const formData = appendEntries(new FormData(), {
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
  });
  if (image) {
    formData.append('image', image, image.name);
  }
  return formData;
}

function newsFormData(request: CreateNewsItemRequest, image: File | null): FormData {
  const formData = new FormData();
  formData.append('title', request.title);
  formData.append('description', request.description);
  if (image) {
    formData.append('image', image, image.name);
  }
  return formData;
}

function partnerFormData(request: CreatePartnerRequest, logo: File | null): FormData {
  const formData = appendEntries(new FormData(), {
    name: request.name,
    shortDescription: request.shortDescription,
    description: request.description,
    address: request.address,
    websiteUrl: request.websiteUrl,
    googleMapsUrl: request.googleMapsUrl,
    latitude: request.latitude,
    longitude: request.longitude,
  });
  if (logo) {
    formData.append('logo', logo, logo.name);
  }
  return formData;
}

function infoFormData(request: CreateInfoArticleRequest, image: File | null): FormData {
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

export const adminApi = {
  async getEvents(): Promise<EventDetailsDto[]> {
    const items: EventDetailsDto[] = [];
    let page = 1;
    for (;;) {
      const result = await http.get<PagedResult<EventDetailsDto>>(`${BASE_URL}/events`, {
        params: { page, pageSize: 100 },
      });
      items.push(...result.items);
      if (!result.hasNextPage) {
        return items;
      }
      page = result.page + 1;
    }
  },

  getNews: () => http.get<NewsItemDto[]>(`${BASE_URL}/news`),
  getPartners: () => http.get<PartnerDto[]>(`${BASE_URL}/partners`),
  getInfo: () => http.get<InfoArticleDto[]>(`${BASE_URL}/info`),

  getAdmins: () => http.get<AdminUserDto[]>(`${BASE_URL}/admins`),
  createAdmin: (email: string, password: string) =>
    http.post<AdminUserDto>(`${BASE_URL}/admins`, { email, password }),
  deleteAdmin: (id: string) => http.delete<void>(`${BASE_URL}/admins/${id}`),
  requestPasswordReset: (id: string) => http.post<void>(`${BASE_URL}/admins/${id}/reset-password`, {}),

  createEvent: (request: CreateEventRequest, image: File | null) =>
    http.post<EventDetailsDto>(`${BASE_URL}/events`, eventFormData(request, image)),
  getEvent: (id: string) => http.get<EventDetailsDto>(`${BASE_URL}/events/${id}`),
  deleteEvent: (id: string) => http.delete<void>(`${BASE_URL}/events/${id}`),
  updateEvent(id: string, request: CreateEventRequest, image: File | null, removeImage: boolean) {
    const formData = eventFormData(request, image);
    formData.append('removeImage', String(removeImage));
    return http.put<EventDetailsDto>(`${BASE_URL}/events/${id}`, formData);
  },
  updateEventStatus: (id: string, status: number) =>
    http.patch<EventDetailsDto>(`${BASE_URL}/events/${id}`, { status }),

  getNewsItem: (id: string) => http.get<NewsItemDto>(`${BASE_URL}/news/${id}`),
  createNews: (request: CreateNewsItemRequest, image: File) =>
    http.post<NewsItemDto>(`${BASE_URL}/news`, newsFormData(request, image)),
  updateNews: (id: string, request: CreateNewsItemRequest, image: File | null) =>
    http.put<NewsItemDto>(`${BASE_URL}/news/${id}`, newsFormData(request, image)),
  deleteNews: (id: string) => http.delete<void>(`${BASE_URL}/news/${id}`),
  updateNewsStatus: (id: string, status: number) =>
    http.patch<NewsItemDto>(`${BASE_URL}/news/${id}/status`, { status }),

  updatePartnerStatus: (id: string, status: number) =>
    http.patch<PartnerDto>(`${BASE_URL}/partners/${id}/status`, { status }),
  reorderPartners: (partnerIds: string[]) =>
    http.put<PartnerDto[]>(`${BASE_URL}/partners/order`, { partnerIds }),
  createPartner: (request: CreatePartnerRequest, logo: File) =>
    http.post<PartnerDto>(`${BASE_URL}/partners`, partnerFormData(request, logo)),
  getPartnerBySlug: (slug: string) => http.get<PartnerDto>(`${BASE_URL}/partners/by-slug/${slug}`),
  updatePartner: (id: string, request: CreatePartnerRequest, logo: File | null) =>
    http.put<PartnerDto>(`${BASE_URL}/partners/${id}`, partnerFormData(request, logo)),
  deletePartner: (id: string) => http.delete<void>(`${BASE_URL}/partners/${id}`),

  createDiscount: (request: CreateDiscountRequest) => http.post<DiscountDto>(`${BASE_URL}/discounts`, request),
  getPartnerDiscounts: (partnerId: string) =>
    http.get<DiscountDto[]>(`${BASE_URL}/partners/${partnerId}/discounts`),
  updateDiscount: (id: string, request: UpdateDiscountRequest) =>
    http.put<DiscountDto>(`${BASE_URL}/discounts/${id}`, request),
  deleteDiscount: (id: string) => http.delete<void>(`${BASE_URL}/discounts/${id}`),

  updateInfoStatus: (id: string, status: number) =>
    http.patch<InfoArticleDto>(`${BASE_URL}/info/${id}/status`, { status }),
  getInfoArticle: (id: string) => http.get<InfoArticleDto>(`${BASE_URL}/info/${id}`),
  createInfo: (request: CreateInfoArticleRequest, image: File) =>
    http.post<InfoArticleDto>(`${BASE_URL}/info`, infoFormData(request, image)),
  updateInfo: (id: string, request: CreateInfoArticleRequest, image: File | null) =>
    http.put<InfoArticleDto>(`${BASE_URL}/info/${id}`, infoFormData(request, image)),
  deleteInfo: (id: string) => http.delete<void>(`${BASE_URL}/info/${id}`),
  reorderInfo: (articleIds: string[]) => http.put<InfoArticleDto[]>(`${BASE_URL}/info/order`, { articleIds }),
};
