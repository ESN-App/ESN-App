import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly isStandalone = this.detectStandaloneMode();

  private detectStandaloneMode(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      window.matchMedia?.('(display-mode: standalone)').matches === true ||
      window.matchMedia?.('(display-mode: fullscreen)').matches === true ||
      (window.navigator as StandaloneNavigator).standalone === true
    );
  }
}
