import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { LoadingSpinner } from '../../../../shared';
import { EventsApi } from '../../data-access/events-api';
import { isSameCalendarDay } from '../../utils/event-date';
import { extractEventId } from '../../utils/event-url';

@Component({
  selector: 'app-event-details',
  imports: [CurrencyPipe, DatePipe, RouterLink, LoadingSpinner],
  templateUrl: './event-details.html',
  styleUrl: './event-details.scss',
})
export class EventDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(EventsApi);

  protected readonly showParticipants = true;
  protected readonly isSameDay = isSameCalendarDay;

  readonly event = toSignal(
    this.route.paramMap.pipe(
      map((params) => extractEventId(params.get('eventSlug') ?? '')),
      switchMap((id) => (id ? this.api.getById(id) : of(null))),
      catchError(() => of(null)),
    ),
  );

  hideBrokenImage(event: Event): void {
    const image = event.currentTarget as HTMLImageElement;
    image.closest('.hero')?.classList.add('no-image');
    image.closest('.hero-image')?.remove();
  }
}
