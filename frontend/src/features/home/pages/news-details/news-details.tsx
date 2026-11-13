import { Link, useParams } from 'react-router';
import { LoadingSpinner } from '../../../../shared/components';
import { useAsync } from '../../../../shared/hooks';
import { Host } from '../../../../shared/host';
import { NewsDetailsView, type NewsDetailsViewModel } from '../../components/news-details-view/news-details-view';
import { newsApi } from '../../data-access/news-api';
import type { NewsItemDto } from '../../data-access/news.models';
import './news-details.scss';

function detailsView(item: NewsItemDto): NewsDetailsViewModel {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    imagePath: item.imagePath || null,
    createdAt: item.createdAt,
    status: item.status,
  };
}

export default function NewsDetails() {
  const { newsId } = useParams();
  const state = useAsync(() => (newsId ? newsApi.getById(newsId) : Promise.reject()), [newsId]);

  return (
    <Host tag="app-news-details">
      <main className="details-page">
        <Link className="back" to="/" aria-label="Back to home">
          <span className="back-icon" aria-hidden="true"></span>
          <span className="back-label">Home</span>
        </Link>

        {state.status === 'loaded' ? (
          <NewsDetailsView newsItem={detailsView(state.data)} />
        ) : state.status === 'error' ? (
          <section className="not-found">
            <h1>Story not found</h1>
            <p>This news item may no longer be available.</p>
            <Link to="/">Return to home</Link>
          </section>
        ) : (
          <LoadingSpinner />
        )}
      </main>
    </Host>
  );
}
