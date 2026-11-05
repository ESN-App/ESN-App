import { DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { parseThemePreference, ThemePreference } from '../shared/utils/theme-preference';

const THEME_KEY = 'esn-app.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly preference = signal<ThemePreference>(parseThemePreference(this.read()));

  constructor() {
    // styles.scss maps data-theme to color-scheme, which drives every light-dark() token.
    effect(() => this.document.documentElement.setAttribute('data-theme', this.preference()));
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      localStorage.setItem(THEME_KEY, preference);
    } catch {
      // Storage can be unavailable (private mode, quota); the choice still applies for this visit.
    }
  }

  private read(): string | null {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }
}
