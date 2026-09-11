/**
 * Utility functions for Russian dates and calendar arithmetic
 */

export const RU_DAYS_SHORT = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
export const RU_DAYS_FULL = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

export const RU_MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export const RU_MONTHS_NOMINATIVE = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

/**
 * Parses YYYY-MM-DD to Date object at local midnight
 */
export function parseISODate(isoString: string): Date {
  const parts = isoString.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

/**
 * Formats Date to YYYY-MM-DD
 */
export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns Monday (start of week) for a given date
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns array of 7 days starting from Monday
 */
export function getWeekDates(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    days.push(next);
  }
  return days;
}

/**
 * Formats Russian week range, e.g. "7–13 сентября 2026"
 */
export function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const startMonth = monday.getMonth();
  const endMonth = sunday.getMonth();
  const startYear = monday.getFullYear();
  const endYear = sunday.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startDay}–${endDay} ${RU_MONTHS_GENITIVE[endMonth]} ${endYear}`;
    }
    return `${startDay} ${RU_MONTHS_GENITIVE[startMonth]} — ${endDay} ${RU_MONTHS_GENITIVE[endMonth]} ${endYear}`;
  }
  return `${startDay} ${RU_MONTHS_GENITIVE[startMonth]} ${startYear} — ${endDay} ${RU_MONTHS_GENITIVE[endMonth]} ${endYear}`;
}

/**
 * Formats date to Russian display, e.g. "7 сентября 2026, Понедельник"
 */
export function formatFullRussianDate(date: Date): string {
  const day = date.getDate();
  const month = RU_MONTHS_GENITIVE[date.getMonth()];
  const year = date.getFullYear();
  const dayOfWeek = RU_DAYS_FULL[date.getDay()];
  return `${day} ${month} ${year}, ${dayOfWeek}`;
}

/**
 * Converts "HH:MM" string to minutes from start of day
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from start of day to "HH:MM"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Check if two dates represent the same calendar day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
