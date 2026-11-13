import type { SyntheticEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { EventStatusTitle } from '../../../../shared/components';
import { formatDate, formatPrice } from '../../../../shared/format';
import { Host } from '../../../../shared/host';
import { isSameCalendarDay } from '../../utils/event-date';
import { createEventSlug } from '../../utils/event-url';
import './event-list-item.scss';

export interface EventListItemView {
  id: string;
  title: string;
  shortDescription: string;
  location: string;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
  imagePath: string | null;
  currentParticipants: number | null;
  maximumParticipants: number | null;
  price: number;
  status: number;
}

interface EventListItemProps {
  event: EventListItemView;
  interactive?: boolean;
  displayMode?: 'auto' | 'desktop' | 'mobile';
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>): void {
  event.currentTarget.style.display = 'none';
}

export function EventListItem({ event: item, interactive = true, displayMode = 'auto' }: EventListItemProps) {
  const location = useLocation();
  // queryParamsHandling="preserve": keep the selected month when opening details.
  const eventLink = { pathname: `/events/${createEventSlug(item.title, item.id)}`, search: location.search };

  return (
    <Host tag="app-event-list-item" className={displayMode === 'desktop' ? 'event-list-item--desktop' : undefined}>
      <article className={`event-item${item.status === 0 ? ' event-item--draft' : ''}`}>
        {interactive && (
          <Link className="mobile-card-link" to={eventLink} aria-label={`Read more about ${item.title}`}></Link>
        )}

        <div className="event-image">
          <span aria-hidden="true">{item.startsAt ? formatDate(item.startsAt, 'dd') : '—'}</span>
          {item.imagePath && (
            <img
              src={item.imagePath}
              alt={item.title}
              loading={interactive ? 'lazy' : undefined}
              onError={hideBrokenImage}
            />
          )}
        </div>

        <div className="event-copy">
          <EventStatusTitle status={item.status}>
            <h3>{item.title}</h3>
          </EventStatusTitle>
          <p className="description">{item.shortDescription}</p>

          <div className="desktop-facts">
            <p className="location desktop-location">
              <span className="event-icon location-icon" aria-hidden="true"></span>
              <span>{item.location}</span>
            </p>
            <strong className="price">
              <span className="event-icon wallet-icon" aria-hidden="true"></span>
              <span>{formatPrice(item.price)}</span>
            </strong>
            {item.currentParticipants !== null && (
              <span className="participants">
                <span className="event-icon participants-icon" aria-hidden="true"></span>
                <span>
                  {item.currentParticipants}
                  {item.maximumParticipants !== null && ` /${item.maximumParticipants}`} going
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="event-meta">
          <p className="event-date">
            {item.startsAt ? (
              <>
                <time dateTime={new Date(item.startsAt).toISOString()}>{formatDate(item.startsAt, 'd MMM')}</time>
                {item.endsAt && !isSameCalendarDay(item.startsAt, item.endsAt) && (
                  <span className="event-end">— {formatDate(item.endsAt, 'dd MMM')}</span>
                )}
              </>
            ) : (
              <time>Date</time>
            )}
          </p>

          {interactive ? (
            <Link className="arrow-link" to={eventLink} aria-label={`Read more about ${item.title}`}>
              <span className="details-label">Read more</span>
              <span className="arrow" aria-hidden="true"></span>
            </Link>
          ) : (
            <span className="arrow-link" aria-hidden="true">
              <span className="details-label">Read more</span>
              <span className="arrow"></span>
            </span>
          )}
        </div>
      </article>
    </Host>
  );
}
