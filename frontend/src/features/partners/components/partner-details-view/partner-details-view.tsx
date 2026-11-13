import { useState } from 'react';
import { DraftPreviewBanner, InactiveBadge } from '../../../../shared/components';
import { initials } from '../../../../shared/format';
import { Host } from '../../../../shared/host';
import type { PartnerOffer } from '../../data-access/partners.models';
import type { PartnerListItemView } from '../partner-list-item/partner-list-item';
import './partner-details-view.scss';

export interface PartnerDetailsViewModel extends PartnerListItemView {
  description: string;
  address: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  offers: PartnerOffer[];
}

function mapUrl(latitude: number | null, longitude: number | null, fallbackUrl: string | null): string | null {
  if (latitude !== null && longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  return fallbackUrl;
}

export function PartnerDetailsView({
  partner: item,
  interactive = true,
}: {
  partner: PartnerDetailsViewModel;
  interactive?: boolean;
}) {
  const [logoBroken, setLogoBroken] = useState(false);
  const mapsUrl = mapUrl(item.latitude, item.longitude, item.googleMapsUrl);

  return (
    <Host tag="app-partner-details-view">
      <article>
        {item.status === 0 && <DraftPreviewBanner />}

        <section className="partner-hero">
          <div className="hero-logo">
            {item.logoPath && !logoBroken ? (
              <img src={item.logoPath} alt={`${item.name} logo`} onError={() => setLogoBroken(true)} />
            ) : (
              <span aria-hidden="true">{initials(item.name)}</span>
            )}
          </div>

          <div className="hero-copy">
            <div className="eyebrow-row">
              <p className="eyebrow">ESN GDAŃSK PARTNER</p>
              {item.status === 2 && <InactiveBadge />}
            </div>
            <h1>{item.name}</h1>
            <p className="summary">{item.shortDescription}</p>

            {item.address && (
              <div className="hero-location">
                <span className="location-icon" aria-hidden="true"></span>
                <div>
                  <strong>{item.address}</strong>
                  {mapsUrl &&
                    (interactive ? (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        Open in maps
                      </a>
                    ) : (
                      <span className="map-label">Open in maps</span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {item.offers.length > 0 && (
          <section className="offers" aria-labelledby="offers-title">
            <div className="section-heading">
              <h2 id="offers-title">Benefits</h2>
              <span className="offer-count">
                {item.offers.length} {item.offers.length === 1 ? 'offer' : 'offers'}
              </span>
            </div>

            <div className="offer-list">
              {item.offers.map((offer) => (
                <article className="offer" key={offer.id}>
                  <div className="offer-title">
                    <span className="offer-icon" aria-hidden="true"></span>
                    <h3>{offer.title}</h3>
                  </div>
                  <p>{offer.description}</p>

                  {offer.instructions && (
                    <div className="offer-detail">
                      <strong>How to use it</strong>
                      <span>{offer.instructions}</span>
                    </div>
                  )}
                  {offer.terms && (
                    <div className="offer-detail">
                      <strong>Terms</strong>
                      <span>{offer.terms}</span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="about">
          <p className="eyebrow">About the partner</p>
          <p>{item.description}</p>
        </section>

        {item.websiteUrl &&
          (interactive ? (
            <a className="website-cta" href={item.websiteUrl} target="_blank" rel="noopener noreferrer">
              Visit partner website
              <span className="cta-arrow" aria-hidden="true"></span>
            </a>
          ) : (
            <div className="website-cta">
              Visit partner website
              <span className="cta-arrow" aria-hidden="true"></span>
            </div>
          ))}
      </article>
    </Host>
  );
}
