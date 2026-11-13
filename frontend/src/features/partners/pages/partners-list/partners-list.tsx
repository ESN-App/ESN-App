import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { EmptyState, LoadingSpinner } from '../../../../shared/components';
import { initials } from '../../../../shared/format';
import { useAsync, useMediaQuery } from '../../../../shared/hooks';
import { Host } from '../../../../shared/host';
import { PartnerListItem, type PartnerListItemView } from '../../components/partner-list-item/partner-list-item';
import { PartnersMap } from '../../components/partners-map/partners-map';
import { partnersApi } from '../../data-access/partners-api';
import type { PartnerView } from '../../data-access/partners.models';
import { createPartnerSlug } from '../../utils/partner-url';
import './partners-list.scss';

type MobilePartnersView = 'list' | 'map';

function partnerSlug(partner: PartnerView): string {
  return partner.slug || createPartnerSlug(partner.name);
}

function partnerListItemView(partner: PartnerView): PartnerListItemView {
  return {
    id: partner.id,
    slug: partnerSlug(partner),
    name: partner.name,
    logoPath: partner.logoPath,
    shortDescription: partner.shortDescription,
    status: partner.status,
    offersCount: partner.offers.length,
  };
}

export default function PartnersList() {
  const [searchParams] = useSearchParams();
  const state = useAsync(() => partnersApi.getAll(), []);
  const partners = useMemo(() => (state.status === 'loaded' ? state.data : []), [state]);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(() =>
    searchParams.get('selectedPartner'),
  );
  const [mobileView, setMobileView] = useState<MobilePartnersView>(() =>
    searchParams.get('view') === 'map' ? 'map' : 'list',
  );
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollMaximum, setScrollMaximum] = useState(0);
  const [brokenLogoIds, setBrokenLogoIds] = useState<ReadonlySet<string>>(new Set());
  const listRef = useRef<HTMLElement>(null);

  const filteredPartners = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) {
      return partners;
    }
    return partners.filter(
      (partner) =>
        partner.name.toLocaleLowerCase().includes(query) ||
        partner.shortDescription.toLocaleLowerCase().includes(query) ||
        partner.offers.some(
          (offer) =>
            offer.title.toLocaleLowerCase().includes(query) || offer.description.toLocaleLowerCase().includes(query),
        ),
    );
  }, [partners, searchQuery]);

  const selectedPartner = partners.find((partner) => partner.id === selectedPartnerId) ?? null;

  const capturePartnerScroll = useCallback((list = listRef.current) => {
    if (!list) {
      return;
    }
    setScrollPosition(list.scrollTop);
    setScrollMaximum(Math.max(0, list.scrollHeight - list.clientHeight));
  }, []);

  // Measure right after the list re-renders (layout is final at this point), so the custom
  // scrollbar's range is correct without waiting for an animation frame.
  useLayoutEffect(() => {
    capturePartnerScroll();
  }, [filteredPartners, isDesktop, mobileView, capturePartnerScroll]);

  const selectPartner = (partnerId: string, scrollCardIntoView = false) => {
    setSelectedPartnerId(partnerId);
    if (!scrollCardIntoView) {
      return;
    }
    requestAnimationFrame(() => {
      const selectedCard = listRef.current?.querySelector<HTMLElement>(`[data-partner-id="${CSS.escape(partnerId)}"]`);
      selectedCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const markLogoAsBroken = (partnerId: string) =>
    setBrokenLogoIds((current) => new Set(current).add(partnerId));

  return (
    <Host tag="app-partners-list">
      <section className="partners-page">
        <header className="partners-header">
          <div className="page-heading">
            <img src="/images/esnstar.png" alt="" />
            <div>
              <p className="eyebrow">ESN Gdańsk</p>
              <h1>Partners</h1>
            </div>
          </div>
          <p className="intro">Enjoy special discounts and offers prepared for ESN members.</p>
        </header>

        <div className="partner-tools">
          <label className="search">
            <span className="search-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Search partners</span>
            <input
              type="search"
              placeholder="Search partners or offers"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
            />
          </label>

          {state.status === 'loaded' && (
            <span className="result-count" aria-live="polite">
              {filteredPartners.length} {filteredPartners.length === 1 ? 'partner' : 'partners'}
            </span>
          )}
        </div>

        {state.status === 'loading' && <LoadingSpinner />}

        {state.status === 'error' && (
          <section className="error-state">
            <span aria-hidden="true">!</span>
            <h2>We could not load the partners</h2>
            <p>Please try again in a moment.</p>
          </section>
        )}

        {state.status === 'loaded' &&
          (partners.length === 0 ? (
            <EmptyState message="No partners are available yet." />
          ) : (
            <>
              {!isDesktop && (
                <div className="mobile-view-switch" role="tablist" aria-label="Partners view">
                  <button
                    id="partners-list-tab"
                    type="button"
                    role="tab"
                    aria-selected={mobileView === 'list'}
                    aria-controls="partners-list-panel"
                    className={mobileView === 'list' ? 'mobile-view-switch__option--active' : undefined}
                    onClick={() => setMobileView('list')}
                  >
                    List
                  </button>
                  <button
                    id="partners-map-tab"
                    type="button"
                    role="tab"
                    aria-selected={mobileView === 'map'}
                    aria-controls="partners-map-panel"
                    className={mobileView === 'map' ? 'mobile-view-switch__option--active' : undefined}
                    onClick={() => setMobileView('map')}
                  >
                    Map
                  </button>
                </div>
              )}

              <div className="partners-split">
                {(isDesktop || mobileView === 'list') && (
                  <div className="partner-list-shell">
                    <section
                      ref={listRef}
                      id="partners-list-panel"
                      className="partner-list-region"
                      role="tabpanel"
                      aria-labelledby="partners-list-tab"
                      aria-label="ESN partners"
                      onScroll={(event) => capturePartnerScroll(event.currentTarget)}
                    >
                      {filteredPartners.length === 0 ? (
                        <EmptyState message="No partners match your search." />
                      ) : (
                        <div className="partner-grid">
                          {filteredPartners.map((partner) => (
                            <PartnerListItem
                              key={partner.id}
                              id={`partner-${partner.id}`}
                              data-partner-id={partner.id}
                              partner={partnerListItemView(partner)}
                              selected={selectedPartnerId === partner.id}
                              selectable
                              onSelectPartner={(id) => selectPartner(id)}
                            />
                          ))}
                        </div>
                      )}
                    </section>

                    <input
                      className="partner-scrollbar"
                      type="range"
                      min="0"
                      max={scrollMaximum}
                      value={scrollPosition}
                      disabled={scrollMaximum === 0}
                      aria-label="Scroll partners list"
                      onChange={(event) => {
                        const position = Number(event.currentTarget.value);
                        if (listRef.current) {
                          listRef.current.scrollTop = position;
                        }
                        setScrollPosition(position);
                      }}
                    />
                  </div>
                )}

                {isDesktop ? (
                  <aside className="partners-map-region" aria-label="Partner locations">
                    <PartnersMap
                      partners={partners}
                      selectedPartnerId={selectedPartnerId}
                      onPartnerSelected={(id) => selectPartner(id, true)}
                    />
                  </aside>
                ) : (
                  mobileView === 'map' && (
                    <section
                      id="partners-map-panel"
                      className="partners-map-region partners-map-region--mobile"
                      role="tabpanel"
                      aria-labelledby="partners-map-tab"
                    >
                      <PartnersMap
                        partners={partners}
                        selectedPartnerId={selectedPartnerId}
                        onPartnerSelected={(id) => selectPartner(id)}
                      />

                      {selectedPartner && (
                        <article className="map-partner-card" aria-live="polite">
                          <button
                            className="map-partner-card__close"
                            type="button"
                            aria-label="Close selected partner"
                            onClick={() => setSelectedPartnerId(null)}
                          >
                            <span aria-hidden="true">×</span>
                          </button>

                          <div className="map-partner-card__logo">
                            <span aria-hidden="true">{initials(selectedPartner.name)}</span>
                            {selectedPartner.logoPath && !brokenLogoIds.has(selectedPartner.id) && (
                              <img
                                src={selectedPartner.logoPath}
                                alt={`${selectedPartner.name} logo`}
                                onError={() => markLogoAsBroken(selectedPartner.id)}
                              />
                            )}
                          </div>

                          <div className="map-partner-card__content">
                            <h2>{selectedPartner.name}</h2>
                            <p>{selectedPartner.shortDescription}</p>
                            <Link
                              className="map-partner-card__details"
                              to={{
                                pathname: `/partners/${partnerSlug(selectedPartner)}`,
                                search: `?view=map&selectedPartner=${encodeURIComponent(selectedPartner.id)}`,
                              }}
                            >
                              View partner details
                              <span className="arrow-icon" aria-hidden="true"></span>
                            </Link>
                          </div>
                        </article>
                      )}
                    </section>
                  )
                )}
              </div>
            </>
          ))}
      </section>
    </Host>
  );
}
