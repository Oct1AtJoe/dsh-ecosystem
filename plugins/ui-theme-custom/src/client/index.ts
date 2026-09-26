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
/* ── 无边框融合（方案 C）：顶部同色屏障带 ──────────────────────────────
   壳顶栏与内容区是两个物理不重叠的 WebView，要做到「看起来无边框」，
   必须让内容区**最顶端的色值**与壳顶栏逐字节一致。

   做法：在背景层最前面插一条与 bg-base 同色的实心带，高度 = 壳顶栏高度，
   再向下渐隐过渡到主题原有的极光渐变。由于它位于最上层，故顶部 44px
   内任何主题都呈现纯净的 bg-base 色 —— 而 bg-base 已与壳顶栏同色。

   ⚠️ --dsh-fusion-top 必须等于 desktop/src-tauri/src/lib.rs 的 TITLEBAR_HEIGHT，
   改一处必须同步另一处（sequoia-neutral-check.mjs 有门禁锁定）。 */
body[data-ds-custom-theme]{
  --dsh-fusion-top:44px;

  /* ── 毛玻璃参数（Frosted Glass）────────────────────────────────────────
     ⚠️ 材质定义：本插件做的是「毛玻璃」，不是「磨砂/砂纸」。

        · 毛玻璃 = 表面光滑无颗粒，背后内容被 blur 化开，隐约可见明暗但读不出字。
        · 磨砂   = 表面有微观颗粒（需叠 SVG 分形噪声纹理层）。

     历史教训：曾误做成磨砂，叠了一层 SVG fractalNoise 去色颗粒。
     该噪声 rect 带满 alpha，叠加会**同时压暗整体明度** —— 强度 0.20/0.12/0.05/0.03
     一路调下来始终是「糊了一层灰雾」的脏感，方向本身就是错的，调参无解。已全部移除。

     ⚠️ 两条独立的轴，切勿搞混（这是最容易做反的地方）：
        · 「透多少」由填充 alpha 控制 —— 调高会看不到背后（变白板）。
        · 「糊多狠」由 blur 半径控制 —— 遮住背后文字只能靠它，不能靠加填充。

     用户确认参数：填充 .38 + blur(92px) saturate(180%)。

     🚨 适用范围收窄（用户实测反馈）：
     玻璃材质**只服务 液态 sequoia 与 曜黑 sonoma 两个主题**。
     用户原话：「只有给液态以及曜黑这两个主题加好看，其他 4 个主题加了都不好看」。
     故冥夜 void / 银曜 jade / 灼日 solar / 缃素 parchment 一律**不加玻璃**，
     完全保持官方原始外观（含输入区压底渐变、面板填充、投影、描边等）。

     实现方式：给每条材质规则加主题门控前缀（body[data-ds-custom-theme="sequoia"] /
     "sonoma"），而不是给 4 个主题逐个写「归零」例外 ——
     后者会把 background 改成 transparent，连官方原有底衬一起抹掉，属于破坏而非还原。 */
  --dsh-glass-blur:blur(92px) saturate(180%);

  /* 两个玻璃主题各自的取值（sequoia 浅 / sonoma 深，各自独立、不共用） */
  --dsh-glass-fill:rgba(255,255,255,0.38);
  --dsh-glass-sheen:linear-gradient(180deg,
      rgba(255,255,255,0.30) 0%,
      rgba(255,255,255,0.05) 48%,
      rgba(255,255,255,0)    78%);
  --dsh-glass-edge:rgba(255,255,255,0.96);
  --dsh-glass-rim:rgba(255,255,255,0.58);
  --dsh-glass-bottom:rgba(255,255,255,0.40);
  /* 弹窗单独一档：内容面板可读性优先，填充比输入坞实得多 */
  --dsh-glass-dialog-fill:rgba(255,255,255,0.78);
  /* 浮层（菜单/提示）也单列一档：承载可读文字，不能沿用输入坞的 .38 */
  --dsh-glass-popover-fill:rgba(255,255,255,0.72);
}
/* 曜黑（深色）：填充与高光必须取深色系值 —— 照抄浅色的 rgba(255,255,255,.38)
   会让面板发灰发白，与暗色背景割裂。 */
