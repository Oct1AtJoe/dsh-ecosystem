import { MOCHA_TOKENS } from "./mocha.js";
import { NEBULA_TOKENS } from "./nebula.js";
import { VOID_TOKENS } from "./void.js";
import { JADE_TOKENS } from "./jade.js";
import { SOLAR_TOKENS } from "./solar.js";
import { PARCHMENT_TOKENS } from "./parchment.js";
import { en, zh } from "./locales.js";
import { createTechThemeStore } from "./settings-store.js";
import { SETTINGS_NS, TechThemeRow } from "./TechThemeRow.js";
/** Mocha (栖木): the warm coffee and wood dark variant — rich espresso charcoal + warm caramel amber. */
const MOCHA = Object.freeze({
    id: 'mocha',
    colorScheme: 'dark',
    tokens: MOCHA_TOKENS,
});
/** Nebula: the deep-space tech variant — matte acrylic surfaces + gradient buttons. */
const NEBULA = Object.freeze({
    id: 'nebula',
    colorScheme: 'dark',
    tokens: NEBULA_TOKENS,
});
/** Void: the volcanic-ash dark variant — warm charcoal frosted glass. */
const VOID = Object.freeze({
    id: 'void',
    colorScheme: 'dark',
    tokens: VOID_TOKENS,
});
/** Argent (银曜): refined frosted liquid silver light theme (silver, grey, obsidian black). */
const JADE = Object.freeze({
    id: 'jade',
    colorScheme: 'light',
    tokens: JADE_TOKENS,
});
/** Solar: the amber-orange variant — warm glowing frosted glass. */
const SOLAR = Object.freeze({
    id: 'solar',
    colorScheme: 'dark',
    tokens: SOLAR_TOKENS,
});
/** Parchment (缃素): refined warm rice paper & pine soot ink light theme (cream linen, amber cinnabar, ink black). */
const PARCHMENT = Object.freeze({
    id: 'parchment',
    colorScheme: 'light',
    tokens: PARCHMENT_TOKENS,
});
/** Surface-glass CSS injected so sidebar, details, and bubbles get
 * backdrop-filter without modifying the host panel CSS (avoids
 * the fixed-positioned child constraint by using ::before pseudo-elements,
 * which are not DOM ancestors and therefore don't create a containing
 * block for position:fixed descendants).
 * Selectors use [class*="..."] to match CSS Modules hashed class names. */
