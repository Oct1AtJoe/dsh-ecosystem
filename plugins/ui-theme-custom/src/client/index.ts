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
import type { ThemeDefinition, ThemeRuntime, ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale), the
// settings section's SlotMap entry (ctx.slots.register for settings.general.item),
// and the renderer's Context merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { SEQUOIA_TOKENS } from './sequoia.ts'
import { SONOMA_TOKENS } from './sonoma.ts'
import { VOID_TOKENS } from './void.ts'
import { JADE_TOKENS } from './jade.ts'
import { SOLAR_TOKENS } from './solar.ts'
import { PARCHMENT_TOKENS } from './parchment.ts'
import { en, zh, type TechThemeKey } from './locales.ts'
import { createSidebarFontStore, createTechThemeStore } from './settings-store.ts'
import { SETTINGS_NS, TechThemeRow, type TechThemeRowInjected } from './TechThemeRow.tsx'
import { SidebarFontRow, type SidebarFontRowInjected } from './SidebarFontRow.tsx'
import { applySidebarFont, normalizeSidebarFont, readSidebarFont, writeSidebarFont } from './sidebar-font.ts'

export type { TechThemeRowInjected } from './TechThemeRow.tsx'
export type { SidebarFontRowInjected } from './SidebarFontRow.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The tech-theme row's copy. */
    'settings.theme.custom': TechThemeKey
  }
}

/** Sequoia: macOS Sequoia 液态透光浅色版 (Liquid Frost Light). */
const SEQUOIA: ThemeDefinition = Object.freeze({
  id: 'sequoia',
  colorScheme: 'light' as const,
  tokens: SEQUOIA_TOKENS,
})