body[data-ds-custom-theme="sonoma"]{
  --dsh-glass-fill:rgba(26,30,38,0.46);
  --dsh-glass-sheen:linear-gradient(180deg,
      rgba(255,255,255,0.10) 0%,
      rgba(255,255,255,0.02) 48%,
      rgba(255,255,255,0)    78%);
  --dsh-glass-edge:rgba(255,255,255,0.16);
  --dsh-glass-rim:rgba(255,255,255,0.10);
  --dsh-glass-bottom:rgba(255,255,255,0.06);
  --dsh-glass-dialog-fill:rgba(26,30,38,0.78);
  --dsh-glass-popover-fill:rgba(26,30,38,0.82);
}
/* ── 无边框融合屏障带（方案 C）──────────────────────────────────────────
   作用：内容区最顶端与壳顶栏保持逐字节同色，实现「看不出边框」。

   🚨 实测修复（用户反馈「深色主题下顶部栏与页面顶部这条缝看起来不太友好」）：
   原写法是**硬切边** ——
     linear-gradient(180deg, bg-base 0, bg-base 44px, transparent 44px)
   即「44px 内死纯色，44px 处瞬间变透明」。逐像素实测色阶：
     y=42  RGB(22,24,30)  L=24.1
     y=44  RGB(12,13,18)  L=13.3   ← ΔL = -10.8，一条突兀的暗色断崖
   深色主题下尤其刺眼：顶部是一块「死板纯色」，下方突然切到彩色光斑。

   现改为**渐隐带**：44px 内保持纯净同色（融合前提不变），
   之后用 100px 左右平滑过渡到主题原有背景。实测同一位置：
     y=44  ΔL = -1.0（无可见台阶）

   ⚠️ 两条硬约束：
     1. --dsh-fusion-top 必须等于 desktop/src-tauri/src/lib.rs 的 TITLEBAR_HEIGHT（44px）。
        三处需同步：shell.html 的 --dsh-titlebar-height、lib.rs 的 TITLEBAR_HEIGHT、此处。
     2. 屏障带必须位于 background **最上层**（CSS 第一项），否则彩色光斑会盖住它，
        顶部就不再与顶栏同色，融合失效。

   渐隐长度用固定 100px（= 44 + 100 = 144px 处完全过渡完），
   比 44px 的 2 倍略长，足够柔和又不会把光晕糊掉。 */
[class$="centerCol"] > :first-child > [class$="_root"],
[class$="centerCol"] [data-slot="main.conversation"] > [class*="_root"]{
  background:
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 55%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      transparent calc(var(--dsh-fusion-top, 44px) + 100px)),
    var(--dsw-alias-bg-app-image),
    var(--dsw-alias-bg-base) !important;
}
/* 注意：侧边栏顶部**不能**在此加同色屏障带 —— 下方 body[data-ds-dark-theme] /
   body:not([data-ds-dark-theme]) / body[data-ds-custom-theme="*"] 三条规则对同一
   选择器的特异性更高，会直接覆盖这里。侧边栏顶部的融合改由其各自的主题规则处理
   （见 sequoia 等主题块内的 sidebarCol root 定义）。 */

/* ══════════════════════════════════════════════════════════════════════════
   毛玻璃材质（Glassmorphism）· **仅 液态 sequoia 与 曜黑 sonoma**
   ══════════════════════════════════════════════════════════════════════════

   🚨 适用范围（用户实测确认）：
   用户反馈「只有给液态以及曜黑这两个主题加好看，其他 4 个主题加了都不好看」。
   故冥夜 void / 银曜 jade / 灼日 solar / 缃素 parchment **完全不加玻璃**，
   保持官方原始外观。

   实现方式：所有材质规则统一加主题门控（body[data-ds-custom-theme="sequoia"] /
   "sonoma" 前缀）。**不要**改用「把参数归零」的写法 —— 那会把 background 改成
   transparent，连官方原有底衬一起抹掉，属于破坏而非还原。

   分级原则：backdrop-filter 的收益取决于「背后是什么」。
     · A 组：背后**有内容滚过** → blur 有真实收益，上完整毛玻璃。
     · B 组：背后是**均匀纯色** → blur(纯色)=纯色，零收益，只做填充。
     · C 组：Portal 到 body 的瞬态浮层。

   ⚠️ 历史失效记录（务必先读）：0.1.5 版改了 CSS Modules 类名，旧规则
   [class*="InputBar_card"] / ChatView_column / AssistantMarkdown_root /
   MessageItem_bubble / codeBlock / _pane / _float / lensBar 实测命中数**全为 0**，
   一条都没生效 —— 这正是「各主题通用缺少玻璃质感」的直接原因。已在下方改写为真实类名。 */

