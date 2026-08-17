import { DatePipe } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { DraftPreviewBanner } from '../../../../shared';

export interface NewsDetailsViewModel {
  id: string;
  title: string;
  description: string;
  imagePath: string | null;
  createdAt: string | null;
  status: number;
}

@Component({
  selector: 'app-news-details-view',
  imports: [DatePipe, DraftPreviewBanner],
  templateUrl: './news-details-view.html',
  styleUrl: './news-details-view.scss',
})
export class NewsDetailsView {
  readonly newsItem = input.required<NewsDetailsViewModel>();
  readonly interactive = input(true);

  protected readonly imageBroken = signal(false);
}
