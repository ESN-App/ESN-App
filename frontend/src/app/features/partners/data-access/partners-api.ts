import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core';
import { createPartnerSlug } from '../utils/partner-url';
import { PartnerDto, PartnerOffer, PartnerView } from './partners.models';

@Injectable({ providedIn: 'root' })
export class PartnersApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiBaseUrl}/api`;

  getAll(): Observable<PartnerView[]> {
    return forkJoin({
      partners: this.http.get<PartnerDto[]>(
        this.auth.isAdmin() ? `${this.baseUrl}/admin/partners` : `${this.baseUrl}/partners`,
      ),
      offers: this.http.get<PartnerOffer[]>(`${this.baseUrl}/discounts`),
    }).pipe(
      map(({ partners, offers }) =>
        partners
          .map((partner) => this.withOffers(partner, offers))
          .sort(
            (left, right) =>
              left.displayOrder - right.displayOrder || left.name.localeCompare(right.name),
          ),
      ),
    );
  }

  getBySlug(slug: string): Observable<PartnerView | null> {
    return this.getAll().pipe(
      map(
        (partners) =>
          partners.find(
            (partner) => (partner.slug || createPartnerSlug(partner.name)) === slug,
          ) ?? null,
      ),
    );
  }

  private withOffers(partner: PartnerDto, offers: PartnerOffer[]): PartnerView {
    return {
      ...partner,
      offers: offers
        .filter((offer) => offer.partnerId === partner.id)
        .sort(
          (left, right) =>
            Number(right.isFeatured ?? false) - Number(left.isFeatured ?? false),
        ),
    };
  }
}
