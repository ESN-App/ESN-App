import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HomeHighlights } from './home-highlights/home-highlights';

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, HomeHighlights],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly isStandalone = this.detectStandaloneMode();
  protected readonly activeTileIndex = signal(0);

  protected updateActiveTile(event: Event): void {
    const carousel = event.currentTarget as HTMLElement;
    const tiles = Array.from(carousel.querySelectorAll<HTMLElement>('.section-tile'));
    const carouselCenter = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    tiles.forEach((tile, index) => {
      const tileBounds = tile.getBoundingClientRect();
      const tileCenter = tileBounds.left + tileBounds.width / 2;
      const distance = Math.abs(carouselCenter - tileCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (this.activeTileIndex() !== nearestIndex) {
      this.activeTileIndex.set(nearestIndex);
    }
  }

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
