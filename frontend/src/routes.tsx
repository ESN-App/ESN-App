import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { App } from './App';
import { AdminGuard } from './core/guards';

export interface RouteHandle {
  /** Hide the floating mobile navigation (details pages, admin, auth). */
  hideMobileNavigation?: boolean;
}

function page(load: () => Promise<{ default: ComponentType }>): ReactNode {
  const Page = lazy(load);
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}

function adminPage(load: () => Promise<{ default: ComponentType }>): ReactNode {
  return <AdminGuard>{page(load)}</AdminGuard>;
}

const hidden: RouteHandle = { hideMobileNavigation: true };

const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      // Home feature (also hosts News, which has no feature folder of its own).
      { index: true, element: page(() => import('./features/home/home-page')) },
      { path: 'preview', element: null, handle: hidden },
      {
        path: 'news/:newsId',
        element: page(() => import('./features/home/pages/news-details/news-details')),
        handle: hidden,
      },

      { path: 'events', element: page(() => import('./features/events/pages/events-list/events-list')) },
      {
        path: 'events/:eventSlug',
        element: page(() => import('./features/events/pages/event-details/event-details')),
        handle: hidden,
      },

      {
        path: 'partners',
        element: page(() => import('./features/partners/pages/partners-list/partners-list')),
      },
      {
        path: 'partners/:partnerSlug',
        element: page(() => import('./features/partners/pages/partner-details/partner-details')),
        handle: hidden,
      },
      { path: 'discounts', element: <Navigate to="/partners" replace /> },

      { path: 'info', element: page(() => import('./features/info/pages/info-list/info-list')) },
      {
        path: 'info/:articleSlug',
        element: page(() => import('./features/info/pages/info-details/info-details')),
        handle: hidden,
      },

      { path: 'auth', element: page(() => import('./features/auth/auth-page')), handle: hidden },
      {
        path: 'auth/reset-password',
        element: page(() => import('./features/auth/pages/reset-password/reset-password-page')),
        handle: hidden,
      },

      {
        path: 'admin',
        handle: hidden,
        children: [
          { index: true, element: adminPage(() => import('./features/admin/pages/admin-panel/admin-panel')), handle: hidden },
          {
            path: 'admins/new',
            element: adminPage(() => import('./features/admin/pages/admin-admin-create/admin-admin-create')),
            handle: hidden,
          },
          {
            path: 'events/new',
            element: adminPage(() => import('./features/admin/pages/admin-event-create/admin-event-create')),
            handle: hidden,
          },
          {
            path: 'events/:eventId/edit',
            element: adminPage(() => import('./features/admin/pages/admin-event-edit/admin-event-edit')),
            handle: hidden,
          },
          {
            path: 'partners/new',
            element: adminPage(() => import('./features/admin/pages/admin-partner-create/admin-partner-create')),
            handle: hidden,
          },
          {
            path: 'partners/:partnerSlug/edit',
            element: adminPage(() => import('./features/admin/pages/admin-partner-edit/admin-partner-edit')),
            handle: hidden,
          },
          {
            path: 'news/new',
            element: adminPage(() => import('./features/admin/pages/admin-news-create/admin-news-create')),
            handle: hidden,
          },
          {
            path: 'news/:newsId/edit',
            element: adminPage(() => import('./features/admin/pages/admin-news-edit/admin-news-edit')),
            handle: hidden,
          },
          {
            path: 'info/new',
            element: adminPage(() => import('./features/admin/pages/admin-info-create/admin-info-create')),
            handle: hidden,
          },
          {
            path: 'info/:infoId/edit',
            element: adminPage(() => import('./features/admin/pages/admin-info-edit/admin-info-edit')),
            handle: hidden,
          },
        ],
      },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
