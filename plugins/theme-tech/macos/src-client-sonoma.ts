/**
 * DSH 官方插件主题定义：macOS Sonoma 深空曜黑暗色版 (Dark Obsidian Pro)
 * 适配 @deepseek-ai/dsh-client-ui-theme 架构规范
 * 目标路径: C:\dsh-ecosystem\plugins\ui-theme-custom\src\client\sonoma.ts
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client'

export const SONOMA_TOKENS: ThemeTokens = Object.freeze({
  // 1. Sonoma 暗夜壁纸黑曜石微发光漫反射层
  '--dsw-alias-bg-app-image':
    'radial-gradient(ellipse 900px 520px at 15% 20%, rgba(130, 45, 220, 0.28) 0%, transparent 65%),'
    + 'radial-gradient(ellipse 850px 600px at 85% 85%, rgba(0, 145, 255, 0.25) 0%, transparent 65%),'
    + 'radial-gradient(circle at 50% 50%, rgba(240, 60, 120, 0.12) 0%, transparent 60%),'
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
  '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.10)',
  '--dsw-alias-border-l3': 'rgba(255, 255, 255, 0.18)',
  '--dsw-alias-border-l4': 'rgba(255, 255, 255, 0.26)',

  // 6. macOS 暗黑模式专属亮蓝色调
  '--dsw-alias-brand-primary': '#2997ff',
  '--dsw-alias-brand-primary-invert': '#ffffff',
  '--dsw-alias-brand-text': '#2997ff',

  // 7. 暗夜控制按钮与发光
  '--dsw-alias-button-primary-bg': 'linear-gradient(180deg, #3aa0ff 0%, #2997ff 100%)',
  '--dsw-alias-button-primary-bg-hover': 'linear-gradient(180deg, #4da9ff 0%, #3aa0ff 100%)',
  '--dsw-alias-button-radius': '14px',
  '--dsw-alias-button-radius-sm': '8px',
  '--dsw-alias-button-glow': '0 0 16px rgba(41, 151, 255, 0.45)',
  '--dsw-alias-button-glow-hover': '0 0 24px rgba(41, 151, 255, 0.65)',

  // 8. 柔和夜间文本色
  '--dsw-alias-label-primary': '#f5f5f7',
  '--dsw-alias-label-secondary': '#a1a1a6',
  '--dsw-alias-label-caption': '#86868b',
  '--dsw-alias-label-dimmed': '#6e6e73',

  // 9. Xcode 暗夜极客代码终端
  '--dsw-code-bg': '#14161b',
  '--dsw-code-fg': '#e6edf3',
  '--dsw-code-border': 'rgba(255, 255, 255, 0.12)',
  '--dsw-code-comment': '#7d8590',
  '--dsw-code-keyword': '#ff7b72',
  '--dsw-code-string': '#a5d6ff',
  '--dsw-code-function': '#d2a8ff',
})
