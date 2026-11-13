import { Link, useLocation, useParams } from 'react-router';
import { LoadingSpinner } from '../../../../shared/components';
import { useAsync } from '../../../../shared/hooks';
import { Host } from '../../../../shared/host';
import {
  PartnerDetailsView,
  type PartnerDetailsViewModel,
} from '../../components/partner-details-view/partner-details-view';
import { partnersApi } from '../../data-access/partners-api';
import type { PartnerView } from '../../data-access/partners.models';
import { createPartnerSlug } from '../../utils/partner-url';
import './partner-details.scss';

function detailsViewModel(partner: PartnerView): PartnerDetailsViewModel {
  return {
    id: partner.id,
    slug: partner.slug || createPartnerSlug(partner.name),
    name: partner.name,
    logoPath: partner.logoPath,
    shortDescription: partner.shortDescription,
    status: partner.status,
    offersCount: partner.offers.length,
    description: partner.description,
    address: partner.address,
    websiteUrl: partner.websiteUrl,
    googleMapsUrl: partner.googleMapsUrl,
    latitude: partner.latitude,
    longitude: partner.longitude,
    offers: partner.offers,
  };
}

export default function PartnerDetails() {
  const { partnerSlug } = useParams();
  const location = useLocation();
  const state = useAsync(
    () => (partnerSlug ? partnersApi.getBySlug(partnerSlug).catch(() => null) : Promise.resolve(null)),
    [partnerSlug],
  );

  return (
    <Host tag="app-partner-details">
      <main className="details-page">
        <Link className="back" to={{ pathname: '/partners', search: location.search }} aria-label="Back to partners">
          <span className="back-icon" aria-hidden="true"></span>
          <span className="back-label">Partners</span>
        </Link>

        {state.status === 'loading' ? (
          <LoadingSpinner />
        ) : state.data ? (
          <PartnerDetailsView partner={detailsViewModel(state.data)} />
        ) : (
          <section className="not-found">
            <span aria-hidden="true">?</span>
            <h1>Partner not found</h1>
            <p>This partner may no longer be available.</p>
            <Link to="/partners">Return to partners</Link>
          </section>
        )}
      </main>
    </Host>
  );
}