/* ① 结构层（关键前提）：去掉输入区自刷的实色压底。
   实测 composerSeat 带 linear-gradient(transparent, rgb(245,245,247) 36px)，
   叠加纯色 bg-base 后，输入框背后恒为纯色 → blur(纯色)=纯色，
   毛玻璃**数学上不可能生效**。不去掉这层，下方 A1/A2 全部白做。
   ⚠️ 仅对两个玻璃主题生效 —— 其余主题保留官方压底，避免内容与输入框打架。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"]{
  background-image:none !important;
}

/* ── A 组：完整毛玻璃（背后有内容滚动经过）────────────────────────────── */
/* A1 输入坞 · A2 任务进度卡 · A3 撤回气泡 · A5 代码块标题条。

   ⚠️ 成本卡（cm-footer-stack）：
   原设于 A 组，但实测该组件在 simple 模式下为 overflow: auto 滚动容器，
   内部每个用量卡均包裹了官方 primitives Tooltip（Fragment 原地渲染 position:fixed 浮层）。
   W3C 规范中 backdrop-filter 会将自身提升为固定定位子树的 Containing Block，
   直接导致：① Tooltip 视口坐标被误作局部偏移甩出视口外；② 巨大浮层撑爆容器产生横竖双向滚动条。
   且成本卡在侧边栏纯底色上，blur 零漫反射收益。
   故移出 A 组、显式禁用 blur（backdrop-filter: none !important），
   独立保留其玻璃高光与内阴影，彻底根治 Containing Block 劫持。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sequoia"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sequoia"] [class*="dsh-recall-bubble"],
body[data-ds-custom-theme="sequoia"] [class*="_bannerWrap"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sonoma"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sonoma"] [class*="dsh-recall-bubble"],
body[data-ds-custom-theme="sonoma"] [class*="_bannerWrap"]{
  background:var(--dsh-glass-sheen),var(--dsh-glass-fill) !important;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom) !important;
}
/* 成本卡（独立规则：保留高光与边缘，显式禁用 blur 以防劫持固定定位 Tooltip 浮层） */
body[data-ds-custom-theme="sequoia"] [class*="cm-footer-stack"],
body[data-ds-custom-theme="sonoma"] [class*="cm-footer-stack"]{
  background:var(--dsh-glass-sheen),var(--dsh-glass-fill) !important;
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom) !important;
}
/* 输入坞是**浮在对话流之上**的 sticky 浮层，需要外投影与内容分离；
   成本卡在侧栏内、与背景同为侧栏填充，去掉外投影更干净。
   故只给输入坞/任务卡/标题条补回官方 elevation 的**投影部分**（不含 0.5px 外环）。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sequoia"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sequoia"] [class*="_bannerWrap"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sonoma"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sonoma"] [class*="_bannerWrap"]{
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom),
    0 3px 8px rgba(0,0,0,0.10),
    0 0 20px rgba(0,0,0,0.05) !important;
}

/* ── B 组：仅填充（背后纯色，**不加 blur，也不加任何 box-shadow**）──────
   B1 侧栏内容层 · B2 右栏列 · B3 右侧面板 · B4 侧栏会话行 · B5 新会话按钮
   B6 成本芯片 · B7 网关开关 · B8~B11 设置弹窗内的步进器/下拉/色块/导航项

   🚨 三处实测踩坑（用户三次反馈「每个单独 DOM 都有外边框/边线」）：
     · 第一轮给了闭合 rim  inset 0 0 0 1px  → 每项被框出一圈完整矩形白线；
     · 第二轮改为只给顶部高光 inset 0 1px 0 → **仍然出线**：会话行高仅 36px，
       每行顶边一条近乎纯白的 1px 线（浅色主题下 rgba(255,255,255,.96)），
       多行堆叠起来就是「每个小 DOM 之间的横向边线」；
     · 第三轮：成本卡仍有包边 —— 官方自带 border + elevation 外环，
       叠加我给的 inset rim，三重描边。

   结论：**列表项/小控件一律不施加任何 box-shadow。**
   本组只做「填充透明度」，其余全部交还官方原始样式。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > * > [class*="root"],
body[data-ds-custom-theme="sequoia"] [class*="rightbarCol"] > * > [class*="root"],
body[data-ds-custom-theme="sequoia"] [data-sidebar-right-panel],
body[data-ds-custom-theme="sequoia"] [class*="dsh-ff__session-row"],
body[data-ds-custom-theme="sequoia"] [class*="_newSession"],
body[data-ds-custom-theme="sequoia"] [class*="cm-chip"],
body[data-ds-custom-theme="sequoia"] [class*="cm-gw-switcher"],
body[data-ds-custom-theme="sonoma"] [class*="sidebarCol"] > * > [class*="root"],
body[data-ds-custom-theme="sonoma"] [class*="rightbarCol"] > * > [class*="root"],
body[data-ds-custom-theme="sonoma"] [data-sidebar-right-panel],
body[data-ds-custom-theme="sonoma"] [class*="dsh-ff__session-row"],
body[data-ds-custom-theme="sonoma"] [class*="_newSession"],
body[data-ds-custom-theme="sonoma"] [class*="cm-chip"],
body[data-ds-custom-theme="sonoma"] [class*="cm-gw-switcher"]{
  box-shadow:none !important;
}

/* ── C 组：瞬态浮层 / Portal（仅两个玻璃主题）────────────────────────────
   C1 设置弹窗 · C2 菜单 · C3 Tooltip。
   C4 Toast **刻意排除** —— 官方是深色实底强调提示
   （--dsw-alias-button-contrast-fill），改半透明会削弱提示力度（用户已确认保持实底）。

   🚨 本轮修复（用户反馈「权限展开的选择面板透明度太高、没有背景高斯模糊」）：
   实测该菜单的 computed backdrop-filter **确实是 blur(92px)**，却看不出模糊。根因有二：

   ① **嵌套 backdrop root 导致 blur 失效**（主因）。
      实测祖先链：[role="menu"] → _root_1nxmc_1 → QwfZkG_modes → QwfZkG_tools
      → QwfZkG_row → **QwfZkG_card（输入坞卡片，自带 backdrop-filter）**。
      即该菜单是**输入坞卡片的 DOM 后代**。CSS 规范：带 backdrop-filter 的元素会建立
      新的 backdrop root，其后代的 backdrop-filter **只能模糊该 root 内部已合成的内容**。
      而卡片内部是均匀填充 → 菜单等于「模糊了一个寂寞」。
      修法沿用本项目对 sidebarCol 已确立的做法：**把卡片的 blur 移到 ::before 伪元素**
      （伪元素不是菜单的祖先，不会为后代建立 backdrop root）。

   ② **填充沿用了输入坞的 .38 档，太透**。
      菜单是**承载可读文字**的浮层（选项 + 勾选态），不是大面积背景板。
      与输入坞共用 .38 会让背后文字直接穿透、选项互相干扰。
      故为浮层单列一档 --dsh-glass-popover-fill（浅 .72 / 深 .82），
      与 --dsh-glass-dialog-fill 同理：**内容可读性优先于通透度**。 */
