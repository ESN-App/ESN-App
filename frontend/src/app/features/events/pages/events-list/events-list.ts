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
  template: `
    <section class="events-page">
      <header class="events-header">
        <div class="page-heading">
          <img src="/images/esnstar.png" alt="" />
          <div>
            <p class="eyebrow">ESN Gdańsk</p>
            <h1>Events</h1>
          </div>
        </div>
      </header>

      @if (events(); as loaded) {
        @if (loaded.items.length > 0) {
          <div class="event-list" aria-label="Upcoming events">
            @for (event of loaded.items; track event.id) {
              <article class="event-item">
                <div class="event-image">
                  <span aria-hidden="true">{{ event.startsAt | date: 'dd' }}</span>
                  @if (event.imagePath) {
                    <img
                      [src]="event.imagePath"
                      [alt]="event.title"
                      loading="lazy"
                      (error)="hideBrokenImage($event)"
                    />
                  }
                </div>

                <div class="event-copy">
                  <h2>{{ event.title }}</h2>
                  <p class="description">{{ event.shortDescription }}</p>
                  <p class="location">
                    <span class="location-icon" aria-hidden="true"></span>
                    {{ event.location }}
                  </p>
                </div>

                <div class="event-meta">
                  <p class="event-date">
                    <time [attr.datetime]="event.startsAt">
                      {{ event.startsAt | date: 'dd MMM yyyy' }}
                    </time>
                    @if (event.endsAt && !isSameDay(event.startsAt, event.endsAt)) {
                      <span>— {{ event.endsAt | date: 'dd MMM yyyy' }}</span>
                    }
                  </p>

                  <strong class="price">
                    {{ event.price === 0 ? 'Free' : (event.price | currency: 'PLN') }}
                  </strong>
                  @if (event.currentParticipants !== null) {
                    <span class="participants">
                      {{ event.currentParticipants }}
                      @if (event.maximumParticipants !== null) {
                        /{{ event.maximumParticipants }}
                      }
                      going
                    </span>
                  }
                  <a
                    class="arrow-link"
                    [routerLink]="['/events', eventSlug(event.title, event.id)]"
                    queryParamsHandling="preserve"
                    [attr.aria-label]="'Read more about ' + event.title"
                  >
                    <span class="arrow" aria-hidden="true"></span>
                  </a>
                </div>
              </article>
            }
          </div>
        }
      } @else {
        <app-loading-spinner />
      }

      <nav class="month-switcher" aria-label="Choose events month">
        <button
          type="button"
          (click)="changeMonth(-1)"
          [disabled]="!hasPreviousMonth()"
          aria-label="Show previous month"
        >
          <span class="month-arrow previous" aria-hidden="true"></span>
        </button>
        <h2 class="month-name">{{ selectedMonth() | date: 'MMMM yyyy' }}</h2>
        <button
          type="button"
          (click)="changeMonth(1)"
          [disabled]="!hasNextMonth()"
          aria-label="Show next month"
        >
          <span class="month-arrow next" aria-hidden="true"></span>
        </button>
      </nav>
    </section>
  `,
  styles: `
    :host {
      --events-accent: #7ac143;
      display: block;
    }

    .events-page {
      margin: 0 auto;
      max-width: 52rem;
    }

    .events-header {
      display: flex;
      margin-bottom: 1.5rem;
      padding: 1rem 0 0;
    }

    .eyebrow {
      color: var(--events-accent);
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      margin: 0 0 0.2rem;
      text-transform: uppercase;
    }

    h1 {
      font-size: clamp(2.25rem, 7vw, 4rem);
      font-weight: 900;
      letter-spacing: -0.06em;
      line-height: 0.9;
      margin: 0;
    }

    .month-switcher {
      align-items: center;
      display: grid;
      grid-template-columns: 2.25rem minmax(0, 1fr) 2.25rem;
      margin: 1.25rem auto 0.5rem;
      max-width: 20rem;
    }

    .month-switcher button {
      -webkit-tap-highlight-color: transparent;
      background: transparent;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
      height: 2.25rem;
      padding: 0;
      transition: transform 140ms ease;
      width: 2.25rem;
    }

    .month-switcher button:hover {
      transform: scale(1.08);
    }

    .month-switcher button:disabled {
      cursor: default;
      opacity: 0.22;
      transform: none;
    }

    .month-switcher button:focus-visible {
      outline: 2px solid var(--events-accent);
      outline-offset: 2px;
    }

    .month-name {
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin: 0;
      text-align: center;
    }

    .month-arrow {
      background: var(--events-accent);
      display: block;
      height: 100%;
      width: 100%;
    }

    .month-arrow.previous {
      mask: url('/icons/arrow-circle-left.svg') center / 1.8rem no-repeat;
    }

    .month-arrow.next {
      mask: url('/icons/arrow-circle-right.svg') center / 1.8rem no-repeat;
    }

    .event-list {
      display: grid;
      gap: 0.75rem;
    }

    .event-item {
      background: color-mix(in srgb, var(--events-accent) 9%, #fff);
      border: 2px solid var(--events-accent);
      border-radius: 1.75rem;
      box-sizing: border-box;
      display: grid;
      gap: 1rem;
      grid-template-columns: 7rem minmax(0, 1fr) 10rem;
      min-height: 8.5rem;
      overflow: hidden;
      padding: 0.75rem;
      transition: background-color 140ms ease, transform 140ms ease;
    }

    .event-item:hover {
      background: color-mix(in srgb, var(--events-accent) 13%, #fff);
      transform: translateY(-2px);
    }

    .event-image {
      align-items: center;
      background: color-mix(in srgb, var(--events-accent) 9%, #fff);
      display: flex;
      justify-content: center;
      min-height: 7rem;
      overflow: hidden;
      position: relative;
      border-radius: 1.15rem;
    }

    .event-image img {
      height: 100%;
      inset: 0;
      object-fit: cover;
      position: absolute;
      width: 100%;
    }

    .event-image span {
      color: #111;
      font-size: 2.5rem;
      font-weight: 900;
    }

    .event-copy {
      align-self: center;
      min-width: 0;
      padding: 0.2rem;
    }

    .event-copy h2 {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.1;
      margin: 0 0 0.35rem;
    }

    .description {
      color: #505050;
      font-size: 0.875rem;
      line-height: 1.35;
      margin: 0;
    }

    .location {
      align-items: center;
      display: flex;
      font-size: 0.75rem;
      font-weight: 700;
      gap: 0.3rem;
      margin: 0.55rem 0 0;
    }

    .location-icon {
      background-color: var(--events-accent);
      height: 0.8rem;
      mask: url('/icons/marker.svg') center / contain no-repeat;
      width: 0.8rem;
    }

    .event-meta {
      align-items: flex-end;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
      padding: 0.35rem;
      text-align: right;
    }

    .event-date {
      color: #717171;
      font-size: 0.68rem;
      line-height: 1.35;
      margin: 0;
      white-space: nowrap;
    }

    .event-date span {
      display: inline;
    }

    .price {
      align-self: flex-end;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .participants {
      color: #717171;
      font-size: 0.7rem;
    }

    .arrow {
      background-color: var(--events-accent);
      display: block;
      height: 2rem;
      mask: url('/icons/arrow-circle-right.svg') center / contain no-repeat;
      width: 2rem;
    }

    .arrow-link {
      border-radius: 50%;
      display: block;
      transition: transform 140ms ease;
    }

    .arrow-link:hover {
      transform: translateX(2px);
    }

    @media (max-width: 700px) {
      .events-header {
        padding-top: 0;
      }

      .event-item {
        gap: 0.75rem;
        grid-template-columns: 5.25rem minmax(0, 1fr) 4.25rem;
        min-height: 7.5rem;
        padding: 0.65rem;
      }

      .event-image {
        min-height: 6rem;
      }

      .participants {
        display: none;
      }

      .event-meta {
        padding: 0.2rem;
      }

      .event-date {
        white-space: normal;
      }

      .event-date span {
        display: block;
      }

      h2 {
        font-size: 1.05rem;
      }
    }
  `,
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
