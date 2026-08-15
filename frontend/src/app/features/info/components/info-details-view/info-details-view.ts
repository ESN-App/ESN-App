import { Component, input, signal } from '@angular/core';

export interface InfoDetailsViewModel {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  externalLinks: string[];
}

@Component({
  selector: 'app-info-details-view',
  templateUrl: './info-details-view.html',
  styleUrl: './info-details-view.scss',
})
export class InfoDetailsView {
  readonly article = input.required<InfoDetailsViewModel>();
  readonly interactive = input(true);

  protected readonly imageBroken = signal(false);
}