body[data-ds-custom-theme="sequoia"] [role="dialog"],
body[data-ds-custom-theme="sequoia"] [role="menu"],
body[data-ds-custom-theme="sequoia"] [role="tooltip"],
body[data-ds-custom-theme="sonoma"] [role="dialog"],
body[data-ds-custom-theme="sonoma"] [role="menu"],
body[data-ds-custom-theme="sonoma"] [role="tooltip"]{
  background:var(--dsh-glass-sheen),var(--dsh-glass-popover-fill) !important;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    0 24px 60px rgba(0,0,0,0.18) !important;
}

/* ① 解除嵌套 backdrop root：输入坞卡片的 blur 移到 ::before 伪元素。
   ⚠️ 伪元素 z-index:-1 需要卡片自身建立 stacking context（position+z-index:0），
   否则会掉到卡片背景之下而看不见。
   ⚠️ 卡片自身**严禁**再带 backdrop-filter —— 那正是菜单模糊失效的根因。

   ── 推广范围已全页实测（不是推测）────────────────────────────────
   判据：**自身带 backdrop-filter 且内部含绝对/固定定位浮层**的容器才需此修法。
   实测结果（sequoia 会话页全量扫描）：
     · QwfZkG_card（输入坞卡片）  内部有权限菜单/模型下拉  → **需修**（即本节）
     · kdtA_a_flowItem（AI 回复卡）内部浮层数 = 0          → 无需修
       （其 aria-expanded 是**内联折叠行**，展开的是文档流内容，不脱离文档流、
         不依赖祖先 blur 透视背景；实测 absoluteLayersInsideCard = []）
     · cm-footer-stack 内部含 Tooltip fixed 浮层且自身为滚动容器 → 显式禁用 blur（见前节）
     · dsh-recall-bubble / _bannerWrap  内部浮层数 = 0 → 无需修
     · sidebarCol / rightbarCol   blur 本就在 ::before 上，主元素无 blur → 本就安全
       （设置弹窗 Portal 虽挂其子树下，但祖先无 backdrop root，故 blur 正常）

   全页复扫「自身带 blur + 内含定位浮层」的容器数 = **0**，即风险已清零。
   ⚠️ 若日后 A 组新增成员且其内部会弹出浮层，必须套用本节同一修法。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"]{
  position:relative;z-index:0;
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
}
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"]::before,
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"]::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  border-radius:inherit;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
}
/* 卡片内含浮层时抬层，确保菜单浮在卡片内容之上（用 :has 自适应，无需改 JS） */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"]:has([role="menu"]),
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"]:has([role="menu"]){
  z-index:9500 !important;
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
   which would break the settings dialog (portal renders inside sidebar).

   ⚠️ 顶部融合屏障（**六主题通用，不分深浅**）：
   中央内容区一直带「同色屏障 + 渐隐」，而侧栏此前没有 —— 导致侧栏顶部直接
   暴露半透明填充与光斑，与顶栏形成亮度断层。逐像素实测（修复前）：
     · void  左=33.7  中=13.3  → 差 20.3 阶
     · solar 左=36.8  中=15.4  → 差 21.3 阶
     · parchment 左=219.6 中=224.4 → 差 4.8 阶
   用户反馈「左右侧边栏跟顶部栏反差，其他 4 个主题也要一同修复」。
   故把屏障提到**通用规则**层：无论深浅主题，顶部 44px 一律等于 bg-base，
   再向下渐隐到主题原有材质。补齐后三处顶部亮度一致（差 < 1.5 阶）。
   ⚠️ 屏障必须在 background **最上层**（CSS 第一项），否则会被光斑盖住。 */
