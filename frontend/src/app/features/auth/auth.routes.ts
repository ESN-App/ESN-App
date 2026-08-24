import { Routes } from '@angular/router';
import { AuthPage } from './auth-page';
import { ResetPasswordPage } from './pages/reset-password/reset-password-page';

export const AUTH_ROUTES: Routes = [
  { path: '', component: AuthPage, data: { hideMobileNavigation: true } },
  { path: 'reset-password', component: ResetPasswordPage, data: { hideMobileNavigation: true } },
];
