import { Routes } from '@angular/router';
import { PartnerDetails } from './pages/partner-details/partner-details';
import { PartnersList } from './pages/partners-list/partners-list';

export const PARTNERS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', component: PartnersList },
  {
    path: ':partnerSlug',
    component: PartnerDetails,
    data: { hideMobileNavigation: true },
  },
];
