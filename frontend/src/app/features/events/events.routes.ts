import { Routes } from '@angular/router';
import { EventDetails } from './pages/event-details/event-details';
import { EventsList } from './pages/events-list/events-list';

export const EVENTS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', component: EventsList },
  {
    path: ':eventSlug',
    component: EventDetails,
    data: { hideMobileNavigation: true },
  },
];
