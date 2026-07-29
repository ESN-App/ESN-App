import { Routes } from '@angular/router';
import { InfoDetails } from './pages/info-details/info-details';
import { InfoList } from './pages/info-list/info-list';

export const INFO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', component: InfoList },
  {
    path: ':articleSlug',
    component: InfoDetails,
    data: { hideMobileNavigation: true },
  },
];
