import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventStatusTitle } from '../../../../shared';
import { isSameCalendarDay } from '../../utils/event-date';
import { createEventSlug } from '../../utils/event-url';

export interface EventListItemView {
  id: string;
  title: string;
  shortDescription: string;
  location: string;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
  imagePath: string | null;
  currentParticipants: number | null;
  maximumParticipants: number | null;
  price: number;
  status: number;
}

@Component({
  selector: 'app-event-list-item',
  imports: [CurrencyPipe, DatePipe, EventStatusTitle, RouterLink],
  templateUrl: './event-list-item.html',
  styleUrl: './event-list-item.scss',
  host: {
    '[class.event-list-item--desktop]': 'displayMode() === "desktop"',
  },
})
export class EventListItem {
  readonly event = input.required<EventListItemView>();
  readonly interactive = input(true);
  readonly displayMode = input<'auto' | 'desktop' | 'mobile'>('auto');

  protected readonly isSameDay = isSameCalendarDay;

  protected eventLink(): string[] {
    const event = this.event();
    return ['/events', createEventSlug(event.title, event.id)];
  }

  protected hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).style.display = 'none';
  }
}
