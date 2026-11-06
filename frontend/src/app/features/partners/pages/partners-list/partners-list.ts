import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  QueryList,
  signal,
  viewChild,
  ViewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { EmptyState, ErrorState, Skeleton, StaggerIn } from '../../../../shared';
import { PartnerListItem, PartnerListItemView } from '../../components/partner-list-item/partner-list-item';
import { PartnersMap } from '../../components/partners-map/partners-map';
import { PartnersApi } from '../../data-access/partners-api';
import { PartnerView } from '../../data-access/partners.models';
import { discountLabel, initials } from '../../utils/partner-offer';
import { createPartnerSlug } from '../../utils/partner-url';

interface PartnersPageState {
  status: 'loading' | 'loaded' | 'error';
  partners: PartnerView[];
}

type MobilePartnersView = 'list' | 'map';

@Component({
  selector: 'app-partners-list',
  imports: [RouterLink, EmptyState, ErrorState, MatIconModule, PartnerListItem, PartnersMap, Skeleton, StaggerIn],
  templateUrl: './partners-list.html',
  styleUrl: './partners-list.scss',
})
export class PartnersList {
  private readonly api = inject(PartnersApi);
  private readonly route = inject(ActivatedRoute);
  private readonly breakpointObserver = inject(BreakpointObserver);

  @ViewChildren('partnerCard', { read: ElementRef })
  private partnerCards?: QueryList<ElementRef<HTMLElement>>;

  protected readonly searchQuery = signal('');
  protected readonly selectedPartnerId = signal<string | null>(
    this.route.snapshot.queryParamMap.get('selectedPartner'),
  );
  protected readonly mobileView = signal<MobilePartnersView>(
    this.route.snapshot.queryParamMap.get('view') === 'map' ? 'map' : 'list',
  );
  private readonly brokenLogoIds = signal<ReadonlySet<string>>(new Set());
  protected readonly isDesktop = toSignal(
    this.breakpointObserver.observe('(min-width: 701px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );
  // Emits on start and on every "Try again".
  private readonly reload$ = new BehaviorSubject<void>(undefined);
  protected readonly state = toSignal(
    this.reload$.pipe(
      switchMap(() =>
        this.api.getAll().pipe(
          map((partners): PartnersPageState => ({
            status: 'loaded',
            partners,
          })),
          startWith<PartnersPageState>({ status: 'loading', partners: [] }),
          catchError(() => of<PartnersPageState>({ status: 'error', partners: [] })),
        ),
      ),
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
  private readonly worldHeader = viewChild.required<ElementRef<HTMLElement>>('worldHeader');
  // True once the big header has scrolled fully out of view; false again only when it is
  // fully back (top of the page), so the bar doesn't flicker around the threshold.
  private readonly scrolledPastHeader = signal(false);
  protected readonly mapMode = computed(() => !this.isDesktop() && this.mobileView() === 'map');
  protected readonly collapsed = computed(() => this.mapMode() || this.scrolledPastHeader());

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            this.scrolledPastHeader.set(true);
          } else if (entry.intersectionRatio >= 0.99) {
            this.scrolledPastHeader.set(false);
          }
        },
        // The header counts as gone once it is under the sticky desktop top bar.
        // shortcut: read once, so resizing across 701px is off by the bar height until reload.
        {
          rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--top-bar-height').trim() || '0px'} 0px 0px 0px`,
          threshold: [0, 1],
        },
      );
      observer.observe(this.worldHeader().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected readonly selectedPartner = computed(() => {
    const selectedId = this.selectedPartnerId();
    return this.state().partners.find((partner) => partner.id === selectedId) ?? null;
  });
  protected updateSearch(event: Event): void {
    this.searchQuery.set((event.currentTarget as HTMLInputElement).value);
  }

  protected retry(): void {
    this.reload$.next();
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
    // Start each view at the top: the map fills the screen, the list opens expanded.
    this.worldHeader().nativeElement.scrollIntoView({ block: 'start' });
  }

  protected clearSelection(): void {
    this.selectedPartnerId.set(null);
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
      topDiscount: this.topDiscount(partner),
    };
  }

  protected readonly initials = initials;
  protected readonly discountLabel = discountLabel;
  protected readonly tints = ['magenta', 'cyan', 'orange', 'green'];

  protected topDiscount(partner: PartnerView): string | null {
    return partner.offers.find((offer) => offer.discountValue)?.discountValue ?? null;
  }

  protected hasBrokenLogo(partnerId: string): boolean {
    return this.brokenLogoIds().has(partnerId);
  }

  protected markLogoAsBroken(partnerId: string): void {
    this.brokenLogoIds.update((current) => new Set(current).add(partnerId));
  }
}
