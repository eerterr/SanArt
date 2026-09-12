/**
 * СанАрт — точка сборки страницы «Дашборд».
 * Все метрики и графики — реальные, с бэкенда (Backend/app.py → /api/dashboard),
 * посчитанные из institutions_official + events/attendance/audience_synthetic.
 */

const KPI_META = [
  { key: "visitors", icon: "audience", label: "Посетители" },
  { key: "newVisitors", icon: "userPlus", label: "Новые посетители" },
  { key: "eventsHeld", icon: "events", label: "Проведено мероприятий" },
  { key: "avgFillRatePct", icon: "clock", label: "Средняя заполняемость", isPercent: true },
];

function renderKpiCards(kpis) {
  const mount = document.getElementById("kpi-grid");
  if (!mount) return;

  mount.innerHTML = KPI_META.map((meta) => {
    const raw = kpis[meta.key];
    const value = meta.isPercent ? `${String(raw).replace(".", ",")}%` : formatNumber(raw);
    return `
      <div class="card kpi-card">
        <div class="kpi-card__head">
          <span class="kpi-card__icon">${SANART_ICONS[meta.icon]}</span>
          <span>${meta.label}</span>
        </div>
        <div class="kpi-card__value-row">
          <span class="kpi-card__value">${value}</span>
        </div>
      </div>`;
  }).join("");
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

async function initDashboard() {
  const institutions = await sanartApiGet("/institutions");
  const institutionId = sanartGetActiveInstitutionId(institutions);
  const data = await sanartApiGet(`/dashboard?institution_id=${institutionId}`);

  renderSidebar("dashboard");
  renderTopbar(institutions, {
    dataQuality: data.dataQuality,
    periodLabel: sanartFormatDateRange(data.dateRange),
  });
  renderDataQualityBanner(data.dataQuality);
  renderKpiCards(data.kpis);
  initPeriodTabs();

  const attendanceSeries = data.attendanceSeries.map((d) => ({ date: sanartFormatShortDate(d.date), value: d.value }));
  renderAreaChart("attendance-chart", attendanceSeries);

  const eventTypes = sanartWithColors(data.eventTypes.map((t) => ({ label: t.label, value: t.pct })));
  renderDonutChart("event-types-donut", eventTypes, data.kpis.eventsHeld, "мероприятий");

  renderRankList("top-events", sanartWithColors(data.topEvents));
  renderBarChart("age-bar-chart", sanartWithColors(data.ageGroups));
}

document.addEventListener("DOMContentLoaded", initDashboard);
