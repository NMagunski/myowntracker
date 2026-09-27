import { compareMonths, msUntilMidnight, shiftMonth, today, weekdayNames } from './dates.js';
import { load, save } from './storage.js';
import { render } from './render.js';

const NEXT_STATE = { empty: 'green', green: 'red', red: 'empty' };

const els = {
  title: document.getElementById('title'),
  prev: document.getElementById('prev'),
  next: document.getElementById('next'),
  today: document.getElementById('today'),
  weekdays: document.getElementById('weekdays'),
  grid: document.getElementById('grid'),
  counter: document.getElementById('counter'),
};

const now = today();
const state = {
  viewYear: now.year,
  viewMonth: now.month,
  today: now,
  days: load(),
};

function cycle(key) {
  if (key > state.today.key) return; // бъдещите дни са заключени
  const next = NEXT_STATE[state.days[key] || 'empty'];
  if (next === 'empty') delete state.days[key];
  else state.days[key] = next;
  save(state.days);
  render(els, state, { changedKey: key });
}

function goToMonth(year, month) {
  if (compareMonths(year, month, state.today.year, state.today.month) > 0) return;
  const direction = compareMonths(year, month, state.viewYear, state.viewMonth);
  if (!direction) return;
  state.viewYear = year;
  state.viewMonth = month;
  render(els, state, { direction });
}

function goBy(delta) {
  const { year, month } = shiftMonth(state.viewYear, state.viewMonth, delta);
  goToMonth(year, month);
}

/** Проверява дали денят е сменен (апът е стоял във фонов режим през полунощ). */
function refreshToday() {
  const t = today();
  if (t.key === state.today.key) return;
  const wasOnCurrentMonth =
    compareMonths(state.viewYear, state.viewMonth, state.today.year, state.today.month) === 0;
  state.today = t;
  if (wasOnCurrentMonth) {
    state.viewYear = t.year;
    state.viewMonth = t.month;
  }
  render(els, state);
}

let midnightTimer;
function scheduleMidnight() {
  clearTimeout(midnightTimer);
  midnightTimer = setTimeout(() => {
    refreshToday();
    scheduleMidnight();
  }, msUntilMidnight() + 1000);
}

// --- Събития ---

els.grid.addEventListener('click', (e) => {
  const btn = e.target.closest('.day');
  if (btn && !btn.disabled) cycle(btn.dataset.key);
});
els.prev.addEventListener('click', () => goBy(-1));
els.next.addEventListener('click', () => goBy(1));
els.today.addEventListener('click', () => goToMonth(state.today.year, state.today.month));

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    refreshToday();
    scheduleMidnight();
  }
});
window.addEventListener('pageshow', refreshToday);

// Swipe наляво/надясно по календара сменя месеца.
let touchStart = null;
const calendar = document.getElementById('calendar');
calendar.addEventListener('touchstart', (e) => {
  touchStart = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
}, { passive: true });
calendar.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goBy(dx < 0 ? 1 : -1);
}, { passive: true });

// --- Старт ---

els.weekdays.replaceChildren(...weekdayNames().map((name) => {
  const span = document.createElement('span');
  span.textContent = name;
  return span;
}));
render(els, state);
scheduleMidnight();

if (navigator.storage?.persist) {
  navigator.storage.persisted()
    .then((already) => already || navigator.storage.persist())
    .catch(() => {});
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch((err) => {
    console.error('MyOwnTracker: service worker не се регистрира', err);
  });
}
