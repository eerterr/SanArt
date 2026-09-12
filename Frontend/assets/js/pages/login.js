/**
 * СанАрт — авторизация + выбор/переключение организации (мультиорганизация).
 * Мок: реальной аутентификации нет — любые email/пароль проходят.
 * Список организаций — с бэкенда (Backend/app.py, /api/institutions).
 */

async function renderOrgOptions() {
  const mount = document.getElementById("org-options");
  if (!mount) return;

  const institutions = await sanartApiGet("/institutions");

  mount.innerHTML = institutions
    .map(
      (org, i) => `
      <label class="org-option ${i === 0 ? "org-option--selected" : ""}" data-org-id="${org.id}">
        <input class="visually-hidden" type="radio" name="org" value="${org.id}" ${i === 0 ? "checked" : ""} />
        <span class="org-option__icon">${SANART_ICONS.building}</span>
        <span class="org-option__body">
          <span class="org-option__name">${org.name}</span>
          <span class="org-option__meta">${org.type} · ${org.city} · ${org.role}</span>
        </span>
        <span class="org-option__check">${SANART_ICONS.check}</span>
      </label>`
    )
    .join("");

  mount.querySelectorAll(".org-option").forEach((label) => {
    label.addEventListener("click", () => {
      mount.querySelectorAll(".org-option").forEach((l) => {
        l.classList.remove("org-option--selected");
        l.querySelector("input").checked = false;
      });
      label.classList.add("org-option--selected");
      label.querySelector("input").checked = true;
    });
  });
}

function initLoginFlow() {
  const stepCredentials = document.getElementById("step-credentials");
  const stepOrg = document.getElementById("step-org");
  const loginForm = document.getElementById("login-form");
  const backBtn = document.getElementById("org-back");
  const continueBtn = document.getElementById("org-continue");

  loginForm.addEventListener("submit", (evt) => {
    evt.preventDefault();
    stepCredentials.hidden = true;
    stepOrg.hidden = false;
  });

  backBtn.addEventListener("click", () => {
    stepOrg.hidden = true;
    stepCredentials.hidden = false;
  });

  continueBtn.addEventListener("click", () => {
    const selected = document.querySelector(".org-option--selected");
    if (selected) sanartSetActiveInstitutionId(selected.dataset.orgId);
    window.location.href = "index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderOrgOptions();
  initLoginFlow();
});
