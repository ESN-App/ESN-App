import { useState, type ReactNode } from 'react';
import { Host } from '../../../../shared/host';
import { EventDetailsView, type EventDetailsViewModel } from '../../../events/components/event-details-view/event-details-view';
import { EventListItem } from '../../../events/components/event-list-item/event-list-item';
import { NewsDetailsView, type NewsDetailsViewModel } from '../../../home/components/news-details-view/news-details-view';
import { NewsListItem, type NewsListItemView } from '../../../home/components/news-list-item/news-list-item';
import { InfoDetailsView, type InfoDetailsViewModel } from '../../../info/components/info-details-view/info-details-view';
import { InfoListItem, type InfoListItemView } from '../../../info/components/info-list-item/info-list-item';
import {
  PartnerDetailsView,
  type PartnerDetailsViewModel,
} from '../../../partners/components/partner-details-view/partner-details-view';
import { PartnerListItem } from '../../../partners/components/partner-list-item/partner-list-item';
import './admin-preview-panel.scss';

export type AdminPreviewDevice = 'desktop' | 'mobile';

interface AdminPreviewPanelProps {
  heading: string;
  primaryTitle: string;
  secondaryTitle: string;
  primary: (device: AdminPreviewDevice) => ReactNode;
  secondary: ReactNode;
}

export function AdminPreviewPanel({ heading, primaryTitle, secondaryTitle, primary, secondary }: AdminPreviewPanelProps) {
  const [previewDevice, setPreviewDevice] = useState<AdminPreviewDevice>('desktop');

  return (
    <Host tag="app-admin-preview-panel" transparent>
      <aside className="preview-panel">
        <header className="preview-header">
          <div>
            <p className="eyebrow">Live preview</p>
            <h2>{heading}</h2>
          </div>
          <div className="device-switch" aria-label="Preview size">
            <button
              type="button"
              className={previewDevice === 'desktop' ? 'active' : undefined}
              onClick={() => setPreviewDevice('desktop')}
            >
              Desktop
            </button>
            <button
              type="button"
              className={previewDevice === 'mobile' ? 'active' : undefined}
              onClick={() => setPreviewDevice('mobile')}
            >
              Mobile
            </button>
          </div>
        </header>

        <div className={`preview-stage${previewDevice === 'mobile' ? ' preview-stage--mobile' : ''}`}>
          <section className="preview-section">
            <h3>{primaryTitle}</h3>
            {primary(previewDevice)}
          </section>

          <section className="preview-section">
            <h3>{secondaryTitle}</h3>
            {secondary}
          </section>
        </div>
      </aside>
    </Host>
  );
}

export function AdminEventPreview({ event }: { event: EventDetailsViewModel }) {
  return (
    <Host tag="app-admin-event-preview" transparent>
      <AdminPreviewPanel
        heading="How the event will look"
        primaryTitle="Events list"
        secondaryTitle="Event details"
        primary={(device) => <EventListItem event={event} interactive={false} displayMode={device} />}
        secondary={<EventDetailsView event={event} interactive={false} showParticipants={false} />}
      />
    </Host>
  );
}

export function AdminNewsPreview({ listItem, details }: { listItem: NewsListItemView; details: NewsDetailsViewModel }) {
  return (
    <Host tag="app-admin-news-preview" transparent>
      <AdminPreviewPanel
        heading="How the news article will look"
        primaryTitle="Home"
        secondaryTitle="News details"
        primary={() => <NewsListItem newsItem={listItem} />}
        secondary={<NewsDetailsView newsItem={details} interactive={false} />}
      />
    </Host>
  );
}

export function AdminInfoPreview({ listItem, details }: { listItem: InfoListItemView; details: InfoDetailsViewModel }) {
  return (
    <Host tag="app-admin-info-preview" transparent>
      <AdminPreviewPanel
        heading="How the article will look"
        primaryTitle="Info list"
        secondaryTitle="Info details"
        primary={() => <InfoListItem article={listItem} interactive={false} />}
        secondary={<InfoDetailsView article={details} interactive={false} />}
      />
    </Host>
  );
}

export function AdminPartnerPreview({ partner }: { partner: PartnerDetailsViewModel }) {
  return (
    <Host tag="app-admin-partner-preview" transparent>
      <AdminPreviewPanel
        heading="How the partner will look"
        primaryTitle="Partners list"
        secondaryTitle="Partner details"
        primary={() => <PartnerListItem partner={partner} interactive={false} />}
        secondary={<PartnerDetailsView partner={partner} interactive={false} />}
      />
    </Host>
  );
}
