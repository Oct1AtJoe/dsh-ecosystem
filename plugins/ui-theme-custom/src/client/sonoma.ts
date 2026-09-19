/**
 * DSH 官方插件主题定义：macOS Sonoma 深空曜黑暗色版 (Dark Obsidian Pro)
 * 适配 @deepseek-ai/dsh-client-ui-theme 架构规范
 * 目标路径: C:\dsh-ecosystem\plugins\ui-theme-custom\src\client\sonoma.ts
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client'

export const SONOMA_TOKENS: ThemeTokens = Object.freeze({
  // 1. Sonoma 暗夜壁纸黑曜石微发光漫反射层（沉静内敛星尘微晕，消除过浓紫蓝霓虹）
  '--dsw-alias-bg-app-image':
    'radial-gradient(ellipse 900px 520px at 15% 20%, rgba(130, 60, 220, 0.08) 0%, transparent 65%),'
    + 'radial-gradient(ellipse 850px 600px at 85% 85%, rgba(40, 150, 255, 0.07) 0%, transparent 65%),'
    + 'radial-gradient(circle at 50% 50%, rgba(240, 70, 130, 0.03) 0%, transparent 60%),'
    + 'linear-gradient(180deg, rgba(12, 13, 17, 0.95) 0%, rgba(16, 18, 24, 0.98) 100%)',

  // 2. 黑曜石暗色高折射毛玻璃
  '--dsw-alias-glass-blur': 'blur(50px) saturate(180%)',
  '--dsw-alias-surface-glass-blur': 'blur(34px) saturate(160%)',
  '--dsw-alias-bg-base': 'rgba(22, 24, 30, 0.74)',
  '--dsw-alias-surface-glass-spot': 'transparent',

  // 3. 暗夜极客分层视窗面板
  '--dsw-alias-bg-layer-1': 'rgba(28, 32, 40, 0.78)',
  '--dsw-alias-bg-layer-2': 'rgba(34, 38, 48, 0.85)',
  '--dsw-alias-bg-layer-3': 'rgba(42, 46, 58, 0.92)',
  '--dsw-specific-sidebar-fill': 'rgba(18, 20, 25, 0.55)',
  '--dsw-alias-bg-module-platform': 'rgb(26, 29, 36)',
  '--dsw-alias-bg-multi-select': 'rgb(36, 40, 52)',
  '--dsw-alias-bg-overlay': 'rgba(20, 22, 28, 0.95)',
  '--dsw-alias-bg-skeleton': 'rgba(255, 255, 255, 0.05)',

  // 4. 遮罩层
  '--dsw-alias-bg-mask-1': 'rgba(0, 0, 0, 0.45)',
  '--dsw-alias-bg-mask-2': 'rgba(0, 0, 0, 0.25)',
  '--dsw-alias-bg-mask-3': 'rgba(0, 0, 0, 0.65)',
  '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.85)',
  '--dsw-alias-bg-mask-drop': 'rgba(16, 18, 24, 0.90)',

  // 5. 暗夜 1px 发丝倒角高光反光
  '--dsw-alias-border-inverted': 'rgba(255, 255, 255, 0.14)',
  '--dsw-alias-border-inverted2': 'rgba(255, 255, 255, 0.20)',
  '--dsw-alias-border-l1': 'rgba(255, 255, 255, 0.06)',
  '--dsw-alias-border-l2-darkmode-thin': 'rgba(255, 255, 255, 0.08)',
  '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.10)',
  '--dsw-alias-border-l3': 'rgba(255, 255, 255, 0.18)',
  '--dsw-alias-border-l4': 'rgba(255, 255, 255, 0.26)',

  // 6. macOS 暗黑模式专属亮蓝色调
  '--dsw-alias-brand-primary': '#2997ff',
  '--dsw-alias-brand-primary-invert': '#ffffff',
  '--dsw-alias-brand-primary-new-colorprimary-new-color': '#1f80e6',
  '--dsw-alias-brand-text': '#2997ff',

  // 7. 暗夜控制按钮与发光
  '--dsw-alias-button-contrast-fill': '#2997ff',
  '--dsw-alias-button-elevated-fill': 'rgb(34, 38, 48)',
  '--dsw-alias-button-floating-fill': 'rgba(34, 38, 48, 0.85)',
  '--dsw-alias-button-floating-hover': 'rgb(42, 46, 58)',
  '--dsw-alias-button-ghost-active-border': 'rgba(41, 151, 255, 0.40)',
  '--dsw-alias-button-ghost-active-fill': 'rgba(41, 151, 255, 0.12)',
  '--dsw-alias-button-ghost-active-hover': 'rgba(41, 151, 255, 0.18)',
  '--dsw-alias-button-info-fill': 'rgb(41, 151, 255)',
  '--dsw-alias-button-info-hover': '#1f80e6',
  '--dsw-alias-button-info-bg': 'linear-gradient(180deg, rgba(58, 160, 255, 0.60), rgba(41, 151, 255, 0.38))',
  '--dsw-alias-button-info-bg-hover': 'linear-gradient(180deg, rgba(77, 169, 255, 0.72), rgba(58, 160, 255, 0.48))',
  '--dsw-alias-button-radius': '14px',
  '--dsw-alias-button-radius-sm': '8px',
  '--dsw-alias-button-primary-bg': 'linear-gradient(180deg, #3aa0ff 0%, #2997ff 100%)',
  '--dsw-alias-button-primary-bg-hover': 'linear-gradient(180deg, #4da9ff 0%, #3aa0ff 100%)',
  '--dsw-alias-button-primary-bg-size': '100% 100%',
  '--dsw-alias-button-primary-motion': 'none',
  '--dsw-alias-button-glow': '0 0 12px rgba(41, 151, 255, 0.32)',
  '--dsw-alias-button-glow-hover': '0 0 18px rgba(41, 151, 255, 0.48)',
  '--dsw-alias-button-press-shadow': 'inset 0 1px 3px rgba(0, 0, 0, 0.50)',
  '--dsw-alias-button-press-shift': 'translate(0, 1px)',
  '--dsw-alias-button-outline-glow': '0 0 0 2px rgba(41, 151, 255, 0.35)',
  '--dsw-alias-button-send-shift-active': 'translateY(-1px) translate(0, 2px)',
  '--dsw-alias-button-primary-dimmed': 'rgba(41, 151, 255, 0.18)',
  '--dsw-alias-button-primary-fill': '#2997ff',
  '--dsw-alias-button-primary-hover': '#3aa0ff',
  '--dsw-alias-button-tool-bar-fill': 'rgba(255, 255, 255, 0.06)',
  '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
  '--dsw-alias-button-tool-bar-hover': 'rgba(255, 255, 255, 0.12)',

  // 8. 交互状态
  '--dsw-alias-interactive-bg-active': 'rgba(255, 255, 255, 0.12)',
  '--dsw-alias-interactive-bg-hover': 'rgba(255, 255, 255, 0.07)',
  '--dsw-alias-interactive-bg-hover-accent': 'rgba(41, 151, 255, 0.16)',
  '--dsw-alias-interactive-bg-hover-danger': 'rgba(255, 69, 58, 0.15)',
  '--dsw-alias-interactive-bg-hover-solid': 'rgb(34, 38, 48)',

  // 9. 柔和夜间文本色
  '--dsw-alias-label-primary': '#f5f5f7',
  '--dsw-alias-label-secondary': '#a1a1a6',
  '--dsw-alias-label-caption': '#86868b',
  '--dsw-alias-label-dimmed': '#6e6e73',
  '--dsw-alias-label-primary-bluish': '#f5f5f7',
  '--dsw-alias-label-primary-dimmed': '#d1d1d6',
  '--dsw-alias-label-primary-foreground': '#ffffff',
  '--dsw-alias-label-primary-inverted': '#1c1c1e',
  '--dsw-alias-label-tertiary': '#86868b',

  // 10. Markdown 渲染
  '--dsw-alias-markdown-citation': 'rgb(24, 27, 34)',
  '--dsw-alias-markdown-code-block-banner': 'rgb(16, 18, 23)',
  '--dsw-alias-markdown-code-block': '#14161b',
  '--dsw-alias-markdown-code-segment-selected': 'rgb(36, 40, 52)',
  '--dsw-alias-markdown-code-segment-unselected': '#14161b',
  '--dsw-alias-markdown-inline-code': 'rgba(255, 255, 255, 0.08)',
  '--dsw-alias-markdown-placeholder': 'rgb(20, 22, 28)',
  '--dsw-alias-markdown-tag': 'rgb(28, 32, 40)',

  // 11. 滚动条
  '--dsw-alias-scrollbar-bg-l1': 'rgba(255, 255, 255, 0.10)',
  '--dsw-alias-scrollbar-bg-l2': 'rgba(255, 255, 255, 0.16)',
  '--dsw-alias-scrollbar-hover-l1': 'rgba(255, 255, 255, 0.22)',
  '--dsw-alias-scrollbar-hover-l2': 'rgba(255, 255, 255, 0.28)',

  // 12. 业务与提示框
  '--dsw-alias-state-business-primary': '#2997ff',
  '--dsw-alias-state-business-tertiary': 'rgba(41, 151, 255, 0.15)',
  '--dsw-alias-toast-bg': 'rgba(28, 32, 40, 0.90)',
  '--dsw-alias-tooltip-bg': 'rgba(34, 38, 48, 0.92)',

  // 13. 会话气泡与输入坞
  '--dsw-specific-bubble-highlight': 'rgba(34, 38, 48, 0.88)',
  '--dsw-specific-bubble': 'rgba(28, 32, 40, 0.82)',
  '--dsw-specific-input-major': 'rgba(22, 24, 30, 0.82)',
  '--dsw-specific-login-input': 'rgb(20, 22, 28)',
  '--dsw-specific-selector': 'rgba(28, 32, 40, 0.85)',
  '--dsw-specific-tip': 'rgba(24, 27, 34, 0.80)',

  // 14. 侧边栏与激活项 (对比度守门保证 >= 4.5:1)
  '--dsw-specific-sidebar-nav-item-active-accent': 'rgb(36, 40, 56)',
  '--dsw-specific-sidebar-nav-item-active': 'rgba(42, 46, 58, 0.85)',
  '--dsw-specific-sidebar-nav-item-hover': 'rgba(255, 255, 255, 0.05)',

  // 15. Xcode 暗夜极客代码终端
  '--dsw-code-bg': '#14161b',
  '--dsw-code-fg': '#e6edf3',
  '--dsw-code-border': 'rgba(255, 255, 255, 0.12)',
  '--dsw-code-comment': '#7d8590',
  '--dsw-code-keyword': '#ff7b72',
  '--dsw-code-string': '#a5d6ff',
  '--dsw-code-function': '#d2a8ff',
})
