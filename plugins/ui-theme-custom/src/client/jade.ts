/**
 * The plugin-registered "jade" theme slot re-imagined as "银曜" (Argent / Silver Obsidian):
 * a refined, eye-friendly light theme engineered around silver, grey, and black — entirely
 * free of stark white glare and harsh blue elements.
 *
 * Palette Philosophy:
 * - Base: Matte metallic silver-grey (rgb(243, 244, 247)), gentle on eyes.
 * - Glass layers: Semi-translucent frosted platinum-white and cool silver with ambient radial sheen.
 * - Accents: Obsidian ink black (#181a22), eliminating all default DeepSeek blue (#2563eb).
 * - Typography: High-contrast obsidian primary text with slate & nickel secondary hierarchy.
 * - Buttons: Liquid frosted silver glass (银底黑字) with specular highlight and depth shadow.
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client'

/** Alias-token overrides for the 银曜 (Argent / Silver Obsidian) light theme. */
export const JADE_TOKENS: ThemeTokens = Object.freeze({
  // Ambient silver backdrop: gentle, non-dazzling silver-grey with soft pearl-white
  // and mist-silver radial light pools for a luxurious frosted glass backplate.
  '--dsw-alias-bg-app-image':
    'linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(243, 244, 247, 0) 24%),'
    + 'radial-gradient(560px 420px at 85% 15%, rgba(255, 255, 255, 0.70), transparent 55%),'
    + 'radial-gradient(540px 420px at 8% 45%, rgba(218, 224, 235, 0.45), transparent 52%)',
  '--dsw-alias-glass-blur': 'blur(20px) saturate(1.20)',
  '--dsw-alias-surface-glass-blur': 'blur(12px)',
  '--dsw-alias-bg-base': 'rgb(243, 244, 247)',
  // Soft ambient silver sheen behind sidebars and pane panels
  '--dsw-alias-surface-glass-spot': 'rgba(255, 255, 255, 0.65)',

  // Frosted silver-white acrylic surface tiers (high opacity so text behind does not bleed through)
  '--dsw-alias-bg-layer-1': 'rgba(255, 255, 255, 0.88)',
  '--dsw-alias-bg-layer-2': 'rgba(244, 246, 250, 0.95)',
  '--dsw-alias-bg-layer-3': 'rgba(236, 238, 244, 0.97)',
  '--dsw-alias-bg-module-platform': 'rgb(236, 238, 243)',
  '--dsw-alias-bg-multi-select': 'rgb(232, 235, 240)',
  '--dsw-alias-bg-overlay': 'rgba(255, 255, 255, 0.98)',
  '--dsw-alias-bg-skeleton': 'rgba(15, 23, 42, 0.05)',

  // Scrim & masks
  '--dsw-alias-bg-mask-1': 'rgba(15, 23, 42, 0.25)',
  '--dsw-alias-bg-mask-2': 'rgba(15, 23, 42, 0.12)',
  '--dsw-alias-bg-mask-3': 'rgba(15, 23, 42, 0.45)',
  '--dsw-alias-bg-mask-photo': 'rgba(15, 23, 42, 0.85)',
  '--dsw-alias-bg-mask-drop': 'rgba(255, 255, 255, 0.80)',

  // Metallic silver hairlines & borders (zero blue tint)
  '--dsw-alias-border-inverted': 'rgba(0, 0, 0, 0.05)',
  '--dsw-alias-border-inverted2': 'rgba(0, 0, 0, 0.07)',
  '--dsw-alias-border-l1': 'rgba(15, 23, 42, 0.05)',
  '--dsw-alias-border-l2-darkmode-thin': 'rgba(15, 23, 42, 0.08)',
  '--dsw-alias-border-l2': 'rgba(15, 23, 42, 0.08)',
  '--dsw-alias-border-l3': 'rgba(15, 23, 42, 0.12)',
  '--dsw-alias-border-l4': 'rgba(15, 23, 42, 0.18)',

  // Brand: Deep Obsidian Ink (#181a22) replacing all deepseek blue
  '--dsw-alias-brand-primary': 'rgb(24, 26, 34)',
  // Official light resolves this to bluish-1000 (dark ink), not white.
  '--dsw-alias-brand-primary-invert': 'rgb(15, 17, 21)',
  '--dsw-alias-brand-primary-new-colorprimary-new-color': 'rgb(40, 44, 54)',
  '--dsw-alias-brand-text': 'rgb(24, 26, 34)',

  // Frosted liquid silver glass buttons (银底黑字)
  '--dsw-alias-button-contrast-fill': 'rgb(24, 26, 34)',
  '--dsw-alias-button-elevated-fill': 'rgb(255, 255, 255)',
  '--dsw-alias-button-floating-fill': 'rgba(255, 255, 255, 0.85)',
  '--dsw-alias-button-floating-hover': 'rgb(245, 247, 250)',
  '--dsw-alias-button-ghost-active-border': 'rgb(209, 213, 219)',
  '--dsw-alias-button-ghost-active-fill': 'rgb(243, 244, 246)',
  '--dsw-alias-button-ghost-active-hover': 'rgb(229, 231, 235)',
  '--dsw-alias-button-info-fill': 'rgb(24, 26, 34)',
  '--dsw-alias-button-info-hover': 'rgb(45, 49, 60)',
  '--dsw-alias-button-info-bg': 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(230, 234, 242, 0.85))',
  '--dsw-alias-button-info-bg-hover': 'linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(240, 244, 250, 0.90))',
  '--dsw-alias-button-radius': '10px',
  '--dsw-alias-button-radius-sm': '8px',
  '--dsw-alias-button-primary-bg': 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 242, 247, 0.85) 45%, rgba(222, 226, 235, 0.80) 100%)',
  '--dsw-alias-button-primary-bg-hover': 'linear-gradient(145deg, rgba(255, 255, 255, 1) 0%, rgba(245, 247, 252, 0.90) 45%, rgba(230, 234, 242, 0.85) 100%)',
  '--dsw-alias-button-primary-bg-size': '200% 100%',
  '--dsw-alias-button-primary-motion': 'dsh-button-drift 5s linear infinite',
  '--dsw-alias-button-glow': 'inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(255, 255, 255, 0.55), 0 0 0 1px rgba(15, 23, 42, 0.09), 0 2px 6px rgba(15, 23, 42, 0.08), 0 6px 16px rgba(15, 23, 42, 0.05)',
  '--dsw-alias-button-glow-hover': 'inset 0 1px 1.5px rgba(255, 255, 255, 1), inset 0 0 0 1px rgba(255, 255, 255, 0.75), 0 0 0 1px rgba(15, 23, 42, 0.12), 0 3px 10px rgba(15, 23, 42, 0.12), 0 8px 20px rgba(15, 23, 42, 0.06)',
  '--dsw-alias-button-press-shadow': 'inset 0 1px 2px rgba(15, 23, 42, 0.12), inset 0 0 0 1px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.06)',
  '--dsw-alias-button-press-shift': 'translate(0, 1px)',
  '--dsw-alias-button-outline-glow': 'inset 0 1px 1px rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(15, 23, 42, 0.1)',
  '--dsw-alias-button-send-shift-active': 'translateY(-1px) translate(0, 2px)',
  '--dsw-alias-button-primary-dimmed': 'rgb(229, 231, 235)',
  '--dsw-alias-button-primary-fill': 'rgb(24, 26, 34)',
  '--dsw-alias-button-primary-hover': 'rgb(45, 49, 60)',
  '--dsw-alias-button-tool-bar-fill': 'rgba(255, 255, 255, 0.65)',
  '--dsw-alias-button-tool-bar-fill-invisible': 'rgba(255, 255, 255, 0.35)',
  '--dsw-alias-button-tool-bar-hover': 'rgba(255, 255, 255, 0.85)',

  // Interactive states: subtle slate-grey tints, no blue
  '--dsw-alias-interactive-bg-active': 'rgba(15, 23, 42, 0.08)',
  '--dsw-alias-interactive-bg-hover': 'rgba(15, 23, 42, 0.04)',
  '--dsw-alias-interactive-bg-hover-accent': 'rgba(15, 23, 42, 0.07)',
  '--dsw-alias-interactive-bg-hover-danger': 'rgba(236, 19, 19, 0.08)',
  '--dsw-alias-interactive-bg-hover-solid': 'rgb(240, 242, 246)',

  // Typography: Clean obsidian black ink hierarchy (#181a22 / #4b5563 / #9ca3af)
  '--dsw-alias-label-caption': 'rgb(148, 155, 168)',
  '--dsw-alias-label-dimmed': 'rgb(180, 186, 196)',
  '--dsw-alias-label-primary-bluish': 'rgb(24, 26, 34)',
  '--dsw-alias-label-primary-dimmed': 'rgb(40, 44, 54)',
  '--dsw-alias-label-primary-foreground': 'rgb(255, 255, 255)',
  '--dsw-alias-label-primary-inverted': 'rgb(255, 255, 255)',
  '--dsw-alias-label-primary': 'rgb(24, 26, 34)',
  '--dsw-alias-label-secondary': 'rgb(75, 85, 99)',
  '--dsw-alias-label-tertiary': 'rgb(130, 140, 155)',

  // Markdown & Code surfaces: clear silver-grey plates
  '--dsw-alias-markdown-citation': 'rgb(240, 242, 246)',
  '--dsw-alias-markdown-code-block-banner': 'rgb(238, 240, 245)',
  '--dsw-alias-markdown-code-block': 'rgb(243, 245, 249)',
  '--dsw-alias-markdown-code-segment-selected': 'rgb(255, 255, 255)',
  '--dsw-alias-markdown-code-segment-unselected': 'rgb(238, 240, 245)',
  '--dsw-alias-markdown-inline-code': 'rgb(238, 240, 245)',
  '--dsw-alias-markdown-placeholder': 'rgb(243, 244, 248)',
  '--dsw-alias-markdown-tag': 'rgb(238, 240, 245)',

  // Scrollbar: muted charcoal-silver
  '--dsw-alias-scrollbar-bg-l1': 'rgba(15, 23, 42, 0.12)',
  '--dsw-alias-scrollbar-bg-l2': 'rgba(15, 23, 42, 0.16)',
  '--dsw-alias-scrollbar-hover-l1': 'rgba(15, 23, 42, 0.22)',
  '--dsw-alias-scrollbar-hover-l2': 'rgba(15, 23, 42, 0.28)',

  // State Business: Pure obsidian black (replaces all blue links / tabs / accents)
  '--dsw-alias-state-business-primary': 'rgb(24, 26, 34)',
  '--dsw-alias-state-business-tertiary': 'rgb(235, 238, 244)',
  '--dsw-alias-toast-bg': 'rgb(30, 32, 40)',
  '--dsw-alias-tooltip-bg': 'rgb(24, 26, 34)',

  // Message bubbles & inputs: frosted silver-white glass, no blue tint!
  '--dsw-specific-bubble-highlight': 'rgba(238, 241, 247, 0.88)',
  '--dsw-specific-bubble': 'rgba(255, 255, 255, 0.90)',
  '--dsw-specific-input-major': 'rgba(255, 255, 255, 0.85)',
  '--dsw-specific-login-input': 'rgb(255, 255, 255)',
  '--dsw-specific-selector': 'rgba(240, 242, 247, 0.85)',

  // Sidebar: translucent silver mist acrylic
  '--dsw-specific-sidebar-fill': 'rgba(236, 238, 243, 0.65)',
  // Active accent background for badges & sidebar active items: subtle cool silver-grey tint
  '--dsw-specific-sidebar-nav-item-active-accent': 'rgb(228, 232, 239)',
  '--dsw-specific-sidebar-nav-item-active': 'rgba(255, 255, 255, 0.85)',
  '--dsw-specific-sidebar-nav-item-hover': 'rgba(15, 23, 42, 0.04)',
  '--dsw-specific-tip': 'rgba(240, 242, 247, 0.80)',
})
