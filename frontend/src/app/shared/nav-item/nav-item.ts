import { CdkMonitorFocus } from '@angular/cdk/a11y';
import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { isActive, Router, RouterLink } from '@angular/router';

/** One main-navigation destination; `stacked` for the mobile bottom bar, `inline` for the desktop top bar. */
@Component({
  selector: 'app-nav-item',
  imports: [CdkMonitorFocus, RouterLink, MatIconModule],
  templateUrl: './nav-item.html',
  styleUrl: './nav-item.scss',
  host: {
    '[class.nav-item--inline]': "layout() === 'inline'",
    // Read by the parent nav's SlidingIndicator, which paints the active pill.
    '[style.--indicator-colour]': 'colour()',
  },
})
export class NavItem {
  readonly link = input.required<string>();
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly colour = input.required<string>();
  readonly exact = input(false);
  /** Forces the active state for routes that belong here but live outside `link`. */
  readonly alsoActive = input(false);
  readonly layout = input<'stacked' | 'inline'>('stacked');

  private readonly router = inject(Router);
  protected readonly active = computed(
    () =>
      this.alsoActive() ||
      isActive(this.link(), this.router, this.exact() ? { paths: 'exact', queryParams: 'exact' } : {})(),
  );
}
