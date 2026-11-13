import { useState } from 'react';
import { Host } from '../../../../shared/host';
import './news-list-item.scss';

export interface NewsListItemView {
  id: string;
  title: string;
  imagePath: string | null;
  status: number;
}

/**
 * Standalone rendering of a home-carousel news card, used by the admin live preview.
 * The carousel in home-highlights still renders its own markup: its cards are direct
 * grid items that rely on grid-auto-columns and scroll-snap-align, so wrapping them in
 * a component host would break sizing and snapping. Keep the two in sync by hand.
 */
export function NewsListItem({ newsItem: item }: { newsItem: NewsListItemView }) {
  const [imageBroken, setImageBroken] = useState(false);

  return (
    <Host tag="app-news-list-item">
      <div className={`news-card${item.status === 0 ? ' news-card--draft' : ''}`}>
        {item.imagePath && !imageBroken ? (
          <img src={item.imagePath} alt={item.title} onError={() => setImageBroken(true)} />
        ) : (
          <span className="image-fallback" aria-hidden="true"></span>
        )}
        <span className="news-overlay">
          <span className={`news-badge${item.status === 0 ? ' draft-badge' : ''}`}>
            {item.status === 0 ? 'Draft' : 'New'}
          </span>
          <strong>{item.title}</strong>
        </span>
      </div>
    </Host>
  );
}
