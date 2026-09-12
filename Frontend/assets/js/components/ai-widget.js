/**
 * СанАрт — сквозной AI-виджет: плавающая кнопка + простая чат-панель.
 * Монтируется на index.html и events.html (в #ai-widget-mount), на login.html
 * не подключается.
 *
 * Сейчас максимально просто и без выдуманной логики: сообщение пользователя
 * просто добавляется в ленту. Реальный вызов AI (бэкенд-функция
 * get_recommendation_json(event_input)) подключим, когда будет что показывать.
 */

function sanartInitAIWidget() {
  const mount = document.getElementById("ai-widget-mount");
  if (!mount) return;

  mount.innerHTML = `
    <button class="ai-fab" id="ai-fab" type="button" aria-label="Открыть чат СанАрт">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4.6A2.1 2.1 0 0 1 5.1 2.5h9.8A2.1 2.1 0 0 1 17 4.6v6.3a2.1 2.1 0 0 1-2.1 2.1H8.6L5 16.2v-3.2H5.1A2.1 2.1 0 0 1 3 10.9V4.6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
    </button>
    <div class="ai-panel" id="ai-panel" hidden>
      <div class="ai-panel__header">
        <span class="ai-panel__title">Чат СанАрт</span>
        <button class="overlay__close" id="ai-panel-close" type="button" aria-label="Закрыть">${SANART_ICONS.close}</button>
      </div>
      <div class="ai-panel__body" id="ai-panel-body"></div>
      <div class="ai-panel__footer">
        <div class="ai-input-row">
          <textarea class="textarea-input" id="ai-input" rows="1" placeholder="Написать сообщение"></textarea>
          <button class="ai-send-btn" id="ai-send" type="button" aria-label="Отправить">${SANART_ICONS.send}</button>
        </div>
      </div>
    </div>`;

  const fab = document.getElementById("ai-fab");
  const panel = document.getElementById("ai-panel");
  const closeBtn = document.getElementById("ai-panel-close");
  const body = document.getElementById("ai-panel-body");
  const input = document.getElementById("ai-input");
  const sendBtn = document.getElementById("ai-send");

  fab.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) input.focus();
  });
  closeBtn.addEventListener("click", () => {
    panel.hidden = true;
  });

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    const el = document.createElement("div");
    el.className = "ai-message ai-message--user";
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;

    input.value = "";
  }

  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter" && !evt.shiftKey) {
      evt.preventDefault();
      handleSend();
    }
  });
}

document.addEventListener("DOMContentLoaded", sanartInitAIWidget);
