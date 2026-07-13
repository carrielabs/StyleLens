export function runtimeStyle() {
  return `
:root {
  --ahp-theme-color: #d9eb26;
  --ahp-theme-glow: rgba(217, 235, 38, 0.2);
  --ahp-site-accent: #d9eb26;
  --ahp-site-accent-glow: rgba(217, 235, 38, 0.2);
}
#ahp-toolbar {
  position: fixed;
  top: 14px;
  right: 22px;
  z-index: 2147483647;
  display: grid;
  justify-items: end;
  gap: 8px;
  color: #fff;
  font: 11px/1.15 -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
  pointer-events: none;
}
#ahp-toolbar,
#ahp-toolbar *,
#ahp-style-panel,
#ahp-style-panel *,
#ahp-editor-hint,
#ahp-editor-hint * {
  cursor: auto !important;
  letter-spacing: 0;
}
#ahp-toolbar button,
#ahp-editor-hint button {
  border: 0;
  border-radius: 999px;
  padding: 5px 8px;
  background: transparent;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer !important;
  white-space: nowrap;
}
#ahp-toolbar button:hover,
#ahp-editor-hint button:hover {
  background: rgba(255, 255, 255, 0.12);
}
#ahp-toolbar [data-ahp-launcher] {
  pointer-events: auto;
  width: 34px;
  min-width: 34px;
  height: 34px;
  min-height: 34px;
  justify-content: center;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--ahp-theme-color) 28%, rgba(255,255,255,0.18));
  border-radius: 999px;
  background: rgba(18, 18, 20, 0.58);
  color: var(--ahp-theme-color);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.06);
  backdrop-filter: blur(14px) saturate(1.1);
  font-size: 11px;
  font-weight: 800;
}
#ahp-toolbar [data-ahp-launcher] span {
  position: absolute;
  right: 42px;
  opacity: 0;
  pointer-events: none;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(18, 18, 20, 0.82);
  color: rgba(255,255,255,0.78);
  transition: opacity 0.16s ease;
}
#ahp-toolbar [data-ahp-launcher]:hover span {
  opacity: 1;
}
#ahp-toolbar[data-open="true"] [data-ahp-launcher] {
  display: none;
}
.ahp-editor-popover {
  pointer-events: auto;
  display: none;
  width: min(360px, calc(100vw - 28px));
  max-height: calc(100vh - 32px);
  overflow: auto;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--ahp-theme-color) 24%, rgba(255,255,255,0.16));
  background:
    radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--ahp-theme-color) 16%, transparent), transparent 34%),
    rgba(19, 16, 15, 0.84);
  box-shadow: 0 24px 64px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.08);
  backdrop-filter: blur(22px) saturate(1.35);
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.ahp-editor-popover::-webkit-scrollbar {
  width: 0;
  height: 0;
}
#ahp-toolbar[data-open="true"] .ahp-editor-popover {
  display: grid;
  gap: 8px;
}
#ahp-toolbar [data-ahp-toolbar-section] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  width: 100%;
}
#ahp-toolbar [data-ahp-label] {
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
  white-space: nowrap;
}
#ahp-toolbar [data-ahp-theme-value] {
  display: inline-flex;
  margin-left: 6px;
  color: var(--ahp-theme-color);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}
#ahp-toolbar [data-ahp-toolbar-status] {
  min-width: 70px;
  padding: 5px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ahp-theme-color) 16%, rgba(255,255,255,0.06));
  color: var(--ahp-theme-color);
  font-size: 10px;
  font-weight: 800;
  text-align: center;
}
#ahp-toolbar svg {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  stroke: currentColor;
}
#ahp-toolbar [data-ahp-toolbar-group] {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 3px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
}
.ahp-theme-swatches {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
#ahp-toolbar .ahp-theme-swatch {
  width: 17px;
  min-width: 17px;
  height: 17px;
  padding: 0;
  border-radius: 999px;
  background: var(--theme-color);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
#ahp-toolbar .ahp-theme-swatch[aria-pressed="true"] {
  border-color: rgba(255,255,255,0.9);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ahp-theme-color) 32%, transparent);
}
#ahp-toolbar [data-action="closeToolbar"] {
  width: 26px;
  height: 26px;
  justify-content: center;
  padding: 0;
  color: rgba(255,255,255,0.66);
}
.ahp-editor-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ahp-editor-popover-title {
  display: grid;
  gap: 2px;
}
.ahp-editor-popover-title strong {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ahp-editor-popover-title small {
  color: rgba(255,255,255,0.48);
  font-size: 10px;
}
#ahp-editor-hint {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 2147483645;
  display: none;
  width: min(360px, calc(100vw - 48px));
  padding: 16px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--ahp-theme-color) 22%, rgba(255,255,255,0.14));
  background:
    radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--ahp-theme-color) 12%, transparent), transparent 36%),
    rgba(19, 16, 15, 0.88);
  color: #fff;
  box-shadow: 0 22px 60px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08);
  backdrop-filter: blur(18px) saturate(1.25);
  font: 12px/1.6 -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
}
#ahp-editor-hint[data-dismissed="false"] {
  display: block;
}
body.ahp-advanced-editing #ahp-editor-hint {
  display: none !important;
}
.ahp-editor-hint-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.ahp-editor-hint-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.9);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.ahp-editor-hint-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--ahp-theme-color);
  box-shadow: 0 0 18px var(--ahp-theme-color);
}
.ahp-editor-hint-body {
  color: rgba(255,255,255,0.62);
}
.ahp-editor-hint-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  color: rgba(255,255,255,0.42);
  font-size: 11px;
}
@media (max-width: 680px) {
  #ahp-toolbar {
    top: 10px;
    right: 10px;
  }
  .ahp-editor-popover {
    width: calc(100vw - 20px);
  }
  #ahp-editor-hint {
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
  }
}
#ahp-style-panel {
  width: 100%;
  max-height: none;
  overflow: visible;
  transform: none;
  display: none;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
  gap: 6px;
  padding: 8px 0 0;
  background: transparent;
  color: #fff;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  font: 11px/1.15 -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
}
#ahp-style-panel[data-visible="true"] {
  display: grid;
}
#ahp-style-panel::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.ahp-panel-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  user-select: none;
}
#ahp-style-panel label {
  display: grid;
  gap: 3px;
  min-width: 0;
  color: rgba(255, 255, 255, 0.58);
}
#ahp-style-panel input,
#ahp-style-panel button {
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font: inherit;
}
#ahp-style-panel input {
  padding: 0 8px;
  text-align: left;
}
#ahp-style-panel button {
  min-width: 28px;
  padding: 0 8px;
  cursor: pointer !important;
}
#ahp-style-panel button[aria-pressed="true"] {
  background: var(--ahp-theme-glow);
  border-color: var(--ahp-theme-color);
  color: var(--ahp-theme-color);
}
.ahp-editor-actions {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  padding-top: 2px;
}
.ahp-editor-actions button {
  min-width: auto;
}
.ahp-style-title {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.ahp-style-title strong {
  overflow: hidden;
  color: #fff;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ahp-style-title small {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
}
.ahp-panel-section {
  grid-column: 1 / -1;
  display: grid;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.ahp-panel-header + .ahp-panel-section {
  border-top: 0;
  padding-top: 0;
}
.ahp-section-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  font-weight: 800;
}
.ahp-control-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  align-items: end;
}
.ahp-span-2 {
  grid-column: 1 / -1;
}
.ahp-span-2 > .ahp-dropdown {
  width: 100%;
}
.ahp-module-actions {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: end;
}
.ahp-dashboard-data {
  display: grid;
  gap: 8px;
}
.ahp-dashboard-data-group {
  display: grid;
  gap: 5px;
}
.ahp-dashboard-data-group strong {
  color: rgba(255,255,255,0.72);
  font-size: 10px;
}
.ahp-dashboard-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 82px;
  gap: 5px;
}
.ahp-dashboard-row[data-wide="true"] {
  grid-template-columns: minmax(0, 1fr);
}
.ahp-inline {
  grid-column: 1 / -1;
  display: flex;
  gap: 5px;
  align-items: end;
}
.ahp-color-control {
  position: relative;
  display: grid;
  gap: 3px;
  min-width: 0;
  color: rgba(255, 255, 255, 0.58);
}
.ahp-color-control,
.ahp-dropdown {
  min-width: 0;
}
.ahp-color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
#ahp-style-panel .ahp-color-chip {
  width: 28px;
  min-width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  background: var(--ahp-current-color, var(--ahp-theme-color));
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.18);
}
.ahp-color-popover {
  position: absolute;
  left: 0;
  bottom: 36px;
  display: none;
  width: 260px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  background: rgba(20, 23, 27, 0.98);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.36);
}
.ahp-color-control[data-open="true"] .ahp-color-popover {
  display: grid;
  gap: 8px;
}
.ahp-color-swatch-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
}
#ahp-style-panel .ahp-color-swatch {
  width: 18px;
  min-width: 18px;
  height: 18px;
  padding: 0;
  border-radius: 5px;
  background: var(--swatch);
  border: 1px solid rgba(255, 255, 255, 0.22);
}
.ahp-dropdown {
  position: relative;
  display: grid;
  gap: 3px;
  min-width: 0;
  color: rgba(255, 255, 255, 0.58);
}
#ahp-style-panel .ahp-dropdown-trigger {
  width: 100%;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px;
  background: rgba(255, 255, 255, 0.08);
  text-align: left;
}
#ahp-style-panel .ahp-dropdown-trigger [data-dropdown-value] {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ahp-dropdown-chevron {
  position: relative;
  width: 12px;
  height: 12px;
  flex: 0 0 12px;
  color: rgba(255, 255, 255, 0.72);
}
.ahp-dropdown-chevron::before {
  content: "";
  position: absolute;
  top: 3px;
  left: 4px;
  width: 6px;
  height: 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
}
.ahp-dropdown-menu {
  position: absolute;
  left: 0;
  top: 34px;
  bottom: auto;
  z-index: 2;
  display: none;
  width: max(100%, 190px);
  max-height: 220px;
  overflow: auto;
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  background: rgba(24, 27, 31, 0.98);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.36);
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.ahp-dropdown-menu::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.ahp-dropdown[data-open="true"] .ahp-dropdown-menu {
  display: grid;
  gap: 3px;
}
#ahp-style-panel .ahp-dropdown-option {
  justify-content: flex-start;
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
}
#ahp-style-panel .ahp-dropdown-option[aria-selected="true"] {
  background: var(--ahp-theme-glow);
  color: var(--ahp-theme-color);
}
.ahp-color-rgb {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.ahp-color-rgb label {
  min-width: 0 !important;
}
[data-editable="true"][contenteditable="true"] {
  cursor: text;
}
[data-editable="true"][contenteditable="true"]:focus {
  outline: 1px solid color-mix(in srgb, var(--ahp-theme-color) 72%, rgba(255,255,255,0.28));
  outline-offset: 3px;
  background: color-mix(in srgb, var(--ahp-theme-color) 8%, transparent);
}
body.ahp-advanced-editing [data-editable="true"].ahp-selected {
  outline: 2px solid var(--ahp-theme-color);
  box-shadow: 0 0 0 4px var(--ahp-theme-glow);
}
body.ahp-advanced-editing [data-section].ahp-section-selected {
  outline: 1px solid var(--ahp-theme-color);
  outline-offset: 8px;
}
[data-ahp-hidden="true"] {
  display: none !important;
}
body.ahp-advanced-editing [data-ahp-hidden="true"] {
  display: block !important;
  min-height: 48px;
  padding: 14px !important;
  opacity: 0.35;
  border: 1px dashed rgba(255, 214, 102, 0.55) !important;
}
body.ahp-advanced-editing [data-ahp-hidden="true"] > * {
  display: none !important;
}
body.ahp-advanced-editing [data-ahp-hidden="true"]::before {
  content: "已隐藏模块";
  display: block;
  color: var(--ahp-theme-color);
  font: 12px/1.2 -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
  letter-spacing: 0;
}
`;
}

