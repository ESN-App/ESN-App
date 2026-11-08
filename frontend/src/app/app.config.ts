import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { AppUpdate, authInterceptor, retryInterceptor, SiteSettings } from './core';
import { animateDetailTransition, detailDirection, trackRouteTransition } from './shared';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Cross-fade between pages; query-only changes (filters, selected day) stay instant;
      // list <-> details gets the shared hero image and a slide.
      withViewTransitions({
        onViewTransitionCreated: ({ transition, from, to }) => {
          trackRouteTransition(transition);
          const fromPath = routePath(from);
          const toPath = routePath(to);
          if (fromPath === toPath) {
            // No animation instead of skipTransition(), whose AbortError Angular logs in dev.
            const root = document.documentElement;
            root.classList.add('vt-instant');
            const done = () => root.classList.remove('vt-instant');
            transition.finished.then(done, done);
            return;
          }
          const popstate = inject(Router).currentNavigation()?.trigger === 'popstate';
          const direction = detailDirection(fromPath, toPath, popstate);
          if (direction) {
            animateDetailTransition(
              transition,
              direction,
              direction === 'forward' ? toPath : fromPath,
            );
          }
        },
      }),
    ),
    provideHttpClient(withInterceptors([authInterceptor, retryInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(() => inject(AppUpdate).start()),
    // Starts loading the site time zone right away (non-blocking; defaults until it arrives).
    provideAppInitializer(() => void inject(SiteSettings)),
  ],
};

function routePath(root: ActivatedRouteSnapshot): string {
  let leaf = root;
  while (leaf.firstChild) {
    leaf = leaf.firstChild;
  }
  return leaf.pathFromRoot.flatMap((snapshot) => snapshot.url.map((segment) => segment.path)).join('/');
}
