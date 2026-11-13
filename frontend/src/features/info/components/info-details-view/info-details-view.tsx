import { useState } from 'react';
import { DraftPreviewBanner } from '../../../../shared/components';
import { Host } from '../../../../shared/host';
import './info-details-view.scss';

export interface InfoDetailsViewModel {
  id: string;
  title: string;
  content: string;
  imagePath: string | null;
  externalLinks: string[];
  status: number;
}

interface InfoDetailsViewProps {
  article: InfoDetailsViewModel;
  interactive?: boolean;
}

export function InfoDetailsView({ article: loaded, interactive = true }: InfoDetailsViewProps) {
  const [imageBroken, setImageBroken] = useState(false);

  return (
    <Host tag="app-info-details-view">
      <article className="article">
        {loaded.status === 0 && <DraftPreviewBanner />}

        <section className="info-hero">
          <div className="hero-image">
            {loaded.imagePath && !imageBroken ? (
              <img src={loaded.imagePath} alt={loaded.title} onError={() => setImageBroken(true)} />
            ) : (
              <span className="image-fallback" aria-hidden="true"></span>
            )}
          </div>

          <div className="hero-copy">
            <p className="eyebrow">ESN Gdańsk info</p>
            <h1>{loaded.title}</h1>
          </div>
        </section>

        <section className="content-section" aria-labelledby="article-content-title">
          <div className="section-heading">
            <h2 id="article-content-title">About</h2>
          </div>
          <p>{loaded.content}</p>
        </section>

        {loaded.externalLinks.length > 0 && (
          <div className="link-list">
            {loaded.externalLinks.map((link, index) =>
              interactive ? (
                <a key={`${link}-${index}`} className="read-more-cta" href={link} target="_blank" rel="noopener noreferrer">
                  Read more about it
                  <span className="external-arrow" aria-hidden="true"></span>
                </a>
              ) : (
                <span key={`${link}-${index}`} className="read-more-cta">
                  Read more about it
                  <span className="external-arrow" aria-hidden="true"></span>
                </span>
              ),
            )}
          </div>
        )}
      </article>
    </Host>
  );
}
