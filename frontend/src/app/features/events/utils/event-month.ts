const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export interface MonthRange {
  from: string;
  to: string;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function normalizeMonthKey(value: string | null, today = new Date()): string {
  return value && MONTH_KEY_PATTERN.test(value) ? value : monthKey(today);
}

export function normalizeAvailableMonths(values: string[]): string[] {
  return [...new Set(values.filter((value) => MONTH_KEY_PATTERN.test(value)))].sort();
}

export function closestAvailableMonth(
  requestedMonth: string,
  availableMonths: string[],
): string | null {
  if (availableMonths.length === 0) {
    return null;
  }

  if (availableMonths.includes(requestedMonth)) {
    return requestedMonth;
  }

  const requestedIndex = monthNumber(requestedMonth);

  return availableMonths.reduce((closest, candidate) => {
    const candidateDistance = Math.abs(monthNumber(candidate) - requestedIndex);
    const closestDistance = Math.abs(monthNumber(closest) - requestedIndex);

    return candidateDistance < closestDistance ? candidate : closest;
  });
}

export function monthFromKey(value: string): Date {
  const match = MONTH_KEY_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Invalid month key: ${value}`);
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

export function moveMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export function monthRange(date: Date): MonthRange {
  const year = date.getFullYear();
  const month = date.getMonth();

  return {
    from: new Date(Date.UTC(year, month, 1)).toISOString(),
    to: new Date(Date.UTC(year, month + 1, 1)).toISOString(),
  };
}

function monthNumber(value: string): number {
  const date = monthFromKey(value);
  return date.getFullYear() * 12 + date.getMonth();
}
