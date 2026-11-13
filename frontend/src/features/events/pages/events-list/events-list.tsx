import { useEffect, useMemo, useState, type PointerEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { LoadingSpinner } from '../../../../shared/components';
import { formatDate } from '../../../../shared/format';
import { useAsync } from '../../../../shared/hooks';
import { Host } from '../../../../shared/host';
import { EventListItem } from '../../components/event-list-item/event-list-item';
import { eventsApi } from '../../data-access/events-api';
import { dateFromKey, dateKey } from '../../utils/event-date';
import {
  closestAvailableMonth,
  monthFromKey,
  monthKey,
  monthRange,
  moveMonth,
  normalizeAvailableMonths,
  normalizeMonthKey,
} from '../../utils/event-month';
import { MonthCalendar } from './month-calendar';
import './events-list.scss';

interface MonthOption {
  date: Date;
  hasEvents: boolean;
  key: string;
}

function resolveMonth(requestedValue: string | null, availableMonths: string[]): string | null {
  const requestedMonth = normalizeMonthKey(requestedValue);
  const firstMonth = availableMonths.at(0);
  const lastMonth = availableMonths.at(-1);
  const isWithinAvailableRange =
    firstMonth !== undefined && lastMonth !== undefined && requestedMonth >= firstMonth && requestedMonth <= lastMonth;

  return isWithinAvailableRange ? requestedMonth : closestAvailableMonth(requestedMonth, availableMonths);
}

const stopPropagation = (event: PointerEvent) => event.stopPropagation();
const preventDefault = (event: PointerEvent) => event.preventDefault();

export default function EventsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMonth = searchParams.get('month');

  const monthsState = useAsync(
    () => eventsApi.getAvailableMonths().then(normalizeAvailableMonths),
    [],
  );
  const availableMonths = useMemo(
    () => (monthsState.status === 'loaded' ? monthsState.data : []),
    [monthsState],
  );
  const resolvedMonth = monthsState.status === 'loaded' ? resolveMonth(requestedMonth, availableMonths) : null;

  useEffect(() => {
    if (monthsState.status !== 'loaded') {
      return;
    }
    if (monthsState.data.length === 0) {
      navigate('/');
      return;
    }
    if (resolvedMonth && requestedMonth !== resolvedMonth) {
      setSearchParams(
        (params) => {
          params.set('month', resolvedMonth);
          params.delete('page');
          return params;
        },
        { replace: true },
      );
    }
  }, [monthsState, resolvedMonth, requestedMonth, navigate, setSearchParams]);

  const eventsState = useAsync(
    () =>
      resolvedMonth
        ? eventsApi.getAll({ ...monthRange(monthFromKey(resolvedMonth)), page: 1, pageSize: 100 })
        : new Promise<never>(() => undefined),
    [resolvedMonth],
  );

  const selectedMonth = monthFromKey(resolvedMonth ?? normalizeMonthKey(null));
  const selectedMonthKey = monthKey(selectedMonth);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [monthPickerYear, setMonthPickerYear] = useState(selectedMonth.getFullYear());

  const items = useMemo(() => (eventsState.status === 'loaded' ? eventsState.data.items : []), [eventsState]);

  const monthOptions = useMemo<MonthOption[]>(() => {
    const availableSet = new Set(availableMonths);
    const years = [...new Set(availableMonths.map((month) => Number(month.slice(0, 4))))];
    return years.flatMap((year) =>
      Array.from({ length: 12 }, (_, monthIndex) => {
        const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
        return { date: monthFromKey(key), hasEvents: availableSet.has(key), key };
      }),
    );
  }, [availableMonths]);
  const monthPickerYears = [...new Set(monthOptions.map((month) => month.date.getFullYear()))];
  const visibleMonthOptions = monthOptions.filter((month) => month.date.getFullYear() === monthPickerYear);

  const firstMonth = availableMonths.at(0);
  const lastMonth = availableMonths.at(-1);
  const calendarMinDate = firstMonth ? monthFromKey(firstMonth) : null;
  const calendarMaxDate = lastMonth
    ? new Date(monthFromKey(lastMonth).getFullYear(), monthFromKey(lastMonth).getMonth() + 1, 0)
    : null;

  const eventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of items) {
      const key = dateKey(new Date(event.startsAt));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [items]);
  const eventDates = useMemo(() => new Set(eventCounts.keys()), [eventCounts]);

  const todayKey = dateKey(new Date());
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const mobileCalendarDays = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), index + 1);
    const key = dateKey(date);
    return { date, dateKey: key, eventCount: eventCounts.get(key) ?? 0, isToday: key === todayKey };
  });

  const query = searchTerm.trim().toLocaleLowerCase();
  const filteredEvents = items.filter((event) => {
    const matchesDate = selectedDateKey === null || dateKey(new Date(event.startsAt)) === selectedDateKey;
    const searchableText = `${event.title} ${event.shortDescription} ${event.location}`;
    const matchesSearch = query.length === 0 || searchableText.toLocaleLowerCase().includes(query);
    return matchesDate && matchesSearch;
  });

  const goToMonth = (target: string) => {
    setSelectedDateKey(null);
    setSearchParams((params) => {
      params.set('month', target);
      params.delete('page');
      return params;
    });
  };

  const hasPreviousMonth = firstMonth !== undefined && selectedMonthKey > firstMonth;
  const hasNextMonth = lastMonth !== undefined && selectedMonthKey < lastMonth;

  const changeMonth = (offset: number) => {
    const target = monthKey(moveMonth(selectedMonth, offset));
    if (!firstMonth || !lastMonth || target < firstMonth || target > lastMonth) {
      return;
    }
    goToMonth(target);
  };

  const toggleMonthPicker = () => {
    if (!monthPickerOpen) {
      setMonthPickerYear(selectedMonth.getFullYear());
    }
    setMonthPickerOpen(!monthPickerOpen);
  };

  const canChangeMonthPickerYear = (offset: number) => {
    const index = monthPickerYears.indexOf(monthPickerYear) + offset;
    return index >= 0 && index < monthPickerYears.length;
  };

  const changeMonthPickerYear = (offset: number) => {
    const nextYear = monthPickerYears.at(monthPickerYears.indexOf(monthPickerYear) + offset);
    if (nextYear !== undefined) {
      setMonthPickerYear(nextYear);
    }
  };

  const selectMonth = (key: string) => {
    if (!availableMonths.includes(key)) {
      return;
    }
    setMonthPickerOpen(false);
    goToMonth(key);
  };

  const selectDate = (date: Date) => {
    const key = dateKey(date);
    setSelectedDateKey((selected) => (selected === key ? null : key));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDateKey(null);
  };

  return (
    <Host tag="app-events-list">
      <section className="events-page">
        <header className="events-header">
          <div className="page-heading">
            <img src="/images/esnstar.png" alt="" />
            <div>
              <p className="eyebrow">ESN Gdańsk</p>
              <h1>Events</h1>
            </div>
          </div>
          <p className="intro">Discover upcoming events, trips and activities prepared for ESN members.</p>
        </header>

        {eventsState.status === 'loaded' ? (
          <>
            <div className="events-toolbar">
              <div className="search-field">
                <label className="search-control">
                  <span className="search-icon" aria-hidden="true"></span>
                  <input
                    id="event-search"
                    type="search"
                    aria-label="Search events"
                    placeholder="Search by name, description or place"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                  />
                </label>
              </div>
              <span className="event-count">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            <section className="mobile-date-calendar" aria-label="Filter events by date">
              <header className="mobile-date-calendar__header">
                <button
                  className="month-picker-control"
                  type="button"
                  aria-expanded={monthPickerOpen}
                  aria-controls="month-picker-popover"
                  onClick={toggleMonthPicker}
                >
                  <span>{formatDate(selectedMonth, 'MMMM, yyyy')}</span>
                  <span className="mobile-calendar-icon" aria-hidden="true"></span>
                </button>
              </header>

              {monthPickerOpen && (
                <>
                  <button
                    className="month-picker-backdrop"
                    type="button"
                    aria-label="Close month picker"
                    onClick={() => setMonthPickerOpen(false)}
                  ></button>
                  <section id="month-picker-popover" className="month-picker-popover" aria-label="Choose month">
                    <header>
                      <button
                        type="button"
                        disabled={!canChangeMonthPickerYear(-1)}
                        aria-label="Previous year"
                        onClick={() => changeMonthPickerYear(-1)}
                      >
                        <span className="year-chevron previous" aria-hidden="true"></span>
                      </button>
                      <h3>{monthPickerYear}</h3>
                      <button
                        type="button"
                        disabled={!canChangeMonthPickerYear(1)}
                        aria-label="Next year"
                        onClick={() => changeMonthPickerYear(1)}
                      >
                        <span className="year-chevron next" aria-hidden="true"></span>
                      </button>
                    </header>

                    <div className="month-picker-grid">
                      {visibleMonthOptions.map((month) => (
                        <button
                          key={month.key}
                          type="button"
                          disabled={!month.hasEvents}
                          className={month.key === selectedMonthKey ? 'selected' : undefined}
                          aria-pressed={month.key === selectedMonthKey}
                          onClick={() => selectMonth(month.key)}
                        >
                          {formatDate(month.date, 'MMM')}
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}

              <div className="mobile-date-strip">
                {mobileCalendarDays.map((day) => {
                  const classes = ['mobile-date'];
                  if (selectedDateKey === day.dateKey) classes.push('mobile-date--selected');
                  if (day.isToday) classes.push('mobile-date--today');
                  if (day.eventCount > 0) classes.push('mobile-date--has-events');
                  const countLabel = day.eventCount
                    ? `, ${day.eventCount}${day.eventCount === 1 ? ' event' : ' events'}`
                    : ', no events';

                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      className={classes.join(' ')}
                      aria-pressed={selectedDateKey === day.dateKey}
                      aria-label={formatDate(day.date, 'fullDate') + countLabel}
                      onClick={() => selectDate(day.date)}
                    >
                      <span className="mobile-date__number">{formatDate(day.date, 'd')}</span>
                      <span className="mobile-date__weekday">{formatDate(day.date, 'EEE')}</span>
                      {day.eventCount > 0 && <span className="mobile-date__dot" aria-hidden="true"></span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="events-layout">
              <aside className="calendar-panel" aria-label="Event calendar">
                <nav className="month-switcher" aria-label="Choose events month" onPointerDown={stopPropagation}>
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    onPointerDown={preventDefault}
                    disabled={!hasPreviousMonth}
                    aria-label="Show previous month"
                  >
                    <span className="month-arrow previous" aria-hidden="true"></span>
                  </button>
                  <h2 className="month-name">{formatDate(selectedMonth, 'MMMM yyyy')}</h2>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    onPointerDown={preventDefault}
                    disabled={!hasNextMonth}
                    aria-label="Show next month"
                  >
                    <span className="month-arrow next" aria-hidden="true"></span>
                  </button>
                </nav>

                <MonthCalendar
                  month={selectedMonth}
                  selected={selectedDateKey ? dateFromKey(selectedDateKey) : null}
                  minDate={calendarMinDate}
                  maxDate={calendarMaxDate}
                  eventDates={eventDates}
                  onSelect={selectDate}
                />
              </aside>

              <section className="events-results" aria-label="Events list">
                {filteredEvents.length > 0 ? (
                  <div className="event-list" aria-label="Upcoming events">
                    {filteredEvents.map((event) => (
                      <EventListItem key={event.id} event={event} />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="empty-month">
                    <span className="empty-calendar-icon" aria-hidden="true"></span>
                    <h3>No events this month</h3>
                    <p>Use the calendar arrows to see what’s happening in another month.</p>
                  </div>
                ) : (
                  <div className="empty-month">
                    <span className="empty-calendar-icon" aria-hidden="true"></span>
                    <h3>No matching events</h3>
                    <p>Try another search or select a different calendar date.</p>
                    <button className="clear-filters" type="button" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <LoadingSpinner />
        )}
      </section>
    </Host>
  );
}
