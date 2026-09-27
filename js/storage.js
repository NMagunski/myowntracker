const KEY = 'myowntracker:v1';
const BACKUP_KEY = 'myowntracker:v1:corrupt-backup';
const VERSION = 1;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const STATES = new Set(['green', 'red']);

// Ако прочетените данни са повредени, пазим суровия текст, за да не се загуби,
// когато потребителят направи първата си промяна и записът го презапише.
let corruptRaw = null;

/** Връща обекта days ({ "YYYY-MM-DD": "green" | "red" }). Никога не хвърля грешка. */
export function load() {
  let raw;
  try {
    raw = localStorage.getItem(KEY);
  } catch (err) {
    console.error('MyOwnTracker: localStorage не е достъпен', err);
    return {};
  }
  if (raw === null) return {};

  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !data.days || typeof data.days !== 'object') {
      throw new Error('неочаквана структура');
    }
    const days = {};
    for (const [key, value] of Object.entries(data.days)) {
      if (DAY_KEY.test(key) && STATES.has(value)) days[key] = value;
      else console.warn('MyOwnTracker: пропуснат невалиден запис', key, value);
    }
    return days;
  } catch (err) {
    console.error('MyOwnTracker: повредени данни, няма да бъдат презаписани без промяна', err);
    corruptRaw = raw;
    return {};
  }
}

/** Записва всички дни. Връща true при успех. */
export function save(days) {
  try {
    if (corruptRaw !== null) {
      localStorage.setItem(BACKUP_KEY, corruptRaw);
      corruptRaw = null;
    }
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, days }));
    return true;
  } catch (err) {
    console.error('MyOwnTracker: записът не успя', err);
    return false;
  }
}
