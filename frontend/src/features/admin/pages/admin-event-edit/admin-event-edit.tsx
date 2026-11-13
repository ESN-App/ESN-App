import { useParams } from 'react-router';
import { EventEditor } from '../admin-event-create/event-editor';

export default function AdminEventEdit() {
  const { eventId } = useParams();
  return <EventEditor key={eventId} mode="edit" eventId={eventId} />;
}
