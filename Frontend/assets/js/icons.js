/**
 * СанАрт — набор inline SVG-иконок (stroke, 20x20 viewBox по умолчанию).
 * Один источник иконок для сайдбара, хедера, KPI-карточек и списков.
 */

const SANART_ICONS = {
  dashboard: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.6" fill="currentColor"/><rect x="11" y="2.5" width="6.5" height="6.5" rx="1.6" fill="currentColor" opacity="0.4"/><rect x="2.5" y="11" width="6.5" height="6.5" rx="1.6" fill="currentColor" opacity="0.4"/><rect x="11" y="11" width="6.5" height="6.5" rx="1.6" fill="currentColor"/></svg>`,

  audience: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="6.6" r="3.1" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 17c.7-3.4 3.4-5.4 6.5-5.4s5.8 2 6.5 5.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  events: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.8" y="3.8" width="14.4" height="13" rx="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M2.8 8h14.4" stroke="currentColor" stroke-width="1.6"/><path d="M6.4 2.5v2.6M13.6 2.5v2.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  feedback: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4.6A2.1 2.1 0 0 1 5.1 2.5h9.8A2.1 2.1 0 0 1 17 4.6v6.3a2.1 2.1 0 0 1-2.1 2.1H8.6L5 16.2v-3.2H5.1A2.1 2.1 0 0 1 3 10.9V4.6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,

  reports: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 2.8h6.2l3.3 3.3v10.4a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 10.5h6M7 13.3h6M7 7.7h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  building: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2 3 6v1.2h14V6L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 8.2v7.4M7 8.2v7.4M13 8.2v7.4M16 8.2v7.4" stroke="currentColor" stroke-width="1.5"/><path d="M3 17h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  calendarRange: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.6" y="3.8" width="14.8" height="13" rx="2.4" stroke="currentColor" stroke-width="1.5"/><path d="M2.6 8h14.8" stroke="currentColor" stroke-width="1.5"/><path d="M6.2 2.4v2.8M13.8 2.4v2.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  chevronDown: `<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5.2 7 9l4-3.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  arrowUp: `<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  arrowDown: `<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  arrowRight: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  clock: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7.2" stroke="currentColor" stroke-width="1.6"/><path d="M10 6v4.2l3 1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  userPlus: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8.4" cy="6.6" r="3.1" stroke="currentColor" stroke-width="1.6"/><path d="M2.6 17c.6-3.2 3-5 5.8-5M14 6.6h4M16 4.6v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  pin: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 17.5s5.5-4.9 5.5-9.2A5.5 5.5 0 0 0 4.5 8.3c0 4.3 5.5 9.2 5.5 9.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="8.2" r="1.9" stroke="currentColor" stroke-width="1.5"/></svg>`,

  warning: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.8 18 16.4H2L10 2.8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 8.4v3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="14.2" r="0.9" fill="currentColor"/></svg>`,

  pixelGlyph: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="8" height="8" fill="currentColor"/><rect x="11" y="0" width="4" height="4" fill="currentColor"/><rect x="0" y="11" width="4" height="4" fill="currentColor"/><rect x="9" y="9" width="9" height="9" fill="currentColor"/></svg>`,

  close: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,

  plus: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,

  sparkle: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.5 11.6 7.9 17 9.5l-5.4 1.6L10 16.5 8.4 11.1 3 9.5l5.4-1.6L10 2.5Z" fill="currentColor"/><path d="M16 2.5v3.4M14.3 4.2h3.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,

  send: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3 3 9.2l5.8 2 2 5.8L17 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M8.8 11.2 17 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  star: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.6 12.5 7.7l5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8L10 2.6Z" fill="currentColor"/></svg>`,

  check: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10.5 8 14.5 16 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  filter: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4.5h14L11.5 10.8v4.7L8.5 17v-6.2L3 4.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,

  paperclip: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.7 6.3 7.9 12.1a2.4 2.4 0 0 0 3.4 3.4l6.1-6.1a4 4 0 1 0-5.7-5.7L5.6 9.8a5.6 5.6 0 1 0 7.9 7.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  logout: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 17H4.8A1.8 1.8 0 0 1 3 15.2V4.8A1.8 1.8 0 0 1 4.8 3H8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 6.5 17 10l-4 3.5M17 10H7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};
