/**
 * СанАрт — компонент бокового меню.
 * Сознательно минимальный список вкладок на этом шаге: Дашборд, Аудитория,
 * Мероприятия (по структуре из вайрфрейма). Остальные разделы добавятся позже
 * вместе с реальными данными под них.
 */

const SANART_NAV_ITEMS = [
  { id: "dashboard", label: "Дашборд", icon: "dashboard", href: "index.html", ready: true },
  { id: "audience", label: "Аудитория", icon: "audience", href: "audience.html", ready: true },
  { id: "events", label: "Мероприятия", icon: "events", href: "events.html", ready: true },
];

function renderSidebar(activeId) {
  const mount = document.getElementById("sidebar-mount");
  if (!mount) return;

  const navHtml = SANART_NAV_ITEMS.map((item) => {
    const isActive = item.id === activeId;
    const classes = ["nav-item"];
    if (isActive) classes.push("nav-item--active");
    if (!item.ready) classes.push("nav-item--disabled");

    const tag = item.ready ? "a" : "span";
    const href = item.ready ? `href="${item.href}"` : "";
    const soon = !item.ready ? `<span class="nav-item__soon">скоро</span>` : "";

    return `
      <${tag} class="${classes.join(" ")}" ${href}>
        <span class="nav-item__icon">${SANART_ICONS[item.icon]}</span>
        <span class="nav-item__label">${item.label}</span>
        ${soon}
      </${tag}>`;
  }).join("");

  mount.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar__top">
        <div class="sidebar__brand">
          <img class="sidebar__logo-img" src="assets/img/logo.png" alt="СанАрт" />
          <p class="corner-label sidebar__tagline">Искусство<br />в движении</p>
        </div>
        <nav class="sidebar__nav" aria-label="Основная навигация">
          ${navHtml}
        </nav>
      </div>
      <div class="sidebar__footer">
        <span class="corner-label">Культура<br />Люди<br />Данные<br />Возможности</span>
        <span class="corner-label" style="color: var(--color-text)">${SANART_ICONS.pixelGlyph.replace('viewBox="0 0 20 20"', 'viewBox="0 0 20 20" width="14" height="14"')}</span>
      </div>
    </aside>`;
}
