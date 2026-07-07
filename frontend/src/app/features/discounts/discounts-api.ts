import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DiscountDto {
  id: string;
  title: string;
  description: string;
  partnerId: string;
  partnerName: string | null;
}

export interface PartnerDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class DiscountsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getAll(): Observable<DiscountDto[]> {
    return this.http.get<DiscountDto[]>(`${this.baseUrl}/api/discounts`);
  }

  getById(id: string): Observable<DiscountDto> {
    return this.http.get<DiscountDto>(`${this.baseUrl}/api/discounts/${id}`);
  }

  getPartners(): Observable<PartnerDto[]> {
    return this.http.get<PartnerDto[]>(`${this.baseUrl}/api/partners`);
  }
}