body[data-ds-dark-theme] [class*="sidebarCol"] > * > [class*="root"]{
  background:
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 55%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      transparent calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
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
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 70%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 30%, transparent) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
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
/* 右栏面板同样补「顶部同色融合屏障」（六主题通用，与左侧栏一致）。
   缺失时其顶部会直接暴露半透明填充与光斑，与顶栏形成亮度断层。 */
body[data-ds-dark-theme] [class*="rightbarCol"] [data-sidebar-right-panel]{
  background:
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 55%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      transparent calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 15%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 30%, transparent) 0%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 10%, transparent) 40%,
      transparent 60%),
    color-mix(in srgb, var(--dsw-specific-sidebar-fill) 55%, transparent) !important;
  /* 去掉顶部 inset 亮线（会在顶栏正下方形成横贯亮线） */
  box-shadow: inset -1px 0 0 rgba(255,255,255,0.05), inset 1px 0 0 rgba(255,255,255,0.04) !important;
}
body:not([data-ds-dark-theme]) [class*="rightbarCol"] [data-sidebar-right-panel]{
  background:
    linear-gradient(180deg,
      var(--dsw-alias-bg-base) 0,
      var(--dsw-alias-bg-base) var(--dsh-fusion-top, 44px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 70%, transparent) calc(var(--dsh-fusion-top, 44px) + 52px),
      color-mix(in srgb, var(--dsw-alias-bg-base) 30%, transparent) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 30%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, transparent) 20%, transparent) 0%,
      transparent 60%),
    var(--dsw-specific-sidebar-fill) !important;
  box-shadow:
    inset -1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.06)),
    inset 1px 0 0 var(--dsw-alias-border-l1, rgba(15, 23, 42, 0.04)) !important;
}
/* 右栏 fullscreen 态的面板 blur 由上方 C 组统一处理，这里不再重复。 */

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

