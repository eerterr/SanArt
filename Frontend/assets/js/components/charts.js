/**
 * СанАрт — лёгкие SVG-графики без внешних зависимостых библиотек.
 * Каждая функция принимает id контейнера и данные (сейчас — с бэкенда)
 * и ничего не знает о разметке страницы — можно переиспользовать
 * на будущих страницах (Мероприятия, Аудитория и т.д.).
 */

/* ---------- Area chart: «Посещаемость музея» ---------- */

function renderAreaChart(containerId, series) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const width = 900;
  const height = 260;
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 40;
  const padRight = 8;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const values = series.map((d) => d.value);
  const maxVal = Math.ceil(Math.max(...values) / 500) * 500;
  const minVal = 0;

  const xStep = plotW / (series.length - 1);
  const yScale = (v) => padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;
  const xScale = (i) => padLeft + i * xStep;

  const points = series.map((d, i) => [xScale(i), yScale(d.value)]);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${padTop + plotH} L ${points[0][0].toFixed(1)} ${padTop + plotH} Z`;

  const ySteps = 4;
  const gridlines = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = (maxVal / ySteps) * i;
    const y = yScale(val);
    return `
      <line class="area-chart__gridline" x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" />
      <text class="area-chart__axis-label" x="${padLeft - 10}" y="${(y + 3).toFixed(1)}" text-anchor="end">${formatNumber(val)}</text>`;
  }).join("");

  const labelEvery = Math.ceil(series.length / 9);
  const xLabels = series
    .map((d, i) => {
      if (i % labelEvery !== 0 && i !== series.length - 1) return "";
      return `<text class="area-chart__axis-label" x="${xScale(i).toFixed(1)}" y="${height - 6}" text-anchor="middle">${d.date}</text>`;
    })
    .join("");

  el.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Посещаемость музея по дням">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-accent-orange)" stop-opacity="0.35" />
          <stop offset="100%" stop-color="var(--color-accent-orange)" stop-opacity="0" />
        </linearGradient>
      </defs>
      ${gridlines}
      <path d="${areaPath}" fill="url(#areaFill)" stroke="none" />
      <path d="${linePath}" fill="none" stroke="var(--color-accent-orange)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      ${xLabels}
      <circle class="area-chart__point" id="${containerId}-active-dot" r="5" cx="${points[0][0]}" cy="${points[0][1]}" />
      <rect id="${containerId}-hit" x="${padLeft}" y="0" width="${plotW}" height="${height}" fill="transparent" style="cursor: crosshair;" />
    </svg>
    <div class="area-chart__tooltip" id="${containerId}-tooltip"></div>`;

  const svg = el.querySelector("svg");
  const dot = document.getElementById(`${containerId}-active-dot`);
  const tooltip = document.getElementById(`${containerId}-tooltip`);
  const hitRect = document.getElementById(`${containerId}-hit`);

  function showAt(index) {
    const [px, py] = points[index];
    dot.setAttribute("cx", px);
    dot.setAttribute("cy", py);

    const pctX = (px / width) * 100;
    const pctY = (py / height) * 100;
    tooltip.style.left = `${pctX}%`;
    tooltip.style.top = `${pctY}%`;
    tooltip.innerHTML = `<strong>${formatNumber(series[index].value)}</strong><span>${series[index].date}</span>`;
  }

  function handlePointer(evt) {
    const rect = svg.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const relX = ((clientX - rect.left) / rect.width) * width;
    let index = Math.round((relX - padLeft) / xStep);
    index = Math.min(series.length - 1, Math.max(0, index));
    showAt(index);
  }

  hitRect.addEventListener("mousemove", handlePointer);
  hitRect.addEventListener("touchmove", handlePointer);

  // Дефолтное состояние — пик серии (соответствует референсу интерфейса).
  const peakIndex = values.indexOf(Math.max(...values));
  showAt(peakIndex);
}

/* ---------- Donut chart: «Источники посещений» ---------- */

function renderDonutChart(containerId, data, centerValue, centerLabel) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const size = 168;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offsetAcc = 0;
  const segments = data
    .map((d) => {
      const segLen = (d.value / 100) * circumference;
      const dasharray = `${segLen} ${circumference - segLen}`;
      const dashoffset = -offsetAcc;
      offsetAcc += segLen;
      return `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${d.color}"
        stroke-width="${strokeWidth}" stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}"
        transform="rotate(-90 ${center} ${center})" stroke-linecap="butt" />`;
    })
    .join("");

  const legendRows = data
    .map(
      (d) => `
      <div class="legend__row">
        <span class="legend__dot" style="background:${d.color}"></span>
        <span class="legend__label">${d.label}</span>
        <span class="legend__value">${d.value}%</span>
      </div>`
    )
    .join("");

  el.innerHTML = `
    <div class="donut-wrap">
      <div class="donut">
        <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Источники посещений">
          ${segments}
        </svg>
        <div class="donut__center">
          <span class="donut__center-value">${formatNumber(centerValue)}</span>
          <span class="donut__center-label">${centerLabel}</span>
        </div>
      </div>
      <div class="legend">${legendRows}</div>
    </div>`;
}

/* ---------- Ranked list с прогресс-барами: «Популярные экспозиции» ---------- */

function renderRankList(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const maxVal = Math.max(...data.map((d) => d.value));

  el.innerHTML = data
    .map(
      (d, i) => `
      <div class="rank-row">
        <span class="rank-row__index">${i + 1}</span>
        <span class="rank-row__body">
          <span class="rank-row__label">${d.label}</span>
          <span class="rank-row__track">
            <span class="rank-row__fill" style="width:${(d.value / maxVal) * 100}%; background:${d.color}"></span>
          </span>
        </span>
        <span class="rank-row__value">${formatNumber(d.value)}</span>
      </div>`
    )
    .join("");
}

/* ---------- Bar chart: «Возраст посетителей» ---------- */

function renderBarChart(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const maxPct = Math.max(...data.map((d) => d.pct));

  el.innerHTML = data
    .map(
      (d) => `
      <div class="bar-chart__col">
        <span class="bar-chart__pct">${d.pct}%</span>
        <span class="bar-chart__bar" style="height:${(d.pct / maxPct) * 100}%; background:${d.color}"></span>
        <span class="bar-chart__age">${d.label}</span>
      </div>`
    )
    .join("");
}

/* ---------- Geography list ---------- */

function renderGeoList(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = data
    .map(
      (d) => `
      <div class="geo-row">
        <span class="geo-row__icon">${SANART_ICONS.pin}</span>
        <span class="geo-row__label">${d.city}</span>
        <span class="geo-row__value">${d.pct}%</span>
      </div>`
    )
    .join("");
}
