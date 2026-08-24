import { Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PartnerStatusTitle } from '../../../../shared';
import { createPartnerSlug } from '../../utils/partner-url';

export interface PartnerListItemView {
  id: string;
  slug?: string | null;
  name: string;
  logoPath: string | null;
  shortDescription: string;
  status: number;
  offersCount: number;
}

@Component({
  selector: 'app-partner-list-item',
  imports: [PartnerStatusTitle, RouterLink],
  templateUrl: './partner-list-item.html',
  styleUrl: './partner-list-item.scss',
})
export class PartnerListItem {
  readonly partner = input.required<PartnerListItemView>();
  readonly interactive = input(true);
  readonly selectable = input(false);
  readonly selected = input(false);
  readonly selectPartner = output<string>();

  protected readonly logoBroken = signal(false);

  protected partnerLink(): string[] {
    const partner = this.partner();
    return ['/partners', partner.slug || createPartnerSlug(partner.name)];
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
}
