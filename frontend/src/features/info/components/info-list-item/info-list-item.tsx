import { useState } from 'react';
import { Link } from 'react-router';
import { Host } from '../../../../shared/host';
import './info-list-item.scss';

export interface InfoListItemView {
  id: string;
  title: string;
  slug: string | null;
  content: string;
  imagePath: string | null;
  status: number;
}

interface InfoListItemProps {
  article: InfoListItemView;
  interactive?: boolean;
}

export function InfoListItem({ article: item, interactive = true }: InfoListItemProps) {
  const [imageBroken, setImageBroken] = useState(false);
  const infoLink = `/info/${item.slug ?? ''}`;

  return (
    <Host tag="app-info-list-item">
      <article className={`info-card${item.status === 0 ? ' info-card--draft' : ''}`}>
        {interactive && (
          <Link className="card-link" to={infoLink} aria-label={`Read more about ${item.title}`}></Link>
        )}

        <div className="article-image">
          {item.imagePath && !imageBroken ? (
            <img
              src={item.imagePath}
              alt={item.title}
              loading={interactive ? 'lazy' : undefined}
              onError={() => setImageBroken(true)}
            />
          ) : (
            <span className="image-fallback" aria-hidden="true"></span>
          )}
        </div>

        <div className="article-copy">
          {item.status === 0 && <span className="draft-badge">Draft</span>}
          <h2>{item.title}</h2>
          <p className="article-description">{item.content}</p>
        </div>

        {interactive ? (
          <Link className="details-link" to={infoLink} aria-label={`Read more about ${item.title}`}>
            <span>Read more</span>
            <span className="arrow-icon" aria-hidden="true"></span>
          </Link>
        ) : (
          <span className="details-link" aria-hidden="true">
            <span>Read more</span>
            <span className="arrow-icon"></span>
          </span>
        )}
      </article>
    </Host>
  );
}
