import { Component, input, signal } from '@angular/core';
import { DraftPreviewBanner, InactiveBadge } from '../../../../shared';
import { PartnerOffer } from '../../data-access/partners.models';
import { PartnerListItemView } from '../partner-list-item/partner-list-item';

export interface PartnerDetailsViewModel extends PartnerListItemView {
  description: string;
  address: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  offers: PartnerOffer[];
}

@Component({
  selector: 'app-partner-details-view',
  imports: [DraftPreviewBanner, InactiveBadge],
  templateUrl: './partner-details-view.html',
  styleUrl: './partner-details-view.scss',
})
export class PartnerDetailsView {
  readonly partner = input.required<PartnerDetailsViewModel>();
  readonly interactive = input(true);

  protected readonly logoBroken = signal(false);

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  protected mapUrl(
    latitude: number | null,
    longitude: number | null,
    fallbackUrl: string | null,
  ): string | null {
    if (latitude !== null && longitude !== null) {
      return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }

    return fallbackUrl;
  }
}
