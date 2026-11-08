import { DatePipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DraftPreviewBanner, ImageFade } from '../../../../shared';
import { newsTileColour } from '../../utils/news-tile-colour';

export interface NewsDetailsViewModel {
  id: string;
  title: string;
  description: string;
  imagePath: string | null;
  createdAt: string | null;
  status: number;
}

// shortcut: "New" means published in the last two weeks; switch to a model flag if one appears.
const NEW_FOR_MS = 14 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-news-details-view',
  imports: [DatePipe, DraftPreviewBanner, ImageFade, MatIconModule, RouterLink],
  templateUrl: './news-details-view.html',
  styleUrl: './news-details-view.scss',
})
export class NewsDetailsView {
  readonly newsItem = input.required<NewsDetailsViewModel>();
  readonly interactive = input(true);

  protected readonly imageBroken = signal(false);
  protected readonly newsTileColour = newsTileColour;
  protected readonly isNew = computed(() => {
    const createdAt = this.newsItem().createdAt;
    return createdAt !== null && Date.now() - new Date(createdAt).getTime() < NEW_FOR_MS;
  });
}
