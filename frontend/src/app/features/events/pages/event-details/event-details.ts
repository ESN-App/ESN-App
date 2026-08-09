import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { LoadingSpinner } from '../../../../shared';
import { EventDetailsView } from '../../components/event-details-view/event-details-view';
import { EventsApi } from '../../data-access/events-api';
import { extractEventId } from '../../utils/event-url';

@Component({
  selector: 'app-event-details',
  imports: [EventDetailsView, LoadingSpinner, RouterLink],
  templateUrl: './event-details.html',
  styleUrl: './event-details.scss',
})
export class EventDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(EventsApi);

  readonly event = toSignal(
    this.route.paramMap.pipe(
      map((params) => extractEventId(params.get('eventSlug') ?? '')),
      switchMap((id) => (id ? this.api.getById(id) : of(null))),
      catchError(() => of(null)),
    ),
  );
}
