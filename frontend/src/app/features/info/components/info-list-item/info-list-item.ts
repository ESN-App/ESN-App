import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { readMinutes } from '../../utils/read-time';

export interface InfoListItemView {
  id: string;
  title: string;
  slug: string | null;
  content: string;
  imagePath: string | null;
  status: number;
}

/** A guide as the big "Start here" card (`featured`) or as a compact row. */
@Component({
  selector: 'app-info-list-item',
  imports: [MatIconModule, RouterLink],
  templateUrl: './info-list-item.html',
  styleUrl: './info-list-item.scss',
})
export class InfoListItem {
  readonly article = input.required<InfoListItemView>();
  readonly interactive = input(true);
  readonly featured = input(false);
  /** Tint of the row icon square: orange, cyan, green or magenta. */
  readonly tint = input('orange');

  protected readonly imageBroken = signal(false);
  protected readonly minutes = computed(() => readMinutes(this.article().content));

  protected infoLink(): string[] {
    return ['/info', this.article().slug ?? ''];
  }
}
