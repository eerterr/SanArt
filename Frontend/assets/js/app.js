/**
 * СанАрт — точка сборки страницы «Дашборд».
 * Все метрики и графики — реальные, с бэкенда (Backend/app.py → /api/dashboard,
 * /api/kpis), посчитанные из institutions_official + events/attendance/audience_synthetic.
 */

const KPI_META = [
  { key: "visitors", icon: "audience", label: "Посетители" },
  { key: "newVisitors", icon: "userPlus", label: "Новые посетители" },
  { key: "eventsHeld", icon: "events", label: "Проведено мероприятий" },
  { key: "avgFillRatePct", icon: "clock", label: "Средняя заполняемость", isPercent: true },
];

let sanartActiveInstitutionId = null;

function ru1(value) {
  return String(value).replace(".", ",");
}

function renderKpiCards(kpis) {
  const mount = document.getElementById("kpi-grid");
  if (!mount) return;

  mount.innerHTML = KPI_META.map((meta) => {
    const kpi = kpis[meta.key];
    const value = meta.isPercent ? `${ru1(kpi.value)}%` : formatNumber(kpi.value);
    const hasDelta = kpi.deltaPct != null;
    const isUp = kpi.deltaDir === "up";
    const deltaHtml = hasDelta
      ? `<span class="kpi-card__delta ${isUp ? "kpi-card__delta--up" : "kpi-card__delta--down"}">
           <span class="kpi-card__delta-icon">${isUp ? SANART_ICONS.arrowUp : SANART_ICONS.arrowDown}</span>${ru1(Math.abs(kpi.deltaPct))}%
         </span>`
      : "";

    return `
      <div class="card kpi-card">
        <div class="kpi-card__head">
          <span class="kpi-card__icon">${SANART_ICONS[meta.icon]}</span>
          <span>${meta.label}</span>
        </div>
        <div class="kpi-card__value-row">
          <span class="kpi-card__value">${value}</span>
          ${deltaHtml}
        </div>
        <p class="kpi-card__caption">${kpi.caption}</p>
      </div>`;
  }).join("");
}

function renderDataQualityBanner(dataQuality) {
  const mount = document.getElementById("dq-banner");
  if (!mount) return;

  const message = dataQuality.ownIsOk
    ? `<strong>Контроль качества:</strong> данные этой организации подтверждены (OK). По всей платформе у ${dataQuality.institutionsFlagged} из ${dataQuality.institutionsTotal} учреждений есть расхождения в отчётности — это не скрывается и видно в системе.`
    : `<strong>Контроль качества:</strong> в отчётности этой организации обнаружены расхождения (${dataQuality.ownStatus}) — показатели по ней помечены и не скрыты. Всего по платформе такое у ${dataQuality.institutionsFlagged} из ${dataQuality.institutionsTotal} учреждений.`;

  mount.innerHTML = `
    <div class="dq-banner">
      <span class="dq-banner__icon">${SANART_ICONS.warning}</span>
      <span>${message}</span>
    </div>`;
}

async function loadKpisForPeriod(period) {
  const kpis = await sanartApiGet(`/kpis?institution_id=${sanartActiveInstitutionId}&period=${period}`);
  renderKpiCards(kpis);
}

function initPeriodTabs() {
  const tabs = document.querySelectorAll(".period-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("period-tab--active"));
      tab.classList.add("period-tab--active");
      loadKpisForPeriod(tab.dataset.period);
    });
  });
}

async function initDashboard() {
  if (!sanartRequireActiveInstitution()) return;

  const institutions = await sanartApiGet("/institutions");
  sanartActiveInstitutionId = sanartGetActiveInstitutionId(institutions);
  const data = await sanartApiGet(`/dashboard?institution_id=${sanartActiveInstitutionId}`);

  renderSidebar("dashboard");
  renderTopbar(institutions, {
    dataQuality: data.dataQuality,
    periodLabel: sanartFormatDateRange(data.dateRange),
  });
  renderDataQualityBanner(data.dataQuality);
  initPeriodTabs();
  await loadKpisForPeriod("today");

  const attendanceSeries = data.attendanceSeries.map((d) => ({ date: sanartFormatShortDate(d.date), value: d.value }));
  renderAreaChart("attendance-chart", attendanceSeries);

  const eventTypes = sanartWithColors(data.eventTypes.map((t) => ({ label: t.label, value: t.pct })));
  renderDonutChart("event-types-donut", eventTypes, data.kpis.eventsHeld, "мероприятий");

  renderRankList("top-events", sanartWithColors(data.topEvents));
  renderBarChart("age-bar-chart", sanartWithColors(data.ageGroups));
}

document.addEventListener("DOMContentLoaded", initDashboard);
