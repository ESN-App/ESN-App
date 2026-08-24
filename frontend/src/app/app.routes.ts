import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
  },
  {
    path: 'events',
    loadChildren: () => import('./features/events/events.routes').then((m) => m.EVENTS_ROUTES),
  },
  {
    path: 'partners',
    loadChildren: () =>
      import('./features/partners/partners.routes').then((m) => m.PARTNERS_ROUTES),
  },
  { path: 'discounts', redirectTo: 'partners', pathMatch: 'full' },
  {
    path: 'info',
    loadChildren: () => import('./features/info/info.routes').then((m) => m.INFO_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
