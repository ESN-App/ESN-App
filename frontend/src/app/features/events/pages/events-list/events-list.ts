import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { LoadingSpinner } from '../../../../shared';
import { EventsApi } from '../../data-access/events-api';
import { isSameCalendarDay } from '../../utils/event-date';
import {
  closestAvailableMonth,
  monthFromKey,
  monthKey,
  monthRange,
  normalizeAvailableMonths,
  normalizeMonthKey,
} from '../../utils/event-month';
import { createEventSlug } from '../../utils/event-url';

@Component({
  selector: 'app-events-list',
  imports: [CurrencyPipe, DatePipe, RouterLink, LoadingSpinner],
  templateUrl: './events-list.html',
  styleUrl: './events-list.scss',
})
export class EventsList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(EventsApi);

  protected readonly isSameDay = isSameCalendarDay;
  private readonly availableMonths$ = this.api.getAvailableMonths().pipe(
    map(normalizeAvailableMonths),
    tap((months) => {
      if (months.length === 0) {
        this.router.navigateByUrl('/');
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  private readonly monthKey$ = combineLatest([
    this.route.queryParamMap.pipe(map((params) => params.get('month'))),
    this.availableMonths$,
  ]).pipe(
    map(([requestedValue, availableMonths]) => {
      const requestedMonth = normalizeMonthKey(requestedValue);
      const resolvedMonth = closestAvailableMonth(requestedMonth, availableMonths);

      return { requestedValue, resolvedMonth };
    }),
    tap(({ requestedValue, resolvedMonth }) => {
      if (resolvedMonth && requestedValue !== resolvedMonth) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { month: resolvedMonth, page: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    }),
    map(({ resolvedMonth }) => resolvedMonth),
    filter((resolvedMonth): resolvedMonth is string => resolvedMonth !== null),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly availableMonths = toSignal(this.availableMonths$, { initialValue: [] });

  readonly selectedMonth = toSignal(this.monthKey$.pipe(map(monthFromKey)), {
    initialValue: monthFromKey(normalizeMonthKey(null)),
  });

  readonly events = toSignal(
    this.monthKey$.pipe(
      map(monthFromKey),
      map(monthRange),
      switchMap((range) =>
        this.api.getAll({ ...range, page: 1, pageSize: 100 }).pipe(startWith(null)),
      ),
    ),
  );

  changeMonth(offset: number): void {
    const months = this.availableMonths();
    const selectedIndex = months.indexOf(monthKey(this.selectedMonth()));
    const targetMonth = months[selectedIndex + offset];

    if (!targetMonth) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { month: targetMonth, page: null },
      queryParamsHandling: 'merge',
    });
  }

  hasPreviousMonth(): boolean {
    return this.availableMonths().indexOf(monthKey(this.selectedMonth())) > 0;
  }

  hasNextMonth(): boolean {
    const months = this.availableMonths();
    const selectedIndex = months.indexOf(monthKey(this.selectedMonth()));

    return selectedIndex >= 0 && selectedIndex < months.length - 1;
  }

  eventSlug(title: string, id: string): string {
    return createEventSlug(title, id);
  }

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).style.display = 'none';
  }
}
