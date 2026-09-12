/**
 * СанАрт — клиент простого бэкенда (Backend/app.py, Flask + SQLite).
 * Общий модуль для всех страниц: институции, дашборд, ивенты.
 */

const SANART_API_BASE = "http://localhost:5000/api";
const SANART_USER_EMAIL = "user_login@mail.ru";
const SANART_ACTIVE_INSTITUTION_KEY = "sanart_active_institution_id";

const SANART_PALETTE = [
  "var(--color-accent-orange)",
  "var(--color-accent-purple)",
  "var(--color-accent-blue)",
  "var(--color-accent-green)",
  "var(--color-accent-gray)",
];

const RU_MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function formatNumber(n) {
  return new Intl.NumberFormat("ru-RU").format(n);
}

async function sanartApiGet(path) {
  const res = await fetch(`${SANART_API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json();
}

function sanartGetActiveInstitutionId(institutions) {
  const saved = localStorage.getItem(SANART_ACTIVE_INSTITUTION_KEY);
  if (saved && institutions.some((i) => i.id === saved)) return saved;
  return institutions[0].id;
}

function sanartSetActiveInstitutionId(id) {
  localStorage.setItem(SANART_ACTIVE_INSTITUTION_KEY, id);
}

// Страницы приложения (дашборд/ивенты) доступны только после входа —
// без выбранной организации сразу отправляем на login.html.
function sanartRequireActiveInstitution() {
  if (localStorage.getItem(SANART_ACTIVE_INSTITUTION_KEY)) return true;
  window.location.href = "login.html";
  return false;
}

function sanartWithColors(items) {
  return items.map((item, i) => ({ ...item, color: SANART_PALETTE[i % SANART_PALETTE.length] }));
}

function sanartFormatShortDate(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${RU_MONTHS_SHORT[m - 1]}`;
}

function sanartFormatDateRange(range) {
  if (!range || !range.min || !range.max) return "";
  return `${sanartFormatShortDate(range.min)} – ${sanartFormatShortDate(range.max)}`;
}
