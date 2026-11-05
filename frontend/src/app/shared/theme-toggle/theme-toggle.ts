import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../core/theme.service';
import { nextThemePreference, ThemePreference } from '../utils/theme-preference';

const ICONS: Record<ThemePreference, string> = {
  light: 'light_mode',
  dark: 'dark_mode',
  system: 'desktop_windows',
};

@Component({
  selector: 'app-theme-toggle',
  imports: [MatIconModule],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
  host: { '[class.theme-toggle--segmented]': "variant() === 'segmented'" },
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);

  /** `icon`: one round button cycling the modes; `segmented`: sun / moon / monitor. */
  readonly variant = input<'icon' | 'segmented'>('icon');

  protected readonly options: readonly ThemePreference[] = ['light', 'dark', 'system'];
  protected readonly icons = ICONS;
  protected readonly next = computed(() => nextThemePreference(this.theme.preference()));
}
