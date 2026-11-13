import { Link, useLocation, useParams } from 'react-router';
import { LoadingSpinner } from '../../../../shared/components';
import { useAsync } from '../../../../shared/hooks';
import { Host } from '../../../../shared/host';
import { EventDetailsView } from '../../components/event-details-view/event-details-view';
import { eventsApi } from '../../data-access/events-api';
import { extractEventId } from '../../utils/event-url';
import './event-details.scss';

export default function EventDetails() {
  const { eventSlug } = useParams();
  const location = useLocation();
  const id = extractEventId(eventSlug ?? '');
  const state = useAsync(() => (id ? eventsApi.getById(id) : Promise.reject()), [id]);

  return (
    <Host tag="app-event-details">
      <main className="details-page">
        <Link
          className="back"
          to={{ pathname: '/events', search: location.search }}
          aria-label="Back to events"
        >
          <span className="back-icon" aria-hidden="true"></span>
          <span className="back-label">Events</span>
        </Link>

        {state.status === 'loaded' ? (
          <EventDetailsView event={state.data} />
        ) : state.status === 'error' ? (
          <section className="not-found">
            <h1>Event not found</h1>
            <p>This event may no longer be available.</p>
            <Link to="/events">Return to events</Link>
          </section>
        ) : (
          <LoadingSpinner />
        )}
      </main>
    </Host>
  );
}
