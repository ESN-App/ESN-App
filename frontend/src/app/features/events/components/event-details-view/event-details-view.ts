import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { CancelledBadge, DraftBadge } from '../../../../shared';
import { isSameCalendarDay } from '../../utils/event-date';
import { eventMapUrl } from '../../utils/event-map';
import type { EventListItemView } from '../event-list-item/event-list-item';

export interface EventDetailsViewModel extends EventListItemView {
  description: string;
  googleMapsUrl: string | null;
  registrationUrl: string | null;
  minimumParticipants: number | null;
}

@Component({
  selector: 'app-event-details-view',
  imports: [CancelledBadge, CurrencyPipe, DatePipe, DraftBadge],
  templateUrl: './event-details-view.html',
  styleUrl: './event-details-view.scss',
})
export class EventDetailsView {
  readonly event = input.required<EventDetailsViewModel>();
  readonly interactive = input(true);
  readonly showParticipants = input(true);
  readonly imageBroken = signal(false);

  protected readonly isSameDay = isSameCalendarDay;
  protected readonly mapUrl = eventMapUrl;
}
