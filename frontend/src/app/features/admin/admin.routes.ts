import { Routes } from '@angular/router';
import { adminGuard } from '../../core';
import { AdminPanel } from './pages/admin-panel/admin-panel';
import { AdminAdminCreate } from './pages/admin-admin-create/admin-admin-create';
import { AdminEventForm } from './pages/admin-event-form/admin-event-form';
import { AdminInfoForm } from './pages/admin-info-form/admin-info-form';
import { AdminNewsForm } from './pages/admin-news-form/admin-news-form';
import { AdminPartnerForm } from './pages/admin-partner-form/admin-partner-form';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'admins/new',
    component: AdminAdminCreate,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'events/new',
    component: AdminEventForm,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'events/:eventId/edit',
    component: AdminEventForm,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'partners/new',
    component: AdminPartnerForm,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'partners/:partnerSlug/edit',
    component: AdminPartnerForm,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'news/new',
    component: AdminNewsForm,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'news/:newsId/edit',
    component: AdminNewsForm,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'info/new',
    component: AdminInfoForm,
    canActivate: [adminGuard],
    data: { hideMobileNavigation: true },
  },
  {
    path: 'info/:infoId/edit',
    component: AdminInfoForm,
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