/* Dialogs/modals：毛玻璃面板（**仅 液态 sequoia 与 曜黑 sonoma**）。
   ⚠️ 弹窗是**大面积内容面板**（表单、长列表、设置项），可读性优先于通透度，
   故填充比输入坞更实 —— 单独用 --dsh-glass-dialog-fill，不共用 .38 的输入坞填充。
   配方（填充 + 虚化 + 光学边缘）与 C 组一致，此处只覆盖填充与投影。
   ⚠️ 主题门控写死为 sequoia / sonoma 两个 id：
   不得改到内置 light/dark，也不得扩散到其余四个自定义主题（用户已确认）。 */
body[data-ds-custom-theme="sonoma"] [role="dialog"]{
  background:
    linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 30%),
    var(--dsh-glass-dialog-fill) !important;
  backdrop-filter:var(--dsh-glass-blur) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur) !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    0 6px 16px rgba(0,0,0,0.40),
    0 24px 60px rgba(0,0,0,0.50) !important;
}
body[data-ds-custom-theme="sequoia"] [role="dialog"]{
  background:
    linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 34%),
    var(--dsh-glass-dialog-fill) !important;
  backdrop-filter:var(--dsh-glass-blur) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur) !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
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

/* 输入坞的聚焦态反馈（液态/曜黑各一套主题色）。
   ⚠️ 旧规则用 [class*="InputBar_card"]，0.1.5 改名后实测命中数为 0，一直没生效。
   现改用结构稳定的 [class*="composerSeat"] [class$="_card"]（与 A1 组同源）。
   填充、虚化、颗粒均已由 A 组统一配方与 --dsh-glass-* 令牌接管，
   此处只保留「聚焦环 + 圆角」这两项纯交互反馈，避免与 A 组 !important 打架。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"] {
  border-radius: 20px !important;
  transition: box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [class$="_card"]:focus-within {
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom),
    0 0 0 3px rgba(0, 113, 227, 0.18),
    var(--dsw-elevation-prominent, none) !important;
}

body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"] {
  border-radius: 20px !important;
  transition: box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [class$="_card"]:focus-within {
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom),
    0 0 0 3px rgba(41, 151, 255, 0.22),
    var(--dsw-elevation-prominent, none) !important;
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

/* 用户气泡：Apple 官方高光胶囊。
   ⚠️ 选择器已修正：旧写法 [class*="MessageItem_bubble"] 依赖「源码目录名」，
   而 CSS Modules 产出的是 <hash>_bubble —— 源码名从不出现在 DOM，实测命中为 0。
   改用后缀式 [class$="_bubble"]（不含哈希，跨版本稳定），并以 userStack 限定为用户气泡，
   避免误伤 tooltip 的 .bubble。 */
body[data-ds-custom-theme="sequoia"] [class*="userStack"] > [class$="_bubble"] {
  border-radius: 18px 18px 4px 18px !important;
  background: #0071e3 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(0, 113, 227, 0.28) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="userStack"] > [class$="_bubble"] * {
  color: #ffffff !important;
}

body[data-ds-custom-theme="sonoma"] [class*="userStack"] > [class$="_bubble"] {
  border-radius: 18px 18px 4px 18px !important;
  background: #2997ff !important;
  color: #ffffff !important;
  box-shadow: 0 4px 18px rgba(41, 151, 255, 0.40) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="userStack"] > [class$="_bubble"] * {
  color: #ffffff !important;
}

