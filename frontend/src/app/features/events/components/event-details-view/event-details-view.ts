import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AppDatePipe, DraftPreviewBanner, ImageFade } from '../../../../shared';
import { FeatureFlags, SiteSettings } from '../../../../core';
import { hasEventEnded, isSameCalendarDay } from '../../utils/event-date';
import { buildIcs, googleCalendarUrl, type CalendarEvent } from '../../utils/add-to-calendar';
import { eventMapUrl } from '../../utils/event-map';
import { createEventSlug } from '../../utils/event-url';
import type { EventListItemView } from '../event-list-item/event-list-item';

export interface EventDetailsViewModel extends EventListItemView {
  description: string;
  googleMapsUrl: string | null;
  registrationUrl: string | null;
  minimumParticipants: number | null;
}

@Component({
  selector: 'app-event-details-view',
  imports: [AppDatePipe, DecimalPipe, DraftPreviewBanner, ImageFade, MatIconModule, MatMenuModule, NgTemplateOutlet],
  templateUrl: './event-details-view.html',
  styleUrl: './event-details-view.scss',
})
export class EventDetailsView {
  readonly event = input.required<EventDetailsViewModel>();
  readonly interactive = input(true);
  readonly showParticipants = input(true);
  readonly imageBroken = signal(false);

  private readonly timeZone = inject(SiteSettings).timeZone;
  protected isSameDay(start: string | Date, end: string | Date): boolean {
    return isSameCalendarDay(start, end, this.timeZone());
  }
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

  private readonly sheet = viewChild<ElementRef<HTMLDialogElement>>('sheet');

  /** Null when adding to a calendar makes no sense (cancelled, ended, no start, preview). */
  protected readonly calendarEvent = computed<CalendarEvent | null>(() => {
    const item = this.event();
    if (!this.interactive() || item.status === 2 || this.ended() || !item.startsAt) {
      return null;
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      location: item.location,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      url: `${location.origin}/events/${createEventSlug(item.title, item.id)}`,
    };
  });
  protected readonly googleUrl = computed(() => {
    const item = this.calendarEvent();
    return item ? googleCalendarUrl(item) : '';
  });

  protected openSheet(): void {
    this.sheet()?.nativeElement.showModal();
  }

  protected closeSheet(): void {
    this.sheet()?.nativeElement.close();
  }

  protected onSheetClick(event: MouseEvent): void {
    // The body fills the dialog, so a click landing on the dialog itself hit the backdrop.
    if (event.target === event.currentTarget) {
      this.closeSheet();
    }
  }

  protected downloadIcs(): void {
    const item = this.calendarEvent();
    if (!item) {
      return;
    }

    const url = URL.createObjectURL(new Blob([buildIcs(item)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${createEventSlug(item.title, item.id)}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    this.closeSheet();
  }
}