export function runtimeScript(initialEdits, storageKey, templateId = "unknown-template", defaultThemeColor = "#ffffff", themeConfig = {}) {
  const initialJson = JSON.stringify(initialEdits).replace(/<\/script/gi, "<\\/script");
  const keyJson = JSON.stringify(storageKey);
  const templateIdJson = JSON.stringify(templateId);
  const defaultThemeJson = JSON.stringify(defaultThemeColor);
  const themeConfigLiteral = jsLiteral(themeConfig || {});

  return `
(function () {
  var STORAGE_KEY = ${keyJson};
  var TEMPLATE_ID = ${templateIdJson};
  var DEFAULT_THEME_COLOR = ${defaultThemeJson};
  var THEME_CONFIG = ${themeConfigLiteral};
  var INITIAL_EDITS = ${initialJson};
  var advancedEditing = false;
  var status;
  var toolbar;
  var editorHint;
  var stylePanel;
  var selectedNode;
  var selectedSection;
  var styleControls = {};
  var initialBodyHtml = '';
  var initialThemeColor = DEFAULT_THEME_COLOR;
  var themeColor = DEFAULT_THEME_COLOR;
  var themeTouched = false;
  var buttonLinkClicksDelegated = false;
  var dashboardData = window.AHP_DASHBOARD_DATA || null;

  function icon(name) {
    var icons = {
      edit: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
      save: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>',
      download: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
      restore: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/></svg>',
      close: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
    };
    return icons[name] || '';
  }

  function editableNodes() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-editable="true"][data-edit-id]'));
  }

  function cleanupBodyClone(clone) {
    clone.querySelectorAll('[data-ahp-toolbar], [data-ahp-style-panel], [data-ahp-editor-hint], [data-ahp-runtime]').forEach(function (node) {
      node.remove();
    });
    clone.classList.remove('ahp-advanced-editing', 'ahp-has-toolbar');
    clone.querySelectorAll('[contenteditable]').forEach(function (node) {
      node.removeAttribute('contenteditable');
      node.removeAttribute('spellcheck');
    });
    clone.querySelectorAll('.ahp-selected, .ahp-section-selected').forEach(function (node) {
      node.classList.remove('ahp-selected', 'ahp-section-selected');
    });
    sanitizeElementTree(clone);
  }

  function captureBodyHtml() {
    var clone = document.body.cloneNode(true);
    cleanupBodyClone(clone);
    return clone.innerHTML;
  }

  function rebuildRuntimeUi(keepOpen) {
    toolbar = null;
    editorHint = null;
    stylePanel = null;
    selectedNode = null;
    selectedSection = null;
    styleControls = {};
    createToolbar();
    createEditorHint();
    createStylePanel();
    setToolbarOpen(Boolean(keepOpen));
    enableInlineEditing();
    delegateButtonLinkClicks();
    if (keepOpen) setAdvancedEditing(true);
  }

  function hexToGlow(hex) {
    var normalized = normalizeHexColor(hex) || normalizeHexColor(initialThemeColor) || '#ffffff';
    var rgb = hexToRgb(normalized);
    return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.2)';
  }

  function computedColorToHex(value) {
    return rgbToHex(value);
  }

  function detectInitialThemeColor() {
    var configVars = THEME_CONFIG && THEME_CONFIG.targets && THEME_CONFIG.targets.cssVariables
      ? Object.keys(THEME_CONFIG.targets.cssVariables)
      : [];
    var cssVars = uniqueStrings(configVars);
    for (var i = 0; i < cssVars.length; i += 1) {
      var cssValue = getComputedStyle(document.documentElement).getPropertyValue(cssVars[i]);
      var normalized = normalizeHexColor(cssValue);
      if (normalized) return normalized;
    }
    return '';
  }

  function syncThemeControls(color) {
    var normalized = normalizeHexColor(color);
    if (!normalized) return;
    themeColor = normalized;
    document.documentElement.style.setProperty('--ahp-theme-color', normalized);
    document.documentElement.style.setProperty('--ahp-theme-glow', hexToGlow(normalized));
    if (toolbar) {
      toolbar.querySelectorAll('[data-theme-color]').forEach(function (button) {
        button.setAttribute('aria-pressed', button.getAttribute('data-theme-color').toLowerCase() === normalized ? 'true' : 'false');
      });
      var themeValue = toolbar.querySelector('[data-ahp-theme-value]');
      if (themeValue) themeValue.textContent = normalized;
    }
    if (!selectedNode) setColorControlValue(themeColor || initialThemeColor);
  }

  function applyTheme(color, silent) {
    var normalized = normalizeHexColor(color);
    if (!normalized) return;
    if (!silent) themeTouched = true;
    syncThemeControls(normalized);
    renderThemeOverride(normalized);
    if (!silent && status) status.textContent = '主题已更新';
  }

  function renderThemeOverride(color) {
    var normalized = normalizeHexColor(color);
    if (!normalized) return;
    var targets = THEME_CONFIG && THEME_CONFIG.targets ? THEME_CONFIG.targets : {};
    var css = [];
    var variables = targets.cssVariables || {};
    Object.keys(variables).forEach(function (name) {
      var mode = variables[name];
      css.push(':root { ' + name + ': ' + themeValueForMode(normalized, mode) + ' !important; }');
    });
    addThemeRules(css, targets.colorSelectors, 'color', normalized);
    addThemeRules(css, targets.backgroundSelectors, 'background-color', normalized);
    addThemeRules(css, targets.borderSelectors, 'border-color', normalized);
    addThemeRules(css, targets.shadowSelectors, 'box-shadow', '0 16px 42px ' + hexToGlow(normalized));
    addThemeGradientRules(css, targets.gradientSelectors, normalized);
    addThemeRadialGlowRules(css, targets.radialGlowSelectors, normalized);
    addThemeRules(css, targets.strokeSelectors, 'stroke', normalized);
    addThemeRules(css, targets.fillSelectors, 'fill', normalized);
    addThemeRules(css, targets.stopColorSelectors, 'stop-color', normalized);
    if (!css.length) return;
    var style = document.querySelector('[data-ahp-site-theme-override]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-ahp-site-theme-override', 'true');
      document.head.appendChild(style);
    }
    style.textContent = css.join('\\n');
  }

  function addThemeRules(css, selectors, property, color) {
    (selectors || []).forEach(function (selector) {
      css.push(selector + ' { ' + property + ': ' + color + ' !important; }');
    });
  }

  function addThemeGradientRules(css, selectors, color) {
    (selectors || []).forEach(function (selector) {
      css.push(selector + ' { background-image: linear-gradient(90deg, ' + color + ', color-mix(in srgb, ' + color + ' 58%, #ffffff)) !important; }');
    });
  }

  function addThemeRadialGlowRules(css, selectors, color) {
    (selectors || []).forEach(function (selector) {
      css.push(selector + ' { background: radial-gradient(circle, color-mix(in srgb, ' + color + ' 92%, #ffffff) 0%, ' + color + ' 58%, transparent 86%) !important; }');
    });
  }

  function themeValueForMode(color, mode) {
    if (mode === 'glow') return hexToGlow(color);
    if (mode === 'soft') return 'color-mix(in srgb, ' + color + ' 78%, #ffffff)';
    if (mode === 'softer') return 'color-mix(in srgb, ' + color + ' 56%, #ffffff)';
    return color;
  }

  function restoreBodyContent(html) {
    document.body.innerHTML = sanitizeHtmlFragment(html);
  }

  function restoreBodyHtml(html, keepOpen) {
    restoreBodyContent(html);
    rebuildRuntimeUi(keepOpen);
  }

  function findLinkTarget(node) {
    if (!node || !node.closest) return null;
    return node.closest('a, button');
  }

  function canEditLink(node) {
    var target = findLinkTarget(node);
    if (!target) return false;
    var key = (node.getAttribute('data-key') || target.getAttribute('data-key') || '').toLowerCase();
    var section = target.closest('[data-section]');
    var sectionName = section ? section.getAttribute('data-section') : '';
    var className = String(target.className || '').toLowerCase();
    if (target.tagName === 'BUTTON') return true;
    if (key.indexOf('social_') === 0 || key.indexOf('_btn') > -1 || key.indexOf('btn_') > -1) return true;
    if (className.indexOf('btn') > -1 || className.indexOf('fui-btn') > -1) return true;
    if (sectionName === 'social-media') return true;
    if (['hero', 'cta', 'showcase', 'literature'].includes(sectionName) && target.tagName === 'A' && !target.closest('header')) return true;
    return false;
  }

  function getNodeHref(node) {
    if (!canEditLink(node)) return '';
    var target = findLinkTarget(node);
    if (!target) return '';
    return target.tagName === 'A'
      ? target.getAttribute('href') || ''
      : target.getAttribute('data-link-url') || '';
  }

  function sanitizeUrl(value) {
    var url = String(value || '').trim();
    if (!url) return '';
    if (/^(https?:|mailto:|tel:|#|\\/|\\.\\/|\\.\\.\\/)/i.test(url)) return url;
    if (/^[\\w.-]+\\.[a-z]{2,}(\\/.*)?$/i.test(url)) return 'https://' + url;
    return '';
  }

  function sanitizeElementUrl(name, value) {
    var url = String(value || '').trim();
    if (!url) return '';
    if ((name === 'src' || name === 'xlink:href') && /^data:image\\/(png|jpe?g|gif|webp|avif);/i.test(url)) return url;
    return sanitizeUrl(url);
  }

  function sanitizeStyleAttribute(value) {
    var style = String(value || '');
    if (/expression\\s*\\(|url\\s*\\(\\s*['"]?\\s*javascript:/i.test(style)) return '';
    return style;
  }

  function sanitizeElementTree(root, options) {
    if (!root || !root.querySelectorAll) return root;
    var keepDocumentScripts = Boolean(options && options.keepDocumentScripts);
    root.querySelectorAll('script, iframe, object, embed, link, meta, base').forEach(function (node) {
      if (keepDocumentScripts && node.tagName && node.tagName.toLowerCase() === 'script') return;
      node.remove();
    });
    root.querySelectorAll('*').forEach(function (node) {
      Array.prototype.slice.call(node.attributes || []).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        if (name.indexOf('on') === 0) {
          node.removeAttribute(attr.name);
          return;
        }
        if (['href', 'src', 'xlink:href', 'data-link-url', 'action', 'formaction'].includes(name)) {
          var safeUrl = sanitizeElementUrl(name, attr.value);
          if (safeUrl) node.setAttribute(attr.name, safeUrl);
          else node.removeAttribute(attr.name);
          return;
        }
        if (name === 'style') {
          var safeStyle = sanitizeStyleAttribute(attr.value);
          if (safeStyle) node.setAttribute('style', safeStyle);
          else node.removeAttribute('style');
        }
      });
    });
    return root;
  }

  function sanitizeHtmlFragment(html) {
    var template = document.createElement('template');
    template.innerHTML = String(html || '');
    sanitizeElementTree(template.content);
    return template.innerHTML;
  }

  function delegateButtonLinkClicks() {
    if (buttonLinkClicksDelegated) return;
    document.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('button[data-link-url]') : null;
      if (!button || button.closest('[data-ahp-toolbar], [data-ahp-style-panel], [data-ahp-editor-hint]')) return;
      var url = sanitizeUrl(button.getAttribute('data-link-url'));
      if (!url) return;
      event.preventDefault();
      window.location.href = url;
    });
    buttonLinkClicksDelegated = true;
  }

  function setNodeHref(node, value) {
    if (!canEditLink(node)) return;
    var target = findLinkTarget(node);
    if (!target) return;
    var url = sanitizeUrl(value);
    if (!url) {
      target.removeAttribute('href');
      target.removeAttribute('data-link-url');
      target.removeAttribute('onclick');
      return;
    }
    if (target.tagName === 'A') {
      target.setAttribute('href', url);
    } else {
      target.setAttribute('data-link-url', url);
    }
  }

  function getSelectedSection() {
    return selectedSection || (selectedNode && selectedNode.closest ? selectedNode.closest('[data-section]') : null);
  }

  function getStyleTarget() {
    if (!selectedNode) return null;
    var linkTarget = canEditLink(selectedNode) ? findLinkTarget(selectedNode) : null;
    return linkTarget || selectedNode;
  }

  function readableFontName(value) {
    return String(value || '').split(',')[0].replace(/["']/g, '').trim() || '系统字体';
  }

  function sanitizeImageUrl(value) {
    var url = String(value || '').trim();
    if (!url) return '';
    if (/^data:image\\/(png|jpe?g|gif|webp|avif);/i.test(url)) return url;
    if (/^(https?:|\\/|\\.\\/|\\.\\.\\/)/i.test(url)) return url;
    return '';
  }

  function cssUrl(value) {
    var match = String(value || '').match(/url\\((["']?)(.*?)\\1\\)/);
    return match ? match[2] : '';
  }

  function imageTarget() {
    if (!selectedNode) return null;
    var section = getSelectedSection();
    var img = section && section.querySelector('img');
    return img || section || selectedNode;
  }

  function applyImageUrl(value) {
    var url = sanitizeImageUrl(value);
    if (!url) return;
    var target = imageTarget();
    if (!target) return;
    if (target.tagName === 'IMG') {
      target.setAttribute('src', url);
      return;
    }
    target.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
    target.style.backgroundSize = 'cover';
    target.style.backgroundPosition = 'center';
  }

  function nextEditIdNumber() {
    return editableNodes().reduce(function (max, node) {
      var match = String(node.getAttribute('data-edit-id') || '').match(/edit-(\\d+)/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;
  }

  function assignFreshEditIds(root) {
    var next = nextEditIdNumber();
    Array.prototype.slice.call(root.querySelectorAll('[data-editable="true"]')).forEach(function (node) {
      node.setAttribute('data-edit-id', 'edit-' + next);
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');
      next += 1;
    });
  }

  function closeOpenPopovers(except) {
    if (!stylePanel) return;
    stylePanel.querySelectorAll('[data-open="true"]').forEach(function (node) {
      if (except && node === except) return;
      node.setAttribute('data-open', 'false');
    });
  }

  function selectEditableText(node) {
    if (!node || !window.getSelection || !document.createRange) return;
    var range = document.createRange();
    range.selectNodeContents(node);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function enableInlineEditing() {
    editableNodes().forEach(function (node) {
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');
      if (node.getAttribute('data-ahp-inline-ready') === 'true') return;
      node.setAttribute('data-ahp-inline-ready', 'true');
      node.addEventListener('click', function (event) {
        if (event.target && event.target.closest && event.target.closest('[data-ahp-toolbar], [data-ahp-style-panel], [data-ahp-editor-hint]')) return;
        event.preventDefault();
        node.focus();
      });
      node.addEventListener('focus', function () {
        selectEditableText(node);
      });
      node.addEventListener('blur', function () {
        saveCurrent();
      });
    });
  }

  function setAdvancedEditing(next) {
    advancedEditing = next;
    document.body.classList.toggle('ahp-advanced-editing', advancedEditing);
    if (toolbar) {
      toolbar.setAttribute('data-mode', advancedEditing ? 'advanced' : 'inline');
    }
    enableInlineEditing();
    if (status) status.textContent = advancedEditing ? '高级编辑' : '可直接编辑';
    if (!advancedEditing) selectNode(null);
    if (stylePanel) stylePanel.setAttribute('data-visible', advancedEditing ? 'true' : 'false');
    if (editorHint && advancedEditing) editorHint.setAttribute('data-dismissed', 'true');
  }

  function setToolbarOpen(next) {
    if (!toolbar) return;
    toolbar.setAttribute('data-open', next ? 'true' : 'false');
    if (!next) {
      setAdvancedEditing(false);
    }
  }

  function loadSaved() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      var saved = JSON.parse(raw);
      if (saved && saved.version === 2 && saved.bodyHtml) {
        if (!saved.templateId || saved.templateId !== TEMPLATE_ID) {
          localStorage.removeItem(STORAGE_KEY);
          return;
        }
        var shouldApplySavedTheme = Boolean(saved.themeTouched);
        if (saved.themeColor && shouldApplySavedTheme) {
          themeTouched = Boolean(saved.themeTouched);
          applyTheme(saved.themeColor, true);
        }
        restoreBodyContent(saved.bodyHtml);
        if (saved.dashboardData) {
          dashboardData = saved.dashboardData;
          window.AHP_DASHBOARD_DATA = dashboardData;
          renderDashboardDataScript();
        }
        return;
      }
      if (!Array.isArray(saved)) return;
      saved.forEach(function (item) {
        var node = document.querySelector('[data-edit-id="' + item.id + '"]');
        if (node) {
          node.innerHTML = sanitizeHtmlFragment(item.html);
          if (item.style) item.style = sanitizeStyleAttribute(item.style);
          if (item.style) node.setAttribute('style', item.style);
          if (Object.prototype.hasOwnProperty.call(item, 'href')) setNodeHref(node, item.href);
        }
      });
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function saveCurrent() {
    var payload = {
      version: 2,
      templateId: TEMPLATE_ID,
      themeColor: themeColor,
      themeTouched: themeTouched,
      dashboardData: dashboardData || null,
      bodyHtml: captureBodyHtml(),
      edits: editableNodes().map(function (node) {
        return {
        id: node.getAttribute('data-edit-id'),
        html: sanitizeHtmlFragment(node.innerHTML),
        style: node.getAttribute('style') || '',
        href: getNodeHref(node)
        };
      })
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (status) status.textContent = '已保存';
  }

  function restoreInitial() {
    localStorage.removeItem(STORAGE_KEY);
    restoreBodyHtml(initialBodyHtml, true);
    applyTheme(initialThemeColor, true);
    if (status) status.textContent = '已恢复';
  }

  function exportHtmlString() {
    var clone = document.documentElement.cloneNode(true);
    var toolbar = clone.querySelector('[data-ahp-toolbar]');
    if (toolbar) toolbar.remove();
    var editorHint = clone.querySelector('[data-ahp-editor-hint]');
    if (editorHint) editorHint.remove();
    var panel = clone.querySelector('[data-ahp-style-panel]');
    if (panel) panel.remove();
    var cloneBody = clone.querySelector('body');
    if (cloneBody) cloneBody.classList.remove('ahp-advanced-editing', 'ahp-has-toolbar');
    clone.querySelectorAll('[data-editable="true"]').forEach(function (node) {
      sanitizeElementTree(node);
    });
    clone.querySelectorAll('script:not([src])').forEach(function (node) {
      if (node.matches('[data-ahp-runtime], [data-ahp-dashboard-data]')) return;
      var code = node.textContent || '';
      if (code.indexOf('data-editable') > -1 && code.indexOf('contenteditable') > -1) node.remove();
    });
    clone.querySelectorAll('[contenteditable]').forEach(function (node) {
      node.removeAttribute('contenteditable');
      node.removeAttribute('spellcheck');
    });
    clone.querySelectorAll('.ahp-selected').forEach(function (node) {
      node.classList.remove('ahp-selected');
    });
    sanitizeElementTree(clone, { keepDocumentScripts: true });
    return '<!DOCTYPE html>\\n' + clone.outerHTML;
  }

  function exportHtml() {
    var html = exportHtmlString();
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function selectNode(node) {
    if (selectedNode) selectedNode.classList.remove('ahp-selected');
    if (selectedSection) selectedSection.classList.remove('ahp-section-selected');
    selectedNode = node;
    selectedSection = selectedNode && selectedNode.closest ? selectedNode.closest('[data-section]') : null;
    if (selectedNode) selectedNode.classList.add('ahp-selected');
    if (selectedSection) selectedSection.classList.add('ahp-section-selected');
    updateStyleControls();
  }

  function rgbToHex(value) {
    var match = String(value || '').match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if (!match) return '#ffffff';
    return '#' + [match[1], match[2], match[3]].map(function (part) {
      return Math.max(0, Math.min(255, Number(part))).toString(16).padStart(2, '0');
    }).join('');
  }

  function normalizeHexColor(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    if (text.charAt(0) !== '#') text = '#' + text;
    if (/^#[0-9a-fA-F]{3}$/.test(text)) {
      text = '#' + text.slice(1).split('').map(function (part) { return part + part; }).join('');
    }
    return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toLowerCase() : '';
  }

  function hexToRgb(hex) {
    var normalized = normalizeHexColor(hex) || '#ffffff';
    return {
      r: parseInt(normalized.slice(1, 3), 16),
      g: parseInt(normalized.slice(3, 5), 16),
      b: parseInt(normalized.slice(5, 7), 16)
    };
  }

  function rgbInputsToHex() {
    var parts = ['colorR', 'colorG', 'colorB'].map(function (key) {
      var value = styleControls[key] ? Number(styleControls[key].value) : 0;
      return Math.max(0, Math.min(255, Number.isFinite(value) ? value : 0)).toString(16).padStart(2, '0');
    });
    return '#' + parts.join('');
  }

  function setColorControlValue(color) {
    var normalized = normalizeHexColor(color) || themeColor || initialThemeColor || '#ffffff';
    if (styleControls.colorPreview) styleControls.colorPreview.style.setProperty('--ahp-current-color', normalized);
    if (styleControls.colorText) styleControls.colorText.value = normalized;
    var rgb = hexToRgb(normalized);
    if (styleControls.colorR) styleControls.colorR.value = rgb.r;
    if (styleControls.colorG) styleControls.colorG.value = rgb.g;
    if (styleControls.colorB) styleControls.colorB.value = rgb.b;
  }

  function numberValue(value, fallback) {
    var parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function updateStyleControls() {
    if (!stylePanel) return;
    var hasSelection = Boolean(selectedNode);
    stylePanel.setAttribute('data-has-selection', hasSelection ? 'true' : 'false');
    if (!hasSelection) {
      if (styleControls.selectedName) styleControls.selectedName.textContent = '请选择一个文字块';
      if (styleControls.fontLabel) styleControls.fontLabel.textContent = '未选择';
      setColorControlValue(themeColor || initialThemeColor);
      return;
    }

    var computed = window.getComputedStyle(selectedNode);
    var styleTarget = getStyleTarget();
    var targetComputed = styleTarget ? window.getComputedStyle(styleTarget) : computed;
    var fontSize = Math.round(numberValue(computed.fontSize, 16));
    var color = rgbToHex(computed.color);
    var lineHeight = computed.lineHeight === 'normal'
      ? 1.2
      : Math.round((numberValue(computed.lineHeight, fontSize * 1.2) / fontSize) * 100) / 100;
    var letterSpacing = computed.letterSpacing === 'normal' ? 0 : numberValue(computed.letterSpacing, 0);
    var weight = String(Math.round(numberValue(computed.fontWeight, 400)));
    var currentFont = readableFontName(computed.fontFamily);

    if (styleControls.selectedName) styleControls.selectedName.textContent = selectedNode.textContent.trim().slice(0, 28) || '文字块';
    if (styleControls.fontLabel) styleControls.fontLabel.textContent = currentFont;
    if (styleControls.fontSize) styleControls.fontSize.value = fontSize;
    setColorControlValue(color);
    setDropdownValue('fontWeight', ['300', '400', '500', '600', '700', '800', '900'].includes(weight) ? weight : '400');
    setDropdownValue('fontFamily', selectedNode.style.fontFamily || '', selectedNode.style.fontFamily ? '' : currentFont);
    var linkEnabled = canEditLink(selectedNode);
    if (styleControls.linkField) styleControls.linkField.hidden = !linkEnabled;
    if (styleControls.linkHref) styleControls.linkHref.value = linkEnabled ? getNodeHref(selectedNode) : '';
    if (styleControls.backgroundColor) styleControls.backgroundColor.value = rgbToHex(targetComputed.backgroundColor);
    if (styleControls.borderColor) styleControls.borderColor.value = rgbToHex(targetComputed.borderTopColor);
    if (styleControls.borderRadius) styleControls.borderRadius.value = Math.round(numberValue(targetComputed.borderTopLeftRadius, 0));
    if (styleControls.padding) styleControls.padding.value = Math.round(numberValue(targetComputed.paddingTop, 0));
    if (styleControls.imageUrl) {
      var target = imageTarget();
      styleControls.imageUrl.value = target && target.tagName === 'IMG'
        ? target.getAttribute('src') || ''
        : cssUrl(target && target.style ? target.style.backgroundImage : '');
    }
    if (styleControls.moduleToggle) {
      var section = getSelectedSection();
      styleControls.moduleToggle.textContent = section && section.getAttribute('data-ahp-hidden') === 'true' ? '显示模块' : '隐藏模块';
    }
    if (styleControls.bold) styleControls.bold.setAttribute('aria-pressed', Number(weight) >= 700 ? 'true' : 'false');
    if (styleControls.letterSpacing) styleControls.letterSpacing.value = letterSpacing;
    if (styleControls.lineHeight) styleControls.lineHeight.value = lineHeight;
    ['alignLeft', 'alignCenter', 'alignRight'].forEach(function (key) {
      if (styleControls[key]) styleControls[key].setAttribute('aria-pressed', 'false');
    });
    var alignKey = computed.textAlign === 'center' ? 'alignCenter' : computed.textAlign === 'right' ? 'alignRight' : 'alignLeft';
    if (styleControls[alignKey]) styleControls[alignKey].setAttribute('aria-pressed', 'true');
  }

  function applyStyleControl(name, value) {
    if (!selectedNode) return;
    var styleTarget = getStyleTarget();
    if (name === 'fontSize') selectedNode.style.fontSize = Math.max(8, Math.min(220, Number(value) || 16)) + 'px';
    if (name === 'colorSwatch') selectedNode.style.color = normalizeHexColor(value) || value;
    if (name === 'colorText') {
      var hex = normalizeHexColor(value);
      if (hex) selectedNode.style.color = hex;
    }
    if (name === 'colorR' || name === 'colorG' || name === 'colorB') selectedNode.style.color = rgbInputsToHex();
    if (name === 'fontFamily' && value) selectedNode.style.fontFamily = value;
    if (name === 'fontFamily' && !value) selectedNode.style.removeProperty('font-family');
    if (name === 'fontWeight') selectedNode.style.fontWeight = value;
    if (name === 'linkHref' && canEditLink(selectedNode)) setNodeHref(selectedNode, value);
    if (name === 'bold') selectedNode.style.fontWeight = Number(window.getComputedStyle(selectedNode).fontWeight) >= 700 ? '400' : '700';
    if (name === 'letterSpacing') selectedNode.style.letterSpacing = (Number(value) || 0) + 'px';
    if (name === 'lineHeight') selectedNode.style.lineHeight = Math.max(0.8, Math.min(3, Number(value) || 1.2));
    if (name === 'alignLeft') selectedNode.style.textAlign = 'left';
    if (name === 'alignCenter') selectedNode.style.textAlign = 'center';
    if (name === 'alignRight') selectedNode.style.textAlign = 'right';
    if (name === 'backgroundColor' && styleTarget) {
      var bg = normalizeHexColor(value);
      if (bg) styleTarget.style.backgroundColor = bg;
    }
    if (name === 'borderColor' && styleTarget) {
      var border = normalizeHexColor(value);
      if (border) {
        styleTarget.style.borderColor = border;
        if (window.getComputedStyle(styleTarget).borderTopStyle === 'none') styleTarget.style.borderStyle = 'solid';
        if (window.getComputedStyle(styleTarget).borderTopWidth === '0px') styleTarget.style.borderWidth = '1px';
      }
    }
    if (name === 'borderRadius' && styleTarget) styleTarget.style.borderRadius = Math.max(0, Math.min(120, Number(value) || 0)) + 'px';
    if (name === 'padding' && styleTarget) styleTarget.style.padding = Math.max(0, Math.min(160, Number(value) || 0)) + 'px';
    if (name === 'imageUrl') applyImageUrl(value);
    if (name === 'moduleToggle') toggleSelectedSection();
    if (name === 'moduleUp') moveSelectedSection(-1);
    if (name === 'moduleDown') moveSelectedSection(1);
    if (name === 'moduleDuplicate') duplicateSelectedSection();
    if (name === 'moduleDelete') deleteSelectedSection();
    updateStyleControls();
  }

  function toggleSelectedSection() {
    var section = getSelectedSection();
    if (!section) return;
    section.setAttribute('data-ahp-hidden', section.getAttribute('data-ahp-hidden') === 'true' ? 'false' : 'true');
  }

  function siblingSection(section, direction) {
    var node = direction < 0 ? section.previousElementSibling : section.nextElementSibling;
    while (node && !node.matches('[data-section]')) {
      node = direction < 0 ? node.previousElementSibling : node.nextElementSibling;
    }
    return node;
  }

  function moveSelectedSection(direction) {
    var section = getSelectedSection();
    if (!section || !section.parentNode) return;
    var sibling = siblingSection(section, direction);
    if (!sibling) return;
    if (direction < 0) section.parentNode.insertBefore(section, sibling);
    else section.parentNode.insertBefore(sibling, section);
  }

  function duplicateSelectedSection() {
    var section = getSelectedSection();
    if (!section || !section.parentNode) return;
    var clone = section.cloneNode(true);
    clone.classList.remove('ahp-section-selected');
    clone.removeAttribute('data-ahp-hidden');
    assignFreshEditIds(clone);
    section.parentNode.insertBefore(clone, section.nextSibling);
    var firstEditable = clone.querySelector('[data-editable="true"][data-edit-id]');
    if (firstEditable) selectNode(firstEditable);
  }

  function deleteSelectedSection() {
    var section = getSelectedSection();
    if (!section || !section.parentNode) return;
    var next = siblingSection(section, 1) || siblingSection(section, -1);
    section.remove();
    selectedNode = null;
    selectedSection = null;
    if (next) {
      var node = next.querySelector('[data-editable="true"][data-edit-id]');
      if (node) selectNode(node);
    }
  }

  function setDropdownValue(name, value, displayOverride) {
    var dropdown = stylePanel && stylePanel.querySelector('[data-dropdown="' + name + '"]');
    if (!dropdown) return;
    var valueNode = dropdown.querySelector('[data-dropdown-value]');
    var options = Array.prototype.slice.call(dropdown.querySelectorAll('[data-dropdown-option]'));
    var match = options.find(function (option) {
      return option.getAttribute('value') === value;
    }) || options[0];
    options.forEach(function (option) {
      option.setAttribute('aria-selected', option === match ? 'true' : 'false');
    });
    if (valueNode && match) valueNode.textContent = displayOverride || match.textContent;
  }

  function dropdownHtml(label, name, options) {
    var optionHtml = options.map(function (option) {
      return '<button type="button" class="ahp-dropdown-option" data-dropdown-option data-style="' + name + '" value="' + option.value + '" aria-selected="false">' + option.label + '</button>';
    }).join('');
    return '<div class="ahp-dropdown" data-ahp-dropdown data-dropdown="' + name + '"><span>' + label + '</span><button type="button" class="ahp-dropdown-trigger" data-dropdown-trigger><span data-dropdown-value>' + options[0].label + '</span><span class="ahp-dropdown-chevron" aria-hidden="true"></span></button><div class="ahp-dropdown-menu">' + optionHtml + '</div></div>';
  }

  function htmlEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function dashboardDataSectionHtml() {
    if (!dashboardData) return '';
    var kpis = Array.isArray(dashboardData.kpis) ? dashboardData.kpis : [];
    var trend = Array.isArray(dashboardData.trend) ? dashboardData.trend : [];
    var categories = Array.isArray(dashboardData.categoryBreakdown) ? dashboardData.categoryBreakdown : [];
    var kpiRows = kpis.map(function (kpi, index) {
      return [
        '<div class="ahp-dashboard-row" data-wide="true"><input data-dashboard-kind="kpi" data-dashboard-index="' + index + '" data-dashboard-field="label" value="' + htmlEscape(kpi.label) + '" placeholder="指标名称"></div>',
        '<div class="ahp-dashboard-row"><input data-dashboard-kind="kpi" data-dashboard-index="' + index + '" data-dashboard-field="trend" value="' + htmlEscape(kpi.trend) + '" placeholder="说明"><input data-dashboard-kind="kpi" data-dashboard-index="' + index + '" data-dashboard-field="value" value="' + htmlEscape(kpi.value) + '" placeholder="数值"></div>'
      ].join('');
    }).join('');
    var trendRows = trend.map(function (point, index) {
      return '<div class="ahp-dashboard-row"><input data-dashboard-kind="trend" data-dashboard-index="' + index + '" data-dashboard-field="label" value="' + htmlEscape(point.label) + '" placeholder="时间"><input data-dashboard-kind="trend" data-dashboard-index="' + index + '" data-dashboard-field="value" value="' + htmlEscape(point.value) + '" type="number" step="any"></div>';
    }).join('');
    var categoryRows = categories.map(function (point, index) {
      return '<div class="ahp-dashboard-row"><input data-dashboard-kind="categoryBreakdown" data-dashboard-index="' + index + '" data-dashboard-field="label" value="' + htmlEscape(point.label) + '" placeholder="分类"><input data-dashboard-kind="categoryBreakdown" data-dashboard-index="' + index + '" data-dashboard-field="value" value="' + htmlEscape(point.value) + '" type="number" step="any"></div>';
    }).join('');
    return [
      '<div class="ahp-panel-section" data-ahp-dashboard-editor="true"><div class="ahp-section-title">Data</div><div class="ahp-dashboard-data">',
      '<div class="ahp-dashboard-data-group"><strong>KPI</strong>' + (kpiRows || '<span>无 KPI 数据</span>') + '</div>',
      '<div class="ahp-dashboard-data-group"><strong>趋势图</strong>' + (trendRows || '<span>无趋势数据</span>') + '</div>',
      '<div class="ahp-dashboard-data-group"><strong>分类图</strong>' + (categoryRows || '<span>无分类数据</span>') + '</div>',
      '</div></div>'
    ].join('');
  }

  function applyDashboardDataInput(target) {
    if (!dashboardData || !target) return;
    var kind = target.getAttribute('data-dashboard-kind');
    var field = target.getAttribute('data-dashboard-field');
    var index = Number(target.getAttribute('data-dashboard-index'));
    if (!kind || !field || !Number.isFinite(index)) return;
    var collection = dashboardData[kind];
    if (!Array.isArray(collection) || !collection[index]) return;
    var value = target.value;
    if (field === 'value' && kind !== 'kpi') value = Number(value) || 0;
    collection[index][field] = value;
    window.AHP_DASHBOARD_DATA = dashboardData;
    renderDashboardDataToPage();
    renderDashboardDataScript();
    rerenderDashboardCharts();
    saveCurrent();
    if (status) status.textContent = '数据已更新';
  }

  function dashboardValueForBind(bind) {
    if (!dashboardData || !bind) return '';
    if (bind === 'title') return dashboardData.title || '';
    if (bind === 'primaryMetric.name') return dashboardData.primaryMetric && dashboardData.primaryMetric.name || '';
    var parts = String(bind).split('.');
    if (parts[0] === 'kpi' && dashboardData.kpis && dashboardData.kpis[Number(parts[1])]) {
      return dashboardData.kpis[Number(parts[1])][parts[2]] || '';
    }
    if (parts[0] === 'trend' && dashboardData.trend && dashboardData.trend[Number(parts[1])]) {
      return dashboardData.trend[Number(parts[1])][parts[2]] || '';
    }
    if (parts[0] === 'category' && dashboardData.categoryBreakdown && dashboardData.categoryBreakdown[Number(parts[1])]) {
      return dashboardData.categoryBreakdown[Number(parts[1])][parts[2]] || '';
    }
    return '';
  }

  function renderDashboardDataToPage() {
    if (!dashboardData) return;
    document.querySelectorAll('[data-ahp-dashboard-bind]').forEach(function (node) {
      var value = dashboardValueForBind(node.getAttribute('data-ahp-dashboard-bind'));
      if (value !== '') node.textContent = String(value);
    });
  }

  function renderDashboardDataScript() {
    if (!dashboardData) return;
    var script = document.querySelector('script[data-ahp-dashboard-data]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('data-ahp-dashboard-data', 'true');
      document.body.appendChild(script);
    }
    script.textContent = 'window.AHP_DASHBOARD_DATA = ' + JSON.stringify(dashboardData).replace(/<\\/script/gi, '<\\\\/script') + ';';
  }

  function rerenderDashboardCharts() {
    if (!dashboardData) return;
    var trendLabels = (dashboardData.trend || []).map(function (point) { return point.label; });
    var trendValues = (dashboardData.trend || []).map(function (point) { return Number(point.value) || 0; });
    var categoryLabels = (dashboardData.categoryBreakdown || []).map(function (point) { return point.label; });
    var categoryValues = (dashboardData.categoryBreakdown || []).map(function (point) { return Number(point.value) || 0; });

    if (window.Chart && window.Chart.getChart) {
      Array.prototype.slice.call(document.querySelectorAll('canvas')).forEach(function (canvas, index) {
        var chart = window.Chart.getChart(canvas);
        if (!chart || !chart.data) return;
        var labels = index % 2 === 0 ? trendLabels : categoryLabels;
        var values = index % 2 === 0 ? trendValues : categoryValues;
        chart.data.labels = labels;
        (chart.data.datasets || []).forEach(function (dataset) { dataset.data = values; });
        chart.update();
      });
    }

    if (window.echarts) {
      Array.prototype.slice.call(document.querySelectorAll('div')).forEach(function (node, index) {
        var chart = window.echarts.getInstanceByDom && window.echarts.getInstanceByDom(node);
        if (!chart) return;
        var labels = index % 2 === 0 ? trendLabels : categoryLabels;
        var values = index % 2 === 0 ? trendValues : categoryValues;
        chart.setOption({
          xAxis: { data: labels },
          series: [{ data: values }]
        });
      });
    }
  }

  function createStylePanel() {
    var colorSwatches = ['#ffffff', '#d9dee7', '#9aa4b2', '#111827', '#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6', '#fffbeb', '#ecfccb', '#cffafe', '#e0e7ff', '#fee2e2', '#f5f5f4', '#78716c', '#000000'];
    var swatchHtml = colorSwatches.map(function (color) {
      return '<button type="button" class="ahp-color-swatch" data-style="colorSwatch" value="' + color + '" aria-label="颜色 ' + color + '" style="--swatch:' + color + '"></button>';
    }).join('');
    var fontDropdown = dropdownHtml('字体', 'fontFamily', [
      { label: '当前字体', value: '' },
      { label: '系统黑体', value: '-apple-system, BlinkMacSystemFont, \\'PingFang SC\\', sans-serif' },
      { label: '苹方 / PingFang', value: '\\'PingFang SC\\', -apple-system, sans-serif' },
      { label: '思源黑体 / Noto Sans SC', value: '\\'Noto Sans SC\\', \\'Microsoft YaHei\\', \\'PingFang SC\\', sans-serif' },
      { label: '微软雅黑 / YaHei', value: '\\'Microsoft YaHei\\', \\'PingFang SC\\', sans-serif' },
      { label: '黑体 / SimHei', value: 'SimHei, \\'Microsoft YaHei\\', sans-serif' },
      { label: '思源宋体 / Noto Serif SC', value: '\\'Noto Serif SC\\', \\'Songti SC\\', SimSun, serif' },
      { label: '宋体 / SimSun', value: 'SimSun, \\'Songti SC\\', serif' },
      { label: '楷体 / Kaiti', value: '\\'Kaiti SC\\', STKaiti, serif' },
      { label: '霞鹜文楷 / LXGW', value: '\\'LXGW WenKai\\', \\'Kaiti SC\\', STKaiti, serif' },
      { label: 'Inter', value: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' },
      { label: 'Helvetica Neue', value: '\\'Helvetica Neue\\', Arial, sans-serif' },
      { label: 'Avenir Next', value: '\\'Avenir Next\\', Avenir, sans-serif' },
      { label: 'Futura', value: 'Futura, \\'Avenir Next\\', sans-serif' },
      { label: 'Times New Roman', value: '\\'Times New Roman\\', Times, serif' },
      { label: 'Bodoni 72', value: '\\'Bodoni 72\\', Didot, serif' },
      { label: 'Baskerville', value: 'Baskerville, Georgia, serif' },
      { label: 'Garamond', value: 'Garamond, Georgia, serif' },
      { label: 'DIN Alternate', value: '\\'DIN Alternate\\', \\'Arial Narrow\\', sans-serif' },
      { label: 'DIN Condensed', value: '\\'DIN Condensed\\', \\'Arial Narrow\\', sans-serif' },
      { label: 'Bebas Neue', value: '\\'Bebas Neue\\', Impact, sans-serif' },
      { label: 'Oswald', value: 'Oswald, \\'Arial Narrow\\', sans-serif' },
      { label: 'JetBrains Mono', value: '\\'JetBrains Mono\\', Menlo, monospace' },
      { label: 'Menlo', value: 'Menlo, Monaco, monospace' },
      { label: 'Courier New', value: '\\'Courier New\\', Courier, monospace' }
    ]);
    var weightDropdown = dropdownHtml('字重', 'fontWeight', [
      { label: '300', value: '300' },
      { label: '400', value: '400' },
      { label: '500', value: '500' },
      { label: '600', value: '600' },
      { label: '700', value: '700' },
      { label: '800', value: '800' },
      { label: '900', value: '900' }
    ]);

    stylePanel = document.createElement('div');
    stylePanel.id = 'ahp-style-panel';
    stylePanel.setAttribute('data-ahp-style-panel', 'true');
    stylePanel.setAttribute('data-visible', 'false');
    stylePanel.innerHTML = [
      '<div class="ahp-panel-header"><div class="ahp-style-title"><strong data-role="selectedName">请选择一个文字块</strong><small>当前字体：<span data-role="fontLabel">未选择</span></small></div></div>',
      '<div class="ahp-panel-section"><div class="ahp-section-title">Typography</div><div class="ahp-control-grid">',
      '<div class="ahp-span-2">' + fontDropdown + '</div>',
      weightDropdown,
      '<label>字号<input data-style="fontSize" type="number" min="8" max="220" step="1"></label>',
      '<label>行高<input data-style="lineHeight" type="number" min="0.8" max="3" step="0.1"></label>',
      '<label>字距<input data-style="letterSpacing" type="number" min="-2" max="24" step="0.5"></label>',
      '<div class="ahp-inline ahp-span-2"><button type="button" data-style="bold" aria-label="加粗" aria-pressed="false"><strong>B</strong></button><button type="button" data-style="alignLeft" aria-label="左对齐">左</button><button type="button" data-style="alignCenter" aria-label="居中">中</button><button type="button" data-style="alignRight" aria-label="右对齐">右</button></div>',
      '</div></div>',
      '<div class="ahp-panel-section"><div class="ahp-section-title">Fill</div><div class="ahp-control-grid">',
      '<div class="ahp-color-control ahp-span-2" data-color-control><span>文字颜色</span><div class="ahp-color-row"><button type="button" class="ahp-color-chip" data-action="toggleColor" aria-label="打开颜色面板"></button><input data-style="colorText" type="text" maxlength="7" placeholder="#d9eb26"></div><div class="ahp-color-popover" data-ahp-color-popover><div class="ahp-color-swatch-grid">' + swatchHtml + '</div><div class="ahp-color-rgb"><label>R<input data-style="colorR" type="number" min="0" max="255"></label><label>G<input data-style="colorG" type="number" min="0" max="255"></label><label>B<input data-style="colorB" type="number" min="0" max="255"></label></div></div></div>',
      '<label>背景<input data-style="backgroundColor" type="text" maxlength="7" placeholder="#111827"></label>',
      '<label>边框<input data-style="borderColor" type="text" maxlength="7" placeholder="#ffffff"></label>',
      '</div></div>',
      '<div class="ahp-panel-section"><div class="ahp-section-title">Appearance</div><div class="ahp-control-grid">',
      '<label>圆角<input data-style="borderRadius" type="number" min="0" max="120" step="1"></label>',
      '<label>内距<input data-style="padding" type="number" min="0" max="160" step="1"></label>',
      '<label class="ahp-span-2">图片<input data-style="imageUrl" type="text" placeholder="图片 URL"></label>',
      '<label class="ahp-span-2" data-link-field>链接<input data-style="linkHref" type="text" placeholder="https://example.com"></label>',
      '</div></div>',
      dashboardDataSectionHtml(),
      '<div class="ahp-panel-section"><div class="ahp-section-title">Module</div><div class="ahp-module-actions"><button type="button" data-style="moduleToggle">隐藏模块</button><button type="button" data-style="moduleUp">上移</button><button type="button" data-style="moduleDown">下移</button><button type="button" data-style="moduleDuplicate">复制</button><button type="button" data-style="moduleDelete">删除</button></div></div>'
    ].join('');
    var popover = toolbar && toolbar.querySelector('.ahp-editor-popover');
    if (popover) popover.appendChild(stylePanel);

    styleControls = {
      selectedName: stylePanel.querySelector('[data-role="selectedName"]'),
      fontLabel: stylePanel.querySelector('[data-role="fontLabel"]'),
      fontSize: stylePanel.querySelector('[data-style="fontSize"]'),
      colorControl: stylePanel.querySelector('[data-color-control]'),
      colorPreview: stylePanel.querySelector('[data-action="toggleColor"]'),
      colorText: stylePanel.querySelector('[data-style="colorText"]'),
      colorR: stylePanel.querySelector('[data-style="colorR"]'),
      colorG: stylePanel.querySelector('[data-style="colorG"]'),
      colorB: stylePanel.querySelector('[data-style="colorB"]'),
      backgroundColor: stylePanel.querySelector('[data-style="backgroundColor"]'),
      borderColor: stylePanel.querySelector('[data-style="borderColor"]'),
      borderRadius: stylePanel.querySelector('[data-style="borderRadius"]'),
      padding: stylePanel.querySelector('[data-style="padding"]'),
      imageUrl: stylePanel.querySelector('[data-style="imageUrl"]'),
      linkField: stylePanel.querySelector('[data-link-field]'),
      linkHref: stylePanel.querySelector('[data-style="linkHref"]'),
      letterSpacing: stylePanel.querySelector('[data-style="letterSpacing"]'),
      lineHeight: stylePanel.querySelector('[data-style="lineHeight"]'),
      moduleToggle: stylePanel.querySelector('[data-style="moduleToggle"]'),
      bold: stylePanel.querySelector('[data-style="bold"]'),
      alignLeft: stylePanel.querySelector('[data-style="alignLeft"]'),
      alignCenter: stylePanel.querySelector('[data-style="alignCenter"]'),
      alignRight: stylePanel.querySelector('[data-style="alignRight"]')
    };
    setColorControlValue(themeColor || initialThemeColor);

    stylePanel.addEventListener('input', function (event) {
      var target = event.target;
      if (target && target.getAttribute('data-dashboard-field')) {
        applyDashboardDataInput(target);
        return;
      }
      var name = target && target.getAttribute('data-style');
      if (name) applyStyleControl(name, target.value);
    });
    stylePanel.addEventListener('change', function (event) {
      var target = event.target;
      if (target && target.getAttribute('data-dashboard-field')) {
        applyDashboardDataInput(target);
        return;
      }
      var name = target && target.getAttribute('data-style');
      if (name) applyStyleControl(name, target.value);
    });
    stylePanel.addEventListener('click', function (event) {
      var resetButton = event.target && event.target.closest ? event.target.closest('[data-action="panelReset"]') : null;
      if (resetButton) {
        return;
      }
      var colorToggle = event.target && event.target.closest ? event.target.closest('[data-action="toggleColor"]') : null;
      if (colorToggle && styleControls.colorControl) {
        closeOpenPopovers(styleControls.colorControl);
        styleControls.colorControl.setAttribute('data-open', styleControls.colorControl.getAttribute('data-open') === 'true' ? 'false' : 'true');
        return;
      }
      var dropdownTrigger = event.target && event.target.closest ? event.target.closest('[data-dropdown-trigger]') : null;
      if (dropdownTrigger) {
        var dropdown = dropdownTrigger.closest('[data-ahp-dropdown]');
        var isOpen = dropdown.getAttribute('data-open') === 'true';
        closeOpenPopovers(dropdown);
        dropdown.setAttribute('data-open', isOpen ? 'false' : 'true');
        return;
      }
      var dropdownOption = event.target && event.target.closest ? event.target.closest('[data-dropdown-option]') : null;
      if (dropdownOption) {
        applyStyleControl(dropdownOption.getAttribute('data-style'), dropdownOption.getAttribute('value'));
        setDropdownValue(dropdownOption.getAttribute('data-style'), dropdownOption.getAttribute('value'));
        closeOpenPopovers();
        return;
      }
      var button = event.target && event.target.closest ? event.target.closest('button[data-style]') : null;
      if (button) {
        applyStyleControl(button.getAttribute('data-style'), button.value);
        closeOpenPopovers();
        return;
      }
      closeOpenPopovers();
    });
  }

  function createToolbar() {
    toolbar = document.createElement('div');
    toolbar.id = 'ahp-toolbar';
    toolbar.setAttribute('data-ahp-toolbar', 'true');
    toolbar.setAttribute('data-open', 'false');
    toolbar.setAttribute('data-mode', 'inline');
    toolbar.innerHTML = [
      '<button type="button" data-ahp-launcher data-action="openToolbar">' + icon('edit') + '<span>高级编辑</span></button>',
      '<div class="ahp-editor-popover">',
      '<div class="ahp-editor-popover-header"><div class="ahp-editor-popover-title"><strong>AI HTML Publisher</strong><small>高级编辑</small></div><button type="button" data-action="closeToolbar" aria-label="关闭编辑器">' + icon('close') + '</button></div>',
      '<div data-ahp-toolbar-section><span data-ahp-label>品牌主色<span data-ahp-theme-value>' + (themeColor || initialThemeColor) + '</span></span><div class="ahp-theme-swatches">',
      themeSwatchesHtml(),
      '</div></div>',
      '<div data-ahp-toolbar-section><span data-role="status" data-ahp-toolbar-status>可直接编辑</span><div data-ahp-toolbar-group><button type="button" data-action="save" aria-label="保存">' + icon('save') + '<span>保存</span></button>',
      '<button type="button" data-action="export" aria-label="导出 HTML">' + icon('download') + '<span>导出</span></button>',
      '<button type="button" data-action="restore" aria-label="恢复初始">' + icon('restore') + '<span>恢复</span></button></div></div>',
      '</div>'
    ].join('');
    toolbar.addEventListener('click', function (event) {
      var themeButton = event.target && event.target.closest ? event.target.closest('[data-theme-color]') : null;
      if (themeButton) {
        applyTheme(themeButton.getAttribute('data-theme-color'));
        return;
      }
      var button = event.target && event.target.closest ? event.target.closest('button[data-action]') : null;
      var action = button && button.getAttribute('data-action');
      if (action === 'openToolbar') {
        setToolbarOpen(true);
        setAdvancedEditing(true);
      }
      if (action === 'closeToolbar') setToolbarOpen(false);
      if (action === 'save') saveCurrent();
      if (action === 'export') exportHtml();
      if (action === 'restore') restoreInitial();
    });
    document.body.appendChild(toolbar);
    document.body.classList.add('ahp-has-toolbar');
    status = toolbar.querySelector('[data-role="status"]');
    syncThemeControls(themeColor || initialThemeColor);
  }

  function themeSwatchesHtml() {
    var presetColors = THEME_CONFIG && Array.isArray(THEME_CONFIG.presets) ? THEME_CONFIG.presets : [];
    var colors = uniqueThemeColors(presetColors.concat([
      themeColor || initialThemeColor,
      '#ffffff',
      '#111827',
      '#7c3aed',
      '#38bdf8',
      '#22c55e',
      '#d9eb26',
      '#f97316',
      '#f43f5e'
    ])).slice(0, 6);
    return colors.map(function (color) {
      var pressed = normalizeHexColor(color) === normalizeHexColor(themeColor || initialThemeColor) ? 'true' : 'false';
      return '<button type="button" class="ahp-theme-swatch" data-theme-color="' + color + '" aria-label="主题色 ' + color + '" aria-pressed="' + pressed + '" style="--theme-color:' + color + '"></button>';
    }).join('');
  }

  function uniqueThemeColors(colors) {
    var seen = {};
    return colors.map(normalizeHexColor).filter(function (color) {
      if (!color || seen[color]) return false;
      seen[color] = true;
      return true;
    });
  }

  function uniqueStrings(items) {
    var seen = {};
    return items.filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function createEditorHint() {
    editorHint = document.createElement('div');
    editorHint.id = 'ahp-editor-hint';
    editorHint.setAttribute('data-ahp-editor-hint', 'true');
    editorHint.setAttribute('data-dismissed', 'false');
    editorHint.innerHTML = [
      '<div class="ahp-editor-hint-head"><div class="ahp-editor-hint-title"><span class="ahp-editor-hint-dot"></span><span>Visual Template Edit</span></div><button type="button" data-action="dismissHint" aria-label="关闭提示">' + icon('close') + '</button></div>',
      '<div class="ahp-editor-hint-body">页面文字和数字可以直接点击修改。需要改样式、链接或模块时，再打开右侧高级编辑。</div>',
      '<div class="ahp-editor-hint-foot"><span>样式跟随当前模板</span><span>Ready</span></div>'
    ].join('');
    editorHint.addEventListener('click', function (event) {
      var button = event.target && event.target.closest ? event.target.closest('[data-action="dismissHint"]') : null;
      if (button) editorHint.setAttribute('data-dismissed', 'true');
    });
    document.body.appendChild(editorHint);
  }

  initialThemeColor = normalizeHexColor(DEFAULT_THEME_COLOR) || detectInitialThemeColor() || '#ffffff';
  themeColor = initialThemeColor;
  initialBodyHtml = captureBodyHtml();
  loadSaved();
  createToolbar();
  createEditorHint();
  createStylePanel();
  enableInlineEditing();
  delegateButtonLinkClicks();
  document.addEventListener('click', function (event) {
    if (!advancedEditing) return;
    if (event.target.closest && (event.target.closest('[data-ahp-toolbar]') || event.target.closest('[data-ahp-style-panel]') || event.target.closest('[data-ahp-editor-hint]'))) return;
    closeOpenPopovers();
    var hiddenSection = event.target.closest && event.target.closest('[data-ahp-hidden="true"][data-section]');
    if (hiddenSection) {
      var hiddenNode = hiddenSection.querySelector('[data-editable="true"][data-edit-id]');
      if (hiddenNode) selectNode(hiddenNode);
      return;
    }
    var node = event.target.closest && event.target.closest('[data-editable="true"][data-edit-id]');
    if (node) selectNode(node);
  });
  window.addEventListener('message', function (event) {
    if (!event || !event.data || event.data.type !== 'AHP_REQUEST_EXPORT_HTML') return;
    var target = event.source || window.parent;
    if (!target || !target.postMessage) return;
    target.postMessage({
      type: 'AHP_EXPORT_HTML',
      html: exportHtmlString()
    }, '*');
  });
  setAdvancedEditing(false);
})();
`;
}

function jsLiteral(value) {
  if (Array.isArray(value)) {
    return `[${value.map(jsLiteral).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value).map(([key, entry]) => `${JSON.stringify(key)}:${jsLiteral(entry)}`).join(",")}}`;
  }
  if (typeof value === "string") {
    return `'${value
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n")
      .replace(/<\/script/gi, "<\\/script")}'`;
  }
  return JSON.stringify(value);
}