/* AI 助手回复卡片（**仅液态 sequoia 与曜黑 sonoma** 有此卡面化处理，
   其余四主题保持官方原生段落样式 —— 不做范围外改版）。
   ⚠️ 旧写法 ChatView_column / AssistantMarkdown_root 均为源码目录名，实测命中为 0。
   改用稳定的 slot 锚点 + 后缀式 markdown 类（hash-independent）。

   ⚠️ 该卡片的玻璃质感依赖主题的 --dsw-alias-bg-app-image 提供底衬变化：
     · sonoma：紫/蓝/粉三色光斑底 → 透出后玻璃质感明显 ✅
     · sequoia：已按「方案 B」恢复极淡冷调光晕，特征点落在内容列内 → 可透出 ✅
   若某主题把 bg-app-image 设为 none，则卡片背后恒为纯色，模糊纯色仍是纯色，
   此时只能呈现「顶部光学反光 + 轻微明度差」，不会有明显通透感（物理限制）。
   ⚠️ 只给顶部高光与底部回光两道单向光，**不给闭合 rim**（避免包边）。 */
body[data-ds-custom-theme="sequoia"] [data-slot="main.conversation"] [class*="flowItem"]:has([class*="_markdown_"]),
body[data-ds-custom-theme="sonoma"] [data-slot="main.conversation"] [class*="flowItem"]:has([class*="_markdown_"]) {
  background:var(--dsh-glass-sheen),var(--dsh-glass-fill) !important;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
  border-radius: 18px !important;
  padding: 16px 20px !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom),
    0 10px 30px rgba(0, 0, 0, 0.07) !important;
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
/* 侧边栏内容层：半透明填充 + 顶部与顶栏同色融合屏障。
   层次顺序（CSS background 第一项在最上）：
     ① 融合屏障（顶部 44px 与顶栏逐字节同色，任何叠加层不得侵入否则破坏融合）
     ② 半透明填充
   ⚠️ 屏障同样采用**渐隐过渡**而非硬切边（与内容区一致）：
   侧栏底衬虽是不透明填充，硬切边在这里肉眼不可见，但保持全站一致可避免
   将来调整侧栏填充透明度时这条断崖重新暴露。门禁统一锁「不得出现硬切」。
   ⚠️ 已移除磨砂颗粒层：本插件做的是毛玻璃（表面光滑），颗粒属被否决的材质。
   ⚠️ 严禁 inset 白色高光：inset 0 1px 1px rgba(255,255,255,·) 会画在内容层
   顶部（y=0，即壳顶栏正下方 y=44 处），在纯色底上直接表现为一条横贯的白线。 */
