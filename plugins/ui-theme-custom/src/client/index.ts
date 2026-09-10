/**
 * Aurora and nebula tech themes, registered onto the official theme registry
 * (`ctx.theme.register`), plus their own settings row (`settings.general.item`
 * contribution) and the drift keyframes the nebula motion token references.
 * The registry snapshot drives the presenter; the row — registered beside the
 * official Appearance row, which stays light/dark/system only — carries the
 * two cubes so the official ui-theme package never references the custom ids.
 * Selection persists through the official settings scope because
 * `THEME_PREFERENCES` includes the ids; the keyframes ride a runtime style
 * element disposed with the fiber.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { ThemeDefinition, ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale) and the
// settings section's SlotMap entry (ctx.slots.register for settings.general.item).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AURORA_TOKENS } from './aurora.ts'
import { NEBULA_TOKENS } from './nebula.ts'
import { VOID_TOKENS } from './void.ts'
import { JADE_TOKENS } from './jade.ts'
import { SOLAR_TOKENS } from './solar.ts'
import { GLACIAL_TOKENS } from './glacial.ts'
import { en, zh, type TechThemeKey } from './locales.ts'
import { createTechThemeStore } from './settings-store.ts'
import { SETTINGS_NS, TechThemeRow, type TechThemeRowInjected } from './TechThemeRow.tsx'

export type { TechThemeRowInjected } from './TechThemeRow.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The tech-theme row's copy. */
    'settings.theme.custom': TechThemeKey
  }
}

/** Aurora: the violet variant — alias-token overrides over the dark base palette. */
const AURORA: ThemeDefinition = Object.freeze({
  id: 'aurora',
  colorScheme: 'dark' as const,
  tokens: AURORA_TOKENS,
})

/** Nebula: the deep-space tech variant — matte acrylic surfaces + gradient buttons. */
const NEBULA: ThemeDefinition = Object.freeze({
  id: 'nebula',
  colorScheme: 'dark' as const,
  tokens: NEBULA_TOKENS,
})

/** Void: the volcanic-ash dark variant — warm charcoal frosted glass. */
const VOID: ThemeDefinition = Object.freeze({
  id: 'void',
  colorScheme: 'dark' as const,
  tokens: VOID_TOKENS,
})

/** Argent (银曜): refined frosted liquid silver light theme (silver, grey, obsidian black). */
const JADE: ThemeDefinition = Object.freeze({
  id: 'jade',
  colorScheme: 'light' as const,
  tokens: JADE_TOKENS,
})

/** Solar: the amber-orange variant — warm glowing frosted glass. */
const SOLAR: ThemeDefinition = Object.freeze({
  id: 'solar',
  colorScheme: 'dark' as const,
  tokens: SOLAR_TOKENS,
})

/** Glacial: the ice-blue variant — cold arctic frosted glass. */
const GLACIAL: ThemeDefinition = Object.freeze({
  id: 'glacial',
  colorScheme: 'dark' as const,
  tokens: GLACIAL_TOKENS,
})

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
[class$="centerCol"] > :first-child > [class$="_root"]{
  background:var(--dsw-alias-bg-app-image),var(--dsw-alias-bg-base) !important;
}

/* Sidebar column: transparent base so the sidebar's own glass backdrop
   shows through the alpha — the column wrapper no longer paints a solid
   fill that would block the frosted-glass effect underneath. */
[class$="sidebarCol"]{
  position:relative;z-index:0;background:transparent !important;
}
[class$="sidebarCol"]::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  backdrop-filter:var(--dsw-alias-glass-blur,none);
}
[class$="sidebarCol"]::after{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(440px 320px at 12% 38%, var(--dsw-alias-surface-glass-spot, rgba(200,192,214,0.16)), transparent 56%);
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
/* Light theme frosted silver sidebar glass (银曜 / light mode) */
body:not([data-ds-dark-theme]) [class*="sidebarCol"] > * > [class*="root"]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      rgba(255, 255, 255, 0.75) 0%,
      transparent 100%),
    linear-gradient(145deg,
      rgba(255, 255, 255, 0.50) 0%,
      rgba(240, 242, 247, 0.35) 40%,
      transparent 60%),
    color-mix(in srgb, var(--dsw-specific-sidebar-fill) 70%, transparent) !important;
  box-shadow: inset -1px 0 0 rgba(15, 23, 42, 0.06) !important;
}