const SURFACE_GLASS_CSS = `
/* Glass feel via translucent surfaces letting the aurora pools shine
   through — no backdrop-filter (it blurs the pools into invisibility).
   Panels keep their own rgba fills and the frame/root gradients show
   through the alpha, which is the DSH web glass recipe.

   Conversation root: show the aurora
   pools DIRECTLY on the conversation surface, so the main chat area has a
   clearly visible glass backplate without relying on translucency alone. (The
   frame keeps its native uniform dark background so overlaid dialogs don't
   reveal a patterned backdrop through their own translucency.) */
/* 0.1.5+ renders the conversation through nested root-slot anchors:
   centerCol > [data-slot="main"] > [data-slot="main.conversation"] > root.
   Keep the 0.1.2 direct-child form for older hosts; the slot anchor form
   covers the current nesting (anchors are display:contents). */
[class$="centerCol"] > :first-child > [class$="_root"],
[class$="centerCol"] [data-slot="main.conversation"] > [class*="_root"]{
  background:var(--dsw-alias-bg-app-image),var(--dsw-alias-bg-base) !important;
}

/* Sidebar column: transparent base so the sidebar's own glass backdrop
   shows through the alpha — the column wrapper no longer paints a solid
   fill that would block the frosted-glass effect underneath. */
[class*="sidebarCol"]{
  position:relative;z-index:0;background:transparent !important;
}
[class*="sidebarCol"]::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  backdrop-filter:var(--dsw-alias-glass-blur,none);
}
[class*="sidebarCol"]::after{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(440px 320px at 12% 38%, var(--dsw-alias-surface-glass-spot, transparent), transparent 56%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.04),inset 0 0 0 1px rgba(255,255,255,0.02);
}

/* Sidebar root: composite glass surface — radial inner glow (brighter
   center → dark edge) simulates depth, the diagonal sheen mimics a light
   reflection, and the semi-transparent fill keeps the sidebar distinct
   from the frame behind it. Glow and sheen ride the theme's
   --dsw-alias-surface-glass-spot (color-mixed down to the old white
   intensities) so both sidebars tint with the active theme.
   Matches strictly through the single renderSlot wrapper div (> * >)
   so deep descendants (e.g. settings dialog Menu spans with ._root_*) are not matched.
   
   NOTE: backdrop-filter NOT set here — it lives on sidebarCol::before
   (pseudo-element, safe for position:fixed children). backdrop-filter on
   a DOM element creates a containing block for position:fixed descendants,
   which would break the settings dialog (portal renders inside sidebar). */
body[data-ds-dark-theme] [class*="sidebarCol"] > * > [class*="root"]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 15%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 30%, transparent) 0%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 10%, transparent) 40%,
      transparent 60%),
    color-mix(in srgb, var(--dsw-specific-sidebar-fill) 55%, transparent) !important;
}
/* Light theme sidebar glass — driven by theme's surface-glass-spot (transparent when spots disabled) */
body:not([data-ds-dark-theme]) [class*="sidebarCol"] > * > [class*="root"]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 30%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 20%, transparent) 0%,
      transparent 60%),
    var(--dsw-specific-sidebar-fill) !important;
  box-shadow: inset -1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.06)) !important;
}

/* Sidebar active workspace/folder icons: obsidian black in light mode */
body:not([data-ds-dark-theme]) [class*="folderActive"],
body:not([data-ds-dark-theme]) [class*="dsh-ff__icon-accent"],
body:not([data-ds-dark-theme]) .dsh-ff__icon-accent,
body:not([data-ds-dark-theme]) .dsh-ff__folder-icon.dsh-ff__icon-accent svg {
  color: var(--dsw-alias-label-primary, #181a22) !important;
  fill: currentColor !important;
}

/* Right sidebar — 0.1.5 native ui-sidebar-right, a sibling of the app frame:
   rightbarCol hosts an edge-anchored panel ([data-sidebar-right-panel], "push"
   mode) that can also go fixed fullscreen. Mirror the left sidebar's glass
   recipe: the column paints the theme's app-image pools DIRECTLY (same trick
   as the conversation surface) so the translucent panel has real depth to
   show through — otherwise its fill sits over the solid frame and reads as
   flat colour; the column keeps the blur backdrop + soft light pool, the
   panel keeps the translucent composite fill; fullscreen gets its own
   backdrop so the panel doesn't turn flat over the conversation.

   The panel is matched by its data attribute, never by [class*="_panel"]:
   that substring also hits the sibling _panelBody class, which painted the
   same 45% fill a second time over the panel — two stacked translucent layers
   read as one solid colour. */
[class*="rightbarCol"]{
  position:relative;z-index:0;
  background:var(--dsw-alias-bg-app-image),var(--dsw-alias-bg-base) !important;
}
[class*="rightbarCol"]::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  backdrop-filter:var(--dsw-alias-glass-blur,none);
}
[class*="rightbarCol"]::after{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(440px 320px at 78% 68%, var(--dsw-alias-surface-glass-spot, transparent), transparent 56%);
  box-shadow:inset -1px 0 0 rgba(255,255,255,0.04),inset 0 0 0 1px rgba(255,255,255,0.02);
}
body[data-ds-dark-theme] [class*="rightbarCol"] [data-sidebar-right-panel]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 15%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 30%, transparent) 0%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 10%, transparent) 40%,
      transparent 60%),
    color-mix(in srgb, var(--dsw-specific-sidebar-fill) 55%, transparent) !important;
  box-shadow: inset -1px 0 0 rgba(255,255,255,0.05), inset 1px 0 0 rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05) !important;
}
body:not([data-ds-dark-theme]) [class*="rightbarCol"] [data-sidebar-right-panel]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 30%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 20%, transparent) 0%,
      transparent 60%),
    var(--dsw-specific-sidebar-fill) !important;
  box-shadow:
    inset -1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.06)),
    inset 1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.04)),
    inset 0 1px 1px var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.04)) !important;
}
[class*="rightbarCol"] [data-sidebar-right-panel="fullscreen"]{
  backdrop-filter:var(--dsw-alias-glass-blur,none);
  -webkit-backdrop-filter:var(--dsw-alias-glass-blur,none);
}
/* Floating dock panels are position:fixed inside the same column subtree:
   the frame already carries a translucent layer-2 fill, so add the theme's
   glass blur and a specular edge so floats read as real frosted glass. */
[class*="rightbarCol"] [class$="_float"]{
  backdrop-filter:var(--dsw-alias-glass-blur,none);
  -webkit-backdrop-filter:var(--dsw-alias-glass-blur,none);
}
body[data-ds-dark-theme] [class*="rightbarCol"] [class$="_float"]{
  box-shadow:var(--dsw-elevation-prominent), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.02) !important;
}
body:not([data-ds-dark-theme]) [class*="rightbarCol"] [class$="_float"]{
  box-shadow:
    var(--dsw-elevation-prominent),
    inset 0 1px 1px rgba(255,255,255,0.85),
    inset 0 0 0 1px rgba(255,255,255,0.45) !important;
}
/* The changes tab (better-sidebar's unified "文件变动" pane) paints an opaque
   --dsw-alias-bg-base ground on its own root, which covers the right panel's
   glass — it is the one pane that reads as a flat slab while every sibling tab
   stays translucent. Drop that ground inside the right sidebar only; the tab's
   rows and diff surfaces still paint their own fills, and the panel glass is
   the same base-surface colour the root was imitating.
   Hooked through the pane's own lens bar (unconditional first child of the
   changes root) so no per-build class hash is baked in. */
[class*="rightbarCol"] [data-slot="sidebar.right.pane.tab"] [class*="_root"]:has(> [class*="_lensBar"]){
  background:transparent !important;
}

/* All primary action buttons (Button variant="primary"):
   1. Dark themes: neon fluid-drift glass buttons.
   2. Light theme: frosted liquid silver glass (银底黑字) with top specular highlight,
      subtle metallic gradient, crisp obsidian typography and soft depth shadow.
   Covers send/stop in composer, dialog confirm/enable (RiskConfirmation, Modal footer),
   settings Done, and any other <Button variant="primary"> throughout the UI. */
body[data-ds-dark-theme] [class*="_primary"]{
  background:var(--dsw-alias-button-primary-bg) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow,none) !important;
}
body[data-ds-dark-theme] [class*="_primary"]:hover:not(:disabled){
  background:var(--dsw-alias-button-primary-bg-hover) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow-hover,none) !important;
}

/* Light mode: Primary action buttons driven dynamically by theme tokens */
body:not([data-ds-dark-theme]) [class*="_primary"],
body:not([data-ds-dark-theme]) [class*="gitCommitButton"]{
  background: var(--dsw-alias-button-primary-bg) !important;
  background-size: var(--dsw-alias-button-primary-bg-size, 200% 100%) !important;
  box-shadow: var(--dsw-alias-button-glow, none) !important;
  color: var(--dsw-alias-button-contrast-fill, #181a22) !important;
  font-weight: 550 !important;
  transition: all 180ms var(--ds-ease-in-out, ease-in-out) !important;
}
body:not([data-ds-dark-theme]) [class*="_primary"]:hover:not(:disabled),
body:not([data-ds-dark-theme]) [class*="gitCommitButton"]:hover:not(:disabled){
  background: var(--dsw-alias-button-primary-bg-hover, var(--dsw-alias-button-primary-bg)) !important;
  box-shadow: var(--dsw-alias-button-glow-hover, none) !important;
  transform: translateY(-0.5px);
}
body:not([data-ds-dark-theme]) [class*="_primary"]:active:not(:disabled),
body:not([data-ds-dark-theme]) [class*="gitCommitButton"]:active:not(:disabled){
  transform: translateY(0.5px);
  box-shadow: var(--dsw-alias-button-press-shadow, none) !important;
}
body:not([data-ds-dark-theme]) [class*="_primary"] *,
body:not([data-ds-dark-theme]) [class*="gitCommitButton"] *{
  color: var(--dsw-alias-button-contrast-fill, #181a22) !important;
  fill: currentColor !important;
}

/* Git commit button (dsh-better-sidebar .gitCommitButton, hashed as
   "<hash>_gitCommitButton"): same gradient glass recipe as the primary
   action buttons — scoped to dark theme. */
body[data-ds-dark-theme] [class*="gitCommitButton"]{
  background:var(--dsw-alias-button-primary-bg) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow,none) !important;
  color:var(--dsw-alias-label-primary-foreground) !important;
}
body[data-ds-dark-theme] [class*="gitCommitButton"]:hover:not(:disabled){
  background:var(--dsw-alias-button-primary-bg-hover) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow-hover,none) !important;
}

/* Settings/dialog full-viewport layer (the .overlay box, marked
   role="presentation", whose child is the role="dialog" panel): force a
   standalone stacking context at the top of the page so the dialog never
   competes with the message-nav rail (z 1001), sticky composer, or the
   conversation trace — a structural fix that lives with the theme, not the
   host package. Portal menus (settings language/permission selects, z 1100)
   would lose to a max overlay on z-index alone, so they get the same max
   value below: both are root-level layers and menus mount into <body> AFTER
   the overlay, so the equal z-index resolves in the menu's favor (later DOM
   order wins). */
/* Settings/dialog: raise above third-party plugin layers, but never to the
   int32 max. A max z-index on the dialog makes every "plausible" plugin
   layer lose — dsh-market's preview lightbox (z 10000, explicitly designed
   to out-rank any plausible dialog) was buried behind the settings panel.
   The 9500 cap sits above the message-nav rail (1001), sticky composer, and
   Radix popovers (1100) while staying below the market lightbox. */
[role="presentation"]:has(> [role="dialog"]){
  z-index:9500 !important;
  isolation:isolate !important;
}
[role="menu"]{
  z-index:9501 !important;
}
/* The settings portal mounts INSIDE the sidebar column (sidebarCol), which
   is a position:relative z-index:0 stacking context — the message layer
   (z 20) competes against the column at the frame level, so any z-index on
   the dialog itself loses regardless of its value. Lift the whole sidebar
   column while a dialog is open: the column and the dialog do not overlap,
   so there is no visual side effect, and the :has() reverts automatically
   when the dialog closes. A nested :has() cannot be used — Chromium rejects
   it as an invalid selector and silently drops the whole rule. */
[class*="_sidebarCol"]:has([role="dialog"]){
  z-index:9500 !important;
}
/* Tooltip inside sidebar: raise sidebar column above center column and message layer (z 20)
   so tooltips extending to the right are not clipped or covered by the conversation surface. */
[class*="sidebarCol"]:has([role="tooltip"]){
  z-index:50 !important;
}

/* Sidebar footer actions: vertical layout so card (e.g. cost-meter) and action buttons stack top-to-bottom */
[class*="footArea"] [class*="footerActions"]{
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 8px !important;
}
[class*="footArea"] [class*="footerActions"] > *{
  min-width: 0 !important;
  width: 100% !important;
}
[class*="footArea"] [class*="footerActions"] .dshRemoteSidebarEntry{
  order: 10 !important;
}
[class*="footArea"] [class*="footerActions"] .dshRemoteSidebarEntry.isWide{
  width: 100% !important;
  margin: 0 !important;
}
[class*="collapsed"] [class*="footArea"] [class*="footerActions"]{
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 8px !important;
  width: auto !important;
}
[class*="collapsed"] [class*="footArea"] [class*="footerActions"] > *{
  width: auto !important;
}

/* Dialogs/modals: frosted glass surface */
body[data-ds-dark-theme] [role="dialog"]{
  background:
    linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 30%),
    linear-gradient(0deg, rgba(10,11,16,0.25) 0%, transparent 45%),
    color-mix(in srgb, var(--dsw-alias-bg-layer-2) 85%, transparent) !important;
  backdrop-filter:blur(32px) saturate(1.05) !important;
  box-shadow:
    0 0 0 1px rgba(200,198,204,0.22),
    inset 0 1px 0 rgba(255,255,255,0.12),
    0 6px 16px rgba(0,0,0,0.40),
    0 24px 60px rgba(0,0,0,0.50) !important;
}
/* Dialogs/modals in light mode: surface driven dynamically by theme tokens */
body:not([data-ds-dark-theme]) [role="dialog"]{
  background:
    linear-gradient(145deg,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 100%),
    var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-2, rgb(238, 232, 220))) !important;
  backdrop-filter: blur(28px) saturate(1.10) !important;
  -webkit-backdrop-filter: blur(28px) saturate(1.10) !important;
  box-shadow:
    0 0 0 1px var(--dsw-alias-border-l2, rgba(15, 23, 42, 0.08)),
    0 12px 32px rgba(15, 23, 42, 0.08),
    0 24px 64px rgba(15, 23, 42, 0.05) !important;
}
`;
/** localStorage key for the user's custom theme preference. */
const LS_KEY = 'dsh-theme-preference';
/** Stable marker attribute for the injected keyframes style. */
const KEYFRAMES_ATTRIBUTE = 'data-ui-theme-custom-keyframes';
/** Button-drift keyframes the nebula motion token references. */
const BUTTON_DRIFT_CSS = `@keyframes dsh-button-drift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}`;
/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
export const inject = ['theme', 'slots', 'locale'];
/**
 * Inject the keyframes style once; idempotent across HMR re-applies.
 * @returns disposer removing the style element.
 */
