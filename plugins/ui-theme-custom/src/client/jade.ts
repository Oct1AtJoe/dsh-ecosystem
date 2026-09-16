/**
 * The plugin-registered "jade" theme slot re-imagined as "银曜" (Argent / Cool Titanium Stone):
 * a softened, low-luminance light theme engineered around calm slate-grey, titanium mist, and
 * deep obsidian ink — completely free of stark white glare and harsh blue elements.
 *
 * Palette Philosophy:
 * - Base: Muted matte titanium slate-grey (rgb(226, 228, 233)), significantly lower luminance (~0.73)
 *   than standard blinding light themes, comfortable for all-day focus.
 * - Glass layers: Translucent frosted platinum-grey and cool mist silver with soft diffuse sheen.
 * - Accents: Obsidian ink black (rgb(20, 22, 28)), eliminating all harsh digital blue (#2563eb).
 * - Typography: High-contrast obsidian primary text with slate & nickel secondary hierarchy.
 * - Buttons: Matte frosted silver glass with quiet specular sheen and depth shadow.
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client'

/** Alias-token overrides for the 银曜 (Argent / Cool Titanium Stone) light theme. */
export const JADE_TOKENS: ThemeTokens = Object.freeze({
  // Ambient titanium backdrop: gentle, non-glaring mist grey with soft platinum
  // sheen, eliminating pure-white glare.
  '--dsw-alias-bg-app-image':
    'linear-gradient(180deg, rgba(236, 239, 245, 0.80), rgba(226, 228, 233, 0) 24%),'
    + 'radial-gradient(560px 420px at 85% 15%, rgba(240, 243, 248, 0.65), transparent 55%),'
    + 'radial-gradient(540px 420px at 8% 45%, rgba(205, 211, 222, 0.45), transparent 52%)',
  '--dsw-alias-glass-blur': 'blur(20px) saturate(1.20)',
  '--dsw-alias-surface-glass-blur': 'blur(12px)',
  '--dsw-alias-bg-base': 'rgb(226, 228, 233)',
  // Soft ambient silver sheen behind sidebars and pane panels
  '--dsw-alias-surface-glass-spot': 'rgba(238, 241, 247, 0.65)',

  // Frosted silver-grey acrylic surface tiers (no stark pure white)
  '--dsw-alias-bg-layer-1': 'rgba(235, 237, 242, 0.88)',
  '--dsw-alias-bg-layer-2': 'rgba(228, 231, 237, 0.92)',
  '--dsw-alias-bg-layer-3': 'rgba(220, 223, 230, 0.96)',
  '--dsw-alias-bg-module-platform': 'rgb(224, 227, 234)',
  '--dsw-alias-bg-multi-select': 'rgb(218, 221, 228)',
  '--dsw-alias-bg-overlay': 'rgba(238, 241, 247, 0.98)',
  '--dsw-alias-bg-skeleton': 'rgba(15, 23, 42, 0.06)',

  // Scrim & masks
  '--dsw-alias-bg-mask-1': 'rgba(15, 23, 42, 0.22)',
  '--dsw-alias-bg-mask-2': 'rgba(15, 23, 42, 0.10)',
  '--dsw-alias-bg-mask-3': 'rgba(15, 23, 42, 0.40)',
  '--dsw-alias-bg-mask-photo': 'rgba(15, 23, 42, 0.85)',
  '--dsw-alias-bg-mask-drop': 'rgba(235, 238, 244, 0.82)',

  // Metallic slate hairlines & borders
  '--dsw-alias-border-inverted': 'rgba(0, 0, 0, 0.06)',
  '--dsw-alias-border-inverted2': 'rgba(0, 0, 0, 0.08)',
  '--dsw-alias-border-l1': 'rgba(15, 23, 42, 0.06)',
  '--dsw-alias-border-l2-darkmode-thin': 'rgba(15, 23, 42, 0.09)',
  '--dsw-alias-border-l2': 'rgba(15, 23, 42, 0.10)',
  '--dsw-alias-border-l3': 'rgba(15, 23, 42, 0.14)',
  '--dsw-alias-border-l4': 'rgba(15, 23, 42, 0.20)',

  // Brand: Deep Obsidian Ink replacing all deepseek blue
  '--dsw-alias-brand-primary': 'rgb(20, 22, 28)',
  '--dsw-alias-brand-primary-invert': 'rgb(240, 242, 247)',
  '--dsw-alias-brand-primary-new-colorprimary-new-color': 'rgb(36, 40, 50)',
  '--dsw-alias-brand-text': 'rgb(20, 22, 28)',

  // Frosted liquid silver glass buttons (银底黑字, 柔和不刺眼)
  '--dsw-alias-button-contrast-fill': 'rgb(20, 22, 28)',
  '--dsw-alias-button-elevated-fill': 'rgb(238, 240, 245)',
  '--dsw-alias-button-floating-fill': 'rgba(238, 240, 245, 0.88)',
  '--dsw-alias-button-floating-hover': 'rgb(232, 235, 241)',
  '--dsw-alias-button-ghost-active-border': 'rgb(196, 202, 212)',
  '--dsw-alias-button-ghost-active-fill': 'rgb(226, 229, 235)',
  '--dsw-alias-button-ghost-active-hover': 'rgb(220, 223, 230)',
  '--dsw-alias-button-info-fill': 'rgb(20, 22, 28)',
  '--dsw-alias-button-info-hover': 'rgb(42, 46, 56)',
  '--dsw-alias-button-info-bg': 'linear-gradient(135deg, rgba(240, 242, 247, 0.95), rgba(222, 226, 234, 0.85))',
  '--dsw-alias-button-info-bg-hover': 'linear-gradient(135deg, rgba(245, 247, 252, 1), rgba(228, 232, 240, 0.90))',
  '--dsw-alias-button-radius': '10px',
  '--dsw-alias-button-radius-sm': '8px',
  '--dsw-alias-button-primary-bg': 'linear-gradient(145deg, rgba(240, 242, 247, 0.95) 0%, rgba(230, 233, 240, 0.88) 45%, rgba(216, 220, 228, 0.82) 100%)',
  '--dsw-alias-button-primary-bg-hover': 'linear-gradient(145deg, rgba(245, 247, 252, 1) 0%, rgba(235, 238, 245, 0.92) 45%, rgba(222, 226, 234) 100%)',
  '--dsw-alias-button-primary-bg-size': '200% 100%',
  '--dsw-alias-button-primary-motion': 'dsh-button-drift 5s linear infinite',
  '--dsw-alias-button-glow': 'inset 0 1px 1px rgba(255, 255, 255, 0.80), inset 0 0 0 1px rgba(255, 255, 255, 0.40), 0 0 0 1px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.08), 0 6px 16px rgba(15, 23, 42, 0.05)',
  '--dsw-alias-button-glow-hover': 'inset 0 1px 1.5px rgba(255, 255, 255, 0.90), inset 0 0 0 1px rgba(255, 255, 255, 0.60), 0 0 0 1px rgba(15, 23, 42, 0.14), 0 3px 10px rgba(15, 23, 42, 0.12), 0 8px 20px rgba(15, 23, 42, 0.06)',
  '--dsw-alias-button-press-shadow': 'inset 0 1px 2px rgba(15, 23, 42, 0.14), inset 0 0 0 1px rgba(15, 23, 42, 0.09), 0 1px 3px rgba(15, 23, 42, 0.06)',
  '--dsw-alias-button-press-shift': 'translate(0, 1px)',
  '--dsw-alias-button-outline-glow': 'inset 0 1px 1px rgba(255, 255, 255, 0.70), 0 0 0 1px rgba(15, 23, 42, 0.11)',
  '--dsw-alias-button-send-shift-active': 'translateY(-1px) translate(0, 2px)',
  '--dsw-alias-button-primary-dimmed': 'rgb(218, 222, 230)',
  '--dsw-alias-button-primary-fill': 'rgb(20, 22, 28)',
  '--dsw-alias-button-primary-hover': 'rgb(42, 46, 56)',
  '--dsw-alias-button-tool-bar-fill': 'rgba(235, 238, 244, 0.70)',
  '--dsw-alias-button-tool-bar-fill-invisible': 'rgba(235, 238, 244, 0.35)',
  '--dsw-alias-button-tool-bar-hover': 'rgba(240, 242, 248, 0.88)',

  // Interactive states: subtle slate-grey tints, no blue
  '--dsw-alias-interactive-bg-active': 'rgba(15, 23, 42, 0.09)',
  '--dsw-alias-interactive-bg-hover': 'rgba(15, 23, 42, 0.05)',
  '--dsw-alias-interactive-bg-hover-accent': 'rgba(15, 23, 42, 0.08)',
  '--dsw-alias-interactive-bg-hover-danger': 'rgba(236, 19, 19, 0.08)',
  '--dsw-alias-interactive-bg-hover-solid': 'rgb(226, 229, 236)',

  // Typography: Clean obsidian black ink hierarchy
  '--dsw-alias-label-caption': 'rgb(136, 144, 156)',
  '--dsw-alias-label-dimmed': 'rgb(168, 175, 186)',
  '--dsw-alias-label-primary-bluish': 'rgb(20, 22, 28)',
  '--dsw-alias-label-primary-dimmed': 'rgb(36, 40, 50)',
  '--dsw-alias-label-primary-foreground': 'rgb(240, 242, 247)',
  '--dsw-alias-label-primary-inverted': 'rgb(240, 242, 247)',
  '--dsw-alias-label-primary': 'rgb(20, 22, 28)',
  '--dsw-alias-label-secondary': 'rgb(68, 76, 88)',
  '--dsw-alias-label-tertiary': 'rgb(112, 120, 134)',

  // Markdown & Code surfaces: clear silver-grey plates
  '--dsw-alias-markdown-citation': 'rgb(224, 227, 234)',
  '--dsw-alias-markdown-code-block-banner': 'rgb(222, 225, 232)',
  '--dsw-alias-markdown-code-block': 'rgb(226, 229, 236)',
  '--dsw-alias-markdown-code-segment-selected': 'rgb(238, 240, 245)',
  '--dsw-alias-markdown-code-segment-unselected': 'rgb(222, 225, 232)',
  '--dsw-alias-markdown-inline-code': 'rgb(222, 225, 232)',
  '--dsw-alias-markdown-placeholder': 'rgb(226, 229, 236)',
  '--dsw-alias-markdown-tag': 'rgb(222, 225, 232)',

  // Scrollbar: muted charcoal-silver
  '--dsw-alias-scrollbar-bg-l1': 'rgba(15, 23, 42, 0.13)',
  '--dsw-alias-scrollbar-bg-l2': 'rgba(15, 23, 42, 0.18)',
  '--dsw-alias-scrollbar-hover-l1': 'rgba(15, 23, 42, 0.24)',
  '--dsw-alias-scrollbar-hover-l2': 'rgba(15, 23, 42, 0.30)',

  // State Business: Pure obsidian black
  '--dsw-alias-state-business-primary': 'rgb(20, 22, 28)',
  '--dsw-alias-state-business-tertiary': 'rgb(222, 225, 232)',
  '--dsw-alias-toast-bg': 'rgb(26, 28, 36)',
  '--dsw-alias-tooltip-bg': 'rgb(20, 22, 28)',

  // Message bubbles & inputs: frosted slate-silver glass, zero harsh white!
  '--dsw-specific-bubble-highlight': 'rgba(228, 232, 238, 0.90)',
  '--dsw-specific-bubble': 'rgba(235, 238, 243, 0.92)',
  '--dsw-specific-input-major': 'rgba(235, 238, 243, 0.92)',
  '--dsw-specific-login-input': 'rgb(235, 238, 243)',
  '--dsw-specific-selector': 'rgba(228, 232, 238, 0.90)',

  // Sidebar: translucent silver mist acrylic
  '--dsw-specific-sidebar-fill': 'rgba(224, 227, 234, 0.70)',
  // Active accent background for badges & sidebar active items: solid calibrated slate
  '--dsw-specific-sidebar-nav-item-active-accent': 'rgb(212, 216, 224)',
  '--dsw-specific-sidebar-nav-item-active': 'rgba(238, 241, 246, 0.90)',
  '--dsw-specific-sidebar-nav-item-hover': 'rgba(15, 23, 42, 0.05)',
  '--dsw-specific-tip': 'rgba(226, 229, 236, 0.85)',
})
