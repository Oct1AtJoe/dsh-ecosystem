/**
 * DSH 官方插件主题定义：macOS Sequoia 液态透光浅色版 (Liquid Frost Light)
 * 适配 @deepseek-ai/dsh-client-ui-theme 架构规范
 * 目标路径: C:\dsh-ecosystem\plugins\ui-theme-custom\src\client\sequoia.ts
 */
import type { ThemeTokens } from '@deepseek-ai/dsh-client-ui-theme/client'

export const SEQUOIA_TOKENS: ThemeTokens = Object.freeze({
  // 1. Sequoia 阳光加州红杉林壁纸流动漫反射层
  '--dsw-alias-bg-app-image':
    'radial-gradient(ellipse 900px 520px at 20% 15%, rgba(255, 138, 67, 0.35) 0%, transparent 65%),'
    + 'radial-gradient(ellipse 850px 600px at 85% 85%, rgba(96, 56, 255, 0.30) 0%, transparent 70%),'
    + 'radial-gradient(circle at 60% 40%, rgba(255, 75, 114, 0.25) 0%, transparent 60%),'
    + 'linear-gradient(135deg, rgba(43, 57, 144, 0.15) 0%, rgba(255, 107, 74, 0.12) 50%, rgba(253, 187, 45, 0.15) 100%)',

  // 2. 超采样高斯液态磨砂与透光亚克力
  '--dsw-alias-glass-blur': 'blur(48px) saturate(200%)',
  '--dsw-alias-surface-glass-blur': 'blur(32px) saturate(180%)',
  '--dsw-alias-bg-base': 'rgba(255, 255, 255, 0.72)',
  '--dsw-alias-surface-glass-spot': 'transparent',

  // 3. 原生分层视窗面板
  '--dsw-alias-bg-layer-1': 'rgba(255, 255, 255, 0.88)',
  '--dsw-alias-bg-layer-2': 'rgba(245, 245, 247, 0.92)',
  '--dsw-alias-bg-layer-3': 'rgba(235, 235, 238, 0.96)',
  '--dsw-specific-sidebar-fill': 'rgba(245, 245, 247, 0.45)',
  '--dsw-alias-bg-module-platform': 'rgb(240, 240, 243)',
  '--dsw-alias-bg-multi-select': 'rgb(230, 230, 235)',
  '--dsw-alias-bg-overlay': 'rgba(255, 255, 255, 0.95)',
  '--dsw-alias-bg-skeleton': 'rgba(0, 0, 0, 0.05)',

  // 4. 遮罩层
  '--dsw-alias-bg-mask-1': 'rgba(0, 0, 0, 0.15)',
  '--dsw-alias-bg-mask-2': 'rgba(0, 0, 0, 0.08)',
  '--dsw-alias-bg-mask-3': 'rgba(0, 0, 0, 0.35)',
  '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.75)',
  '--dsw-alias-bg-mask-drop': 'rgba(255, 255, 255, 0.85)',

  // 5. 1px 细发丝镜面高光倒角
  '--dsw-alias-border-inverted': 'rgba(255, 255, 255, 0.65)',
  '--dsw-alias-border-inverted2': 'rgba(255, 255, 255, 0.85)',
  '--dsw-alias-border-l1': 'rgba(0, 0, 0, 0.06)',
  '--dsw-alias-border-l2': 'rgba(0, 0, 0, 0.10)',
  '--dsw-alias-border-l3': 'rgba(0, 0, 0, 0.16)',
  '--dsw-alias-border-l4': 'rgba(0, 0, 0, 0.22)',

  // 6. Apple 官方系统经典蓝色主色调
  '--dsw-alias-brand-primary': '#0071e3',
  '--dsw-alias-brand-primary-invert': '#ffffff',
  '--dsw-alias-brand-text': '#0071e3',

  // 7. 原生控制按钮与光晕
  '--dsw-alias-button-primary-bg': 'linear-gradient(180deg, #0077ed 0%, #0071e3 100%)',
  '--dsw-alias-button-primary-bg-hover': 'linear-gradient(180deg, #0081fc 0%, #0077ed 100%)',
  '--dsw-alias-button-radius': '14px',
  '--dsw-alias-button-radius-sm': '8px',
  '--dsw-alias-button-glow': '0 2px 8px rgba(0, 113, 227, 0.30)',
  '--dsw-alias-button-glow-hover': '0 4px 14px rgba(0, 113, 227, 0.45)',

  // 8. 文本墨色
  '--dsw-alias-label-primary': '#1d1d1f',
  '--dsw-alias-label-secondary': '#6e6e73',
  '--dsw-alias-label-caption': '#86868b',
  '--dsw-alias-label-dimmed': '#a1a1a6',

  // 9. Xcode 代码终端配色
  '--dsw-code-bg': '#f6f8fa',
  '--dsw-code-fg': '#24292f',
  '--dsw-code-border': '#d0d7de',
  '--dsw-code-comment': '#6e7781',
  '--dsw-code-keyword': '#cf222e',
  '--dsw-code-string': '#0a3069',
  '--dsw-code-function': '#8250df',
})