function injectButtonDrift() {
    if (typeof document === 'undefined')
        return () => { };
    if (document.head.querySelector(`style[${KEYFRAMES_ATTRIBUTE}]`) !== null)
        return () => { };
    const tag = document.createElement('style');
    tag.setAttribute(KEYFRAMES_ATTRIBUTE, '');
    tag.textContent = BUTTON_DRIFT_CSS;
    document.head.appendChild(tag);
    return () => { tag.remove(); };
}
/** Marker attribute for the injected surface-glass stylesheet. */
const SURFACE_GLASS_ATTRIBUTE = 'data-ui-theme-custom-surface-glass';
/**
 * Inject the surface-glass stylesheet once; idempotent across HMR re-applies.
 * Uses ::before pseudo-elements so backdrop-filter doesn't create a containing
 * block for position:fixed children (tooltips, dialogs).
 * @returns disposer removing the style element.
 */
function injectSurfaceGlass() {
    if (typeof document === 'undefined')
        return () => { };
    if (document.head.querySelector(`style[${SURFACE_GLASS_ATTRIBUTE}]`) !== null)
        return () => { };
    const tag = document.createElement('style');
    tag.setAttribute(SURFACE_GLASS_ATTRIBUTE, '');
    tag.textContent = SURFACE_GLASS_CSS;
    document.head.appendChild(tag);
    return () => { tag.remove(); };
}
/** Theme id → tokens map for direct CSS-variable application. */
const THEME_TOKEN_MAP = {
    mocha: MOCHA_TOKENS,
    nebula: NEBULA_TOKENS,
    void: VOID_TOKENS,
    jade: JADE_TOKENS,
    solar: SOLAR_TOKENS,
    parchment: PARCHMENT_TOKENS,
};
/** Theme id → colorScheme map so light custom themes switch palette properly. */
const THEME_SCHEME_MAP = {
    mocha: 'dark',
    nebula: 'dark',
    void: 'dark',
    jade: 'light',
    solar: 'dark',
    parchment: 'light',
};
/** Token names this plugin wrote inline (its retraction set). */
const APPLIED_TOKEN_NAMES = new Set();
const TITLEBAR_PRESETS = {
    nebula: {
        bg: 'rgb(28, 24, 46)',
        accent: 'rgb(168, 142, 250)',
        line: 'rgba(168, 142, 250, 0.18)',
        text: 'rgb(240, 236, 255)',
        muted: 'rgb(175, 168, 200)',
        hover: 'rgba(168, 142, 250, 0.12)',
        active: 'rgba(168, 142, 250, 0.22)',
    },
    solar: {
        bg: 'rgb(40, 28, 20)',
        accent: 'rgb(240, 180, 90)',
        line: 'rgba(240, 180, 90, 0.18)',
        text: 'rgb(252, 246, 238)',
        muted: 'rgb(198, 178, 156)',
        hover: 'rgba(240, 180, 90, 0.12)',
        active: 'rgba(240, 180, 90, 0.22)',
    },
    mocha: {
        bg: 'rgb(36, 27, 21)',
        accent: 'rgb(228, 160, 92)',
        line: 'rgba(228, 160, 92, 0.18)',
        text: 'rgb(248, 242, 236)',
        muted: 'rgb(196, 176, 158)',
        hover: 'rgba(228, 160, 92, 0.12)',
        active: 'rgba(228, 160, 92, 0.22)',
    },
    parchment: {
        bg: 'rgb(230, 224, 212)',
        accent: 'rgb(150, 56, 30)',
        line: 'rgba(38, 32, 28, 0.09)',
        text: 'rgb(38, 32, 28)',
        muted: 'rgb(110, 98, 88)',
        hover: 'rgba(38, 32, 28, 0.06)',
        active: 'rgba(150, 56, 30, 0.12)',
    },
    jade: {
        bg: 'rgb(226, 228, 233)',
        accent: 'rgb(20, 22, 28)',
        line: 'rgba(15, 23, 42, 0.09)',
        text: 'rgb(20, 22, 28)',
        muted: 'rgb(90, 98, 110)',
        hover: 'rgba(15, 23, 42, 0.06)',
        active: 'rgba(15, 23, 42, 0.10)',
    },
    void: {
        bg: 'rgb(24, 26, 30)',
        accent: 'rgb(140, 144, 155)',
        line: 'rgba(140, 144, 155, 0.18)',
        text: 'rgb(235, 237, 240)',
        muted: 'rgb(160, 164, 175)',
        hover: 'rgba(140, 144, 155, 0.08)',
        active: 'rgba(140, 144, 155, 0.16)',
    },
};
/**
 * Synchronize theme and background color with the Tauri desktop shell (if running in desktop).
 * Toggles Windows DWM native title bar dark/light mode and sets caption color on Windows 11.
 */
