import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  NavigationControl,
} from 'maplibre-gl';
import { PartnerView } from '../../data-access/partners.models';

const DEFAULT_CENTER: [number, number] = [18.6466, 54.352];
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 15;
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

interface PartnerMarker {
  element: HTMLButtonElement;
  marker: MapLibreMarker;
}

export function hasValidPartnerCoordinates(
  partner: Pick<PartnerView, 'latitude' | 'longitude'>,
): partner is PartnerView & { latitude: number; longitude: number } {
  return (
    partner.latitude !== null &&
    partner.longitude !== null &&
    Number.isFinite(partner.latitude) &&
    Number.isFinite(partner.longitude) &&
    partner.latitude >= -90 &&
    partner.latitude <= 90 &&
    partner.longitude >= -180 &&
    partner.longitude <= 180
  );
}

@Component({
  selector: 'app-partners-map',
  templateUrl: './partners-map.html',
  styleUrl: './partners-map.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PartnersMap implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) partners: PartnerView[] = [];
  @Input() selectedPartnerId: string | null = null;
  @Output() readonly partnerSelected = new EventEmitter<string>();

  @ViewChild('mapCanvas', { static: true })
  private readonly mapCanvas?: ElementRef<HTMLDivElement>;

  private map?: MapLibreMap;
  private readonly markers = new Map<string, PartnerMarker>();
  private resizeObserver?: ResizeObserver;
  private hasSetInitialBounds = false;
  private lastCenteredPartnerId: string | null = null;

  get hasMarkers(): boolean {
    return this.partners.some(hasValidPartnerCoordinates);
  }

  ngAfterViewInit(): void {
    if (!this.mapCanvas) {
      return;
    }

    const map = new MapLibreMap({
      container: this.mapCanvas.nativeElement,
      center: DEFAULT_CENTER,
      style: MAP_STYLE_URL,
      zoom: DEFAULT_ZOOM,
    });
    this.map = map;

    map.addControl(
      new NavigationControl({
        showCompass: false,
      }),
      this.isDesktopMap() ? 'top-right' : 'top-left',
    );

    this.resizeObserver = new ResizeObserver(() => this.map?.resize());
    this.resizeObserver.observe(this.mapCanvas.nativeElement);
    this.syncMarkers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['partners'] && this.map) {
      this.syncMarkers();
    }

    if (changes['selectedPartnerId'] && this.map) {
      this.updateMarkerStyles();
      this.centerSelectedMarker();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private syncMarkers(): void {
    if (!this.map) {
      return;
    }

    const mappedPartners = this.partners.filter(hasValidPartnerCoordinates);
    const visibleIds = new Set(mappedPartners.map((partner) => partner.id));

    for (const [partnerId, partnerMarker] of this.markers) {
      if (!visibleIds.has(partnerId)) {
        partnerMarker.marker.remove();
        this.markers.delete(partnerId);
      }
    }

    for (const partner of mappedPartners) {
      const coordinates: [number, number] = [partner.longitude, partner.latitude];
      const existing = this.markers.get(partner.id);

      if (existing) {
        existing.marker.setLngLat(coordinates);
        existing.element.setAttribute('aria-label', `${partner.name} map marker`);
        existing.element.dataset['label'] = partner.name;
        continue;
      }

      const element = document.createElement('button');
      element.className = 'partners-map-marker';
      element.type = 'button';
      element.dataset['label'] = partner.name;
      element.setAttribute('aria-label', `${partner.name} map marker`);
      element.addEventListener('click', () => this.partnerSelected.emit(partner.id));

      const marker = new MapLibreMarker({
        anchor: 'center',
        element,
      })
        .setLngLat(coordinates)
        .addTo(this.map);

      this.markers.set(partner.id, { element, marker });
    }

    this.updateMarkerStyles();

    if (!this.hasSetInitialBounds) {
      this.fitInitialBounds(mappedPartners);
    }
  }

  private fitInitialBounds(
    partners: (PartnerView & { latitude: number; longitude: number })[],
  ): void {
    if (!this.map) {
      return;
    }

    this.hasSetInitialBounds = true;

    if (partners.length === 0) {
      this.map.jumpTo({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
      });
      return;
    }

    const bounds = new LngLatBounds();
    for (const partner of partners) {
      bounds.extend([partner.longitude, partner.latitude]);
    }

    this.map.fitBounds(bounds, {
      maxZoom: SELECTED_ZOOM,
      padding: this.mapPadding(),
      duration: 0,
    });
  }

  private centerSelectedMarker(): void {
    if (
      !this.map ||
      !this.selectedPartnerId ||
      this.selectedPartnerId === this.lastCenteredPartnerId
    ) {
      return;
    }

    const partnerMarker = this.markers.get(this.selectedPartnerId);

    if (!partnerMarker) {
      return;
    }

    this.lastCenteredPartnerId = this.selectedPartnerId;
    this.map.flyTo({
      center: partnerMarker.marker.getLngLat(),
      duration: 350,
      essential: false,
      padding: this.mapPadding(),
      zoom: Math.max(this.map.getZoom(), SELECTED_ZOOM),
    });
  }

  private isDesktopMap(): boolean {
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
  }

  private mapPadding(): number | { top: number; right: number; bottom: number; left: number } {
    if (!this.isDesktopMap() || !this.mapCanvas) {
      return 42;
    }

    return {
      top: 48,
      right: 48,
      bottom: 48,
      left: Math.min(430, this.mapCanvas.nativeElement.clientWidth * 0.38),
    };
  }

  private updateMarkerStyles(): void {
    for (const [partnerId, partnerMarker] of this.markers) {
      const isSelected = partnerId === this.selectedPartnerId;
      partnerMarker.element.classList.toggle('partners-map-marker--selected', isSelected);
      partnerMarker.element.style.zIndex = isSelected ? '1' : '';
    }
  }
}
