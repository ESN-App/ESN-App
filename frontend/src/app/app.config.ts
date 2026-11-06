import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ActivatedRouteSnapshot, provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor, retryInterceptor } from './core';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Cross-fade between pages; query-only changes (filters, selected day) stay instant.
      withViewTransitions({
        onViewTransitionCreated: ({ transition, from, to }) => {
          if (routePath(from) === routePath(to)) {
            transition.skipTransition();
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
