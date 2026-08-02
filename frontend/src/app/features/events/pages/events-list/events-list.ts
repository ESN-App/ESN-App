import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import {
  MatCalendar,
  MatCalendarCellClassFunction,
  MatDatepickerModule,
} from '@angular/material/datepicker';
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
import type { EventListItemDto } from '../../data-access/events.models';
import { isSameCalendarDay } from '../../utils/event-date';
import {
  closestAvailableMonth,
  monthFromKey,
  monthKey,
  monthRange,
  moveMonth,
  normalizeAvailableMonths,
  normalizeMonthKey,
} from '../../utils/event-month';
import { createEventSlug } from '../../utils/event-url';

interface MobileCalendarDay {
  date: Date;
  dateKey: string;
  eventCount: number;
  isToday: boolean;
}

interface MonthOption {
  date: Date;
  hasEvents: boolean;
  key: string;
}

@Component({
  selector: 'app-events-list',
  imports: [CurrencyPipe, DatePipe, RouterLink, LoadingSpinner, MatDatepickerModule],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  templateUrl: './events-list.html',
  styleUrl: './events-list.scss',
})
export class EventsList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(EventsApi);
  private readonly calendar = viewChild<MatCalendar<Date>>(MatCalendar);

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
      const firstMonth = availableMonths.at(0);
      const lastMonth = availableMonths.at(-1);
      const isWithinAvailableRange =
        firstMonth !== undefined &&
        lastMonth !== undefined &&
        requestedMonth >= firstMonth &&
        requestedMonth <= lastMonth;
      const resolvedMonth = isWithinAvailableRange
        ? requestedMonth
        : closestAvailableMonth(requestedMonth, availableMonths);

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

  readonly searchTerm = signal('');
  readonly selectedDateKey = signal<string | null>(null);
  readonly selectedMonthKey = computed(() => monthKey(this.selectedMonth()));
  readonly monthPickerOpen = signal(false);
  readonly monthPickerYear = signal(this.selectedMonth().getFullYear());

  readonly monthOptions = computed<MonthOption[]>(() => {
    const availableMonths = this.availableMonths();
    const availableSet = new Set(availableMonths);
    const years = [...new Set(availableMonths.map((month) => Number(month.slice(0, 4))))];

    return years.flatMap((year) =>
      Array.from({ length: 12 }, (_, monthIndex) => {
        const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

        return {
          date: monthFromKey(key),
          hasEvents: availableSet.has(key),
          key,
        };
      }),
    );
  });
  readonly monthPickerYears = computed(() => [
    ...new Set(this.monthOptions().map((month) => month.date.getFullYear())),
  ]);
  readonly visibleMonthOptions = computed(() =>
    this.monthOptions().filter((month) => month.date.getFullYear() === this.monthPickerYear()),
  );

  readonly selectedCalendarDate = computed<Date | null>(() => {
    const selectedDate = this.selectedDateKey();

    return selectedDate ? this.dateFromKey(selectedDate) : null;
  });

  readonly calendarMinDate = computed<Date | null>(() => {
    const firstMonth = this.availableMonths().at(0);

    return firstMonth ? monthFromKey(firstMonth) : null;
  });

  readonly calendarMaxDate = computed<Date | null>(() => {
    const lastMonth = this.availableMonths().at(-1);

    if (!lastMonth) {
      return null;
    }

    const month = monthFromKey(lastMonth);
    return new Date(month.getFullYear(), month.getMonth() + 1, 0);
  });

  readonly calendarDateClass = computed<MatCalendarCellClassFunction<Date>>(() => {
    const eventDates = new Set(
      (this.events()?.items ?? []).map((event) => this.dateKey(new Date(event.startsAt))),
    );

    return (date, view) =>
      view === 'month' && eventDates.has(this.dateKey(date)) ? 'event-date' : '';
  });

  readonly mobileCalendarDays = computed<MobileCalendarDay[]>(() => {
    const month = this.selectedMonth();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const todayKey = this.dateKey(new Date());
    const eventCounts = new Map<string, number>();

    for (const event of this.events()?.items ?? []) {
      const eventDateKey = this.dateKey(new Date(event.startsAt));
      eventCounts.set(eventDateKey, (eventCounts.get(eventDateKey) ?? 0) + 1);
    }

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
      const dateKey = this.dateKey(date);

      return {
        date,
        dateKey,
        eventCount: eventCounts.get(dateKey) ?? 0,
        isToday: dateKey === todayKey,
      };
    });
  });

  readonly filteredEvents = computed<EventListItemDto[]>(() => {
    const items = this.events()?.items ?? [];
    const selectedDate = this.selectedDateKey();
    const query = this.searchTerm().trim().toLocaleLowerCase();

    return items.filter((event) => {
      const matchesDate =
        selectedDate === null || this.dateKey(new Date(event.startsAt)) === selectedDate;
      const searchableText = `${event.title} ${event.shortDescription} ${event.location}`;
      const matchesSearch =
        query.length === 0 || searchableText.toLocaleLowerCase().includes(query);

      return matchesDate && matchesSearch;
    });
  });

  private readonly syncCalendarMonth = effect(() => {
    const selectedMonth = this.selectedMonth();
    const calendar = this.calendar();

    if (calendar) {
      calendar.activeDate = selectedMonth;
    }
  });

  changeMonth(offset: number): void {
    const months = this.availableMonths();
    const targetMonth = monthKey(moveMonth(this.selectedMonth(), offset));
    const firstMonth = months.at(0);
    const lastMonth = months.at(-1);

    if (!firstMonth || !lastMonth || targetMonth < firstMonth || targetMonth > lastMonth) {
      return;
    }

    this.selectedDateKey.set(null);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { month: targetMonth, page: null },
      queryParamsHandling: 'merge',
    });
  }

  hasPreviousMonth(): boolean {
    const firstMonth = this.availableMonths().at(0);

    return firstMonth !== undefined && monthKey(this.selectedMonth()) > firstMonth;
  }

  hasNextMonth(): boolean {
    const lastMonth = this.availableMonths().at(-1);

    return lastMonth !== undefined && monthKey(this.selectedMonth()) < lastMonth;
  }

  toggleMonthPicker(): void {
    if (!this.monthPickerOpen()) {
      this.monthPickerYear.set(this.selectedMonth().getFullYear());
    }

    this.monthPickerOpen.update((isOpen) => !isOpen);
  }

  closeMonthPicker(): void {
    this.monthPickerOpen.set(false);
  }

  changeMonthPickerYear(offset: number): void {
    const years = this.monthPickerYears();
    const currentIndex = years.indexOf(this.monthPickerYear());
    const nextYear = years.at(currentIndex + offset);

    if (nextYear !== undefined) {
      this.monthPickerYear.set(nextYear);
    }
  }

  canChangeMonthPickerYear(offset: number): boolean {
    const years = this.monthPickerYears();
    const currentIndex = years.indexOf(this.monthPickerYear());

    return currentIndex + offset >= 0 && currentIndex + offset < years.length;
  }

  selectMonth(selectedMonth: string): void {
    if (!this.availableMonths().includes(selectedMonth)) {
      return;
    }

    this.monthPickerOpen.set(false);
    this.selectedDateKey.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { month: selectedMonth, page: null },
      queryParamsHandling: 'merge',
    });
  }

  selectDate(date: Date | null): void {
    if (!date) {
      return;
    }

    const dateKey = this.dateKey(date);
    this.selectedDateKey.update((selected) => (selected === dateKey ? null : dateKey));
  }

  updateSearch(event: Event): void {
    this.searchTerm.set((event.currentTarget as HTMLInputElement).value);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedDateKey.set(null);
  }

  eventSlug(title: string, id: string): string {
    return createEventSlug(title, id);
  }

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).style.display = 'none';
  }

  private dateFromKey(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private dateKey(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