/* Sidebar active workspace/folder icons: obsidian black in light mode */
body:not([data-ds-dark-theme]) [class*="folderActive"],
body:not([data-ds-dark-theme]) [class*="dsh-ff__icon-accent"],
body:not([data-ds-dark-theme]) .dsh-ff__icon-accent,
body:not([data-ds-dark-theme]) .dsh-ff__folder-icon.dsh-ff__icon-accent svg {
  color: var(--dsw-alias-label-primary, #181a22) !important;
  fill: currentColor !important;
}

/* better-sidebar's pane sits OUTSIDE the frame (x > frame width), so no
   frame pool shines behind it — give the pane its own soft light layer
   via ::after so the translucent fill has glass-like pools, matching
   the left sidebar. */
[class$="_pane"]{
  background-color:var(--dsw-alias-bg-base) !important;
  position:relative;z-index:0;
}
[class$="_pane"]::after{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    radial-gradient(440px 320px at 78% 68%, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.16)), transparent 56%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.05),inset 0 0 0 1px rgba(255,255,255,0.03);
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

/* Light mode: Frosted Liquid Silver Glass (银底黑字 · 高级通透金属玻璃) */
body:not([data-ds-dark-theme]) [class*="_primary"],
body:not([data-ds-dark-theme]) [class*="gitCommitButton"]{
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.90) 0%,
    rgba(240, 242, 247, 0.82) 42%,
    rgba(222, 226, 235, 0.78) 100%) !important;
  backdrop-filter: blur(12px) saturate(1.25) !important;
  -webkit-backdrop-filter: blur(12px) saturate(1.25) !important;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.95),
    inset 0 0 0 1px rgba(255, 255, 255, 0.55),
    0 0 0 1px rgba(15, 23, 42, 0.09),
    0 2px 6px rgba(15, 23, 42, 0.08),
    0 6px 16px rgba(15, 23, 42, 0.05) !important;
  color: #181a22 !important;
  font-weight: 550 !important;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: all 180ms var(--ds-ease-in-out, ease-in-out) !important;
}
body:not([data-ds-dark-theme]) [class*="_primary"]:hover:not(:disabled),
body:not([data-ds-dark-theme]) [class*="gitCommitButton"]:hover:not(:disabled){
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(245, 247, 252, 0.88) 42%,
    rgba(230, 234, 242, 0.84) 100%) !important;
  box-shadow:
    inset 0 1px 1.5px rgba(255, 255, 255, 1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.75),
    0 0 0 1px rgba(15, 23, 42, 0.12),
    0 3px 10px rgba(15, 23, 42, 0.12),
    0 8px 20px rgba(15, 23, 42, 0.06) !important;
  color: #0d0f14 !important;
  transform: translateY(-0.5px);
}
body:not([data-ds-dark-theme]) [class*="_primary"]:active:not(:disabled),
body:not([data-ds-dark-theme]) [class*="gitCommitButton"]:active:not(:disabled){
  transform: translateY(0.5px);
  background: linear-gradient(145deg,
    rgba(228, 231, 238, 0.88) 0%,
    rgba(218, 222, 230, 0.90) 100%) !important;
  box-shadow:
    inset 0 1px 2px rgba(15, 23, 42, 0.12),
    inset 0 0 0 1px rgba(15, 23, 42, 0.08),
    0 1px 3px rgba(15, 23, 42, 0.06) !important;
}
body:not([data-ds-dark-theme]) [class*="_primary"] *,
body:not([data-ds-dark-theme]) [class*="gitCommitButton"] *{
  color: #181a22 !important;
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
[class$="_sidebarCol"]:has([role="dialog"]){
  z-index:9500 !important;
}
/* Tooltip inside sidebar: raise sidebar column above center column and message layer (z 20)
   so tooltips extending to the right are not clipped or covered by the conversation surface. */
[class*="sidebarCol"]:has([role="tooltip"]){
  z-index:50 !important;
}

/* Dialogs/modals: frosted glass surface — scoped to dark theme so light mode dialogs stay clean and readable. */
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
`

/** localStorage key for the user's custom theme preference. */
const LS_KEY = 'dsh-theme-preference'

/** Stable marker attribute for the injected keyframes style. */
const KEYFRAMES_ATTRIBUTE = 'data-ui-theme-custom-keyframes'

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
}`

/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
export const inject = ['theme', 'slots', 'locale']

/**
 * Inject the keyframes style once; idempotent across HMR re-applies.
 * @returns disposer removing the style element.
 */
function injectButtonDrift(): () => void {
  if (typeof document === 'undefined') return () => {}
  if (document.head.querySelector(`style[${KEYFRAMES_ATTRIBUTE}]`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.setAttribute(KEYFRAMES_ATTRIBUTE, '')
  tag.textContent = BUTTON_DRIFT_CSS
  document.head.appendChild(tag)
  return () => { tag.remove() }
}

/** Marker attribute for the injected surface-glass stylesheet. */
const SURFACE_GLASS_ATTRIBUTE = 'data-ui-theme-custom-surface-glass'

/**
 * Inject the surface-glass stylesheet once; idempotent across HMR re-applies.
 * Uses ::before pseudo-elements so backdrop-filter doesn't create a containing
 * block for position:fixed children (tooltips, dialogs).
 * @returns disposer removing the style element.
 */
function injectSurfaceGlass(): () => void {
  if (typeof document === 'undefined') return () => {}
  if (document.head.querySelector(`style[${SURFACE_GLASS_ATTRIBUTE}]`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.setAttribute(SURFACE_GLASS_ATTRIBUTE, '')
  tag.textContent = SURFACE_GLASS_CSS
  document.head.appendChild(tag)
  return () => { tag.remove() }
}

/** Theme id → tokens map for direct CSS-variable application. */
const THEME_TOKEN_MAP: Record<string, ThemeTokens> = {
  aurora: AURORA_TOKENS,
  nebula: NEBULA_TOKENS,
  void: VOID_TOKENS,
  jade: JADE_TOKENS,
  solar: SOLAR_TOKENS,
  glacial: GLACIAL_TOKENS,
}

/** Theme id → colorScheme map so light custom themes switch palette properly. */
const THEME_SCHEME_MAP: Record<string, 'light' | 'dark'> = {
  aurora: 'dark',
  nebula: 'dark',
  void: 'dark',
  jade: 'light',
  solar: 'dark',
  glacial: 'dark',
}

/** Token names this plugin wrote inline (its retraction set). */
const APPLIED_TOKEN_NAMES = new Set<string>()

/**
 * Synchronize theme and background color with the Tauri desktop shell (if running in desktop).
 * Toggles Windows DWM native title bar dark/light mode and sets caption color on Windows 11.
 */
function syncDesktopTitlebar(theme: 'light' | 'dark', colorSpec?: string): void {
  if (typeof window === 'undefined') return
  const bridge = (window as unknown as {
    __dshNotifyBridge?: {
      port?: number
      token?: string
      setTheme?: (theme: string, color?: string) => void
    }
  }).__dshNotifyBridge

  if (!bridge) return

  if (typeof bridge.setTheme === 'function') {
    bridge.setTheme(theme, colorSpec)
  } else if (bridge.port && bridge.token) {
    try {
      fetch(`http://127.0.0.1:${bridge.port}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bridge.token}` },
        body: JSON.stringify({ type: 'theme-change', theme, color: colorSpec }),
      }).catch(() => {})
    } catch {}
  }
}

/** Apply theme tokens as CSS variables on html + body (belt-and-suspenders). */
function applyTokens(tokens: ThemeTokens, colorScheme: 'light' | 'dark' = 'dark'): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.colorScheme = colorScheme
  if (colorScheme === 'dark') {
    document.body.setAttribute('data-ds-dark-theme', '')
  } else {
    document.body.removeAttribute('data-ds-dark-theme')
  }
  for (const [key, value] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(key, value)
    document.body.style.setProperty(key, value)
    APPLIED_TOKEN_NAMES.add(key)
  }
  syncDesktopTitlebar(colorScheme, tokens['--dsw-alias-bg-base'])
}

/**
 * Retract every inline token this plugin wrote. The official ThemePresenter only
 * retracts the body variables it wrote itself, so a custom theme's inline
 * overrides on html + body would otherwise survive a switch back to a built-in
 * preference.
 */
function clearTokens(): void {
  if (typeof document === 'undefined') return
  for (const name of APPLIED_TOKEN_NAMES) {
    document.documentElement.style.removeProperty(name)
    document.body.style.removeProperty(name)
  }
  APPLIED_TOKEN_NAMES.clear()
}

/** Built-in preferences the official Appearance row can explicitly pick. */
const BUILT_IN_PREFERENCES = ['light', 'dark', 'system'] as const
type BuiltinPreference = (typeof BUILT_IN_PREFERENCES)[number]

function isBuiltinPreference(value: string): value is BuiltinPreference {
  return (BUILT_IN_PREFERENCES as readonly string[]).includes(value)
}

/**
 * Whether an observed built-in preference wins over the persisted custom theme.
 * Only a light/dark value the user explicitly picked in THIS session via the
 * setTheme wrapper wins. Values adopted from the settings document at boot/reload
 * (livePick null) never win.
 */
function builtinPickWins(preference: string, livePick: BuiltinPreference | null): boolean {
  if (preference !== 'light' && preference !== 'dark') return false
  return preference === livePick
}

/**
 * Read the saved custom-theme id from localStorage.
 * Handles both plain ids and legacy "id|seen" pipe-delimited values.
 * @returns the validated theme id, or undefined when nothing is saved.
 */
function readSaved(): string | undefined {
  if (typeof localStorage === 'undefined') return undefined
  const raw = localStorage.getItem(LS_KEY)
  if (!raw || raw === 'off') return undefined
  const id = raw.split('|')[0]
  return id && THEME_TOKEN_MAP[id] !== undefined ? id : undefined
}

/** Persist the custom-theme id to localStorage. */
function writeSaved(id: string): void {
  try { localStorage.setItem(LS_KEY, id) } catch { /* localStorage unavailable */ }
}

/** Drop the saved custom-theme record. */
function clearSaved(): void {
  try { localStorage.removeItem(LS_KEY) } catch { /* localStorage unavailable */ }
}

/**
 * Client plugin body: register both themes and the drift keyframes, plus the
 * tech-theme row contribution, disposing everything with the fiber so HMR and
 * teardown never leave a stale theme, stylesheet, or row behind.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  const theme = (ctx.theme ?? ctx.get?.('theme')) as ThemeRuntime

  /** Apply a custom theme via direct CSS variables and the theme service. */
  const activateTheme = (id: string): void => {
    const tokens = THEME_TOKEN_MAP[id]
    if (!tokens) return
    writeSaved(id)
    try { theme.setTheme(id) } catch { /* theme service may reject unknown ids */ }
    applyTokens(tokens, THEME_SCHEME_MAP[id] ?? 'dark')
  }
  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'ui-theme-custom: row dictionaries')

  const store = createTechThemeStore()
  let bound: BoundActions<typeof store> | undefined

  // Session-live record of the user's last EXPLICIT built-in pick, kept by
  // the setTheme wrapper. The wrapper is the only seam that distinguishes
  // "the user clicked Light/Dark/System in the Appearance row" from
  // "ThemeRuntime.adopt() copied the settings document value at boot/reload".
  let liveBuiltinPick: BuiltinPreference | null = null
  const originalSetTheme = theme.setTheme
  theme.setTheme = function (this: ThemeRuntime, id: string): void {
    liveBuiltinPick = isBuiltinPreference(id) ? id : null
    originalSetTheme.call(this, id)
  }
  ctx.effect(() => () => {
    theme.setTheme = originalSetTheme
  }, 'ui-theme-custom: restore setTheme wrapper')

  // Defer the restore out of the current dispatch (microtask) so the custom
  // theme's setTheme is always the LAST event the ThemePresenter sees,
  // preventing the outer dispatch's stale built-in snapshot from overwriting
  // the custom theme's tokens and dark attribute.
  let restorePending = false
  const scheduleRestore = (desired: string): void => {
    if (restorePending) return
    restorePending = true
    queueMicrotask(() => {
      restorePending = false
      const preference = theme.getTheme().preference
      if (preference === desired) return
      if (builtinPickWins(preference, liveBuiltinPick)) return
      activateTheme(desired)
    })
  }

  const applyDesired = (): void => {
    const desired = readSaved()
    const preference = theme.getTheme().preference
    if (desired === undefined) {
      if (isBuiltinPreference(preference)) {
        clearTokens()
        const isDark = preference === 'dark' || (preference === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
        syncDesktopTitlebar(isDark ? 'dark' : 'light', isDark ? '#16161b' : '#f5f5f7')
      }
      return
    }
    if (preference === desired) {
      // Preference matches, but ensure tokens and dark attributes remain applied
      // in case an outer presenter apply cleared them.
      const tokens = THEME_TOKEN_MAP[desired]
      if (tokens) applyTokens(tokens, THEME_SCHEME_MAP[desired] ?? 'dark')
      return
    }
    if (builtinPickWins(preference, liveBuiltinPick)) {
      clearSaved()
      clearTokens()
      const isDark = preference === 'dark' || (preference === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
      syncDesktopTitlebar(isDark ? 'dark' : 'light', isDark ? '#16161b' : '#f5f5f7')
      return
    }
    scheduleRestore(desired)
  }

  applyDesired()
  ctx.on('theme/change', (snapshot) => {
    applyDesired()
    bound?.sync(snapshot.preference, snapshot.revision)
  })

  const injected = (actions: BoundActions<typeof store>): TechThemeRowInjected => {
    bound = actions
    bound.sync(theme.getTheme().preference, theme.getTheme().revision)
    return {
      setTheme: (id) => {
        activateTheme(id)
      },
    }
  }
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'appearance-custom',
    order: 20,
    store,
    locale: SETTINGS_NS,
    inject: injected,
  }, TechThemeRow))

  ctx.effect(() => {
    const disposeAurora = ctx.theme.register(AURORA)
    const disposeNebula = ctx.theme.register(NEBULA)
    const disposeVoid = ctx.theme.register(VOID)
    const disposeJade = ctx.theme.register(JADE)
    const disposeSolar = ctx.theme.register(SOLAR)
    const disposeGlacial = ctx.theme.register(GLACIAL)
    const removeKeyframes = injectButtonDrift()
    const removeSurfaceGlass = injectSurfaceGlass()
    return () => {
      disposeAurora()
      disposeNebula()
      disposeVoid()
      disposeJade()
      disposeSolar()
      disposeGlacial()
      removeKeyframes()
      removeSurfaceGlass()
      clearTokens()
    }
  }, 'ui-theme-custom: tech theme registrations + drift keyframes + surface glass')

  // Restore the user's saved custom theme preference now that themes are
  // registered. Runs during apply() (before first React render when
  // "immediately" is true), so the first paint already shows the right
  // theme — no flash.
  try {
    const saved = readSaved()
    if (saved !== undefined) {
      activateTheme(saved)
    }
  } catch { /* localStorage unavailable */ }
}
