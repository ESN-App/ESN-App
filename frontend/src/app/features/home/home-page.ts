import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { EventsApi } from '../events/data-access/events-api';
import { createEventSlug } from '../events/utils/event-url';
import { InfoApi } from '../info/data-access/info-api';
import { PartnersApi } from '../partners/data-access/partners-api';
import { HomeHighlights } from './home-highlights/home-highlights';
import { nextUpcoming, startOfWeek, weekDays } from './utils/home-week';

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

const CANCELLED = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-home-page',
  imports: [DatePipe, MatIconModule, RouterLink, HomeHighlights],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly eventsApi = inject(EventsApi);
  private readonly partnersApi = inject(PartnersApi);
  private readonly infoApi = inject(InfoApi);
  private readonly now = new Date();
  private readonly monday = startOfWeek(this.now);

  protected readonly isStandalone = this.detectStandaloneMode();
  protected readonly installOpen = signal(false);

  private readonly weekEvents = toSignal(
    this.eventsApi
      .getAll({
        from: this.monday.toISOString(),
        to: new Date(this.monday.getTime() + 7 * DAY_MS).toISOString(),
        page: 1,
        pageSize: 100,
      })
      .pipe(
        map((result) => result.items.filter((event) => event.status !== CANCELLED)),
        catchError(() => of([])),
      ),
    { initialValue: [] },
  );

  protected readonly week = computed(() => weekDays(this.now, this.weekEvents()));
  protected readonly weekEventCount = computed(() => this.weekEvents().length);

  /** Nearest upcoming event, loaded in full for its registration link. */
  protected readonly upNext = toSignal(
    this.eventsApi
      .getAll({
        from: this.now.toISOString(),
        to: new Date(this.now.getTime() + 365 * DAY_MS).toISOString(),
        page: 1,
        pageSize: 50,
      })
      .pipe(
        map((result) => nextUpcoming(result.items, this.now)),
        switchMap((event) => (event ? this.eventsApi.getById(event.id) : of(null))),
        catchError(() => of(null)),
      ),
    { initialValue: null },
  );

  protected readonly discountCount = toSignal(
    this.partnersApi.getAll().pipe(
      map((partners) => partners.reduce((total, partner) => total + partner.offers.length, 0)),
      catchError(() => of(null)),
    ),
    { initialValue: null },
  );

  protected readonly guideCount = toSignal(
    this.infoApi.getAll().pipe(
      map((articles) => articles.length),
      catchError(() => of(null)),
    ),
    { initialValue: null },
  );

  protected eventLink(event: { title: string; id: string }): string[] {
    return ['/events', createEventSlug(event.title, event.id)];
  }

  private detectStandaloneMode(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      window.matchMedia?.('(display-mode: standalone)').matches === true ||
      window.matchMedia?.('(display-mode: fullscreen)').matches === true ||
      (window.navigator as StandaloneNavigator).standalone === true
    );
  }
}
