import { Routes } from '@angular/router';
import { BlankPreviewPage } from './blank-preview-page';
import { HomePage } from './home-page';
import { NewsDetails } from './pages/news-details/news-details';

export const HOME_ROUTES: Routes = [
  { path: 'preview', component: BlankPreviewPage, data: { hideMobileNavigation: true } },
  {
    path: 'news/:newsId',
    component: NewsDetails,
    data: { hideMobileNavigation: true },
  },
  { path: '', component: HomePage },
];