function syncDesktopTitlebar(theme, colorSpec, titlebar) {
    if (typeof window === 'undefined')
        return;
    const bridge = window.__dshNotifyBridge;
    if (!bridge)
        return;
    if (typeof bridge.setTheme === 'function') {
        bridge.setTheme(theme, colorSpec, titlebar);
    }
    else if (bridge.port && bridge.token) {
        try {
            fetch(`http://127.0.0.1:${bridge.port}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bridge.token}` },
                body: JSON.stringify({ type: 'theme-change', theme, color: colorSpec, titlebar }),
            }).catch(() => { });
        }
        catch { }
    }
}
/** Apply theme tokens as CSS variables on html + body (belt-and-suspenders). */
function applyTokens(tokens, colorScheme = 'dark', themeId) {
    if (typeof document === 'undefined')
        return;
    document.documentElement.style.colorScheme = colorScheme;
    if (colorScheme === 'dark') {
        document.body.setAttribute('data-ds-dark-theme', '');
    }
    else {
        document.body.removeAttribute('data-ds-dark-theme');
    }
    for (const [key, value] of Object.entries(tokens)) {
        document.documentElement.style.setProperty(key, value);
        document.body.style.setProperty(key, value);
        APPLIED_TOKEN_NAMES.add(key);
    }
    const titlebar = themeId ? TITLEBAR_PRESETS[themeId] : undefined;
    syncDesktopTitlebar(colorScheme, titlebar?.bg ?? tokens['--dsw-alias-bg-base'], titlebar);
}
/**
 * Retract every inline token this plugin wrote. The official ThemePresenter only
 * retracts the body variables it wrote itself, so a custom theme's inline
 * overrides on html + body would otherwise survive a switch back to a built-in
 * preference.
 */
