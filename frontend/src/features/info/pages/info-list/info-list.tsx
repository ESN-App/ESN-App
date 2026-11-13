import { EmptyState, LoadingSpinner } from '../../../../shared/components';
import { useAsync } from '../../../../shared/hooks';
import { Host } from '../../../../shared/host';
import { InfoListItem } from '../../components/info-list-item/info-list-item';
import { infoApi } from '../../data-access/info-api';
import './info-list.scss';

async function loadArticles() {
  const articles = await infoApi.getAll();
  return [...articles].sort(
    (left, right) => left.displayOrder - right.displayOrder || left.title.localeCompare(right.title),
  );
}

export default function InfoList() {
  const state = useAsync(loadArticles, []);

  return (
    <Host tag="app-info-list">
      <section className="info-page">
        <header className="info-header">
          <div className="page-heading">
            <img src="/images/esnstar.png" alt="" />
            <div>
              <p className="eyebrow">ESN Gdańsk</p>
              <h1>Information</h1>
            </div>
          </div>
          <p className="intro">
            Everything you need for student life, the ESN community and your stay in Gdańsk.
          </p>
        </header>

        {state.status === 'loading' && <LoadingSpinner />}
        {state.status === 'error' && (
          <section className="error-state">
            <span aria-hidden="true">!</span>
            <h2>We could not load the information</h2>
            <p>Please try again in a moment.</p>
          </section>
        )}
        {state.status === 'loaded' &&
          (state.data.length === 0 ? (
            <EmptyState message="No information is available yet." />
          ) : (
            <div className="info-grid" aria-label="Information sections">
              {state.data.map((article) => (
                <InfoListItem key={article.id} article={article} />
              ))}
            </div>
          ))}
      </section>
    </Host>
  );
}
