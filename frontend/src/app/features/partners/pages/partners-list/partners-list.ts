import {
  Component,
  computed,
  ElementRef,
  effect,
  inject,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';
import { EmptyState, LoadingSpinner } from '../../../../shared';
import { PartnerListItem, PartnerListItemView } from '../../components/partner-list-item/partner-list-item';
import { PartnersMap } from '../../components/partners-map/partners-map';
import { PartnersApi } from '../../data-access/partners-api';
import { PartnerView } from '../../data-access/partners.models';
import { createPartnerSlug } from '../../utils/partner-url';

interface PartnersPageState {
  status: 'loading' | 'loaded' | 'error';
  partners: PartnerView[];
}

type MobilePartnersView = 'list' | 'map';

@Component({
  selector: 'app-partners-list',
  imports: [RouterLink, EmptyState, LoadingSpinner, PartnerListItem, PartnersMap],
  templateUrl: './partners-list.html',
  styleUrl: './partners-list.scss',
})
export class PartnersList {
  private readonly api = inject(PartnersApi);
  private readonly route = inject(ActivatedRoute);
  private readonly breakpointObserver = inject(BreakpointObserver);

  @ViewChildren('partnerCard', { read: ElementRef })
  private partnerCards?: QueryList<ElementRef<HTMLElement>>;

  @ViewChild('partnerList', { read: ElementRef })
  private partnerList?: ElementRef<HTMLElement>;

  protected readonly searchQuery = signal('');
  protected readonly selectedPartnerId = signal<string | null>(
    this.route.snapshot.queryParamMap.get('selectedPartner'),
  );
  protected readonly mobileView = signal<MobilePartnersView>(
    this.route.snapshot.queryParamMap.get('view') === 'map' ? 'map' : 'list',
  );
  protected readonly partnerScrollPosition = signal(0);
  protected readonly partnerScrollMaximum = signal(0);
  private readonly brokenLogoIds = signal<ReadonlySet<string>>(new Set());
  protected readonly isDesktop = toSignal(
    this.breakpointObserver.observe('(min-width: 1024px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );
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
        partner.offers.some(
          (offer) =>
            offer.title.toLocaleLowerCase().includes(query) ||
            offer.description.toLocaleLowerCase().includes(query),
        ),
    );
  });
  protected readonly selectedPartner = computed(() => {
    const selectedId = this.selectedPartnerId();
    return this.state().partners.find((partner) => partner.id === selectedId) ?? null;
  });
  private readonly refreshPartnerScrollbar = effect(() => {
    this.filteredPartners();
    this.isDesktop();

    requestAnimationFrame(() => this.capturePartnerScroll());
  });

  protected updateSearch(event: Event): void {
    this.searchQuery.set((event.currentTarget as HTMLInputElement).value);
  }

  protected updatePartnerScroll(event: Event): void {
    this.capturePartnerScroll(event.currentTarget as HTMLElement);
  }

  protected scrollPartnerList(event: Event): void {
    const position = Number((event.currentTarget as HTMLInputElement).value);
    const list = this.partnerList?.nativeElement;

    if (list) {
      list.scrollTop = position;
    }
  }

  protected selectPartner(partnerId: string, scrollCardIntoView = false): void {
    this.selectedPartnerId.set(partnerId);

    if (!scrollCardIntoView) {
      return;
    }

    requestAnimationFrame(() => {
      const selectedCard = this.partnerCards?.find(
        (card) => card.nativeElement.dataset['partnerId'] === partnerId,
      );

      selectedCard?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });
  }

  protected setMobileView(view: MobilePartnersView): void {
    this.mobileView.set(view);
  }

  protected clearSelection(): void {
    this.selectedPartnerId.set(null);
  }

  private capturePartnerScroll(list = this.partnerList?.nativeElement): void {
    if (!list) {
      return;
    }

    this.partnerScrollPosition.set(list.scrollTop);
    this.partnerScrollMaximum.set(Math.max(0, list.scrollHeight - list.clientHeight));
  }

  protected partnerSlug(partner: PartnerView): string {
    return partner.slug || createPartnerSlug(partner.name);
  }

  protected partnerListItemView(partner: PartnerView): PartnerListItemView {
    return {
      id: partner.id,
      slug: this.partnerSlug(partner),
      name: partner.name,
      logoPath: partner.logoPath,
      shortDescription: partner.shortDescription,
      status: partner.status,
      offersCount: partner.offers.length,
    };
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
