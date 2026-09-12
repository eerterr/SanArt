/**
 * СанАрт — страница «Ивенты». Данные — с бэкенда (Backend/app.py, /api/events,
 * /api/events/<id>) для выбранной организации.
 *
 * При наведении на карточку — плашка с ключевыми показателями мероприятия
 * (посещаемость/заполняемость/рейтинг), без лишнего запроса — данные уже
 * приходят вместе со списком. Клик открывает полную карточку мероприятия
 * с ещё несколькими реальными показателями.
 */

let sanartEventsById = {};

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function ru1(value) {
  return String(value).replace(".", ",");
}

function renderDataQualityBanner(dataQuality) {
  const mount = document.getElementById("dq-banner");
  if (!mount) return;
  mount.innerHTML = `
    <div class="dq-banner">
      <span class="dq-banner__icon">${SANART_ICONS.warning}</span>
      <span><strong>Контроль качества:</strong> у ${dataQuality.institutionsFlagged} из ${dataQuality.institutionsTotal} учреждений обнаружены расхождения в исходных данных — значения по ним помечены и не скрыты из отчётов.</span>
    </div>`;
}

function initPeriodTabs() {
  const tabs = document.querySelectorAll(".period-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("period-tab--active"));
      tab.classList.add("period-tab--active");
    });
  });
}

// ---------- Оверлей карточки мероприятия ----------

function openOverlay(html) {
  const overlay = document.getElementById("app-overlay");
  const panel = document.getElementById("app-overlay-panel");
  panel.innerHTML = html;
  overlay.hidden = false;
}

function closeOverlay() {
  const overlay = document.getElementById("app-overlay");
  const panel = document.getElementById("app-overlay-panel");
  overlay.hidden = true;
  panel.innerHTML = "";
}

function initOverlaySystem() {
  const overlay = document.getElementById("app-overlay");
  overlay.addEventListener("click", (evt) => {
    if (evt.target === overlay || evt.target.closest(".overlay__close")) {
      closeOverlay();
    }
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "Escape" && !overlay.hidden) closeOverlay();
  });
}

function buildEventDetailHtml(event, full) {
  const ratingLabel = event.avgRating != null ? `${ru1(event.avgRating)}/5` : "—";
  return `
    <div class="overlay__header">
      <div>
        <p class="overlay__title">${escapeHtml(event.name)}</p>
        <p class="overlay__subtitle">${event.type} · ${event.date} · ${event.startTime}</p>
      </div>
      <button class="overlay__close" type="button" aria-label="Закрыть">${SANART_ICONS.close}</button>
    </div>
    <div class="event-photos">
      <div class="event-photos__item event-photos__item--a">Фото</div>
      <div class="event-photos__item event-photos__item--b">Фото</div>
      <div class="event-photos__item event-photos__item--c">Фото</div>
    </div>
    <div class="event-context-grid">
      <div class="event-context-item"><span class="event-context-item__label">Вместимость</span><span class="event-context-item__value">${formatNumber(event.capacity)}</span></div>
      <div class="event-context-item"><span class="event-context-item__label">Цена</span><span class="event-context-item__value">${event.price ? `${formatNumber(event.price)} ₽` : "Бесплатно"}</span></div>
      <div class="event-context-item"><span class="event-context-item__label">Длительность</span><span class="event-context-item__value">${event.durationMin} мин</span></div>
      <div class="event-context-item"><span class="event-context-item__label">Посетители</span><span class="event-context-item__value">${formatNumber(event.visitors)}</span></div>
      <div class="event-context-item"><span class="event-context-item__label">Заполняемость</span><span class="event-context-item__value">${ru1(event.fillRatePct)}%</span></div>
      <div class="event-context-item"><span class="event-context-item__label">Рейтинг</span><span class="event-context-item__value">${ratingLabel}</span></div>
      ${
        full
          ? `
      <div class="event-context-item"><span class="event-context-item__label">No-show</span><span class="event-context-item__value">${ru1(full.noShowRatePct)}%</span></div>
      <div class="event-context-item"><span class="event-context-item__label">Новые посетители</span><span class="event-context-item__value">${formatNumber(full.newVisitors)}</span></div>
      <div class="event-context-item"><span class="event-context-item__label">Возраст аудитории</span><span class="event-context-item__value">${full.targetAgeMin}–${full.targetAgeMax}</span></div>`
          : ""
      }
    </div>`;
}

async function openEventDetail(event) {
  openOverlay(buildEventDetailHtml(event, null));
  try {
    const full = await sanartApiGet(`/events/${event.id}`);
    openOverlay(buildEventDetailHtml(event, full));
  } catch (e) {
    // если детальный запрос не удался — оставляем уже показанные базовые данные
  }
}

// ---------- Сетка карточек мероприятий ----------

function renderEventCards(events) {
  const mount = document.getElementById("event-cards");
  if (!mount) return;

  mount.innerHTML = events
    .map((e) => {
      const ratingLabel = e.avgRating != null ? ru1(e.avgRating) : "—";
      return `
      <article class="event-card" data-event-id="${e.id}">
        <div class="event-card__head">
          <span class="event-card__name">${escapeHtml(e.name)}</span>
          <span class="event-card__date">${e.date}</span>
        </div>
        <div class="event-card__photo">Фото</div>
        <p class="event-card__caption">${e.type}</p>
        <div class="event-card__hover-panel">
          <div class="event-card__hover-stat"><span>Посетители</span><strong>${formatNumber(e.visitors)}</strong></div>
          <div class="event-card__hover-stat"><span>Заполняемость</span><strong>${ru1(e.fillRatePct)}%</strong></div>
          <div class="event-card__hover-stat"><span>Рейтинг</span><strong>${ratingLabel}</strong></div>
        </div>
      </article>`;
    })
    .join("");

  mount.querySelectorAll("[data-event-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const event = sanartEventsById[card.dataset.eventId];
      if (event) openEventDetail(event);
    });
  });
}

async function initEventsPage() {
  const institutions = await sanartApiGet("/institutions");
  const institutionId = sanartGetActiveInstitutionId(institutions);
  const [dashboardData, events] = await Promise.all([
    sanartApiGet(`/dashboard?institution_id=${institutionId}`),
    sanartApiGet(`/events?institution_id=${institutionId}`),
  ]);

  sanartEventsById = Object.fromEntries(events.map((e) => [e.id, e]));

  renderSidebar("events");
  renderTopbar(institutions, {
    dataQuality: dashboardData.dataQuality,
    periodLabel: sanartFormatDateRange(dashboardData.dateRange),
  });
  renderDataQualityBanner(dashboardData.dataQuality);
  initPeriodTabs();
  renderEventCards(events);
  initOverlaySystem();
}

document.addEventListener("DOMContentLoaded", initEventsPage);
