/**
 * СанАрт — компонент верхней панели: организация / период / профиль.
 * Список организаций и метаданные периода передаются вызывающей страницей
 * (данные приходят с бэкенда — Backend/app.py, /api/institutions и /api/dashboard).
 */

function renderTopbar(institutions, extra) {
  const mount = document.getElementById("topbar-mount");
  if (!mount) return;

  const activeId = sanartGetActiveInstitutionId(institutions);
  const activeOrg = institutions.find((org) => org.id === activeId) || institutions[0];
  const initial = SANART_USER_EMAIL.charAt(0).toUpperCase();
  const periodLabel = (extra && extra.periodLabel) || "";
  const dq = extra && extra.dataQuality;
  const dqTitle = dq
    ? `Качество данных: у ${dq.institutionsFlagged} из ${dq.institutionsTotal} учреждений есть расхождения в отчётности.`
    : "";

  const orgMenuItems = institutions
    .map(
      (org) => `
      <button class="dropdown__item ${org.id === activeOrg.id ? "dropdown__item--active" : ""}" type="button" data-org-id="${org.id}">
        <span class="dropdown__item-icon">${SANART_ICONS.building}</span>
        <span class="dropdown__item-body">
          <span class="dropdown__item-title">${org.name}</span>
          <span class="dropdown__item-meta">${org.type} · ${org.city} · ${org.role}</span>
        </span>
        ${org.id === activeOrg.id ? `<span class="dropdown__item-check">${SANART_ICONS.check}</span>` : ""}
      </button>`
    )
    .join("");

  mount.innerHTML = `
    <header class="topbar">
      <div class="topbar__left">
        <div class="dropdown" id="org-switcher">
          <button class="selector-chip selector-chip--dq" type="button" title="${dqTitle}">
            <span class="selector-chip__icon">${SANART_ICONS.building}</span>
            <span>${activeOrg.name}</span>
            <span class="selector-chip__chevron">${SANART_ICONS.chevronDown}</span>
            <span class="dq-dot" aria-hidden="true"></span>
          </button>
          <div class="dropdown__menu" hidden>
            <p class="dropdown__label">Мои организации</p>
            ${orgMenuItems}
          </div>
        </div>
      </div>
      <div class="topbar__right">
        <button class="selector-chip" type="button">
          <span class="selector-chip__icon">${SANART_ICONS.calendarRange}</span>
          <span>${periodLabel}</span>
        </button>
        <button class="user-chip" type="button">
          <span class="user-chip__avatar">${initial}</span>
          <span>${SANART_USER_EMAIL}</span>
        </button>
      </div>
    </header>`;

  const switcher = document.getElementById("org-switcher");
  const trigger = switcher.querySelector(".selector-chip");
  const menu = switcher.querySelector(".dropdown__menu");

  trigger.addEventListener("click", (evt) => {
    evt.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  menu.querySelectorAll(".dropdown__item").forEach((item) => {
    item.addEventListener("click", () => {
      sanartSetActiveInstitutionId(item.dataset.orgId);
      // Проще всего перезагрузить страницу — так дашборд/ивенты одним
      // движением подтянут метрики новой организации с бэкенда.
      window.location.reload();
    });
  });

  if (!window.__sanartTopbarOutsideClickBound) {
    window.__sanartTopbarOutsideClickBound = true;
    document.addEventListener("click", () => {
      const openMenu = document.querySelector("#org-switcher .dropdown__menu");
      if (openMenu) openMenu.hidden = true;
    });
  }
}
