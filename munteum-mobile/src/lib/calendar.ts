export function buildCalendarCells(selectedDate: string) {
  const date = new Date(selectedDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDay.getDay();
  const cells: Array<{ day: number | null; value: string; empty: boolean }> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({
      day: null,
      value: `empty-${year}-${month + 1}-${index}`,
      empty: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      value: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      empty: false,
    });
  }

  return cells;
}
