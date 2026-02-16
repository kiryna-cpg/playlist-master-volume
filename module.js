/* Playlist Master Volume
 * Foundry VTT module (system-agnostic)
 *
 * Features:
 * - Adds a "Master Volume" control to PlaylistConfig to set all track volumes at once.
 * - Adds a gear button in the Playlists sidebar to open "Edit Playlist" (only for users with edit permission).
 * - Client settings:
 *   - Show/hide the sidebar shortcut
 *   - Choose shortcut position (left of title / right in controls)
 * - Shows a "Reload Required" dialog when settings change.
 *
 * Notes:
 * - Foundry uses non-linear (logarithmic) audio mapping; we convert between UI input and stored volume
 *   using AudioHelper.inputToVolume / volumeToInput.
 */

const MODULE_ID = "playlist-master-volume";

/* -------------------------------------------- */
/* i18n Helpers                                 */
/* -------------------------------------------- */

function i18n(key) {
  return game.i18n.localize(`${MODULE_ID}.${key}`);
}
function i18nFormat(key, data = {}) {
  return game.i18n.format(`${MODULE_ID}.${key}`, data);
}

/* -------------------------------------------- */
/* Reload Dialog (Settings changes)             */
/* -------------------------------------------- */

let _pmvReloadDialogOpen = false;

function reloadClient() {
  if (foundry?.utils?.debouncedReload) return foundry.utils.debouncedReload();
  return window.location.reload();
}

function requestReloadDialog() {
  if (_pmvReloadDialogOpen) return;
  _pmvReloadDialogOpen = true;

  new Dialog({
    title: i18n("reload.title"),
    content: `<p>${i18n("reload.message")}</p>`,
    buttons: {
      now: {
        icon: '<i class="fa-solid fa-rotate-right"></i>',
        label: i18n("reload.now"),
        callback: () => reloadClient()
      },
      later: {
        icon: '<i class="fa-solid fa-xmark"></i>',
        label: i18n("reload.later"),
        callback: () => {}
      }
    },
    default: "now",
    close: () => {
      _pmvReloadDialogOpen = false;
    }
  }).render(true);
}

