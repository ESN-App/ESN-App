import { Component, input, signal } from '@angular/core';
import { DraftPreviewBanner } from '../../../../shared';

export interface InfoDetailsViewModel {
  id: string;
  title: string;
  content: string;
  imagePath: string | null;
  externalLinks: string[];
  status: number;
}

@Component({
  selector: 'app-info-details-view',
  imports: [DraftPreviewBanner],
  templateUrl: './info-details-view.html',
  styleUrl: './info-details-view.scss',
})
export class InfoDetailsView {
  readonly article = input.required<InfoDetailsViewModel>();
  readonly interactive = input(true);

  protected readonly imageBroken = signal(false);
}
