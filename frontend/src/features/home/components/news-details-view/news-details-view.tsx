import { useState } from 'react';
import { DraftPreviewBanner } from '../../../../shared/components';
import { formatDate } from '../../../../shared/format';
import { Host } from '../../../../shared/host';
import './news-details-view.scss';

export interface NewsDetailsViewModel {
  id: string;
  title: string;
  description: string;
  imagePath: string | null;
  createdAt: string | null;
  status: number;
}

interface NewsDetailsViewProps {
  newsItem: NewsDetailsViewModel;
  interactive?: boolean;
}

export function NewsDetailsView({ newsItem: item, interactive = true }: NewsDetailsViewProps) {
  const [brokenImage, setBrokenImage] = useState<string | null>(null);
  const imageBroken = brokenImage !== null && brokenImage === item.imagePath;
  const showImage = Boolean(item.imagePath) && !imageBroken;

  return (
    <Host tag="app-news-details-view">
      <article>
        {item.status === 0 && <DraftPreviewBanner />}

        <section className={`hero${showImage ? '' : ' no-image'}`}>
          {showImage && (
            <div className="hero-image">
              <img
                src={item.imagePath ?? undefined}
                alt={item.title}
                loading={interactive ? 'lazy' : undefined}
                onError={() => setBrokenImage(item.imagePath)}
              />
            </div>
          )}

          <div className="hero-copy">
            <p className="eyebrow">
              Fresh from ESN
              {item.createdAt && <> &middot; {formatDate(item.createdAt, 'd MMMM yyyy')}</>}
            </p>
            <h1>{item.title}</h1>
          </div>
        </section>

        <section className="about">
          <p className="eyebrow">Story</p>
          <p>{item.description}</p>
        </section>
      </article>
    </Host>
  );
}