function clearTokens() {
    if (typeof document === 'undefined')
        return;
    for (const name of APPLIED_TOKEN_NAMES) {
        document.documentElement.style.removeProperty(name);
        document.body.style.removeProperty(name);
    }
    APPLIED_TOKEN_NAMES.clear();
}
/** Built-in preferences the official Appearance row can explicitly pick. */
const BUILT_IN_PREFERENCES = ['light', 'dark', 'system'];
function isBuiltinPreference(value) {
    return BUILT_IN_PREFERENCES.includes(value);
}
/**
 * Whether an observed built-in preference wins over the persisted custom theme.
 * Only a light/dark value the user explicitly picked in THIS session via the
 * setTheme wrapper wins. Values adopted from the settings document at boot/reload
 * (livePick null) never win.
 */
function builtinPickWins(preference, livePick) {
    if (preference !== 'light' && preference !== 'dark')
        return false;
    return preference === livePick;
}
/**
 * Read the saved custom-theme id from localStorage.
 * Handles both plain ids and legacy "id|seen" pipe-delimited values.
 * @returns the validated theme id, or undefined when nothing is saved.
 */
function readSaved() {
    if (typeof localStorage === 'undefined')
        return undefined;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw || raw === 'off')
        return undefined;
    const id = raw.split('|')[0];
    return id && THEME_TOKEN_MAP[id] !== undefined ? id : undefined;
}
/** Persist the custom-theme id to localStorage. */
function writeSaved(id) {
    try {
        localStorage.setItem(LS_KEY, id);
    }
    catch { /* localStorage unavailable */ }
}
/** Drop the saved custom-theme record. */
function clearSaved() {
    try {
        localStorage.removeItem(LS_KEY);
    }
    catch { /* localStorage unavailable */ }
}
/**
 * Client plugin body: register both themes and the drift keyframes, plus the
 * tech-theme row contribution, disposing everything with the fiber so HMR and
 * teardown never leave a stale theme, stylesheet, or row behind.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    // Signal the boot script's re-assert loop to stop: browser half is live.
    ;
    window.__dshCustomThemeLive = true;
    const theme = (ctx.theme ?? ctx.get?.('theme'));
    /** Apply a custom theme via direct CSS variables and the theme service. */
    const activateTheme = (id) => {
        const tokens = THEME_TOKEN_MAP[id];
        if (!tokens)
            return;
        writeSaved(id);
        try {
            theme.setTheme(id);
        }
        catch { /* theme service may reject unknown ids */ }
        applyTokens(tokens, THEME_SCHEME_MAP[id] ?? 'dark', id);
    };
    ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'ui-theme-custom: row dictionaries');
    const store = createTechThemeStore();
    let bound;
    // Session-live record of the user's last EXPLICIT built-in pick, kept by
    // the setTheme wrapper. The wrapper is the only seam that distinguishes
    // "the user clicked Light/Dark/System in the Appearance row" from
    // "ThemeRuntime.adopt() copied the settings document value at boot/reload".
    let liveBuiltinPick = null;
    const originalSetTheme = theme.setTheme;
    theme.setTheme = function (id) {
        liveBuiltinPick = isBuiltinPreference(id) ? id : null;
        originalSetTheme.call(this, id);
    };
    ctx.effect(() => () => {
        theme.setTheme = originalSetTheme;
    }, 'ui-theme-custom: restore setTheme wrapper');
    // Defer the restore out of the current dispatch (microtask) so the custom
    // theme's setTheme is always the LAST event the ThemePresenter sees,
    // preventing the outer dispatch's stale built-in snapshot from overwriting
    // the custom theme's tokens and dark attribute.
    let restorePending = false;
    const scheduleRestore = (desired) => {
        if (restorePending)
            return;
        restorePending = true;
        queueMicrotask(() => {
            restorePending = false;
            const preference = theme.getTheme().preference;
            if (preference === desired)
                return;
            if (builtinPickWins(preference, liveBuiltinPick))
                return;
            activateTheme(desired);
        });
    };
    const applyDesired = () => {
        const desired = readSaved();
        const preference = theme.getTheme().preference;
        if (desired === undefined) {
            if (isBuiltinPreference(preference)) {
                clearTokens();
                const isDark = preference === 'dark' || (preference === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
                // null = 显式切回内置主题，通知壳清除自定义顶栏配色
                syncDesktopTitlebar(isDark ? 'dark' : 'light', isDark ? '#16161b' : '#f5f5f7', null);
            }
            return;
        }
        if (preference === desired) {
            // Preference matches, but ensure tokens and dark attributes remain applied
            // in case an outer presenter apply cleared them.
            const tokens = THEME_TOKEN_MAP[desired];
            if (tokens)
                applyTokens(tokens, THEME_SCHEME_MAP[desired] ?? 'dark', desired);
            return;
        }
        if (builtinPickWins(preference, liveBuiltinPick)) {
            clearSaved();
            clearTokens();
            const isDark = preference === 'dark' || (preference === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
            // null = 显式切回内置主题，通知壳清除自定义顶栏配色
            syncDesktopTitlebar(isDark ? 'dark' : 'light', isDark ? '#16161b' : '#f5f5f7', null);
            return;
        }
        scheduleRestore(desired);
    };
    applyDesired();
    ctx.on('theme/change', (snapshot) => {
        applyDesired();
        bound?.sync(snapshot.preference, snapshot.revision);
    });
    const injected = (actions) => {
        bound = actions;
        bound.sync(theme.getTheme().preference, theme.getTheme().revision);
        return {
            setTheme: (id) => {
                activateTheme(id);
            },
        };
    };
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'appearance-custom',
        order: 20,
        store,
        locale: SETTINGS_NS,
        inject: injected,
    }, TechThemeRow));
    ctx.effect(() => {
        const disposeMocha = ctx.theme.register(MOCHA);
        const disposeNebula = ctx.theme.register(NEBULA);
        const disposeVoid = ctx.theme.register(VOID);
        const disposeJade = ctx.theme.register(JADE);
        const disposeSolar = ctx.theme.register(SOLAR);
        const disposeParchment = ctx.theme.register(PARCHMENT);
        const removeKeyframes = injectButtonDrift();
        const removeSurfaceGlass = injectSurfaceGlass();
        return () => {
            disposeMocha();
            disposeNebula();
            disposeVoid();
            disposeJade();
            disposeSolar();
            disposeParchment();
            removeKeyframes();
            removeSurfaceGlass();
            clearTokens();
        };
    }, 'ui-theme-custom: tech theme registrations + drift keyframes + surface glass');
    // Restore the user's saved custom theme preference now that themes are
    // registered. Runs during apply() (before first React render when
    // "immediately" is true), so the first paint already shows the right
    // theme — no flash.
    try {
        const saved = readSaved();
        if (saved !== undefined) {
            activateTheme(saved);
        }
    }
    catch { /* localStorage unavailable */ }
}
//# sourceMappingURL=index.js.map