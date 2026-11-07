import {
  ApplicationConfig,
  inject,
  isDevMode,
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
import { authInterceptor, retryInterceptor } from './core';
import { animateDetailTransition, detailDirection } from './shared';
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
          const fromPath = routePath(from);
          const toPath = routePath(to);
          if (fromPath === toPath) {
            transition.skipTransition();
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
  ],
};

function routePath(root: ActivatedRouteSnapshot): string {
  let leaf = root;
  while (leaf.firstChild) {
    leaf = leaf.firstChild;
  }
  return leaf.pathFromRoot.flatMap((snapshot) => snapshot.url.map((segment) => segment.path)).join('/');
}
