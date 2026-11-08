import { DOCUMENT, inject, Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const ADMIN_FORM_URL = /^\/admin\/.+\/(new|edit)(?:[/?#]|$)/;

/** A ready update may reload right away only while nobody is looking and no admin form can be lost. */
export function canReloadNow(hidden: boolean, url: string): boolean {
  return hidden && !ADMIN_FORM_URL.test(url);
}

/**
 * Picks up new deployments without a manual refresh: a ready version loads on the next
 * in-app navigation (or at once in a hidden tab), so nothing on the current page is lost.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdate {
  private readonly swUpdate = inject(SwUpdate);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private updateReady = false;

  start(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // No activateUpdate(): a full page load always gets the newest version, and switching the open
    // page early would make it fetch its lazy chunks from the new build.
    this.swUpdate.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_INSTALLATION_FAILED') {
        console.error('App update failed to install', event.error);
      } else if (event.type === 'VERSION_READY') {
        this.updateReady = true;
        if (canReloadNow(this.document.hidden, this.router.url)) {
          this.document.location.reload();
        }
      }
    });
    this.swUpdate.unrecoverable.subscribe(() => this.document.location.reload());

    this.router.events
      .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
      .subscribe((event) => {
        if (this.updateReady) {
          this.document.location.assign(event.url);
        }
      });

    this.check();
    this.document.addEventListener('visibilitychange', () => {
      if (!this.document.hidden) {
        this.check();
      }
    });
    setInterval(() => this.check(), CHECK_INTERVAL_MS);
  }

  private check(): void {
    this.swUpdate.checkForUpdate().catch((error: unknown) => console.error('App update check failed', error));
  }
}
