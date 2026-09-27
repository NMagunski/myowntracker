// Всички дати са в локалното време на устройството.
// Никога не използваме toISOString() за ключове: тя връща UTC и мести деня около полунощ.

const pad = (n) => String(n).padStart(2, '0');

/** Ключ YYYY-MM-DD; month е 0-базиран (както в Date). */
export function dateKey(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** Префикс YYYY-MM за брояча на месеца. */
export function monthPrefix(year, month) {
  return `${year}-${pad(month + 1)}-`;
}

export function today(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  return { year, month, day, key: dateKey(year, month, day) };
}

/** Милисекунди до следващата локална полунощ. */
export function msUntilMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Клетките на месеца, седмицата започва от понеделник.
 * null = празна клетка преди първия или след последния ден.
 */
export function monthGrid(year, month) {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = daysInMonth(year, month);
  const cells = Array(lead).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function shiftMonth(year, month, delta) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/** -1, 0 или 1 според реда на двата месеца. */
export function compareMonths(y1, m1, y2, m2) {
  return Math.sign(y1 * 12 + m1 - (y2 * 12 + m2));
}

const monthFmt = new Intl.DateTimeFormat('bg', { month: 'long' });
const dayMonthFmt = new Intl.DateTimeFormat('bg', { day: 'numeric', month: 'long' });
const weekdayFmt = new Intl.DateTimeFormat('bg', { weekday: 'short' });

const capitalize = (s) => s.charAt(0).toLocaleUpperCase('bg') + s.slice(1);

/** „Септември 2026“ */
export function monthTitle(year, month) {
  return `${capitalize(monthFmt.format(new Date(year, month, 1)))} ${year}`;
}

/** „27 септември“ */
export function dayLabel(year, month, day) {
  return dayMonthFmt.format(new Date(year, month, day));
}

/** Кратките имена на дните, от понеделник до неделя. */
export function weekdayNames() {
  // 1 януари 2024 г. е понеделник.
  return Array.from({ length: 7 }, (_, i) => weekdayFmt.format(new Date(2024, 0, 1 + i)));
}
