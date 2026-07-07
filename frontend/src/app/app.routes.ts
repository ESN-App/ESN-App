import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'events' },
  {
    path: 'events',
    loadChildren: () => import('./features/events/events.routes').then((m) => m.EVENTS_ROUTES),
  },
  {
    path: 'discounts',
    loadChildren: () =>
      import('./features/discounts/discounts.routes').then((m) => m.DISCOUNTS_ROUTES),
  },
  {
    path: 'info',
    loadChildren: () => import('./features/info/info.routes').then((m) => m.INFO_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: 'events' },
];