/** Sonoma: macOS Sonoma 深空曜黑暗色版 (Dark Obsidian Pro). */
const SONOMA: ThemeDefinition = Object.freeze({
  id: 'sonoma',
  colorScheme: 'dark' as const,
  tokens: SONOMA_TOKENS,
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

/** Parchment (缃素): refined warm rice paper & pine soot ink light theme (cream linen, amber cinnabar, ink black). */
const PARCHMENT: ThemeDefinition = Object.freeze({
  id: 'parchment',
  colorScheme: 'light' as const,
  tokens: PARCHMENT_TOKENS,
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
/* Dialogs/modals in light mode: 玻璃通透化 —— 填充由 --dsw-alias-bg-overlay 驱动，
   液态主题已将其压到 0.72；此处再加大 blur 半径，让弹窗背后的内容呈现明显磨砂。 */
body:not([data-ds-dark-theme]) [role="dialog"]{
  background:
    linear-gradient(145deg,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 100%),
    var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-2, rgb(238, 232, 220))) !important;
  backdrop-filter: blur(48px) saturate(1.25) !important;
  -webkit-backdrop-filter: blur(48px) saturate(1.25) !important;
  box-shadow:
    0 0 0 1px var(--dsw-alias-border-l2, rgba(15, 23, 42, 0.08)),
    0 12px 32px rgba(15, 23, 42, 0.08),
    0 24px 64px rgba(15, 23, 42, 0.05) !important;
}

/* Oriental Calligraphic & Inkstone accents:
   1. Blockquote: brush-stroke vermilion/ink left spine
   2. Horizontal rule: dry-brush ink wash taper */
body:not([data-ds-dark-theme]) blockquote {
  border-left: 3px solid var(--dsw-alias-brand-primary, #9c301c) !important;
  background: var(--dsw-alias-markdown-citation, rgba(34, 28, 24, 0.04)) !important;
  border-radius: 0 6px 6px 0 !important;
}
body:not([data-ds-dark-theme]) hr {
  border: none !important;
  height: 1px !important;
  background: linear-gradient(90deg, transparent 0%, var(--dsw-alias-border-l3, rgba(34, 28, 24, 0.15)) 25%, var(--dsw-alias-border-l3, rgba(34, 28, 24, 0.15)) 75%, transparent 100%) !important;
}

/* ==========================================================================
   macOS Sequoia & Sonoma Liquid Glass & Physical Material Engine
   ========================================================================== */

/* 全局字体：优先采用 Apple 原生 SF Pro 排版 */
body[data-ds-custom-theme="sequoia"],
body[data-ds-custom-theme="sonoma"] {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
}

/* 视窗外框发丝高光倒角（Hairline Specular Rim：模拟精密切削玻璃微反光）
   ⚠️ 实测：AppFrame 的真实类名是 哈希前缀加 _frame（如 V41CyG_frame），源码目录名
   AppFrame 不在 DOM 里。改用后缀匹配 _frame，同时必须限定含有直接子级 sidebarCol
   （即顶层视窗容器），严禁裸写 [class$="_frame"] —— 否则会误伤对话流右侧的
   轮次导航条（nav.PodZZa_frame），导致导航条四周被误加矩形描边。

   液态主题例外：该高光贴在 AppFrame 顶边，正好横贯「顶栏—内容区」接缝，
   rgba(255,255,255,0.95) 的 1px 白线 + 全周 0.55 白环在纯色底上会被读成
   一条明确的分界线。故液态主题整体不发丝高光（视觉统一优先）。 */
body[data-ds-custom-theme="sonoma"] div[class$="_frame"]:has(> [class*="sidebarCol"]) {
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.18), inset 0 0 0 1px rgba(255, 255, 255, 0.12) !important;
}

/* 轮次导航条（TurnNavigator，标签为 nav.PodZZa_frame）：
   浮动在对话流右侧，坚决禁止继承任何外框发丝阴影或误伤边框 */
nav[class*="frame"],
[class*="TurnNavigator"] {
  box-shadow: none !important;
}

/* 悬浮毛玻璃输入坞 (Floating Glass Dock)
   玻璃强度 = 模糊半径 ÷ 填充不透明度。填充 0.82 会把背后模糊完全盖住，
   视觉上等于一块实心白板。降到 0.42 + blur 64px，才能透出背景被模糊的层次。 */
body[data-ds-custom-theme="sequoia"] [class*="InputBar_card"] {
  border-radius: 20px !important;
  background: rgba(255, 255, 255, 0.42) !important;
  border: 1px solid rgba(255, 255, 255, 0.90) !important;
  backdrop-filter: blur(64px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(64px) saturate(200%) !important;
  box-shadow:
    0 18px 46px rgba(0, 0, 0, 0.13),
    0 4px 14px rgba(0, 0, 0, 0.05),
    inset 0 1px 1px rgba(255, 255, 255, 0.98),
    inset 0 -1px 1px rgba(255, 255, 255, 0.40) !important;
  margin-bottom: 8px !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="InputBar_card"]:focus-within {
  border-color: rgba(0, 113, 227, 0.45) !important;
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.15),
    0 0 0 3px rgba(0, 113, 227, 0.18),
    inset 0 1px 1px rgba(255, 255, 255, 0.95) !important;
}

body[data-ds-custom-theme="sonoma"] [class*="InputBar_card"] {
  border-radius: 20px !important;
  background: rgba(24, 28, 36, 0.80) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  backdrop-filter: blur(38px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(38px) saturate(180%) !important;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.65),
    0 6px 16px rgba(0, 0, 0, 0.45),
    inset 0 1px 1px rgba(255, 255, 255, 0.18) !important;
  margin-bottom: 8px !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="InputBar_card"]:focus-within {
  border-color: rgba(41, 151, 255, 0.45) !important;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.75),
    0 0 0 3px rgba(41, 151, 255, 0.22),
    inset 0 1px 1px rgba(255, 255, 255, 0.25) !important;
}

/* 全局 Primary 按钮（涵盖插件市场「全部更新」、「安装」、发送按钮与操作确认键）：
   彻底消除深暗高对比刺眼纯色，升级为 Apple 原生透光晴空蓝微渐变与发丝微反光 */
body[data-ds-custom-theme="sequoia"] button[class*="_primary"],
body[data-ds-custom-theme="sequoia"] [class*="_primary"],
body[data-ds-custom-theme="sequoia"] button[class*="sendButton"] {
  border-radius: 14px !important;
  background: linear-gradient(180deg, #3898fc 0%, #147ce5 100%) !important;
  box-shadow:
    0 2px 8px rgba(20, 124, 229, 0.22),
    inset 0 1px 1px rgba(255, 255, 255, 0.40) !important;
  border: 1px solid rgba(255, 255, 255, 0.35) !important;
  color: #ffffff !important;
  font-weight: 500 !important;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sequoia"] button[class*="_primary"] *,
body[data-ds-custom-theme="sequoia"] [class*="_primary"] *,
body[data-ds-custom-theme="sequoia"] button[class*="sendButton"] * {
  color: #ffffff !important;
  fill: currentColor !important;
}
body[data-ds-custom-theme="sequoia"] button[class*="_primary"]:hover:not(:disabled),
body[data-ds-custom-theme="sequoia"] [class*="_primary"]:hover:not(:disabled),
body[data-ds-custom-theme="sequoia"] button[class*="sendButton"]:hover:not(:disabled) {
  background: linear-gradient(180deg, #4da5ff 0%, #288bf2 100%) !important;
  box-shadow:
    0 4px 12px rgba(20, 124, 229, 0.32),
    inset 0 1px 1px rgba(255, 255, 255, 0.55) !important;
  transform: translateY(-0.5px);
}

body[data-ds-custom-theme="sonoma"] button[class*="_primary"],
body[data-ds-custom-theme="sonoma"] [class*="_primary"],
body[data-ds-custom-theme="sonoma"] button[class*="sendButton"] {
  border-radius: 14px !important;
  background: linear-gradient(180deg, #3aa0ff 0%, #2997ff 100%) !important;
  box-shadow:
    0 0 14px rgba(41, 151, 255, 0.32),
    inset 0 1px 1px rgba(255, 255, 255, 0.30) !important;
  border: 1px solid rgba(255, 255, 255, 0.20) !important;
  color: #ffffff !important;
  font-weight: 500 !important;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sonoma"] button[class*="_primary"] *,
body[data-ds-custom-theme="sonoma"] [class*="_primary"] *,
body[data-ds-custom-theme="sonoma"] button[class*="sendButton"] * {
  color: #ffffff !important;
  fill: currentColor !important;
}
body[data-ds-custom-theme="sonoma"] button[class*="_primary"]:hover:not(:disabled),
body[data-ds-custom-theme="sonoma"] [class*="_primary"]:hover:not(:disabled),
body[data-ds-custom-theme="sonoma"] button[class*="sendButton"]:hover:not(:disabled) {
  background: linear-gradient(180deg, #4da9ff 0%, #3aa0ff 100%) !important;
  box-shadow:
    0 0 20px rgba(41, 151, 255, 0.48),
    inset 0 1px 1px rgba(255, 255, 255, 0.45) !important;
  transform: translateY(-0.5px);
}

/* 用户气泡：Apple 官方高光胶囊 */
body[data-ds-custom-theme="sequoia"] [class*="MessageItem_bubble"] {
  border-radius: 18px 18px 4px 18px !important;
  background: #0071e3 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.28) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="MessageItem_bubble"] * {
  color: #ffffff !important;
}

body[data-ds-custom-theme="sonoma"] [class*="MessageItem_bubble"] {
  border-radius: 18px 18px 4px 18px !important;
  background: #2997ff !important;
  color: #ffffff !important;
  box-shadow: 0 4px 18px rgba(41, 151, 255, 0.40) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="MessageItem_bubble"] * {
  color: #ffffff !important;
}

/* AI 助手回复：半透液态玻璃卡片化（同输入坞，淡填充 + 大 blur 换取强透明感） */
body[data-ds-custom-theme="sequoia"] [class*="ChatView_column"] > [class*="ChatView_flowItem"]:has([class*="AssistantMarkdown_root"]) {
  background: rgba(255, 255, 255, 0.46) !important;
  border: 1px solid rgba(255, 255, 255, 0.78) !important;
  border-radius: 18px 18px 18px 4px !important;
  padding: 16px 20px !important;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.07),
    inset 0 1px 1px rgba(255, 255, 255, 0.96),
    inset 0 -1px 1px rgba(255, 255, 255, 0.35) !important;
  backdrop-filter: blur(40px) saturate(175%) !important;
  -webkit-backdrop-filter: blur(40px) saturate(175%) !important;
}

body[data-ds-custom-theme="sonoma"] [class*="ChatView_column"] > [class*="ChatView_flowItem"]:has([class*="AssistantMarkdown_root"]) {
  background: rgba(28, 32, 40, 0.74) !important;
  border: 1px solid rgba(255, 255, 255, 0.10) !important;
  border-radius: 18px 18px 18px 4px !important;
  padding: 16px 20px !important;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.40), inset 0 1px 1px rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(22px) saturate(160%) !important;
}

/* 侧边栏毛玻璃材质与透光 (Sidebar Glassmorphism)
   注意（历史硬规则）：绝对不能在 [class*="sidebarCol"] 主元素上直接设置 backdrop-filter！
   因为设置弹窗 (Settings Dialog) 的 Portal 挂载在 sidebarCol DOM 树下，backdrop-filter 会为
   position: fixed 子元素创建新的包含块 (Containing Block)，导致设置弹窗宽度被压死成侧边栏同宽！
   毛玻璃滤镜必须严格挂载在伪元素 ::before 上，该伪元素不是弹窗的祖先节点，完全安全。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] {
  background: transparent !important;
  /* 左栏右缘竖向分界线（用户要求保留）：
     用「中性浅灰」而非高反差黑/白 —— 在大面积同色底上，
     0.5px 的克制灰线能清晰界定两栏，又不会像 1px 纯黑那样突兀。 */
  border-right: 0.5px solid rgba(0, 0, 0, 0.10) !important;
}
/* 侧边栏毛玻璃：blur 半径拉大（56px），配合下方 0.34 的极淡填充，
   玻璃通透度显著提升（观感 = 模糊半径 ÷ 填充不透明度）。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"]::before {
  backdrop-filter: blur(56px) saturate(190%) !important;
  -webkit-backdrop-filter: blur(56px) saturate(190%) !important;
}
/* 侧边栏内容层：极淡半透明填充（0.34）+ 仅一条发丝高光。
   无光晕、无色相、无白渐变 —— 通透感来自「淡填充 + 大 blur」。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > * > [class*="root"] {
  background: rgba(245, 245, 247, 0.34) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.85) !important;
}

body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] {
  background: transparent !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"]::before {
  backdrop-filter: blur(34px) saturate(170%) !important;
  -webkit-backdrop-filter: blur(34px) saturate(170%) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > * > [class*="root"] {
  background:
    radial-gradient(ellipse 85% 65% at 48% 28%, rgba(140, 70, 240, 0.15) 0%, transparent 100%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%),
    rgba(18, 20, 25, 0.55) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.18), inset -1px 0 0 rgba(255, 255, 255, 0.09) !important;
}

/* 右侧抽屉面板毛玻璃与发丝镜面反射 */
/* 右侧抽屉面板：与顶栏同色系，不发丝高光（同左侧栏，避免色差被读成分界） */
body[data-ds-custom-theme="sequoia"] [class*="rightbarCol"] [data-sidebar-right-panel] {
  background: rgba(245, 245, 247, 0.48) !important;
  box-shadow: none !important;
}
body[data-ds-custom-theme="sonoma"] [class*="rightbarCol"] [data-sidebar-right-panel] {
  background:
    radial-gradient(ellipse 85% 65% at 52% 28%, rgba(41, 151, 255, 0.12) 0%, transparent 100%),
    rgba(18, 20, 25, 0.55) !important;
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.09), inset 0 1px 1px rgba(255, 255, 255, 0.18) !important;
}

/* 强制保障设置与模态弹窗全屏视口居中，彻底消除包含块压迫 */
[role="presentation"]:has(> [role="dialog"]) {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

/* 选中态与分类标签组件视觉调优：柔和半透底色，绝不喧宾夺主，14px 协调几何圆弧
   （涵盖插件市场分类标签、dsh-cost-meter 等扩展的胶囊式 Tab，确保背景与文字对比度充足醒目） */
body[data-ds-custom-theme="sequoia"] [class*="cats"] button[class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="catsWrap"] button[class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="tag"][class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="badge"][class*="active"],
body[data-ds-custom-theme="sequoia"] [class*="cm-tab"][class*="active"],
body[data-ds-custom-theme="sequoia"] button[class*="cm-tab"][class*="active"] {
  background: rgba(0, 113, 227, 0.14) !important;
  color: #0071e3 !important;
  border: 1px solid rgba(0, 113, 227, 0.28) !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 6px rgba(0, 113, 227, 0.10) !important;
  font-weight: 600 !important;
}

body[data-ds-custom-theme="sonoma"] [class*="cats"] button[class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="catsWrap"] button[class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="tag"][class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="badge"][class*="active"],
body[data-ds-custom-theme="sonoma"] [class*="cm-tab"][class*="active"],
body[data-ds-custom-theme="sonoma"] button[class*="cm-tab"][class*="active"] {
  background: rgba(41, 151, 255, 0.18) !important;
  color: #2997ff !important;
  border: 1px solid rgba(41, 151, 255, 0.35) !important;
  border-radius: 8px !important;
  box-shadow: 0 0 10px rgba(41, 151, 255, 0.18) !important;
  font-weight: 600 !important;
}

/* 侧边栏会话/工作区 Nav 条目：仅限真正的侧栏列表，严格排除 [role="dialog"] 与 [role="tab"] */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > :not([role="dialog"]) nav [class*="active"]:not([role="tab"]),
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > :not([role="dialog"]) [class*="navItem"][class*="active"] {
  background: rgba(0, 113, 227, 0.12) !important;
  color: #0071e3 !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > :not([role="dialog"]) nav [class*="active"]:not([role="tab"]) *,
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > :not([role="dialog"]) [class*="navItem"][class*="active"] * {
  color: #0071e3 !important;
  fill: currentColor !important;
}

body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > :not([role="dialog"]) nav [class*="active"]:not([role="tab"]),
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > :not([role="dialog"]) [class*="navItem"][class*="active"] {
  background: rgba(41, 151, 255, 0.16) !important;
  color: #2997ff !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > :not([role="dialog"]) nav [class*="active"]:not([role="tab"]) *,
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > :not([role="dialog"]) [class*="navItem"][class*="active"] * {
  color: #2997ff !important;
  fill: currentColor !important;
}

/* 顶部栏 ☰ 毛玻璃面板与「关于」玻璃弹窗已统一由桌面壳的 initialization_script
   （shell_ui_script）提供：它在 document-created 即执行，冷启动引导页也有，
   因此不会出现「先原生菜单、后自定义面板」的跳变。本插件不再重复实现该 UI，
   以免覆盖壳脚本导致跳变回归。动作仍经 __dshNotifyBridge.shellAction() 回到壳侧。 */

/* ── 字号作用域（Type scale）──────────────────────────────────────────
   分两条独立轴：
   - 对话区（阅读内容）：官方 --dsh-content-font-size，由官方行控制。
   - 侧边栏（导航 chrome）：本插件 --dsh-sidebar-font-size，由侧边栏字号行控制。
   两者独立，因为导航与正文同字号会让内容主体失去视觉重量（VS Code / Slack /
   Notion 的侧边栏都固定小一档）。

   设置面板自身跟随对话区轴（它是内容的一部分）。

   ⚠️ 实测硬规则：CSS Modules 哈希后类名形如 V41CyG_frame，**源码目录名
   （AppFrame / SettingsRoot / Rows）不会出现在 DOM 里**。所以：
   - 区域钩子只能用真实存在的片段（sidebarCol / rightbarCol / dsh-ff__ / role="dialog"）；
   - 禁止 [class*="title"] 这类过宽通配：实测命中 49 个元素，会误伤对话区标题。

   ponytail: 侧边栏直接用绝对字号（不是 delta），因为它是独立设置项而非对话区的偏移。 */
body{
  /* 对话区增量轴：设置面板等跟随内容缩放的区域用 */
  --dsh-shell-font-delta:var(--dsh-content-font-delta,0px);
  /* 侧边栏字号兜底：未设置时比对话区默认（14px）小一档 */
  --dsh-sidebar-font-size:13px;
}
/* 左侧边栏：better-sidebar 会话/文件夹/搜索行（真实前缀 dsh-ff__） */
[class*="sidebarCol"] [class*="dsh-ff__title"],
[class*="sidebarCol"] [class*="dsh-ff__header-title"],
[class*="sidebarCol"] [class*="sessionRow"],
[class*="sidebarCol"] [class*="projectRow"],
[class*="sidebarCol"] [class*="searchResultTitle"],
[class*="sidebarCol"] [class*="navLabel"],
[class*="sidebarCol"] [class*="navCell"]{
  font-size:var(--dsh-sidebar-font-size,13px);
}
[class*="sidebarCol"] [class*="searchResultWorkspace"],
[class*="sidebarCol"] [class*="searchResultSnippet"],
[class*="sidebarCol"] [class*="dsh-ff__meta"],
[class*="sidebarCol"] [class*="dsh-ff__subtitle"]{
  font-size:calc(var(--dsh-sidebar-font-size,13px) - 1px);
}
/* 右侧面板：同样归侧边栏轴 */
[class*="rightbarCol"] [class*="sessionRow"],
[class*="rightbarCol"] [class*="navLabel"],
[class*="rightbarCol"] [class*="dsh-ff__title"]{
  font-size:var(--dsh-sidebar-font-size,13px);
}
[class*="rightbarCol"] [class*="searchResultSnippet"],
[class*="rightbarCol"] [class*="dsh-ff__meta"]{
  font-size:calc(var(--dsh-sidebar-font-size,13px) - 1px);
}
/* 设置面板自身：跟随对话区轴（它是内容） */
[role="dialog"] [class*="navTitle"]{
  font-size:calc(16px + var(--dsh-shell-font-delta,0px));
}
[role="dialog"] [class*="navCell"],
[role="dialog"] [class*="navLabel"]{
  font-size:calc(14px + var(--dsh-shell-font-delta,0px));
}
/* 外壳行高随侧边栏字号联动，避免放大后压字 */
[class*="sidebarCol"] [class*="sessionRow"],
[class*="sidebarCol"] [class*="projectRow"]{
  line-height:calc(var(--dsh-sidebar-font-size,13px) + 8px);
}

/* Xcode 风格代码块 */
body[data-ds-custom-theme="sequoia"] pre,
body[data-ds-custom-theme="sequoia"] [class*="codeBlock"] {
  border-radius: 10px !important;
  border: 1px solid #d0d7de !important;
  background: #f6f8fa !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}
body[data-ds-custom-theme="sonoma"] pre,
body[data-ds-custom-theme="sonoma"] [class*="codeBlock"] {
  border-radius: 10px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  background: #14161b !important;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5) !important;
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
  sequoia: SEQUOIA_TOKENS,
  sonoma: SONOMA_TOKENS,
  void: VOID_TOKENS,
  jade: JADE_TOKENS,
  solar: SOLAR_TOKENS,
  parchment: PARCHMENT_TOKENS,
}

/** Theme id → colorScheme map so light custom themes switch palette properly. */
const THEME_SCHEME_MAP: Record<string, 'light' | 'dark'> = {
  sequoia: 'light',
  sonoma: 'dark',
  void: 'dark',
  jade: 'light',
  solar: 'dark',
  parchment: 'light',
}

/** Token names this plugin wrote inline (its retraction set). */
const APPLIED_TOKEN_NAMES = new Set<string>()

/** Titlebar visual preset for each custom theme (纯实色无光斑，与主题底色 1:1 绝对统一). */
interface TitlebarConfig {
  bg: string
  accent?: string
  line?: string
  text?: string
  muted?: string
  hover?: string
  active?: string
  fontFamily?: string
}

const TITLEBAR_PRESETS: Record<string, TitlebarConfig> = {
  sequoia: {
    bg: 'rgb(245, 245, 247)',
    accent: 'rgb(0, 113, 227)',
    // 液态主题：主页面与顶栏同色（rgb(245,245,247)），接缝天然无差，
    // 故下发 transparent 让壳侧 0.5px 发丝线不渲染，实现完全无缝。
    // 其余主题底色与主画布不同，保留发丝线以免出现色差断层。
    line: 'transparent',
    text: 'rgb(29, 29, 31)',
    muted: 'rgb(110, 110, 115)',
    hover: 'rgba(0, 113, 227, 0.08)',
    active: 'rgba(0, 113, 227, 0.16)',
  },
  sonoma: {
    bg: 'rgb(22, 24, 30)',
    accent: 'rgb(41, 151, 255)',
    line: 'rgba(255, 255, 255, 0.10)',
    text: 'rgb(245, 245, 247)',
    muted: 'rgb(161, 161, 166)',
    hover: 'rgba(41, 151, 255, 0.12)',
    active: 'rgba(41, 151, 255, 0.22)',
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
  parchment: {
    bg: 'rgb(230, 224, 212)',
    accent: 'rgb(156, 48, 28)',
    line: 'rgba(38, 32, 28, 0.08)',
    text: 'rgb(34, 28, 24)',
    muted: 'rgb(120, 106, 96)',
    hover: 'rgba(156, 48, 28, 0.08)',
    active: 'rgba(156, 48, 28, 0.15)',
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
}

/**
 * Synchronize theme and background color with the Tauri desktop shell (if running in desktop).
 * Toggles Windows DWM native title bar dark/light mode and sets caption color on Windows 11.
 *
 * 刻意不下发字号：窗口顶栏属于 chrome（交通灯、托盘菜单都是固定尺寸），
 * 业界惯例与官方 --dsh-content-font-size（content 轴）都不缩放窗口装饰。
 * 字号只作用于页面内的内容区与侧边栏/设置面板。
 */
function syncDesktopTitlebar(
  theme: 'light' | 'dark',
  colorSpec?: string,
  titlebar?: TitlebarConfig | null,
): void {
  if (typeof window === 'undefined') return
  const bridge = (window as unknown as {
    __dshNotifyBridge?: {
      port?: number
      token?: string
      setTheme?: (theme: string, color?: string, titlebar?: TitlebarConfig | null) => void
    }
  }).__dshNotifyBridge

  if (!bridge) return

  if (typeof bridge.setTheme === 'function') {
    bridge.setTheme(theme, colorSpec, titlebar)
  } else if (bridge.port && bridge.token) {
    try {
      fetch(`http://127.0.0.1:${bridge.port}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bridge.token}` },
        body: JSON.stringify({ type: 'theme-change', theme, color: colorSpec, titlebar }),
      }).catch(() => {})
    } catch {}
  }
}

/** Apply theme tokens as CSS variables on html + body (belt-and-suspenders). */
function applyTokens(
  tokens: ThemeTokens,
  colorScheme: 'light' | 'dark' = 'dark',
  themeId?: string,
): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.colorScheme = colorScheme
  if (colorScheme === 'dark') {
    document.body.setAttribute('data-ds-dark-theme', '')
  } else {
    document.body.removeAttribute('data-ds-dark-theme')
  }
  if (themeId) {
    document.body.setAttribute('data-ds-custom-theme', themeId)
  } else {
    document.body.removeAttribute('data-ds-custom-theme')
  }
  // 清理不再属于新主题的遗留内联 token（如已移除的字体变量）
  const nextKeys = new Set(Object.keys(tokens))
  for (const name of APPLIED_TOKEN_NAMES) {
    if (!nextKeys.has(name)) {
      document.documentElement.style.removeProperty(name)
      document.body.style.removeProperty(name)
      APPLIED_TOKEN_NAMES.delete(name)
    }
  }
  // 显式防御：若未定义自定义字体，彻底抹除内联残留，回退系统默认
  if (!tokens['--dsw-font-family']) {
    document.documentElement.style.removeProperty('--dsw-font-family')
    document.body.style.removeProperty('--dsw-font-family')
  }
  for (const [key, value] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(key, value)
    document.body.style.setProperty(key, value)
    APPLIED_TOKEN_NAMES.add(key)
  }
  const titlebar = themeId ? TITLEBAR_PRESETS[themeId] : undefined
  syncDesktopTitlebar(colorScheme, titlebar?.bg ?? tokens['--dsw-alias-bg-base'], titlebar)
}

/**
 * Retract every inline token this plugin wrote. The official ThemePresenter only
 * retracts the body variables it wrote itself, so a custom theme's inline
 * overrides on html + body would otherwise survive a switch back to a built-in
 * preference.
 */
function clearTokens(): void {
  if (typeof document === 'undefined') return
  document.body.removeAttribute('data-ds-custom-theme')
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
  // Signal the boot script's re-assert loop to stop: browser half is live.
  ;(window as unknown as { __dshCustomThemeLive?: boolean }).__dshCustomThemeLive = true

  const theme = (ctx.theme ?? ctx.get?.('theme')) as ThemeRuntime

  /** Apply a custom theme via direct CSS variables and the theme service. */
  const activateTheme = (id: string): void => {
    const tokens = THEME_TOKEN_MAP[id]
    if (!tokens) return
    writeSaved(id)
    try { theme.setTheme(id) } catch { /* theme service may reject unknown ids */ }
    applyTokens(tokens, THEME_SCHEME_MAP[id] ?? 'dark', id)
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

  // ── 字号持久化意图保护 ──────────────────────────────────────────────
  // 官方 ThemeRuntime.setFontSize 是「先乐观改本地 fontSize → void host.set() 异步写盘」，
  // 而 adopt() 每次收到 settings 镜像变更就**无条件**用镜像值覆盖本地 fontSize
  // （见 ui-theme/src/client/index.ts 的 setFontSize 与 adopt）。
  // 于是在写入飞行窗口内，任何镜像抖动（其他命名空间落盘、document-updated、
  // connection/reset）都会把刚改的字号回滚成旧值——表现为「改完几秒自动弹回」。
  //
  // 官方已为 preference 用 liveBuiltinPick 防住同类竞态，字号却没有。这里补上等价防护：
  // 记住用户显式提交的值，一旦发现快照被旧镜像回滚就重新断言，直到写盘落地后静默。
  // ponytail: 以「静默窗口」判定写盘落地，不引入 settingsScope 依赖；若日后官方
  // 暴露 setFontSize 的写盘 Promise，应改为 await 该 Promise 精确清除意图。
  let pendingFontSize: number | null = null
  let pendingFontSizeSettle: ReturnType<typeof setTimeout> | undefined
  const originalSetFontSize = theme.setFontSize
  const recordFontSizeIntent = (px: number): void => {
    pendingFontSize = px
    if (pendingFontSizeSettle !== undefined) clearTimeout(pendingFontSizeSettle)
    pendingFontSizeSettle = undefined
  }
  theme.setFontSize = function (this: ThemeRuntime, px: number): void {
    recordFontSizeIntent(px)
    originalSetFontSize.call(this, px)
  }
  ctx.effect(() => () => {
    theme.setFontSize = originalSetFontSize
    if (pendingFontSizeSettle !== undefined) clearTimeout(pendingFontSizeSettle)
  }, 'ui-theme-custom: restore setFontSize wrapper')

  /**
   * 若快照里的字号被旧镜像回滚，重新断言用户意图。
   * @returns true 表示已重新断言（调用方应中止本次后续处理）。
   */
  const assertFontSizeIntent = (snapshotFontSize: number): boolean => {
    if (pendingFontSize === null) return false
    if (snapshotFontSize === pendingFontSize) {
      // 已追上用户意图：再观察一个静默窗口，确认写盘落地后清除意图
      if (pendingFontSizeSettle === undefined) {
        pendingFontSizeSettle = setTimeout(() => {
          pendingFontSize = null
          pendingFontSizeSettle = undefined
        }, 1500)
      }
      return false
    }
    // 被回滚：重新断言（用原函数，不重置意图与计时器）
    if (pendingFontSizeSettle !== undefined) {
      clearTimeout(pendingFontSizeSettle)
      pendingFontSizeSettle = undefined
    }
    try {
      originalSetFontSize.call(theme, pendingFontSize)
    } catch { /* 超出 12..17 时忽略，保持当前渲染 */ }
    return true
  }

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
        // null = 显式切回内置主题，通知壳清除自定义顶栏配色
        syncDesktopTitlebar(isDark ? 'dark' : 'light', isDark ? '#16161b' : '#f5f5f7', null)
      }
      return
    }
    if (preference === desired) {
      // Preference matches, but ensure tokens and dark attributes remain applied
      // in case an outer presenter apply cleared them.
      const tokens = THEME_TOKEN_MAP[desired]
      if (tokens) applyTokens(tokens, THEME_SCHEME_MAP[desired] ?? 'dark', desired)
      return
    }
    if (builtinPickWins(preference, liveBuiltinPick)) {
      clearSaved()
      clearTokens()
      const isDark = preference === 'dark' || (preference === 'system' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
      // null = 显式切回内置主题，通知壳清除自定义顶栏配色
      syncDesktopTitlebar(isDark ? 'dark' : 'light', isDark ? '#16161b' : '#f5f5f7', null)
      return
    }
    scheduleRestore(desired)
  }

  applyDesired()
  ctx.on('theme/change', (snapshot) => {
    // 字号意图保护必须在其它处理之前：若快照被旧镜像回滚，先重新断言用户的字号，
    // 再走主题恢复逻辑。重新断言会再次触发 theme/change，但此时快照已等于意图，
    // 第二轮只登记静默计时器即返回，递归自然终止。
    if (assertFontSizeIntent(snapshot.fontSize)) return
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
  // ── 科技主题区块 ───────────────────────────────────────────────────
  // order 10.5：紧随官方「外观」(10) 之后，与浅色/深色/跟随系统同处一个外观模式区块。
  // 此前是 order 20（混在最底部），后曾调为 14（被官方 transcript-view 切断）。
  // 设为 10.5 保证紧跟外观模式，随后是官方字号(11)与侧边栏字号(11.5)。
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'appearance-custom',
    order: 10.5,
    store,
    locale: SETTINGS_NS,
    inject: injected,
  }, TechThemeRow))

  // ── 侧边栏字号行 ───────────────────────────────────────────────────
  // order 11.5：紧随官方「字号大小」行(11)，与它构成连续的字号控制组。
  // 对话区字号归官方(11)，侧边栏字号归本插件(11.5)，随后才是对话显示(12)。
  const sidebarStore = createSidebarFontStore()
  let sidebarBound: BoundActions<typeof sidebarStore> | undefined
  let sidebarRevision = 0
  const syncSidebarFontRow = (): void => {
    sidebarBound?.sync(readSidebarFont(), ++sidebarRevision)
  }
  const sidebarInjected = (actions: BoundActions<typeof sidebarStore>): SidebarFontRowInjected => {
    sidebarBound = actions
    syncSidebarFontRow()
    return {
      setSidebarFont: (px) => {
        const next = normalizeSidebarFont(px)
        writeSidebarFont(next)
        applySidebarFont(next)
        syncSidebarFontRow()
      },
    }
  }
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'sidebar-font-custom',
    order: 11.5,
    store: sidebarStore,
    locale: SETTINGS_NS,
    inject: sidebarInjected,
  }, SidebarFontRow))

  ctx.effect(() => {
    const disposeSequoia = ctx.theme.register(SEQUOIA)
    const disposeSonoma = ctx.theme.register(SONOMA)
    const disposeVoid = ctx.theme.register(VOID)
    const disposeJade = ctx.theme.register(JADE)
    const disposeSolar = ctx.theme.register(SOLAR)
    const disposeParchment = ctx.theme.register(PARCHMENT)
    const removeKeyframes = injectButtonDrift()
    const removeSurfaceGlass = injectSurfaceGlass()
    return () => {
      disposeSequoia()
      disposeSonoma()
      disposeVoid()
      disposeJade()
      disposeSolar()
      disposeParchment()
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

  // 侧边栏字号：apply() 期间立即落变量，首帧就用用户设定值（无闪动）。
  try {
    applySidebarFont(readSidebarFont())
  } catch { /* localStorage unavailable */ }
}
