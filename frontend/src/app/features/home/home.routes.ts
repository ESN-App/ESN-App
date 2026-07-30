import { Routes } from '@angular/router';
import { BlankPreviewPage } from './blank-preview-page';
import { HomePage } from './home-page';

export const HOME_ROUTES: Routes = [
  { path: 'preview', component: BlankPreviewPage, data: { hideMobileNavigation: true } },
  { path: '', component: HomePage },
];
