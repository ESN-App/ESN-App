import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService, FeatureFlags, ThemeService } from './core';
import { NavItem, SlidingIndicator, ThemeToggle } from './shared';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, NavItem, SlidingIndicator, ThemeToggle],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');

  protected readonly auth = inject(AuthService);
  // Instantiated here so the stored theme is applied on every route.
  private readonly theme = inject(ThemeService);
  // Instantiated at start so the server's feature flags load once, in the background.
  private readonly featureFlags = inject(FeatureFlags);
  protected readonly hideMobileNavigation = signal(false);
  // News lives under Home in the navigation.
  protected readonly newsPage = signal(false);
  // Public screens use the full-bleed layout; admin and auth keep the boxed one.
  protected readonly publicPage = signal(true);
  protected readonly navItems = [
    { link: '/', label: 'Home', icon: 'home', colour: 'var(--c-cyan)' },
    { link: '/events', label: 'Events', icon: 'event', colour: 'var(--c-green)' },
    { link: '/partners', label: 'Partners', icon: 'local_offer', colour: 'var(--c-magenta)' },
    { link: '/info', label: 'Info', icon: 'info', colour: 'var(--c-orange)' },
  ];

  constructor() {
    this.restoreContentScroll();
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
        this.newsPage.set(path.startsWith('/news/'));
        this.publicPage.set(!/^\/(admin|auth)(\/|$)/.test(path));
        this.hideMobileNavigation.set(activeRoute.snapshot.data['hideMobileNavigation'] === true);
      });
  }

  /**
   * Scroll restoration for whichever element scrolls: main.content on phones, the document
   * from 701px. A new page starts at the top, browser back/forward returns to where that
   * page was left, query-only changes (filters, selected day) keep the position. Applied
   * right after the new page renders, so the route transition snapshots it already in place.
   * (The router's own restoration only knows the window and resets on query-only changes.)
   */
  private restoreContentScroll(): void {
    const scrollTops = new Map<number, number>();
    let currentId = 0;
    let currentPath = '';
    let target = 0;
    const scroller = (): Element => {
      const content = this.content().nativeElement;
      const overflowY = getComputedStyle(content).overflowY;
      return overflowY === 'auto' || overflowY === 'scroll'
        ? content
        : (document.scrollingElement ?? document.documentElement);
    };
    // Otherwise the browser restores the window itself, before the page has rendered.
    history.scrollRestoration = 'manual';

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        scrollTops.set(currentId, scroller().scrollTop);
        target = event.restoredState ? (scrollTops.get(event.restoredState.navigationId) ?? 0) : 0;
      } else if (event instanceof NavigationEnd) {
        const path = event.urlAfterRedirects.split('?')[0];
        const keep = path === currentPath && target === 0;
        currentId = event.id;
        currentPath = path;
        if (!keep) {
          const scrollTop = target;
          afterNextRender(() => (scroller().scrollTop = scrollTop), {
            injector: this.injector,
          });
        }
      }
    });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/events');
  }
}
