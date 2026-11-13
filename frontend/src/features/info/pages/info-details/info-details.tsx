import { Link, useParams } from 'react-router';
import { LoadingSpinner } from '../../../../shared/components';
import { useAsync } from '../../../../shared/hooks';
import { Host } from '../../../../shared/host';
import { InfoDetailsView } from '../../components/info-details-view/info-details-view';
import { infoApi } from '../../data-access/info-api';
import './info-details.scss';

export default function InfoDetails() {
  const { articleSlug } = useParams();
  const state = useAsync(
    () => (articleSlug ? infoApi.getBySlug(articleSlug) : Promise.reject()),
    [articleSlug],
  );

  return (
    <Host tag="app-info-details">
      <main className="details-page">
        <Link className="back" to="/info" aria-label="Back to info">
          <span className="back-icon" aria-hidden="true"></span>
          <span className="back-label">Info</span>
        </Link>

        {state.status === 'loaded' ? (
          <InfoDetailsView article={state.data} />
        ) : state.status === 'error' ? (
          <section className="not-found">
            <span aria-hidden="true">?</span>
            <h1>Information not found</h1>
            <p>This section may no longer be published.</p>
            <Link to="/info">Return to Info</Link>
          </section>
        ) : (
          <LoadingSpinner />
        )}
      </main>
    </Host>
  );
}
