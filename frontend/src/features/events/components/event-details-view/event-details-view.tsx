import { useState } from 'react';
import { CancelledBadge, DraftPreviewBanner } from '../../../../shared/components';
import { formatDate, formatPrice } from '../../../../shared/format';
import { Host } from '../../../../shared/host';
import { isSameCalendarDay } from '../../utils/event-date';
import { eventMapUrl } from '../../utils/event-map';
import type { EventListItemView } from '../event-list-item/event-list-item';
import './event-details-view.scss';

export interface EventDetailsViewModel extends EventListItemView {
  description: string;
  googleMapsUrl: string | null;
  registrationUrl: string | null;
  minimumParticipants: number | null;
}

interface EventDetailsViewProps {
  event: EventDetailsViewModel;
  interactive?: boolean;
  showParticipants?: boolean;
}

export function EventDetailsView({ event: item, interactive = true, showParticipants = true }: EventDetailsViewProps) {
  const [imageBroken, setImageBroken] = useState(false);
  const showImage = Boolean(item.imagePath) && !imageBroken;
  const mapsUrl = eventMapUrl(item.googleMapsUrl);
  const participantsVisible = showParticipants && item.currentParticipants !== null;

  return (
    <Host tag="app-event-details-view">
      <article>
        {item.status === 0 && <DraftPreviewBanner />}

        <section className={`hero${showImage ? '' : ' no-image'}`}>
          {showImage && (
            <div className="hero-image">
              <img src={item.imagePath ?? undefined} alt={item.title} onError={() => setImageBroken(true)} />
            </div>
          )}

          <div className="hero-copy">
            <div className="eyebrow-row">
              <p className="eyebrow">ESN Gdańsk event</p>
              {item.status === 2 && <CancelledBadge />}
            </div>
            <h1>{item.title}</h1>
            <p className="summary">{item.shortDescription}</p>
          </div>
        </section>

        <section className={`facts${participantsVisible ? ' has-participants' : ''}`} aria-label="Event information">
          <div className="fact">
            <span className="fact-icon calendar" aria-hidden="true"></span>
            <div>
              <small>Date &amp; time</small>
              {item.startsAt ? (
                <>
                  <strong>{formatDate(item.startsAt, 'EEEE, d MMMM yyyy')}</strong>
                  <span>
                    {formatDate(item.startsAt, 'HH:mm')}
                    {item.endsAt &&
                      !isSameCalendarDay(item.startsAt, item.endsAt) &&
                      ` – ${formatDate(item.endsAt, 'd MMM yyyy, HH:mm')}`}
                  </span>
                </>
              ) : (
                <strong>Choose a date</strong>
              )}
            </div>
          </div>

          <div className="fact">
            <span className="fact-icon marker" aria-hidden="true"></span>
            <div>
              <small>Location</small>
              <div className="location-value">
                <strong>{item.location}</strong>
                {mapsUrl &&
                  (interactive ? (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                      Open in maps
                    </a>
                  ) : (
                    <span className="map-label">Open in maps</span>
                  ))}
              </div>
            </div>
          </div>

          <div className="fact">
            <span className="fact-icon wallet" aria-hidden="true"></span>
            <div>
              <small>Price</small>
              <strong>{formatPrice(item.price)}</strong>
            </div>
          </div>

          {participantsVisible && (
            <div className="fact participants-fact">
              <span className="fact-icon users" aria-hidden="true"></span>
              <div>
                <small>Participants</small>
                <strong>
                  {item.currentParticipants}
                  {item.maximumParticipants !== null && ` / ${item.maximumParticipants}`} going
                </strong>
                {item.minimumParticipants !== null && <span>Minimum {item.minimumParticipants}</span>}
              </div>
            </div>
          )}
        </section>

        <section className="about">
          <p className="eyebrow">About the event</p>
          <p>{item.description}</p>
        </section>

        {item.registrationUrl &&
          (interactive ? (
            <a className="register" href={item.registrationUrl} target="_blank" rel="noopener noreferrer">
              Register for this event
              <span className="register-arrow" aria-hidden="true"></span>
            </a>
          ) : (
            <div className="register">
              Register for this event
              <span className="register-arrow" aria-hidden="true"></span>
            </div>
          ))}
      </article>
    </Host>
  );
}
