import { Routes } from '@angular/router';
import { adminGuard } from '../../core';
import { AdminPanel } from './pages/admin-panel/admin-panel';
import { AdminAdminCreate } from './pages/admin-admin-create/admin-admin-create';
import { AdminEventCreate } from './pages/admin-event-create/admin-event-create';
import { AdminEventEdit } from './pages/admin-event-edit/admin-event-edit';
import { AdminInfoCreate } from './pages/admin-info-create/admin-info-create';
import { AdminInfoEdit } from './pages/admin-info-edit/admin-info-edit';
import { AdminNewsCreate } from './pages/admin-news-create/admin-news-create';
import { AdminNewsEdit } from './pages/admin-news-edit/admin-news-edit';
import { AdminPartnerCreate } from './pages/admin-partner-create/admin-partner-create';
import { AdminPartnerEdit } from './pages/admin-partner-edit/admin-partner-edit';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'admins/new',
    component: AdminAdminCreate,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'events/new',
    component: AdminEventCreate,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'events/:eventId/edit',
    component: AdminEventEdit,
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
    component: AdminPartnerEdit,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'news/new',
    component: AdminNewsCreate,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'news/:newsId/edit',
    component: AdminNewsEdit,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'info/new',
    component: AdminInfoCreate,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'info/:infoId/edit',
    component: AdminInfoEdit,
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
