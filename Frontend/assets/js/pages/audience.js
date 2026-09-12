/**
 * СанАрт — страница «Аудитория». Данные — с бэкенда (Backend/app.py, /api/audience),
 * который кластеризует профили аудитории учреждения через
 * AI_section/ai_predict.py (HDBSCAN) и добавляет продуктовую метку/рекомендацию
 * по правилам из MVP-описания (раздел 05: "вместо списка пользователей — сегменты").
 */

function ru1(value) {
  return String(value).replace(".", ",");
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

function renderAudienceKpis(data) {
  const mount = document.getElementById("audience-kpi-grid");
  if (!mount) return;

  const cards = [
    { icon: "audience", label: "Посетители", value: formatNumber(data.totalVisitors), caption: "профилей аудитории учреждения" },
    { icon: "dashboard", label: "Сегментов", value: data.segmentsCount, caption: "устойчивых поведенческих групп (HDBSCAN)" },
    { icon: "star", label: "Крупнейший сегмент", value: `${ru1(data.topSegmentSharePct)}%`, caption: "доля аудитории в самом большом сегменте" },
    { icon: "sparkle", label: "Вовлечённость", value: ru1(data.avgEngagement), caption: "средний engagement score (0-100) по учреждению" },
  ];

  mount.innerHTML = cards
    .map(
      (c) => `
      <div class="card kpi-card">
        <div class="kpi-card__head">
          <span class="kpi-card__icon">${SANART_ICONS[c.icon]}</span>
          <span>${c.label}</span>
        </div>
        <div class="kpi-card__value-row">
          <span class="kpi-card__value">${c.value}</span>
        </div>
        <p class="kpi-card__caption">${c.caption}</p>
      </div>`
    )
    .join("");
}

function renderSegmentCards(segments) {
  const mount = document.getElementById("segment-grid");
  if (!mount) return;

  mount.innerHTML = segments
    .map(
      (s) => `
      <article class="card segment-card">
        <div class="segment-card__head">
          <span class="segment-card__badge segment-card__badge--${s.presetKey}">${s.label}</span>
          <span class="segment-card__share">${ru1(s.sharePct)}% · ${formatNumber(s.visitors)} чел.</span>
        </div>
        <div class="segment-card__stats">
          <div class="segment-card__stat"><span>Возраст</span><strong>${ru1(s.avgAge)}</strong></div>
          <div class="segment-card__stat"><span>Визитов за год</span><strong>${ru1(s.avgVisits)}</strong></div>
          <div class="segment-card__stat"><span>Вовлечённость</span><strong>${ru1(s.avgEngagement)}</strong></div>
          <div class="segment-card__stat"><span>Рейтинг</span><strong>${s.avgRatingAmongRaters != null ? `${ru1(s.avgRatingAmongRaters)}/5` : "—"}</strong></div>
          <div class="segment-card__stat"><span>Оставляют отзыв</span><strong>${ru1(s.feedbackSharePct)}%</strong></div>
          <div class="segment-card__stat"><span>Любимый формат</span><strong>${s.topEventType} (${ru1(s.topEventTypeSharePct)}%)</strong></div>
        </div>
        <p class="segment-card__action">${s.action}</p>
      </article>`
    )
    .join("");
}

async function initAudiencePage() {
  if (!sanartRequireActiveInstitution()) return;

  const institutions = await sanartApiGet("/institutions");
  const institutionId = sanartGetActiveInstitutionId(institutions);
  const [dashboardData, audienceData] = await Promise.all([
    sanartApiGet(`/dashboard?institution_id=${institutionId}`),
    sanartApiGet(`/audience?institution_id=${institutionId}`),
  ]);

  renderSidebar("audience");
  renderTopbar(institutions, {
    dataQuality: dashboardData.dataQuality,
    periodLabel: sanartFormatDateRange(dashboardData.dateRange),
  });
  renderDataQualityBanner(dashboardData.dataQuality);

  renderAudienceKpis(audienceData);

  const segmentsWithColors = sanartWithColors(audienceData.segments);

  renderBarChart(
    "segment-engagement-chart",
    segmentsWithColors.map((s) => ({ pct: s.avgEngagement, label: s.label, color: s.color }))
  );

  const shareSlices = segmentsWithColors.map((s) => ({ label: s.label, value: s.sharePct, color: s.color }));
  if (audienceData.noise) {
    shareSlices.push({ label: audienceData.noise.label, value: audienceData.noise.sharePct, color: "var(--color-accent-gray)" });
  }
  renderDonutChart("segment-share-donut", shareSlices, audienceData.totalVisitors, "посетителей");

  renderSegmentCards(segmentsWithColors);

  const noteMount = document.getElementById("audience-note");
  if (noteMount) {
    noteMount.innerHTML = `
      <div class="ml-note">
        <strong>Кластеризация аудитории:</strong> ${audienceData.modelInfo.algorithm} (AI_section/ai_predict.py), минимальный размер кластера — ${audienceData.modelInfo.minClusterSize}.
        Модель — демонстрационный результат прототипа на синтетическом датасете, а не точный прогноз поведения посетителей.
      </div>`;
  }
}

document.addEventListener("DOMContentLoaded", initAudiencePage);
