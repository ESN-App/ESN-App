import { LngLatBounds, Map as MapLibreMap, Marker as MapLibreMarker, NavigationControl } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { Host } from '../../../../shared/host';
import type { PartnerView } from '../../data-access/partners.models';
import { hasValidPartnerCoordinates } from './partners-map-utils';
import './partners-map.scss';

const DEFAULT_CENTER: [number, number] = [18.6466, 54.352];
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 15;
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

interface PartnerMarker {
  element: HTMLButtonElement;
  marker: MapLibreMarker;
}

interface PartnersMapProps {
  partners: PartnerView[];
  selectedPartnerId: string | null;
  onPartnerSelected: (partnerId: string) => void;
}

function isDesktopMap(): boolean {
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

/** MapLibre map of partner locations; the imperative map lives in refs, like the Angular component. */
export function PartnersMap({ partners, selectedPartnerId, onPartnerSelected }: PartnersMapProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef(new Map<string, PartnerMarker>());
  const hasSetInitialBoundsRef = useRef(false);
  const lastCenteredPartnerIdRef = useRef<string | null>(null);
  const onSelectedRef = useRef(onPartnerSelected);

  useEffect(() => {
    onSelectedRef.current = onPartnerSelected;
  });

  const mapPadding = () => {
    const canvas = canvasRef.current;
    if (!isDesktopMap() || !canvas) {
      return 42;
    }
    return { top: 48, right: 48, bottom: 48, left: Math.min(430, canvas.clientWidth * 0.38) };
  };

  // Create the map once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const map = new MapLibreMap({ container: canvas, center: DEFAULT_CENTER, style: MAP_STYLE_URL, zoom: DEFAULT_ZOOM });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), isDesktopMap() ? 'top-right' : 'top-left');

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(canvas);
    const markers = markersRef.current;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      markers.clear();
      mapRef.current = null;
      hasSetInitialBoundsRef.current = false;
      lastCenteredPartnerIdRef.current = null;
    };
  }, []);

  // Sync markers with the partners list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const markers = markersRef.current;
    const mappedPartners = partners.filter(hasValidPartnerCoordinates);
    const visibleIds = new Set(mappedPartners.map((partner) => partner.id));

    for (const [partnerId, partnerMarker] of markers) {
      if (!visibleIds.has(partnerId)) {
        partnerMarker.marker.remove();
        markers.delete(partnerId);
      }
    }

    for (const partner of mappedPartners) {
      const coordinates: [number, number] = [partner.longitude, partner.latitude];
      const existing = markers.get(partner.id);

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
      element.addEventListener('click', () => onSelectedRef.current(partner.id));

      const marker = new MapLibreMarker({ anchor: 'center', element }).setLngLat(coordinates).addTo(map);
      markers.set(partner.id, { element, marker });
    }

    if (!hasSetInitialBoundsRef.current) {
      hasSetInitialBoundsRef.current = true;

      if (mappedPartners.length === 0) {
        map.jumpTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
      } else {
        const bounds = new LngLatBounds();
        for (const partner of mappedPartners) {
          bounds.extend([partner.longitude, partner.latitude]);
        }
        map.fitBounds(bounds, { maxZoom: SELECTED_ZOOM, padding: mapPadding(), duration: 0 });
      }
    }
  }, [partners]);

  // Highlight and fly to the selected partner.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    for (const [partnerId, partnerMarker] of markersRef.current) {
      const isSelected = partnerId === selectedPartnerId;
      partnerMarker.element.classList.toggle('partners-map-marker--selected', isSelected);
      // Markers are DOM elements owned by maplibre, not React state.
      // eslint-disable-next-line react-hooks/immutability
      partnerMarker.element.style.zIndex = isSelected ? '1' : '';
    }

    if (!selectedPartnerId || selectedPartnerId === lastCenteredPartnerIdRef.current) {
      return;
    }
    const partnerMarker = markersRef.current.get(selectedPartnerId);
    if (!partnerMarker) {
      return;
    }

    lastCenteredPartnerIdRef.current = selectedPartnerId;
    map.flyTo({
      center: partnerMarker.marker.getLngLat(),
      duration: 350,
      essential: false,
      padding: mapPadding(),
      zoom: Math.max(map.getZoom(), SELECTED_ZOOM),
    });
  }, [selectedPartnerId, partners]);

  return (
    <Host tag="app-partners-map">
      <div
        ref={canvasRef}
        className="partners-map__canvas"
        role="application"
        aria-label="Interactive map of ESN partners"
      ></div>

      {!partners.some(hasValidPartnerCoordinates) && (
        <div className="partners-map__empty" role="status">
          <span aria-hidden="true">⌖</span>
          <strong>No partner locations to show</strong>
          <p>Partners without coordinates are still available in the list.</p>
        </div>
      )}
    </Host>
  );
}
