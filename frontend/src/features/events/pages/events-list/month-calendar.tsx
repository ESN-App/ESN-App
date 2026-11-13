import { formatDate } from '../../../../shared/format';
import { dateKey } from '../../utils/event-date';
import { Host } from '../../../../shared/host';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CELL_PADDING = `${(50 * 1) / 7}%`;
const CELL_WIDTH = `${100 / 7}%`;

interface MonthCalendarProps {
  month: Date;
  selected: Date | null;
  minDate: Date | null;
  maxDate: Date | null;
  eventDates: ReadonlySet<string>;
  onSelect: (date: Date) => void;
}

/**
 * Month view with the same DOM and class names as Angular Material's `mat-calendar`
 * (en-GB locale: weeks start on Monday), so the events stylesheet keeps applying.
 */
export function MonthCalendar({ month, selected, minDate, maxDate, eventDates, onSelect }: MonthCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstRowOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const todayKey = dateKey(new Date());
  const selectedKey = selected ? dateKey(selected) : null;
  const minKey = minDate ? dateKey(minDate) : null;
  const maxKey = maxDate ? dateKey(maxDate) : null;

  const days = Array.from({ length: daysInMonth }, (_, index) => new Date(year, monthIndex, index + 1));
  const rows: Date[][] = [];
  let row: Date[] = [];
  for (const day of days) {
    row.push(day);
    if ((row.length + (rows.length === 0 ? firstRowOffset : 0)) % 7 === 0) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length > 0) {
    rows.push(row);
  }

  return (
    <Host tag="mat-calendar" transparent className="calendar mat-calendar" aria-label="Filter events by date">
      <div className="mat-calendar-content">
        <table className="mat-calendar-table" role="grid">
          <thead className="mat-calendar-table-header">
            <tr>
              {WEEKDAYS.map((weekday, index) => (
                <th key={index} scope="col">
                  <span className="cdk-visually-hidden">{weekday}</span>
                  <span aria-hidden="true">{weekday[0]}</span>
                </th>
              ))}
            </tr>
            <tr aria-hidden="true">
              <th className="mat-calendar-table-header-divider" colSpan={7}></th>
            </tr>
          </thead>
          <tbody className="mat-calendar-body" role="grid">
            {rows.map((week, rowIndex) => (
              <tr key={rowIndex} role="row">
                {rowIndex === 0 && firstRowOffset > 0 && (
                  <td
                    className="mat-calendar-body-label"
                    colSpan={firstRowOffset}
                    style={{ paddingTop: CELL_PADDING, paddingBottom: CELL_PADDING }}
                  ></td>
                )}
                {week.map((date) => {
                  const key = dateKey(date);
                  const disabled = (minKey !== null && key < minKey) || (maxKey !== null && key > maxKey);
                  const isSelected = key === selectedKey;
                  const cellClasses = ['mat-calendar-body-cell'];
                  if (eventDates.has(key)) cellClasses.push('event-date');
                  if (disabled) cellClasses.push('mat-calendar-body-disabled');
                  const contentClasses = ['mat-calendar-body-cell-content'];
                  if (isSelected) contentClasses.push('mat-calendar-body-selected');
                  if (key === todayKey) contentClasses.push('mat-calendar-body-today');

                  return (
                    <td
                      key={key}
                      role="gridcell"
                      className="mat-calendar-body-cell-container"
                      style={{ width: CELL_WIDTH, paddingTop: CELL_PADDING, paddingBottom: CELL_PADDING }}
                    >
                      <button
                        type="button"
                        className={cellClasses.join(' ')}
                        aria-label={formatDate(date, 'd MMMM yyyy')}
                        aria-pressed={isSelected}
                        aria-disabled={disabled || undefined}
                        aria-current={key === todayKey ? 'date' : undefined}
                        onClick={() => !disabled && onSelect(date)}
                      >
                        <span className={contentClasses.join(' ')}>{date.getDate()}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Host>
  );
}
