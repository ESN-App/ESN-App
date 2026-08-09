export function isSameCalendarDay(start: string | Date, end: string | Date): boolean {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()
  );
}
