import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';
import { EmptyState, LoadingSpinner } from '../../../../shared';
import { PartnersApi } from '../../data-access/partners-api';
import { PartnerView } from '../../data-access/partners.models';
import { createPartnerSlug } from '../../utils/partner-url';

interface PartnersPageState {
  status: 'loading' | 'loaded' | 'error';
  partners: PartnerView[];
}

@Component({
  selector: 'app-partners-list',
  imports: [RouterLink, EmptyState, LoadingSpinner],
  templateUrl: './partners-list.html',
  styleUrl: './partners-list.scss',
})
export class PartnersList {
  private readonly api = inject(PartnersApi);

  protected readonly searchQuery = signal('');
  private readonly brokenLogoIds = signal<ReadonlySet<string>>(new Set());
  protected readonly state = toSignal(
    this.api.getAll().pipe(
      map((partners): PartnersPageState => ({
        status: 'loaded',
        partners,
      })),
      startWith<PartnersPageState>({ status: 'loading', partners: [] }),
      catchError(() => of<PartnersPageState>({ status: 'error', partners: [] })),
    ),
    { requireSync: true },
  );

  protected readonly filteredPartners = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    const partners = this.state().partners;

    if (!query) {
      return partners;
    }

    return partners.filter(
      (partner) =>
        partner.name.toLocaleLowerCase().includes(query) ||
        partner.shortDescription.toLocaleLowerCase().includes(query) ||
        partner.category?.toLocaleLowerCase().includes(query) ||
        partner.offers.some(
          (offer) =>
            offer.title.toLocaleLowerCase().includes(query) ||
            offer.description.toLocaleLowerCase().includes(query),
        ),
    );
  });

  protected updateSearch(event: Event): void {
    this.searchQuery.set((event.currentTarget as HTMLInputElement).value);
  }

  protected partnerSlug(partner: PartnerView): string {
    return partner.slug || createPartnerSlug(partner.name);
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

  protected hasBrokenLogo(partnerId: string): boolean {
    return this.brokenLogoIds().has(partnerId);
  }

  protected markLogoAsBroken(partnerId: string): void {
    this.brokenLogoIds.update((current) => new Set(current).add(partnerId));
  }
}
