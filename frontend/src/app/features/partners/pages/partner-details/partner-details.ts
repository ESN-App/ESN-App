import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { LoadingSpinner } from '../../../../shared';
import { PartnerDetailsView, PartnerDetailsViewModel } from '../../components/partner-details-view/partner-details-view';
import { PartnersApi } from '../../data-access/partners-api';
import { PartnerView } from '../../data-access/partners.models';
import { createPartnerSlug } from '../../utils/partner-url';

@Component({
  selector: 'app-partner-details',
  imports: [RouterLink, LoadingSpinner, PartnerDetailsView],
  templateUrl: './partner-details.html',
  styleUrl: './partner-details.scss',
})
export class PartnerDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PartnersApi);

  protected readonly partner = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('partnerSlug');
        return slug ? this.api.getBySlug(slug) : of(null);
      }),
      catchError(() => of(null)),
    ),
  );

  protected detailsViewModel(partner: PartnerView): PartnerDetailsViewModel {
    return {
      id: partner.id,
      slug: partner.slug || createPartnerSlug(partner.name),
      name: partner.name,
      logoPath: partner.logoPath,
      shortDescription: partner.shortDescription,
      status: partner.status,
      offersCount: partner.offers.length,
      description: partner.description,
      address: partner.address,
      websiteUrl: partner.websiteUrl,
      googleMapsUrl: partner.googleMapsUrl,
      latitude: partner.latitude,
      longitude: partner.longitude,
      offers: partner.offers,
    };
  }
}
