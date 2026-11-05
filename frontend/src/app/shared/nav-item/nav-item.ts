import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** One main-navigation destination; `stacked` for the mobile bottom bar, `inline` for the desktop top bar. */
@Component({
  selector: 'app-nav-item',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './nav-item.html',
  styleUrl: './nav-item.scss',
  host: {
    '[class.nav-item--inline]': "layout() === 'inline'",
    '[style.--nav-colour]': 'colour()',
  },
})
export class NavItem {
  readonly link = input.required<string>();
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly colour = input.required<string>();
  readonly exact = input(false);
  readonly layout = input<'stacked' | 'inline'>('stacked');
}
