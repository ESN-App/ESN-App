// Formatting helpers that reproduce the Angular DatePipe / CurrencyPipe output (en-US) the
// templates relied on, so dates and prices render exactly as before.

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (value: number) => String(value).padStart(2, '0');

const TOKENS: Record<string, (date: Date) => string> = {
  yyyy: (date) => String(date.getFullYear()),
  y: (date) => String(date.getFullYear()),
  MMMM: (date) => MONTHS[date.getMonth()],
  MMM: (date) => MONTHS[date.getMonth()].slice(0, 3),
  MM: (date) => pad(date.getMonth() + 1),
  dd: (date) => pad(date.getDate()),
  d: (date) => String(date.getDate()),
  EEEE: (date) => WEEKDAYS[date.getDay()],
  EEE: (date) => WEEKDAYS[date.getDay()].slice(0, 3),
  HH: (date) => pad(date.getHours()),
  mm: (date) => pad(date.getMinutes()),
};

const TOKEN_PATTERN = /yyyy|y|MMMM|MMM|MM|dd|d|EEEE|EEE|HH|mm/g;

/** Formats a date with Angular DatePipe-style patterns (only the tokens this app uses). */
export function formatDate(value: string | Date | null | undefined, pattern: string): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (pattern === 'fullDate') {
    return formatDate(date, 'EEEE, MMMM d, y');
  }

  return pattern.replace(TOKEN_PATTERN, (token) => TOKENS[token](date));
}

/** Matches Angular's `currency: 'PLN'` output in en-US, e.g. "PLN18.00". */
export function formatPln(value: number): string {
  return `PLN${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "Free" for zero prices, otherwise the PLN amount. */
export function formatPrice(value: number): string {
  return value === 0 ? 'Free' : formatPln(value);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
