import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, ThemeService } from './core';
import { NavItem, ThemeToggle } from './shared';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, NavItem, ThemeToggle],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthService);
  // Instantiated here so the stored theme is applied on every route.
  private readonly theme = inject(ThemeService);
  protected readonly hideMobileNavigation = signal(false);
  // Public screens use the full-bleed layout; admin and auth keep the boxed one.
  protected readonly publicPage = signal(true);
  protected readonly navItems = [
    { link: '/', label: 'Home', icon: 'home', colour: 'var(--c-cyan)' },
    { link: '/events', label: 'Events', icon: 'event', colour: 'var(--c-green)' },
    { link: '/partners', label: 'Partners', icon: 'local_offer', colour: 'var(--c-magenta)' },
    { link: '/info', label: 'Info', icon: 'info', colour: 'var(--c-orange)' },
  ];

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
        this.publicPage.set(!/^\/(admin|auth)(\/|$)/.test(path));
        this.hideMobileNavigation.set(activeRoute.snapshot.data['hideMobileNavigation'] === true);
      });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/events');
  }
}
