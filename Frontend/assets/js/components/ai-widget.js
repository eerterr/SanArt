/**
 * СанАрт — сквозной AI-виджет: плавающая кнопка + чат-панель.
 * Монтируется на index.html и events.html (в #ai-widget-mount), на login.html
 * не подключается.
 *
 * Реальный вызов: POST /api/ai/chat → Backend/app.py → AI_section/ai_rec.py
 * (get_recommendation_json, GigaChat). Без GIGACHAT_AUTH_KEY в AI_section/.env
 * бэкенд вернёт понятную ошибку — показываем её как есть, без выдумывания
 * ответа.
 */

const AI_ACTION_LABELS = {
  KEEP: { label: "Можно оставить как есть", tone: "positive" },
  RESCHEDULE: { label: "Стоит перенести время", tone: "warning" },
  CHANGE_FORMAT: { label: "Стоит изменить формат", tone: "warning" },
  RESCHEDULE_AND_CHANGE_FORMAT: { label: "Перенести время и изменить формат", tone: "warning" },
};

function sanartEscapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanartRenderAIResponseCard(result) {
  if (result.error) {
    return `<div class="ai-response-card ai-response-card--error">${sanartEscapeHtml(result.error)}</div>`;
  }

  const action = AI_ACTION_LABELS[result.action] || { label: result.action || "—", tone: "neutral" };

  const rows = [
    ["Время", result.timing_evaluation],
    ["Формат", result.format_evaluation],
    ["Предложенное время", result.suggested_datetime],
    ["Предложенный формат", result.suggested_format],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `<div class="ai-response-row"><strong>${label}:</strong> ${sanartEscapeHtml(value)}</div>`)
    .join("");

  return `
    <div class="ai-response-card">
      <span class="ai-response-badge ai-response-badge--${action.tone}">${sanartEscapeHtml(action.label)}</span>
      ${rows}
      ${result.reasoning ? `<div class="ai-response-row ai-response-row--reasoning">${sanartEscapeHtml(result.reasoning)}</div>` : ""}
    </div>`;
}

function sanartInitAIWidget() {
  const mount = document.getElementById("ai-widget-mount");
  if (!mount) return;

  mount.innerHTML = `
    <button class="ai-fab" id="ai-fab" type="button" aria-label="Открыть чат СанАрт">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4.6A2.1 2.1 0 0 1 5.1 2.5h9.8A2.1 2.1 0 0 1 17 4.6v6.3a2.1 2.1 0 0 1-2.1 2.1H8.6L5 16.2v-3.2H5.1A2.1 2.1 0 0 1 3 10.9V4.6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
    </button>
    <div class="ai-panel" id="ai-panel" hidden>
      <div class="ai-panel__header">
        <span class="ai-panel__title">AI-ассистент СанАрт</span>
        <button class="overlay__close" id="ai-panel-close" type="button" aria-label="Закрыть">${SANART_ICONS.close}</button>
      </div>
      <div class="ai-panel__body" id="ai-panel-body">
        <p class="ai-panel__intro">Опишите идею мероприятия — оценим время и формат под целевую аудиторию.</p>
      </div>
      <div class="ai-panel__footer">
        <div class="ai-input-row">
          <textarea class="textarea-input" id="ai-input" rows="1" placeholder="Например: хочу лекцию для школьников в 21:00 в будни"></textarea>
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

  async function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    const userEl = document.createElement("div");
    userEl.className = "ai-message ai-message--user";
    userEl.textContent = text;
    body.appendChild(userEl);
    input.value = "";
    sendBtn.disabled = true;
    body.scrollTop = body.scrollHeight;

    const thinkingEl = document.createElement("div");
    thinkingEl.className = "ai-message ai-message--assistant";
    thinkingEl.textContent = "Анализирую…";
    body.appendChild(thinkingEl);
    body.scrollTop = body.scrollHeight;

    try {
      const res = await fetch(`${SANART_API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const result = await res.json();
      thinkingEl.innerHTML = sanartRenderAIResponseCard(result);
    } catch (e) {
      thinkingEl.innerHTML = `<div class="ai-response-card ai-response-card--error">Не удалось связаться с бэкендом (${SANART_API_BASE}). Проверьте, что запущен Backend/app.py.</div>`;
    }

    sendBtn.disabled = false;
    body.scrollTop = body.scrollHeight;
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
