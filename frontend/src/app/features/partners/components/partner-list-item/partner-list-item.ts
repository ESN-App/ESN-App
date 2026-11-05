import { Component, computed, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { discountLabel, initials } from '../../utils/partner-offer';
import { createPartnerSlug } from '../../utils/partner-url';

export interface PartnerListItemView {
  id: string;
  slug?: string | null;
  name: string;
  logoPath: string | null;
  shortDescription: string;
  status: number;
  offersCount: number;
  /** Discount value of the featured offer, shown as a sticker when present. */
  topDiscount?: string | null;
}

@Component({
  selector: 'app-partner-list-item',
  imports: [MatIconModule, RouterLink],
  templateUrl: './partner-list-item.html',
  styleUrl: './partner-list-item.scss',
})
export class PartnerListItem {
  readonly partner = input.required<PartnerListItemView>();
  readonly interactive = input(true);
  readonly selectable = input(false);
  readonly selected = input(false);
  /** Tint of the logo square: magenta, cyan, orange or green. */
  readonly tint = input('magenta');
  readonly selectPartner = output<string>();

  protected readonly logoBroken = signal(false);
  protected readonly initials = initials;
  protected readonly discount = computed(() => discountLabel(this.partner().topDiscount));

  protected partnerLink(): string[] {
    const partner = this.partner();
    return ['/partners', partner.slug || createPartnerSlug(partner.name)];
  }
}
