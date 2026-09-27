import { compareMonths, dateKey, dayLabel, monthGrid, monthPrefix, monthTitle } from './dates.js';

const STATE_LABEL = { green: 'зелено', red: 'червено', empty: 'празно' };

let gridSignature = '';

/**
 * Рисува целия изглед. Мрежата се построява наново само при смяна на месеца или
 * на „днес“; при тап се обновяват само атрибутите на клетките, така фокусът
 * (и VoiceOver курсорът) остават върху същия бутон.
 *
 * direction: -1 / 1 за анимация при смяна на месеца, 0 без анимация.
 */
export function render(els, state, { direction = 0, changedKey = null } = {}) {
  const { viewYear: y, viewMonth: m, today, days } = state;
  const isCurrentMonth = compareMonths(y, m, today.year, today.month) === 0;
  const title = monthTitle(y, m);

  els.title.textContent = title;
  els.next.disabled = compareMonths(y, m, today.year, today.month) >= 0;
  els.today.classList.toggle('is-hidden', isCurrentMonth);
  els.today.disabled = isCurrentMonth;
  els.grid.setAttribute('aria-label', title);

  const signature = `${y}-${m}|${today.key}`;
  if (signature !== gridSignature) {
    gridSignature = signature;
    buildGrid(els.grid, y, m, today.key);
    if (direction) animateMonth(els.grid, direction);
  }

  for (const btn of els.grid.querySelectorAll('.day')) {
    const key = btn.dataset.key;
    const s = days[key] || 'empty';
    if (btn.dataset.state !== s) btn.dataset.state = s;
    const label = btn.disabled
      ? `${btn.dataset.label}, бъдещ ден`
      : `${btn.dataset.label}${key === today.key ? ', днес' : ''}, ${STATE_LABEL[s]}`;
    btn.setAttribute('aria-label', label);
    if (key === changedKey) pop(btn.querySelector('.dot'));
  }

  renderCounter(els.counter, days, y, m);
}

function buildGrid(grid, year, month, todayKey) {
  const frag = document.createDocumentFragment();
  for (const day of monthGrid(year, month)) {
    if (day === null) {
      const blank = document.createElement('div');
      blank.className = 'blank';
      blank.setAttribute('aria-hidden', 'true');
      frag.append(blank);
      continue;
    }
    const key = dateKey(year, month, day);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day';
    btn.dataset.key = key;
    btn.dataset.label = dayLabel(year, month, day);
    btn.dataset.state = 'empty';
    // Ключовете YYYY-MM-DD се сравняват правилно като низове.
    if (key > todayKey) btn.disabled = true;
    if (key === todayKey) btn.classList.add('is-today');
    btn.innerHTML = `<span class="num" aria-hidden="true">${day}</span><span class="dot" aria-hidden="true"></span>`;
    frag.append(btn);
  }
  grid.replaceChildren(frag);
}

function renderCounter(counter, days, year, month) {
  const prefix = monthPrefix(year, month);
  let green = 0;
  let red = 0;
  for (const [key, value] of Object.entries(days)) {
    if (!key.startsWith(prefix)) continue;
    if (value === 'green') green++;
    else if (value === 'red') red++;
  }
  counter.querySelector('[data-count="green"]').textContent = green;
  counter.querySelector('[data-count="red"]').textContent = red;
  counter.querySelector('[data-word="green"]').textContent = green === 1 ? 'зелен' : 'зелени';
  counter.querySelector('[data-word="red"]').textContent = red === 1 ? 'червен' : 'червени';
}

function restartAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth; // reflow, за да тръгне анимацията отначало
  el.classList.add(className);
  // animationend изплува от децата (напр. .dot вътре в мрежата), затова проверяваме target.
  el.onanimationend = (e) => {
    if (e.target !== el) return;
    el.classList.remove(className);
    el.onanimationend = null;
  };
}

function pop(dot) {
  restartAnimation(dot, 'pop');
}

function animateMonth(grid, direction) {
  grid.classList.remove('slide-next', 'slide-prev');
  restartAnimation(grid, direction > 0 ? 'slide-next' : 'slide-prev');
}
