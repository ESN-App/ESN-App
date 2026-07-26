import { Component, inject } from '@angular/core';
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
          '/discounts': '#fde6f4',
          '/info': '#fef2e9',
        };
        const path = event.urlAfterRedirects.split('?')[0];

        this.meta.updateTag({ name: 'theme-color', content: themeColors[path] ?? '#e6f7fd' });
      });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/events');
  }
}
