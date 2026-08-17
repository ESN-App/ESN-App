import { Component, input, signal } from '@angular/core';

export interface NewsListItemView {
  id: string;
  title: string;
  imagePath: string | null;
  status: number;
}

/**
 * Standalone rendering of a home-carousel news card, used by the admin live preview.
 * The carousel in home-highlights still renders its own markup: its cards are direct
 * grid items that rely on grid-auto-columns and scroll-snap-align, so wrapping them in
 * a component host would break sizing and snapping. Keep the two in sync by hand until
 * the carousel is migrated onto this component.
 */
@Component({
  selector: 'app-news-list-item',
  templateUrl: './news-list-item.html',
  styleUrl: './news-list-item.scss',
})
export class NewsListItem {
  readonly newsItem = input.required<NewsListItemView>();

  protected readonly imageBroken = signal(false);
}
