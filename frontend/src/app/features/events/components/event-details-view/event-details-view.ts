import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DraftPreviewBanner } from '../../../../shared';
import { FeatureFlags } from '../../../../core';
import { hasEventEnded, isSameCalendarDay } from '../../utils/event-date';
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
  imports: [DatePipe, DecimalPipe, DraftPreviewBanner, MatIconModule],
  templateUrl: './event-details-view.html',
  styleUrl: './event-details-view.scss',
})
export class EventDetailsView {
  readonly event = input.required<EventDetailsViewModel>();
  readonly interactive = input(true);
  readonly showParticipants = input(true);
  readonly imageBroken = signal(false);

  protected readonly isSameDay = isSameCalendarDay;
  private readonly flags = inject(FeatureFlags);
  protected readonly ended = computed(
    () => this.flags.pastEventTag() && hasEventEnded(this.event()),
  );

  /** Share of spots taken, 0–100, for the progress bar. */
  protected filledPercent(item: EventDetailsViewModel): number {
    if (!item.maximumParticipants || item.currentParticipants === null) {
      return 0;
    }

    return Math.min(100, (item.currentParticipants / item.maximumParticipants) * 100);
  }
  protected readonly mapUrl = eventMapUrl;
}
