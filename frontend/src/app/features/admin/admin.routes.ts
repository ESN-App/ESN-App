import { Routes } from '@angular/router';
import { adminGuard } from '../../core';
import { AdminPanel } from './pages/admin-panel/admin-panel';
import { AdminEventCreate } from './pages/admin-event-create/admin-event-create';
import { AdminPartnerCreate } from './pages/admin-partner-create/admin-partner-create';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'events/new',
    component: AdminEventCreate,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'events/:eventId/edit',
    component: AdminEventCreate,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'partners/new',
    component: AdminPartnerCreate,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'partners/:partnerSlug/edit',
    component: AdminPartnerCreate,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: '',
    component: AdminPanel,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
];