/* -------------------------------------------- */
/* Settings                                     */
/* -------------------------------------------- */

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "showSidebarEdit", {
    name: `${MODULE_ID}.settings.quickEdit.name`,
    hint: `${MODULE_ID}.settings.quickEdit.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: requestReloadDialog
  });

  game.settings.register(MODULE_ID, "sidebarEditPosition", {
    name: `${MODULE_ID}.settings.position.name`,
    hint: `${MODULE_ID}.settings.position.hint`,
    scope: "client",
    config: true,
    type: String,
    choices: {
      left: `${MODULE_ID}.settings.position.choices.left`,
      right: `${MODULE_ID}.settings.position.choices.right`
    },
    default: "right",
    onChange: requestReloadDialog
  });
});

/**
 * Custom Settings UI (to allow HTML gear icon in descriptions).
 * Use `{gear}` placeholder in localized strings to insert the icon.
 */
Hooks.on("renderSettingsConfig", (app, html) => {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;

  const q = root.querySelector(`input[name="${MODULE_ID}.showSidebarEdit"]`)?.closest(".form-group");
  const p = root.querySelector(`select[name="${MODULE_ID}.sidebarEditPosition"]`)?.closest(".form-group");
  if (!q || !p) return;

  const gearHTML = `<i class="fa-solid fa-gear" style="color:#000"></i>`;

  const replaceGear = (text) => {
    const s = String(text ?? "");
    // Replace all occurrences of {gear}
    return s.split("{gear}").join(gearHTML);
  };

  const makeRow = (title, desc, inner) => `
    <div class="pmv-setting">
      <div class="pmv-setting__header">
        <label class="pmv-setting__title">${title}</label>
      </div>
      <p class="notes pmv-setting__desc">${replaceGear(desc)}</p>
      <div class="pmv-setting__fields">${inner}</div>
    </div>
  `;

  const currentShow = game.settings.get(MODULE_ID, "showSidebarEdit");
  const currentPos = game.settings.get(MODULE_ID, "sidebarEditPosition");

  q.innerHTML = makeRow(
    i18n("settings.quickEdit.name"),
    i18n("settings.quickEdit.desc"),
    `<input type="checkbox" ${currentShow ? "checked" : ""} data-pmv-setting="showSidebarEdit">`
  );

  p.innerHTML = makeRow(
    i18n("settings.position.name"),
    i18n("settings.position.desc"),
    `
    <select data-pmv-setting="sidebarEditPosition">
      <option value="left" ${currentPos === "left" ? "selected" : ""}>${i18n("settings.position.choices.left")}</option>
      <option value="right" ${currentPos === "right" ? "selected" : ""}>${i18n("settings.position.choices.right")}</option>
    </select>
    `
  );

  const styleId = "pmv-settings-style";
  if (!root.querySelector(`#${styleId}`)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .pmv-setting { display: flex; flex-direction: column; gap: 0.25rem; }
      .pmv-setting__header { display: flex; align-items: center; gap: 0.5rem; }
      .pmv-setting__title { font-weight: 600; }
      .pmv-setting__icon i { color: #000; }
      .pmv-setting__fields { display: flex; align-items: center; }
      .pmv-setting__fields select { max-width: 320px; }
      .pmv-setting__desc { margin: 0; }
    `;
    root.appendChild(style);
  }

  q.querySelector('[data-pmv-setting="showSidebarEdit"]')?.addEventListener("change", async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    await game.settings.set(MODULE_ID, "showSidebarEdit", ev.currentTarget.checked);

    // Defer dialog to avoid interfering with SettingsConfig internal rerender
    setTimeout(() => requestReloadDialog(), 0);
  });

  p.querySelector('[data-pmv-setting="sidebarEditPosition"]')?.addEventListener("change", async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    await game.settings.set(MODULE_ID, "sidebarEditPosition", ev.currentTarget.value);

    // Defer dialog to avoid interfering with SettingsConfig internal rerender
    setTimeout(() => requestReloadDialog(), 0);
  });
});

/* -------------------------------------------- */
/* Master Volume Logic                          */
/* -------------------------------------------- */

const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

function inputToVolume(input) {
  const x = clamp01(input);
  return globalThis.AudioHelper?.inputToVolume?.(x) ?? x;
}
function volumeToInput(volume) {
  const v = clamp01(volume);
  return globalThis.AudioHelper?.volumeToInput?.(v) ?? v;
}

function normalizeInput2(val) {
  const normalized = String(val).replace(",", ".");
  const x = clamp01(normalized);
  return Math.round(x * 100) / 100;
}
function format2(val) {
  return normalizeInput2(val).toFixed(2);
}

function computeInitialInput(playlist) {
  const vols = playlist.sounds.map((s) => Number(s.volume ?? 0.5));
  if (!vols.length) return 0.5;

  const first = vols[0];
  const allEqual = vols.every((v) => Math.abs(v - first) < 1e-6);
  const baseVol = allEqual ? first : vols.reduce((a, b) => a + b, 0) / vols.length;

  return normalizeInput2(volumeToInput(baseVol));
}

async function setAllSoundsFromInput(playlist, input) {
  const v = clamp01(inputToVolume(input));
  const updates = playlist.sounds.map((s) => ({ _id: s.id, volume: v }));
  if (!updates.length) return;
  await playlist.updateEmbeddedDocuments("PlaylistSound", updates);
}

function injectMasterVolume(app, element) {
  const playlist = app.document ?? app.object;
  if (!playlist) return;

  const canEdit = game.user.isGM || playlist.testUserPermission?.(game.user, "OWNER");
  if (!canEdit) return;

  const root = element instanceof HTMLElement ? element : element?.[0] ?? app.element;
  if (!root) return;

  const form = root.querySelector("form") ?? root;
  if (!form) return;

  if (form.querySelector(`[data-${MODULE_ID}-master]`)) return;

  const initial = computeInitialInput(playlist);

  const footer =
    form.querySelector("footer.form-footer") ??
    form.querySelector("footer") ??
    null;

  const wrapper = document.createElement("div");
  wrapper.className = "form-group";
  wrapper.setAttribute(`data-${MODULE_ID}-master`, "1");

  wrapper.innerHTML = `
    <label>${i18n("masterVolume")}</label>
    <div class="form-fields">
      <range-picker
        name="${MODULE_ID}.master"
        value="${initial}"
        min="0"
        max="1"
        step="0.01"
      >
        <input type="range" min="0" max="1" step="0.01">
        <input type="number" min="0" max="1" step="0.01">
      </range-picker>

      <button type="button" class="${MODULE_ID}-apply">
        <i class="fa-solid fa-check" inert=""></i>
        <span>${i18n("apply")}</span>
      </button>
    </div>
    <p class="hint">${i18n("masterHint")}</p>
  `;

  if (footer?.parentElement) footer.parentElement.insertBefore(wrapper, footer);
  else form.appendChild(wrapper);

  const rangePicker = wrapper.querySelector("range-picker");
  const range = rangePicker?.querySelector('input[type="range"]');
  const number = rangePicker?.querySelector('input[type="number"]');
  const applyBtn = wrapper.querySelector(`button.${MODULE_ID}-apply`);
  if (!range || !number || !applyBtn) return;

  range.value = String(initial);
  number.value = format2(initial);

  const syncFrom = (val) => {
    const x = normalizeInput2(val);
    range.value = String(x);
    number.value = format2(x);
    rangePicker?.setAttribute("value", String(x));
    return x;
  };

  range.addEventListener("input", (ev) => syncFrom(ev.currentTarget.value));
  range.addEventListener("change", (ev) => syncFrom(ev.currentTarget.value));
  number.addEventListener("change", (ev) => syncFrom(ev.currentTarget.value));
  number.addEventListener("blur", (ev) => syncFrom(ev.currentTarget.value));

  applyBtn.addEventListener("click", async () => {
    const x = syncFrom(range.value);
    try {
      applyBtn.disabled = true;
      await setAllSoundsFromInput(playlist, x);
      ui.notifications?.info(i18nFormat("applied", { value: format2(x) }));
    } catch (err) {
      console.error(`[${MODULE_ID}] Apply failed`, err);
      ui.notifications?.error(i18n("errorApply"));
    } finally {
      applyBtn.disabled = false;
    }
  });

  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
  if (submitBtn) {
    let bypass = false;

    submitBtn.addEventListener(
      "click",
      async (ev) => {
        if (bypass) return;

        ev.preventDefault();
        ev.stopPropagation();

        const x = syncFrom(range.value);

        try {
          submitBtn.disabled = true;
          await setAllSoundsFromInput(playlist, x);
        } catch (err) {
          console.error(`[${MODULE_ID}] Pre-submit volume set failed`, err);
          ui.notifications?.error(i18n("errorPreSubmit"));
          submitBtn.disabled = false;
          return;
        }

        bypass = true;
        submitBtn.disabled = false;
        form.requestSubmit(submitBtn);
        setTimeout(() => (bypass = false), 0);
      },
      { capture: true }
    );
  }
}

/* -------------------------------------------- */
/* Sidebar Gear Logic                           */
/* -------------------------------------------- */

function injectSidebarGear(app, html) {
  if (!game.settings.get(MODULE_ID, "showSidebarEdit")) return;

  const position = game.settings.get(MODULE_ID, "sidebarEditPosition"); // "left" | "right"
  const root = html instanceof HTMLElement ? html : html?.[0] ?? html;
  if (!root) return;

  const items = root.querySelectorAll("li.playlist[data-entry-id], li.playlist[data-document-id]");
  if (!items.length) return;

  for (const li of items) {
    if (li.querySelector(`[data-${MODULE_ID}-edit]`)) continue;

    const playlistId = li.dataset.entryId ?? li.dataset.documentId;
    if (!playlistId) continue;

    const playlist = game.playlists?.get?.(playlistId);
    if (!playlist) continue;

    const canEdit = game.user.isGM || playlist.testUserPermission?.(game.user, "OWNER");
    if (!canEdit) continue;

    const header = li.querySelector(".playlist-header");
    if (!header) continue;

    const controls = header.querySelector(".playlist-controls");
    const titleLabel = header.querySelector("label.entry-name, .entry-name.playlist-name, .entry-name");
    if (!controls && position === "right") continue;
    if (!titleLabel && position === "left") continue;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute(`data-${MODULE_ID}-edit`, "1");
    btn.className = "inline-control sound-control icon fa-solid fa-gear";
    btn.setAttribute("data-tooltip", i18n("editPlaylist"));
    btn.setAttribute("aria-label", i18n("editPlaylist"));

    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      playlist.sheet?.render(true, { focus: true });
    });

    if (position === "left") {
      btn.style.marginRight = "0.25rem";
      titleLabel.parentElement?.insertBefore(btn, titleLabel);
      continue;
    }

    // Prevent wrapping to a second row when there are many controls
    controls.style.flexWrap = "nowrap";
    controls.style.whiteSpace = "nowrap";

    btn.style.flex = "0 0 auto";
    btn.style.marginLeft = "0.25rem";

    controls.appendChild(btn);
  }
}

/* -------------------------------------------- */
/* Hooks                                       */
/* -------------------------------------------- */

Hooks.on("renderPlaylistConfig", (app, element) => injectMasterVolume(app, element));
Hooks.on("renderApplicationV2", (app, element) => {
  if (app?.constructor?.name !== "PlaylistConfig") return;
  injectMasterVolume(app, element);
});

Hooks.on("renderPlaylistDirectory", (app, html) => injectSidebarGear(app, html));

Hooks.on("renderSidebarTab", (app, html) => {
  if (app?.tabName === "playlists" || app?.id === "playlists") {
    injectSidebarGear(app, html);
  }
});

Hooks.on("renderApplicationV2", (app, element) => {
  const name = app?.constructor?.name;
  if (name === "PlaylistDirectory" || name === "PlaylistsSidebar" || name === "SidebarTabPlaylists") {
    injectSidebarGear(app, element);
  }
});
