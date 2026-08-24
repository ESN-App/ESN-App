import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthService);
  protected readonly hideMobileNavigation = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const themeColors: Record<string, string> = {
          '/': '#e6f7fd',
          '/events': '#f2f9ec',
          '/partners': '#fde6f4',
          '/info': '#fef2e9',
          '/auth': '#f5f5fb',
        };
        const path = event.urlAfterRedirects.split('?')[0];
        const themeColor =
          Object.entries(themeColors).find(
            ([route]) => path === route || (route !== '/' && path.startsWith(`${route}/`)),
          )?.[1] ?? '#e6f7fd';
        let activeRoute = this.router.routerState.root;

        while (activeRoute.firstChild) {
          activeRoute = activeRoute.firstChild;
        }

        this.meta.updateTag({ name: 'theme-color', content: themeColor });
        this.hideMobileNavigation.set(activeRoute.snapshot.data['hideMobileNavigation'] === true);
      });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/events');
  }
}