body[data-ds-custom-theme="sequoia"] [class*="sidebarCol"] > * > [class*="root"] {
  background:
    linear-gradient(180deg,
      rgb(245, 245, 247) 0,
      rgb(245, 245, 247) var(--dsh-fusion-top, 44px),
      rgba(245, 245, 247, 0.88) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(245, 245, 247, 0.72) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    rgba(245, 245, 247, 0.66) !important;
  box-shadow: none !important;
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
    /* ① 顶部同色融合屏障（**必须在最上层**）—— 逐字节等于 bg-base，
          向下渐隐过渡到主题原有填充。缺这条则侧栏顶部直接暴露半透明填充
          + 紫色光斑，与顶栏形成约 11 阶亮度断层（实测 L≈35 vs 24.1），
          用户反馈「左右侧边栏跟顶部边栏反差太大，没有像中间一样自然过渡」。 */
    linear-gradient(180deg,
      rgb(22, 24, 30) 0,
      rgb(22, 24, 30) var(--dsh-fusion-top, 44px),
      rgba(22, 24, 30, 0.55) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(22, 24, 30, 0) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    /* ② 主题原有材质 */
    radial-gradient(ellipse 85% 65% at 48% 28%, rgba(140, 70, 240, 0.15) 0%, transparent 100%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%),
    rgba(18, 20, 25, 0.55) !important;
  /* ⚠️ 严禁 inset 白色内高光：inset 0 1px 1px 会画在内容层顶部，
     即壳顶栏正下方，在深色底上表现为一条横贯亮线（历史踩坑）。 */
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.09) !important;
}

/* 右侧抽屉面板：与顶栏同色系，不发丝高光（同左侧栏，避免色差被读成分界）。
   ⚠️ 已移除磨砂颗粒层（毛玻璃不要颗粒）。
   ⚠️ 同样补上**顶部同色融合屏障**：右栏面板是独立绘制的 surface，
   缺屏障时其顶部会直接暴露半透明填充与光斑，与顶栏形成断层
   （与左侧栏同一根因，用户反馈「左右侧边栏跟顶部边栏反差太大」）。 */
body[data-ds-custom-theme="sequoia"] [class*="rightbarCol"] [data-sidebar-right-panel] {
  background:
    linear-gradient(180deg,
      rgb(245, 245, 247) 0,
      rgb(245, 245, 247) var(--dsh-fusion-top, 44px),
      rgba(245, 245, 247, 0.88) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(245, 245, 247, 0.72) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    rgba(245, 245, 247, 0.68) !important;
  box-shadow: none !important;
}
body[data-ds-custom-theme="sonoma"] [class*="rightbarCol"] [data-sidebar-right-panel] {
  background:
    linear-gradient(180deg,
      rgb(22, 24, 30) 0,
      rgb(22, 24, 30) var(--dsh-fusion-top, 44px),
      rgba(22, 24, 30, 0.55) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(22, 24, 30, 0) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    radial-gradient(ellipse 85% 65% at 52% 28%, rgba(41, 151, 255, 0.12) 0%, transparent 100%),
    rgba(18, 20, 25, 0.55) !important;
  /* 去掉顶部 inset 亮线（会在顶栏正下方形成横贯亮线） */
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.09) !important;
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

/* Xcode 风格代码块。
   ⚠️ 代码块**刻意不上毛玻璃**（用户已确认排除 A6）：代码是可读性最高优先级的实体内容，
   半透明会让底层文字透出来干扰阅读，故保持实色底 + 描边。
   选择器修正：旧写法 [class*="codeBlock"] 为源码目录名，实测命中为 0；
   改用真实存在且不含哈希的 [class*="md-code-block"]。 */
body[data-ds-custom-theme="sequoia"] pre,
body[data-ds-custom-theme="sequoia"] [class*="md-code-block"] {
  border-radius: 10px !important;
  border: 1px solid #d0d7de !important;
  background: #f6f8fa !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}
body[data-ds-custom-theme="sonoma"] pre,
body[data-ds-custom-theme="sonoma"] [class*="md-code-block"] {
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
    // 与 sonoma.ts 的 --dsw-alias-bg-base 逐字节同色 → 融合无接缝
    bg: 'rgb(22, 24, 30)',
    accent: 'rgb(41, 151, 255)',
    line: 'transparent',
    text: 'rgb(245, 245, 247)',
    muted: 'rgb(161, 161, 166)',
    hover: 'rgba(41, 151, 255, 0.12)',
    active: 'rgba(41, 151, 255, 0.22)',
  },
  solar: {
    // 与 solar.ts 的 --dsw-alias-bg-base 逐字节同色 → 融合无接缝
    bg: 'rgb(18, 14, 16)',
    accent: 'rgb(240, 180, 90)',
    line: 'transparent',
    text: 'rgb(252, 246, 238)',
    muted: 'rgb(198, 178, 156)',
    hover: 'rgba(240, 180, 90, 0.12)',
    active: 'rgba(240, 180, 90, 0.22)',
  },
  parchment: {
    // 与 parchment.ts 的 --dsw-alias-bg-base 逐字节同色 → 融合无接缝
    bg: 'rgb(230, 224, 212)',
    accent: 'rgb(156, 48, 28)',
    line: 'transparent',
    text: 'rgb(34, 28, 24)',
    muted: 'rgb(120, 106, 96)',
    hover: 'rgba(156, 48, 28, 0.08)',
    active: 'rgba(156, 48, 28, 0.15)',
  },
  jade: {
    // 与 jade.ts 的 --dsw-alias-bg-base 逐字节同色 → 融合无接缝
    bg: 'rgb(226, 228, 233)',
    accent: 'rgb(20, 22, 28)',
    line: 'transparent',
    text: 'rgb(20, 22, 28)',
    muted: 'rgb(90, 98, 110)',
    hover: 'rgba(15, 23, 42, 0.06)',
    active: 'rgba(15, 23, 42, 0.10)',
  },
  void: {
    // 与 void.ts 的 --dsw-alias-bg-base 逐字节同色 → 融合无接缝
    bg: 'rgb(13, 13, 16)',
    accent: 'rgb(140, 144, 155)',
    line: 'transparent',
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
