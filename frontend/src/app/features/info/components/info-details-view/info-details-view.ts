import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DraftPreviewBanner, ImageFade, urlHost } from '../../../../shared';
import { readMinutes } from '../../utils/read-time';

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
  imports: [DraftPreviewBanner, ImageFade, MatIconModule],
  templateUrl: './info-details-view.html',
  styleUrl: './info-details-view.scss',
})
export class InfoDetailsView {
  readonly article = input.required<InfoDetailsViewModel>();
  readonly interactive = input(true);

  protected readonly imageBroken = signal(false);
  protected readonly minutes = computed(() => readMinutes(this.article().content));
  protected readonly urlHost = urlHost;
}
