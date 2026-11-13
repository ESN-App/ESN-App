import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './auth';

/** Requires any logged-in user, otherwise redirects to the login page. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return auth.isLoggedIn ? children : <Navigate to="/auth" replace />;
}

/** Requires the Admin role; anonymous users go to login (returning to /admin), others go home. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (!auth.isLoggedIn) {
    return <Navigate to="/auth?returnUrl=%2Fadmin" replace />;
  }

  return auth.isAdmin ? children : <Navigate to="/" replace />;
}
