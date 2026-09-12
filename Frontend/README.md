# СанАрт — Frontend

Чистая вёрстка (HTML/CSS/JS, без сборщика и фреймворка), подключённая к простому
бэкенду (`../Backend`) через `fetch`. Четыре страницы: `login.html`, `index.html`
(дашборд), `audience.html` (аудитория/сегменты), `events.html` (ивенты).

## Как запустить

1. Поднять бэкенд (см. `../Backend/README` в корневом README) — он слушает
   `http://localhost:5000`.
2. Отдать фронтенд любым статическим сервером:

```bash
cd Frontend
python -m http.server 8080
```

и открыть `http://localhost:8080/login.html`.

## Структура

```
Frontend/
  login.html / index.html / audience.html / events.html
  assets/
    img/            — картинки заголовков и логотип (не текст, а .png-файлы)
    css/
      tokens.css              — цвета/шрифты/отступы/радиусы (CSS custom properties)
      base.css                — reset + типографика, .pixel-heading, .corner-label
      layout.css              — каркас: сайдбар / топбар / контентная сетка
      components.css          — карточки, KPI, графики, оверлеи, дропдаун, AI-чат
      pages/                  — точечные правки под конкретную страницу (включая audience.css)
    js/
      api.js                  — клиент бэкенда: fetch-обёртка, активная организация,
                                 палитра цветов для графиков, форматирование дат
      icons.js                — SANART_ICONS: набор inline SVG-иконок
      components/
        sidebar.js             — renderSidebar(activeId)
        topbar.js               — renderTopbar(institutions, extra) — переключатель организации
        charts.js                — renderAreaChart / renderDonutChart / renderRankList / renderBarChart
        ai-widget.js              — плавающий чат, подключён к реальному AI-бэкенду (см. ниже)
      pages/
        login.js                — организации с бэкенда, переключение
        audience.js               — сегменты аудитории (кластеризация)
        events.js                 — список мероприятий + карточка мероприятия
      app.js                     — сборка страницы «Дашборд»
```

## Как это устроено

- Все данные — с бэкенда: `GET /api/institutions`, `/api/dashboard?institution_id=`,
  `/api/audience?institution_id=`, `/api/events?institution_id=`, `/api/events/<id>`,
  `POST /api/ai/chat`. Никаких моков в JS больше нет.
- Аудитория (`audience.html`) — сегменты из HDBSCAN-кластеризации
  (`AI_section/ai_predict.py`), а не список посетителей: размер, профиль
  (возраст/визиты/вовлечённость/рейтинг/любимый формат) и продуктовая
  рекомендация по каждому сегменту, посчитанные бэкендом.
- AI-чат (плавающая кнопка) вызывает `POST /api/ai/chat` → `AI_section/ai_rec.py`
  (GigaChat). Без `GIGACHAT_AUTH_KEY` в `AI_section/.env` бэкенд отвечает
  понятной ошибкой вместо выдуманной рекомендации.
- Активная организация хранится в `localStorage` (`sanart_active_institution_id`) —
  выбирается на `login.html`, переключается прямо в хедере.
- Баннер контроля качества данных (`#dq-banner`) — обязателен: если у части
  учреждений есть расхождения в `data_quality`, это видно, а не скрыто. Значение
  считается бэкендом от реальных данных `institutions_official`, не захардкожено.
- Картинки логотипа и заголовков экранов лежат в `assets/img/` — это не текст,
  на тёмном фоне (левая панель логина) они инвертируются через CSS `filter: invert(1)`.
