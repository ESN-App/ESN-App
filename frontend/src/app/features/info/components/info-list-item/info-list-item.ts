import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface InfoListItemView {
  id: string;
  title: string;
  slug: string | null;
  content: string;
  imageUrl: string | null;
  status: number;
}

@Component({
  selector: 'app-info-list-item',
  imports: [RouterLink],
  templateUrl: './info-list-item.html',
  styleUrl: './info-list-item.scss',
})
export class InfoListItem {
  readonly article = input.required<InfoListItemView>();
  readonly interactive = input(true);

  protected readonly imageBroken = signal(false);

  protected infoLink(): string[] {
    return ['/info', this.article().slug ?? ''];
  }
}
