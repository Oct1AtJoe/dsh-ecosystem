export const SEQUOIA_TOKENS = Object.freeze({
    // 1. 桌面背景：纯色、无光晕、无色相。
    //    用户明确要求去掉光晕（此处曾短暂试行过「方案 B」的冷调光晕，已回退）。
    //    底仍是与壳顶栏逐字节同色的实色 rgb(245,245,247)，故：
    //      · 顶栏/主页面/侧边栏之间零色差，接缝不会回来；
    //      · 所有半透明浮层叠在它上面，alpha 合成后仍是同色 → 可放心把
    //        浮层填充压得很低来换取强透明感，而不必担心出现色块。
    //    ⚠️ 副作用（已知并接受）：本主题背后恒为纯色，故 AI 回复卡片这类
    //    「背后就是页面背景」的大面板，blur 模糊纯色仍是纯色，
    //    只能呈现顶部光学反光与轻微明度差，不会有深色主题那样的通透感。
    //    这是「不要光晕」的必然代价，非缺陷。
    '--dsw-alias-bg-app-image': 'none',
    // 2. 液态磨砂：强度全部集中在浮层。
    //    backdrop-filter 的观感 = 模糊半径 ÷ 填充不透明度。填充越淡、半径越大，
    //    玻璃越通透（能看到背后内容被模糊），这正是「太弱」的解法。
    '--dsw-alias-glass-blur': 'blur(64px) saturate(200%)',
    '--dsw-alias-surface-glass-blur': 'blur(56px) saturate(190%)',
    '--dsw-alias-bg-base': 'rgb(245, 245, 247)',
    // 侧边栏/右面板的漫反射光斑：关闭（不要光晕）
    '--dsw-alias-surface-glass-spot': 'transparent',
    // 3. 原生分层视窗面板
    //    面板填充统一提高到「实而仍透」区间：上一轮的 0.50~0.86 在真实使用中仍显发虚，
    //    文字与底衬对比不足。这里整体上调一档并保持层级递进（越靠上的浮层越实）。
    //    底衬是与顶栏同色的实色，提高不透明度只会更接近 bg-base，不会引入色差。
    '--dsw-alias-bg-layer-1': 'rgba(255, 255, 255, 0.88)',
    '--dsw-alias-bg-layer-2': 'rgba(245, 245, 247, 0.90)',
    '--dsw-alias-bg-layer-3': 'rgba(235, 235, 238, 0.94)',
    '--dsw-specific-sidebar-fill': 'rgba(245, 245, 247, 0.66)',
    '--dsw-alias-bg-module-platform': 'rgb(240, 240, 243)',
    '--dsw-alias-bg-multi-select': 'rgb(230, 230, 235)',
    '--dsw-alias-bg-overlay': 'rgba(255, 255, 255, 0.94)',
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
    '--dsw-alias-border-l2-darkmode-thin': 'rgba(0, 0, 0, 0.08)',
    '--dsw-alias-border-l2': 'rgba(0, 0, 0, 0.10)',
    '--dsw-alias-border-l3': 'rgba(0, 0, 0, 0.16)',
    '--dsw-alias-border-l4': 'rgba(0, 0, 0, 0.22)',
    // 6. Apple 官方系统蓝色主色调（微调提亮，轻盈通透，降低压迫感）
    '--dsw-alias-brand-primary': '#147ce5',
    '--dsw-alias-brand-primary-invert': '#ffffff',
    '--dsw-alias-brand-primary-new-colorprimary-new-color': '#0d6ecc',
    '--dsw-alias-brand-text': '#147ce5',
    // 7. 原生控制按钮与光晕
    '--dsw-alias-button-contrast-fill': '#1d1d1f',
    '--dsw-alias-button-elevated-fill': 'rgba(255, 255, 255, 0.90)',
    '--dsw-alias-button-floating-fill': 'rgba(255, 255, 255, 0.85)',
    '--dsw-alias-button-floating-hover': 'rgba(255, 255, 255, 0.95)',
    '--dsw-alias-button-ghost-active-border': 'rgba(20, 124, 229, 0.30)',
    '--dsw-alias-button-ghost-active-fill': 'rgba(20, 124, 229, 0.08)',
    '--dsw-alias-button-ghost-active-hover': 'rgba(20, 124, 229, 0.12)',
    '--dsw-alias-button-info-fill': 'rgb(0, 102, 212)',
    '--dsw-alias-button-info-hover': '#005bb5',
    '--dsw-alias-button-info-bg': 'linear-gradient(180deg, rgba(56, 152, 252, 0.90), rgba(20, 124, 229, 0.85))',
    '--dsw-alias-button-info-bg-hover': 'linear-gradient(180deg, rgba(77, 165, 255, 0.95), rgba(40, 139, 242, 0.90))',
    '--dsw-alias-button-radius': '14px',
    '--dsw-alias-button-radius-sm': '8px',
    '--dsw-alias-button-primary-bg': 'linear-gradient(180deg, #3898fc 0%, #147ce5 100%)',
    '--dsw-alias-button-primary-bg-hover': 'linear-gradient(180deg, #4da5ff 0%, #288bf2 100%)',
    '--dsw-alias-button-primary-bg-size': '100% 100%',
    '--dsw-alias-button-primary-motion': 'none',
    '--dsw-alias-button-glow': '0 2px 8px rgba(20, 124, 229, 0.20)',
    '--dsw-alias-button-glow-hover': '0 4px 12px rgba(20, 124, 229, 0.30)',
    '--dsw-alias-button-press-shadow': 'inset 0 1px 3px rgba(0, 0, 0, 0.20)',
    '--dsw-alias-button-press-shift': 'translate(0, 1px)',
    '--dsw-alias-button-outline-glow': '0 0 0 2px rgba(20, 124, 229, 0.20)',
    '--dsw-alias-button-send-shift-active': 'translateY(-1px) translate(0, 2px)',
    '--dsw-alias-button-primary-dimmed': 'rgba(20, 124, 229, 0.12)',
    '--dsw-alias-button-primary-fill': '#147ce5',
    '--dsw-alias-button-primary-hover': '#288bf2',
    '--dsw-alias-button-tool-bar-fill': 'rgba(0, 0, 0, 0.04)',
    '--dsw-alias-button-tool-bar-fill-invisible': 'transparent',
    '--dsw-alias-button-tool-bar-hover': 'rgba(0, 0, 0, 0.08)',
    // 8. 交互状态反馈
    '--dsw-alias-interactive-bg-active': 'rgba(0, 0, 0, 0.08)',
    '--dsw-alias-interactive-bg-hover': 'rgba(0, 0, 0, 0.04)',
    '--dsw-alias-interactive-bg-hover-accent': 'rgba(0, 113, 227, 0.08)',
    '--dsw-alias-interactive-bg-hover-danger': 'rgba(255, 59, 48, 0.08)',
    '--dsw-alias-interactive-bg-hover-solid': 'rgb(242, 242, 245)',
    // 9. 文本墨色
    '--dsw-alias-label-primary': '#1d1d1f',
    '--dsw-alias-label-secondary': '#6e6e73',
    '--dsw-alias-label-caption': '#86868b',
    '--dsw-alias-label-dimmed': '#a1a1a6',
    '--dsw-alias-label-primary-bluish': '#1d1d1f',
    '--dsw-alias-label-primary-dimmed': '#424245',
    '--dsw-alias-label-primary-foreground': '#ffffff',
    '--dsw-alias-label-primary-inverted': '#ffffff',
    '--dsw-alias-label-tertiary': '#86868b',
    // 10. Markdown 渲染
    '--dsw-alias-markdown-citation': 'rgba(0, 0, 0, 0.04)',
    '--dsw-alias-markdown-code-block-banner': 'rgb(240, 242, 245)',
    '--dsw-alias-markdown-code-block': '#f6f8fa',
    '--dsw-alias-markdown-code-segment-selected': 'rgba(0, 113, 227, 0.12)',
    '--dsw-alias-markdown-code-segment-unselected': 'rgba(0, 0, 0, 0.03)',
    '--dsw-alias-markdown-inline-code': 'rgba(0, 0, 0, 0.05)',
    '--dsw-alias-markdown-placeholder': 'rgba(0, 0, 0, 0.03)',
    '--dsw-alias-markdown-tag': 'rgba(0, 0, 0, 0.05)',
    // 11. 滚动条
    '--dsw-alias-scrollbar-bg-l1': 'rgba(0, 0, 0, 0.12)',
    '--dsw-alias-scrollbar-bg-l2': 'rgba(0, 0, 0, 0.18)',
    '--dsw-alias-scrollbar-hover-l1': 'rgba(0, 0, 0, 0.24)',
    '--dsw-alias-scrollbar-hover-l2': 'rgba(0, 0, 0, 0.32)',
    // 12. 状态与浮层
    '--dsw-alias-state-business-primary': '#0071e3',
    '--dsw-alias-state-business-tertiary': 'rgba(0, 113, 227, 0.10)',
    '--dsw-alias-toast-bg': 'rgba(30, 30, 35, 0.88)',
    '--dsw-alias-tooltip-bg': 'rgba(30, 30, 35, 0.90)',
    // 13. 对话气泡与输入坞
    //     「选择面板」类（selector / tip / bubble）上一轮被漏调，实测 0.80~0.85 仍偏透，
    //     本次统一提高到 0.90+，让其读起来是实体浮层而非半透明色块。
    '--dsw-specific-bubble-highlight': 'rgba(255, 255, 255, 0.97)',
    '--dsw-specific-bubble': 'rgba(255, 255, 255, 0.93)',
    '--dsw-specific-input-major': 'rgba(255, 255, 255, 0.93)',
    '--dsw-specific-login-input': 'rgba(255, 255, 255, 0.96)',
    '--dsw-specific-selector': 'rgba(245, 245, 247, 0.94)',
    '--dsw-specific-tip': 'rgba(245, 245, 247, 0.92)',
    // 14. 侧边栏与激活项 (对比度守门保证 >= 4.5:1)
    '--dsw-specific-sidebar-nav-item-active-accent': 'rgb(234, 238, 246)',
    '--dsw-specific-sidebar-nav-item-active': 'rgba(255, 255, 255, 0.93)',
    '--dsw-specific-sidebar-nav-item-hover': 'rgba(0, 0, 0, 0.04)',
    // 15. Xcode 浅色代码终端
    '--dsw-code-bg': '#f6f8fa',
    '--dsw-code-fg': '#24292f',
    '--dsw-code-border': '#d0d7de',
    '--dsw-code-comment': '#6e7781',
    '--dsw-code-keyword': '#cf222e',
    '--dsw-code-string': '#0a3069',
    '--dsw-code-function': '#8250df',
});
//# sourceMappingURL=sequoia.js.map