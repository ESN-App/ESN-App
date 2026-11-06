import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FeatureFlags } from '../../../../core';
import { hasEventEnded, isSameCalendarDay } from '../../utils/event-date';
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
  imports: [DatePipe, DecimalPipe, MatIconModule, RouterLink],
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
  /** Show the date in the time line; off when the list is already filtered to one day. */
  readonly showDate = input(true);

  protected readonly isSameDay = isSameCalendarDay;
  private readonly flags = inject(FeatureFlags);
  protected readonly ended = computed(
    () => this.flags.pastEventTag() && hasEventEnded(this.event()),
  );

  protected eventLink(): string[] {
    const event = this.event();
    return ['/events', createEventSlug(event.title, event.id)];
  }

  protected readonly imageBroken = signal(false);

  protected isFull(item: EventListItemView): boolean {
    return (
      item.maximumParticipants !== null &&
      item.currentParticipants !== null &&
      item.currentParticipants >= item.maximumParticipants
    );
  }
}
