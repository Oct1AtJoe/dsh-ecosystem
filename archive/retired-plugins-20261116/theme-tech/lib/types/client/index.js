import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { SEQUOIA_TOKENS } from "./sequoia.js";
import { SONOMA_TOKENS } from "./sonoma.js";
import { VOID_TOKENS } from "./void.js";
import { JADE_TOKENS } from "./jade.js";
import { SOLAR_TOKENS } from "./solar.js";
import { PARCHMENT_TOKENS } from "./parchment.js";
import { en, zh } from "./locales.js";
import { createHomeLayoutStore, createMascotStore, createMoreEntryStore, createRightbarWidthStore, createScheduleEntryStore, createSidebarFontStore, createTechThemeStore } from "./settings-store.js";
import { SETTINGS_NS, TechThemeRow } from "./TechThemeRow.js";
import { SidebarFontRow } from "./SidebarFontRow.js";
import { MascotRow } from "./MascotRow.js";
import { RightbarWidthRow } from "./RightbarWidthRow.js";
import { HomeLayoutRow } from "./HomeLayoutRow.js";
import { ScheduleEntryRow } from "./ScheduleEntryRow.js";
import { MoreEntryRow } from "./MoreEntryRow.js";
import { applySidebarFont, normalizeSidebarFont, readSidebarFont, writeSidebarFont } from "./sidebar-font.js";
import { normalizeRightbarRatio, readRightbarRatio, writeRightbarRatio } from "./rightbar-width.js";
import { initMascot, notifyMascotChange, readMascotEnabled, writeMascotEnabled } from "./mascot.js";
import { applyMoreEntryVisible, applyScheduleEntryVisible, readMoreEntryVisible, readScheduleEntryVisible, writeMoreEntryVisible, writeScheduleEntryVisible, } from "./schedule-entry.js";
import { HomeUsagePanel } from "./usage/HomeUsagePanel.js";
import { SaulFingerGunIcon } from "./usage/SaulIcon.js";
import { createHomeUsage } from "./usage/data.js";
import { injectHomeUsageStyles } from "./usage/styles.js";
import { initMarketStickySync } from "./market-sticky.js";
import { BOOT_SPINNER_CSS } from "../boot-spinner-css.js";
/** Sequoia: macOS Sequoia 液态透光浅色版 (Liquid Frost Light). */
const SEQUOIA = Object.freeze({
    id: 'sequoia',
    colorScheme: 'light',
    tokens: SEQUOIA_TOKENS,
});
/** Sonoma: macOS Sonoma 深空曜黑暗色版 (Dark Obsidian Pro). */
const SONOMA = Object.freeze({
    id: 'sonoma',
    colorScheme: 'dark',
    tokens: SONOMA_TOKENS,
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

  /* ── 浮层底衬不透明化（Windows 无 vibrancy）────────────────────────────
     官方 --dsw-specific-menu 在非 macOS 上取 --dsw-menu-surface-fill（浅 0.58 / 深 0.45），
     前提是官方 MenuSurface 自带的 backdrop-filter。第三方插件自绘的 popover
     （如 git-graph 分支弹层）只写 background: var(--dsw-specific-menu)，没有模糊层，
     背后文字会直接透出来。这里按主题底色派生一个近实心填充：仍走 token，不写死颜色。 */
  --dsw-specific-menu: color-mix(in srgb, var(--dsw-alias-bg-base) 97%, transparent);

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
  /* 浮层（菜单/提示）单列一档：对齐 t3 黄金通透档位（.38），强高斯模糊彻底化开背景，极致通透 */
  --dsh-glass-popover-fill:rgba(255,255,255,0.38);
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

   🚨🚨 选择器必须用 [data-composer-card] 锚定，**不得**用 [class$="_card"]：
   「回答选择面板」（ui-user-questions 的 QuestionComposer）也是
   conversation.composer 链的一个 takeover，它的卡片类名同样以 _card 结尾
   （实测 H0yVCG_card），且**同样挂在 composerSeat 内**。
   于是旧的 [class*="composerSeat"] [class$="_card"] 会把它一起命中，
   把本属于输入坞的 0.38 玻璃填充强加到回答面板上 ——
   而回答面板自带 background: var(--dsw-specific-input-major)（0.93 近实心），
   是**承载可读文字的整块卡片**，不是浮在内容之上的玻璃条。
   实测：回答面板 0.93 → 被覆盖成 0.38，正文选项文字与背后对话直接叠印。

   判据用**官方输入坞自己的 data-composer-card 属性**（InputBar.tsx:398），
   不猜类名、不用后缀通配 —— 回答面板没有这个属性，天然被排除。

   ⚠️ 成本卡（cm-footer-stack）：
   原设于 A 组，但实测该组件在 simple 模式下为 overflow: auto 滚动容器，
   内部每个用量卡均包裹了官方 primitives Tooltip（Fragment 原地渲染 position:fixed 浮层）。
   W3C 规范中 backdrop-filter 会将自身提升为固定定位子树的 Containing Block，
   直接导致：① Tooltip 视口坐标被误作局部偏移甩出视口外；② 巨大浮层撑爆容器产生横竖双向滚动条。
   且成本卡在侧边栏纯底色上，blur 零漫反射收益。
   故移出 A 组、显式禁用 blur（backdrop-filter: none !important），
   独立保留其玻璃高光与内阴影，彻底根治 Containing Block 劫持。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [data-composer-card],
body[data-ds-custom-theme="sequoia"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sequoia"] [class*="dsh-recall-bubble"],
body[data-ds-custom-theme="sequoia"] [class*="_bannerWrap"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [data-composer-card],
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
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [data-composer-card],
body[data-ds-custom-theme="sequoia"] [class*="composerStack"] > section,
body[data-ds-custom-theme="sequoia"] [class*="_bannerWrap"],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [data-composer-card],
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
body[data-ds-custom-theme="sequoia"] [role="menu"],
body[data-ds-custom-theme="sequoia"] [role="tooltip"],
body[data-ds-custom-theme="sequoia"] [class*="overlayAnchor"] [class$="_menu"],
body[data-ds-custom-theme="sonoma"] [role="menu"],
body[data-ds-custom-theme="sonoma"] [role="tooltip"],
body[data-ds-custom-theme="sonoma"] [class*="overlayAnchor"] [class$="_menu"]{
  background:var(--dsh-glass-sheen),var(--dsh-glass-popover-fill) !important;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    0 24px 60px rgba(0,0,0,0.18) !important;
  border-radius:20px !important;
  border:none !important;
}
/* 浮层文字对比度：官方 Tooltip 原生硬绑定纯白字（--dsw-static-neutral-bluish-00），
   在 sequoia 浅色白玻背景下造成白底白字无法辨识；
   必须覆写为深色正文字色（--dsw-alias-label-primary），深色主题（sonoma）保留原生白字。 */
body[data-ds-custom-theme="sequoia"] [role="tooltip"]{
  color:var(--dsw-alias-label-primary) !important;
}

/* ── 输入坞三大弹出浮层（权限选择/模型选择/指令面板）内部细节与滚动条统一 ── */
/* 1. 指令展开面板（overlayAnchor ... _menu）内部项与高亮统一 */
body[data-ds-custom-theme="sequoia"] [class*="overlayAnchor"] [class$="_menu"],
body[data-ds-custom-theme="sonoma"] [class*="overlayAnchor"] [class$="_menu"]{
  padding:8px !important;
}
body[data-ds-custom-theme="sequoia"] [class*="overlayAnchor"] [class*="_item"],
body[data-ds-custom-theme="sonoma"] [class*="overlayAnchor"] [class*="_item"]{
  border-radius:12px !important;
  transition:background 0.15s ease !important;
}
body[data-ds-custom-theme="sequoia"] [class*="overlayAnchor"] [class*="_item"]:hover,
body[data-ds-custom-theme="sequoia"] [class*="overlayAnchor"] [class*="_item"][class*="_active"]{
  background:rgba(0, 0, 0, 0.05) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="overlayAnchor"] [class*="_item"]:hover,
body[data-ds-custom-theme="sonoma"] [class*="overlayAnchor"] [class*="_item"][class*="_active"]{
  background:rgba(255, 255, 255, 0.08) !important;
}

/* 2. 模型选择面板（dsh-better-reasoning-effort）去顶部实色灰底，统一搜索框材质 */
body[data-ds-custom-theme="sequoia"] .bre-model-search-box,
body[data-ds-custom-theme="sonoma"] .bre-model-search-box{
  background:transparent !important;
  border-bottom:1px solid rgba(0, 0, 0, 0.06) !important;
  padding:8px 10px !important;
}
body[data-ds-custom-theme="sonoma"] .bre-model-search-box{
  border-bottom-color:rgba(255, 255, 255, 0.08) !important;
}
body[data-ds-custom-theme="sequoia"] .bre-search-input-wrapper{
  background:rgba(0, 0, 0, 0.04) !important;
  border:1px solid rgba(0, 0, 0, 0.06) !important;
  border-radius:10px !important;
}
body[data-ds-custom-theme="sonoma"] .bre-search-input-wrapper{
  background:rgba(255, 255, 255, 0.06) !important;
  border:1px solid rgba(255, 255, 255, 0.10) !important;
  border-radius:10px !important;
}
body[data-ds-custom-theme] .bre-search-input{
  background:transparent !important;
}
body[data-ds-custom-theme="sequoia"] [role="menu"] [class*="groupTitle"],
body[data-ds-custom-theme="sonoma"] [role="menu"] [class*="groupTitle"]{
  background:transparent !important;
  font-weight:600 !important;
  opacity:0.65 !important;
}
body[data-ds-custom-theme="sequoia"] [role="menu"] button[role="menuitemradio"],
body[data-ds-custom-theme="sequoia"] [role="menu"] button[role="menuitem"],
body[data-ds-custom-theme="sonoma"] [role="menu"] button[role="menuitemradio"],
body[data-ds-custom-theme="sonoma"] [role="menu"] button[role="menuitem"]{
  border-radius:10px !important;
}
body[data-ds-custom-theme="sequoia"] [role="menu"] button[role="menuitemradio"]:hover,
body[data-ds-custom-theme="sequoia"] [role="menu"] button[role="menuitem"]:hover{
  background:rgba(0, 0, 0, 0.05) !important;
}
body[data-ds-custom-theme="sonoma"] [role="menu"] button[role="menuitemradio"]:hover,
body[data-ds-custom-theme="sonoma"] [role="menu"] button[role="menuitem"]:hover{
  background:rgba(255, 255, 255, 0.08) !important;
}

/* 3. 浮层内极细半透滚动条（美化粗灰原生条，保持通透） */
body[data-ds-custom-theme] [role="menu"]::-webkit-scrollbar,
body[data-ds-custom-theme] [role="menu"] *::-webkit-scrollbar,
body[data-ds-custom-theme] [class*="overlayAnchor"] *::-webkit-scrollbar{
  width:5px !important;
  height:5px !important;
}
body[data-ds-custom-theme="sequoia"] [role="menu"]::-webkit-scrollbar-thumb,
body[data-ds-custom-theme="sequoia"] [role="menu"] *::-webkit-scrollbar-thumb,
body[data-ds-custom-theme="sequoia"] [class*="overlayAnchor"] *::-webkit-scrollbar-thumb{
  background:rgba(0, 0, 0, 0.16) !important;
  border-radius:10px !important;
}
body[data-ds-custom-theme="sonoma"] [role="menu"]::-webkit-scrollbar-thumb,
body[data-ds-custom-theme="sonoma"] [role="menu"] *::-webkit-scrollbar-thumb,
body[data-ds-custom-theme="sonoma"] [class*="overlayAnchor"] *::-webkit-scrollbar-thumb{
  background:rgba(255, 255, 255, 0.20) !important;
  border-radius:10px !important;
}
body[data-ds-custom-theme] [role="menu"]::-webkit-scrollbar-track,
body[data-ds-custom-theme] [role="menu"] *::-webkit-scrollbar-track,
body[data-ds-custom-theme] [class*="overlayAnchor"] *::-webkit-scrollbar-track{
  background:transparent !important;
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
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [data-composer-card],
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [data-composer-card]{
  position:relative;z-index:0;
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
}
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [data-composer-card]::before,
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [data-composer-card]::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:-1;
  border-radius:inherit;
  backdrop-filter:var(--dsh-glass-blur,none) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur,none) !important;
}
/* 卡片内含浮层时抬层，确保菜单浮在卡片内容之上（用 :has 自适应，无需改 JS）。
   🚨 性能（2026-10-29）：原先这里是 4 条独立 :has()（菜单 ×2 + 弹窗 ×2，同一值），
   而输入坞卡片**每敲一个字符**内容就变 → 这 4 条各自重跑一次子树匹配。
   现合并为「2 条主题门控 × 1 个 :has(:is(...))」，与下方 1078 行同一范式
   （判据合并进 :is() 只触发一次匹配）。视觉效果逐像素不变。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [data-composer-card]:has(:is(
  [role="menu"],
  [class*="overlayAnchor"] [class$="_menu"],
  [role="dialog"][class$="_panel"]
)),
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [data-composer-card]:has(:is(
  [role="menu"],
  [class*="overlayAnchor"] [class$="_menu"],
  [role="dialog"][class$="_panel"]
)){
  z-index:9500 !important;
}
/* 上下文占用弹窗（官方 ContextMeter 的 role="dialog"）同为**卡片内浮层**：
   它的 z-index:100 只在卡片内部有效（卡片自身上面那条 z-index:0 建了 stacking
   context），而挂件 .dsh-composer-pet（z-index:50）与卡片同层，故弹窗被挂件压住。
   含弹窗时把卡片整体抬到挂件之上，弹窗随之浮起 —— 只改层叠，几何与交互不变。
   （用 :has 自适应，与上方菜单抬层同源，无需改 JS。六主题中只有 sequoia/sonoma
   给卡片加了 z-index:0，其余主题不建立该 context，本就不冲突。）
   选择器收窄到 ContextMeter 面板本体（[role="dialog"][class$="_panel"]），
   与既有 [class$="_menu"] / [class$="_card"] 同一后缀范式，不波及其它卡片内浮层。 */
/* ↑ 上下文占用弹窗（ContextMeter 的 [role="dialog"][class$="_panel"]）的抬层
   已并入上一条 :has(:is(...))，不再单独成规则。 */

/* ── 输入坞底部状态药丸栏（StatsPills / data-composer-dock）防透与毛玻璃 ──
   宿主 0.2.1-rc.2 架构重构：删除了 _MG5Va_root 与 [data-composer-stats]，将统计条目拆分为
   ActivityPill / UsagePill（[data-composer-stat]），外层统一由 InputBar 的
   <div className={css.dock} data-composer-dock> 承载。
   原官方在 composerSeat 上有实色压底渐变，但 sequoia/sonoma 为实现输入框毛玻璃
   移除了该压底，导致处于底部的 dock 槽位完全透明（alpha=0）。
   当对话流向上滚动时，正文文字滑入输入区下方，直接与状态药丸（77.7M tok 等）文字重合叠印。
   修法：
     ① 适配 0.2.1 新宿主 [data-composer-dock]:has(...) 并双向兼容 0.1.5 旧宿主；
     ② 贯彻「内容可读性优先」原则，采用高不透明度半透明底衬（浅色 .88 / 深色 .90）；
     ③ 将 backdrop-filter 挂于 ::before 伪元素，杜绝嵌套 backdrop root 风险；
     ④ 虚化半径 blur(40px) saturate(180%)，彻底抚平滑入背后的文字；
     ⑤ 四角圆角严格对齐输入框卡片 20px（border-radius: 20px），保持上下曲率一致；
     ⑥ 通用规则覆盖其余自定义主题，确保全主题文字清晰绝不重叠。 */
body[data-ds-custom-theme="sequoia"] [data-composer-dock]:has([data-composer-stat]),
body[data-ds-custom-theme="sequoia"] [data-composer-stats],
body[data-ds-custom-theme="sequoia"] [class*="_MG5Va_root"],
body[data-ds-custom-theme="sequoia"] [data-slot="conversation.composer.dock"] > [class*="_root"] {
  position: relative !important;
  z-index: 0 !important;
  max-width: var(--dsh-chat-content-width) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  background: var(--dsh-glass-sheen), rgba(245, 245, 247, 0.88) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border-radius: 20px !important;
  border: 0.5px solid rgba(0, 0, 0, 0.06) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
  padding: 4px 16px !important;
  margin: 2px auto 0 !important;
}
body[data-ds-custom-theme="sequoia"] [data-composer-dock]:has([data-composer-stat])::before,
body[data-ds-custom-theme="sequoia"] [data-composer-stats]::before,
body[data-ds-custom-theme="sequoia"] [class*="_MG5Va_root"]::before,
body[data-ds-custom-theme="sequoia"] [data-slot="conversation.composer.dock"] > [class*="_root"]::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  border-radius: inherit;
  backdrop-filter: blur(40px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(40px) saturate(180%) !important;
}

body[data-ds-custom-theme="sonoma"] [data-composer-dock]:has([data-composer-stat]),
body[data-ds-custom-theme="sonoma"] [data-composer-stats],
body[data-ds-custom-theme="sonoma"] [class*="_MG5Va_root"],
body[data-ds-custom-theme="sonoma"] [data-slot="conversation.composer.dock"] > [class*="_root"] {
  position: relative !important;
  z-index: 0 !important;
  max-width: var(--dsh-chat-content-width) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  background: var(--dsh-glass-sheen), rgba(22, 24, 30, 0.90) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border-radius: 20px !important;
  border: 0.5px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.20) !important;
  padding: 4px 16px !important;
  margin: 2px auto 0 !important;
}
body[data-ds-custom-theme="sonoma"] [data-composer-dock]:has([data-composer-stat])::before,
body[data-ds-custom-theme="sonoma"] [data-composer-stats]::before,
body[data-ds-custom-theme="sonoma"] [class*="_MG5Va_root"]::before,
body[data-ds-custom-theme="sonoma"] [data-slot="conversation.composer.dock"] > [class*="_root"]::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  border-radius: inherit;
  backdrop-filter: blur(40px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(40px) saturate(180%) !important;
}

/* 其余主题通用防穿透底色 */
body[data-ds-custom-theme]:not([data-ds-custom-theme="sequoia"]):not([data-ds-custom-theme="sonoma"]) [data-composer-dock]:has([data-composer-stat]),
body[data-ds-custom-theme]:not([data-ds-custom-theme="sequoia"]):not([data-ds-custom-theme="sonoma"]) [data-composer-stats],
body[data-ds-custom-theme]:not([data-ds-custom-theme="sequoia"]):not([data-ds-custom-theme="sonoma"]) [class*="_MG5Va_root"],
body[data-ds-custom-theme]:not([data-ds-custom-theme="sequoia"]):not([data-ds-custom-theme="sonoma"]) [data-slot="conversation.composer.dock"] > [class*="_root"] {
  background: var(--dsw-alias-bg-base) !important;
  max-width: var(--dsh-chat-content-width) !important;
  width: 100% !important;
  box-sizing: border-box !important;
  border-radius: 20px !important;
  padding: 4px 16px !important;
  margin: 2px auto 0 !important;
}

/* 状态药丸文字对比度提升：次级文字从 tertiary 升级至 secondary，字迹更清晰 */
body[data-ds-custom-theme] [data-composer-dock] [class*="pill"],
body[data-ds-custom-theme] [data-composer-dock] [class*="_anchor"],
body[data-ds-custom-theme] [data-composer-dock] button,
body[data-ds-custom-theme] [data-composer-stat],
body[data-ds-custom-theme] [data-composer-stats] [class*="pill"],
body[data-ds-custom-theme] [class*="_MG5Va_root"] [class*="pill"] {
  color: var(--dsw-alias-label-secondary) !important;
}

/* ── 输入框上方像素小伙伴挂件（全主题通用）─────────────────────────────
   素材为「单行 8 列」条带：每张 584×109px，单元格 73×109px。
   取景窗只露一格，WAAPI steps 逐帧平移即为动画。
   素材为手绘动漫立绘（非像素画），不使用 image-rendering: pixelated，
   满色立绘无需按主题染色。 */
.dsh-composer-pet {
  position: absolute !important;
  right: 18px !important;
  bottom: 100% !important;
  z-index: 50 !important;
  width: 73px !important;
  height: 109px !important;
  pointer-events: none !important;
  user-select: none !important;
}
/* 首帧就绪前先隐藏，避免空窗口闪一下 */
.dsh-composer-pet:not([data-ready]) {
  visibility: hidden !important;
}

/* 对话页：站在 composerStack 顶端，因此上方有排队消息、待办或目标卡片时
   会自动上移到全部元素之上，永不遮挡。

   右侧基准的来历（实测，勿随手改）：34px 是「回到底部」按钮直径
   （.toBottom，官方 ChatView），另一半是留白。
   该按钮挂在对话列上、右对齐，而挂件挂在 composerStack 上 —— 两者在同一
   竖直带里会相遇，所以横向必须让开。

   ⚠️ 站位调整史（均为用户要求「往右移一些」，实测驱动，勿凭感觉改）：
     68px（初版） → 52px（2026-10-20 第一次右移 16px，间隙 35→19px）
                 → 46px（2026-10-20 第二次右移 6px，间隙 19→13px）
   核算公式（列宽 ≥ 约 1100px 时恒成立，区间 760..3000px 实测一致）：
     gap = 34 + (offset - 16)
   → offset=46 → gap=13px（当前）；44 → 11px（开始贴身）；40 → 7px（压住按钮）。
   **46px 已是安全上限附近，再小就开始压「回到底部」按钮。**

   若以后还要让挂件更靠右，唯一出路是**改动竖直站位**：把底边整体上抬，
   越过按钮所占的 34px 高度带（按钮占 composer_height+16 .. composer_height+50），
   横向才彻底自由。单纯压 offset 到 40px 以下会在点击层面撞按钮。
   （注：本文件是反引号模板字符串，注释里禁止再出现反引号，否则会截断字符串。） */
[data-dsh-pet-anchor="stack"] > .dsh-composer-pet {
  right: calc(max(var(--dsh-composer-side-clearance, 16px), (100% - var(--dsh-composer-card-max-width, 712px)) / 2) + 46px) !important;
  bottom: 100% !important;
}
/* 替代面板（授权确认 / 提问面板）接管输入卡片时 —— 与 stack 同步 */
[data-dsh-pet-anchor="panel"] > .dsh-composer-pet {
  right: calc(max(var(--dsh-composer-side-clearance, 16px) + 16px, (100% - var(--dsh-chat-content-width, 680px)) / 2) + 46px) !important;
  bottom: calc(100% - 7px) !important;
}
/* 首页新会话卡片 / 兜底卡片 —— 同样同步 */
[data-dsh-pet-anchor="card"] > .dsh-composer-pet {
  right: 46px !important;
  bottom: 100% !important;
}

/* 取景窗：只露一格，并裁掉条带多余部分 */
.dsh-composer-pet-sprite {
  position: absolute !important;
  inset: 0 !important;
  overflow: hidden !important;
}
/* 胶片条带：整张 8 列图铺满，靠 transform 平移对帧 */
.dsh-composer-pet-strip {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  display: block !important;
  width: 584px !important;
  height: 109px !important;
  background-image: var(--dsh-pet-image, none) !important;
  background-repeat: no-repeat !important;
  background-position: 0 0 !important;
  background-size: 584px 109px !important;
  will-change: transform;
}
/* 点击热区：覆盖人物躯干。用百分比随单元格自适应，不写死像素。 */
.dsh-composer-pet-hit {
  position: absolute !important;
  left: 8% !important;
  top: 10% !important;
  width: 84% !important;
  height: 82% !important;
  pointer-events: auto !important;
  touch-action: none !important;
  cursor: pointer !important;
}
/* 减少动态效果：条带由 JS 停在静止帧，这里不再补任何动画 */
@media (prefers-reduced-motion: reduce) {
  .dsh-composer-pet-strip {
    animation: none !important;
  }
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
/* 零收益项归零（性能）：与左侧栏同因 —— sequoia 右栏背景是
   bg-app-image(none) + bg-base 纯色，blur 无像素差异。
   sonoma 右栏背后有紫/蓝径向光斑，保留其 backdrop-filter 不动。 */
body[data-ds-custom-theme="sequoia"] [class*="rightbarCol"]::before{
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
}
/* 右栏面板同样补「顶部同色融合屏障」（六主题通用，与左侧栏一致）。
   缺失时其顶部会直接暴露半透明填充与光斑，与顶栏形成亮度断层。 */
/* :not([aria-hidden="true"]) —— 面板壳只在「展开」时上色。
   官方 .panel 是 absolute 且 rightbarCol 不裁剪：折叠时列宽为 0，面板壳仍以
   自身 378px 宽悬挂在中栏右侧，只有内部 [data-dockkit-host='dock'] 被
   translateX + visibility:hidden 移走。壳本身在官方设计里是透明的，一旦给它
   灌背景，折叠态就会在中栏右侧留下一块擦不掉的空白，并把 header 右端的
   展开按钮盖住。aria-hidden 正是官方的「折叠且无浮动面板」判据，浮动面板
   场景自动保留上色。 */
body[data-ds-dark-theme] [class*="rightbarCol"] [data-sidebar-right-panel]:not([aria-hidden="true"]){
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
body:not([data-ds-dark-theme]) [class*="rightbarCol"] [data-sidebar-right-panel]:not([aria-hidden="true"]){
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
[role="dialog"],
[role="presentation"]:has(> [role="dialog"]){
  z-index:9500 !important;
  isolation:isolate !important;
}
[role="menu"],
[data-menu-material]{
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

/* Views with composer overlay (trajectory, review, etc.): hide resident composer seat & pet, reset bottom clearance */
:is([data-conversation-scroll], [class*="scrollBody"]):has([data-conversation-composer-overlay]) {
  --dsh-composer-height: 0px !important;
}
:is([data-conversation-scroll], [class*="scrollBody"]):has([data-conversation-composer-overlay]) > :is([data-composer-seat], [class*="composerSeat"]) {
  display: none !important;
}
:is([data-conversation-scroll], [class*="scrollBody"]):has([data-conversation-composer-overlay]) .dsh-composer-pet {
  display: none !important;
}

/* ── 长会话渲染裁剪：视口外的历史行不参与布局/绘制 ────────────────────────
   🚨 为什么必须加（2026-10-29 实测对比 dsh-claude-style）：
   同为长会话流式输出，claude-style 丝滑、本插件明显掉帧。逐项量化后，
   唯一的结构性差距是 **content-visibility：本插件 0 条，它 1 条**。
   其余差异（[class*=] 选择器数、backdrop-filter 数）都只在 DOM 抖动时才会重算，
   而 content-visibility 直接决定「屏幕上几百个历史行要不要每帧参与渲染树」。

   流式输出时，模型每吐一个 token 都会触发宿主重排后续内容。若全部历史行都在
   渲染树里，每次重排的代价 ∝ 会话总长度 —— 这就是「会话越长越卡」的根因，
   也是纯 JS 侧优化（早先的 P0-1/P0-2）完全无感的原因：它们省的是查询与布局读取，
   省不掉「几百个已渲染节点参与每一帧」这笔固定开销。

   判据与排除清单直接沿用 dsh-claude-style 的成熟沉淀（它踩过的坑）：
     · [data-chat-flow-kind] 是宿主 ChatNodeSeat.tsx:155 自带的结构标记，
       不猜类名、不用 :has()；
     · 排除 user 行 —— 用户消息要常驻可见，不折叠；
     · 排除 [data-turn-process-answer] —— **正在生成的那条答案**。折叠它会让
       用户看到一片空白（这是最关键的一条）；
     · 排除 [data-turn-process-hidden] / [hidden] —— 已隐藏的成员无需再折叠，
       且折叠会破坏宿主的展开态测量；
     · 排除 [data-disclosure-row] [hidden] —— 折叠面板内的隐藏行同理。

   尺寸占位用 contain-intrinsic-size 的 **auto** 关键字：首次按 240px 估高，
   之后**记住上次渲染的真实高度**。因此反复滚动不会每次都用估值，避免滚动条
   持续跳动。 */

/* 只给「非用户行、且不在排除清单内」的会话行加裁剪。 */
[data-chat-flow-kind]:not([data-chat-flow-kind="user"]):not(
  [hidden],
  [data-turn-process-answer],
  [data-turn-process-hidden],
  [data-disclosure-row] [hidden]
) {
  contain-intrinsic-size: auto 240px;
  content-visibility: auto;
}

/* ── 第三方输入框浮层（dsh-prompt-history）的层级纠正 ────────────────────────
   🚨 真因：dsh-prompt-history 把「下一条预测」(.dsh-ph-suggest) 与「行内补全」
   (.dsh-ph-ghost) 直接 append 到 document.body，用 position:fixed +
   z-index:2147482000（接近 int32 上限）强行置顶；它只在自己的 editor host
   **断开连接**时才收起（suggestOverlay.ts 的 tick：current.host.isConnected
   为 false 时才 hideSuggestion）。

   问题在于 host 并不会在这些场景断开：
     ① 切到「轨迹 / 审查」等 composer overlay 视图 —— 输入坞是被 overlay 盖住，
        而不是卸载，host 仍 isConnected；
     ② 打开设置弹窗 —— 弹窗是叠在页面之上的独立层，host 自然还在；
     ③ 右栏面板 fullscreen 铺满 —— 同理。
   于是 ghost 文字一直钉在最上层，穿透弹窗与视图。本主题给弹窗层的 9500
   （见上）永远打不过 2147482000，纯改弹窗 z-index 是死路。

   ✅ 修法：在**宿主出现遮挡层**时把这两个浮层隐藏（display:none），而不是
   去和第三方比 z-index。选择器全部锚在宿主自带的结构标记上：
     · [role="presentation"] > [role="dialog"]（官方设置/模态弹窗的固定结构）
     · [data-conversation-composer-overlay]（官方 composer overlay 视图标记）
     · [data-sidebar-right-panel="fullscreen"]（官方右栏通栏态，SidebarRight.tsx）
   弹窗关闭 / 视图切回后 :has() 自动失效，浮层恢复，无需 JS 配合。

      ④ 回答选择面板（ui-user-questions 的 QuestionComposer）弹出 —— 它是
         conversation.composer 链的 takeover，输入坞 host 依然 isConnected。
      ⑤ 开屏动画（dsh-ink-whale 的 .dshiw-root）播放中 —— 它经 shell.overlay
         槽位注入，全屏 fixed、z-index:2147483000；开屏期间输入框本就不可交互，
         提示语浮在品牌动画上只会显得脏。
      ⑥ 模型选择面板（官方 ModelSelect / data-menu-material）与弹出菜单展开 ——
         模型选择面板向上展开覆盖输入框，此时用户正在进行选项或搜索交互，提示语
         不得浮在模型面板之上，菜单关闭后自动恢复。
      ⑦ 会话统计与用量悬浮卡片（官方 StatsPills / TurnUsagePanel 的 role="dialog"）展开 ——
         直接 portaled 到 body，向上展开覆盖输入框，提示语浮在面板正中会严重干扰数据阅读，
         必须收起，面板关闭后自动恢复。

   ⚠️ 不用 z-index 下压：这两个节点是 body 直接子级，下压会掉到内容层之下，
   反而在正常输入场景里不可见。
   ⚠️ 判据合并进一个 :is() 里传给 :has()，只触发一次全文档匹配。
   ⚠️ 门控到自定义主题（body[data-ds-custom-theme]）：本样式只在装了本主题时
   注入，避免影响内置主题的原始表现。
   ⚠️ 只处理提示语/补全（.dsh-ph-suggest / .dsh-ph-ghost）。同插件的聊天目录
   （.dsh-ph-toc*）是用户主动拖出的浮层，刻意不纳入，避免「目录自己在面板上
   消失」的新问题。
   ⚠️ .dshiw-root 是 dsh-ink-whale 在自身样式里显式定义的根类（非 CSS Modules
   哈希名），在宿主 DOM 里稳定可命中；.dshiw-root--inline 是设置页内联预览，
   同样带 .dshiw-root，也一并收起，符合语义。 */
body[data-ds-custom-theme]:has(:is(
  [role="dialog"],
  [role="presentation"] > [role="dialog"],
  [data-conversation-composer-overlay],
  [data-sidebar-right-panel="fullscreen"],
  [data-question-key],
  [data-plan-review-key],
  .dshiw-root,
  [data-menu-material],
  [role="menu"],
  .bre-model-search-box
)) :is(.dsh-ph-suggest, .dsh-ph-ghost) {
  display: none !important;
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

/* Dialogs/modals：系统级晶体磨砂玻璃面板（**仅 液态 sequoia 与 曜黑 sonoma**）。
   ⚠️ 参考 Catppuccin / macOS 顶级磨砂玻璃实现机理：
   ① 弹窗外框采用微光学切边（Specular Edge + Inset Rim + Ambient Drop）与 24px 大圆角；
   ② 弹窗内部解构重塑实色 Token（--dsw-alias-bg-module-platform 与 layer-1/2/3），消除原生死白/死黑补丁；
   ③ 左侧导航菜单与选项卡片转换为通透半透明悬浮晶片，光线多层折射；
   ④ 视口遮罩蒙层（Mask）注入轻透柔焦虚化，烘托前景悬浮深度；
   ⑤ 配备 dsh-glass-dialog-in 弹性微动效；
   ⚠️ 主题门控严格限定在 sequoia 与 sonoma 两个 id，其余四个主题保持原生质感不变。 */
[role="presentation"]:has(> [role="dialog"]){
  z-index:9500 !important;
  isolation:isolate !important;
}

body[data-ds-custom-theme="sequoia"] [role="dialog"]{
  --dsw-alias-bg-module-platform:rgba(255, 255, 255, 0.46) !important;
  --dsw-alias-bg-layer-3:rgba(255, 255, 255, 0.36) !important;
  --dsw-alias-bg-layer-2:rgba(255, 255, 255, 0.48) !important;
  --dsw-alias-bg-layer-1:rgba(255, 255, 255, 0.36) !important;
  --dsw-specific-sidebar-nav-item-active:rgba(0, 0, 0, 0.055) !important;
  --dsw-specific-sidebar-nav-item-hover:rgba(0, 0, 0, 0.028) !important;
  --dsw-alias-border-l3:rgba(0, 0, 0, 0.06) !important;
  --dsw-alias-border-l2:rgba(0, 0, 0, 0.08) !important;
  --dsh-scrollbar-thumb:rgba(0, 0, 0, 0.14) !important;
  --dsh-scrollbar-thumb-hover:rgba(0, 0, 0, 0.24) !important;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 30%, transparent 100%),
    rgba(255, 255, 255, 0.54) !important;
  /* --dsh-glass-blur 自带 saturate(180%)（index.ts:170 默认，sequoia 为
     saturate(200%)）。此处再串 saturate(190%) 等于让 GPU 每帧多跑一次色彩矩阵，
     视觉无可辨收益。统一走变量本身。 */
  backdrop-filter:var(--dsh-glass-blur) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur) !important;
  border-radius:24px !important;
  border:none !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 0 0 1px rgba(0, 0, 0, 0.05),
    0 18px 44px rgba(15, 23, 42, 0.09),
    0 36px 90px rgba(15, 23, 42, 0.12) !important;
  animation:dsh-glass-dialog-in 0.24s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

body[data-ds-custom-theme="sonoma"] [role="dialog"]{
  --dsw-alias-bg-module-platform:rgba(255, 255, 255, 0.06) !important;
  --dsw-alias-bg-layer-3:rgba(255, 255, 255, 0.04) !important;
  --dsw-alias-bg-layer-2:rgba(255, 255, 255, 0.08) !important;
  --dsw-alias-bg-layer-1:rgba(255, 255, 255, 0.04) !important;
  --dsw-specific-sidebar-nav-item-active:rgba(255, 255, 255, 0.08) !important;
  --dsw-specific-sidebar-nav-item-hover:rgba(255, 255, 255, 0.04) !important;
  --dsw-alias-border-l3:rgba(255, 255, 255, 0.08) !important;
  --dsw-alias-border-l2:rgba(255, 255, 255, 0.12) !important;
  --dsh-scrollbar-thumb:rgba(255, 255, 255, 0.14) !important;
  --dsh-scrollbar-thumb-hover:rgba(255, 255, 255, 0.24) !important;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 32%, transparent 100%),
    rgba(22, 25, 32, 0.76) !important;
  /* 同浅色分支：变量已含 saturate，不再叠加。 */
  backdrop-filter:var(--dsh-glass-blur) !important;
  -webkit-backdrop-filter:var(--dsh-glass-blur) !important;
  border-radius:24px !important;
  border:none !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 16px 36px rgba(0, 0, 0, 0.45),
    0 32px 80px rgba(0, 0, 0, 0.60) !important;
  animation:dsh-glass-dialog-in 0.24s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

/* 弹窗内部导航与局部部件精细化 */
body[data-ds-custom-theme="sequoia"] [role="dialog"] [class*="navCell"],
body[data-ds-custom-theme="sonoma"] [role="dialog"] [class*="navCell"]{
  border-radius:12px !important;
  transition:background 0.15s ease, color 0.15s ease !important;
}

/* dsh-cost-meter 费用页根容器（.cm-section）背景归零，与设置弹窗玻璃底统一。
   🚨 实测根因：cost-meter 自带 background: rgb(from var(--dsw-alias-bg-layer-2,
   var(--dsw-alias-bg-base, #fff)) r g b / 1) —— 尾部 / 1 把 alpha 强制成 1（不透明）。
   弹窗内 --dsw-alias-bg-layer-2 被本主题覆写为 rgba(255,255,255,0.48)，
   取 RGB 后 alpha 钉死为 1 → 计算成 color(srgb 1 1 1) 纯白，
   而弹窗本体是 rgba(255,255,255,0.54) 半透明玻璃叠在灰底上，
   于是右侧内容区比弹窗底色明显更白，读作「背景色不统一」。
   修法：只把该根容器设为 transparent，让弹窗自身的玻璃底透上来；
   子级卡片（.cm-card 等）仍走半透明 token，层次不变。 */
body[data-ds-custom-theme="sequoia"] [role="dialog"] [class*="cm-section"],
body[data-ds-custom-theme="sonoma"] [role="dialog"] [class*="cm-section"]{
  background:transparent !important;
}

/* dsh-cost-meter 计费统计 tab（.cm-stat）与上面 .cm-section 同一病因，但走的是
   另一套样式块（client.statistics.js），所以上面那条选择器盖不到它。
   🚨 该根容器写了两条 background 声明，必须一起压掉：
     1) background: var(--cm-opaque-base, #fff) —— 前置回退声明，本主题下
        --cm-opaque-base 无人定义，回退到纯白；
     2) background: rgb(from var(--dsw-alias-bg-layer-2, ...) r g b / 1) ——
        尾部 / 1 把 alpha 钉死为 1，本主题覆写的半透明 layer-2 只贡献 RGB。
   只压第 2 条时，引擎一旦不支持 rgb(from ...) 就落回第 1 条的纯白，仍露白底。
   修法：根容器置透明，让宿主设置弹窗的玻璃底透上来；子级卡片（.cm-* 内部
   面板）继续走半透明 token，层次与实际 .cm-section 修法保持一致。 */
body[data-ds-custom-theme="sequoia"] [class*="cm-stat"],
body[data-ds-custom-theme="sonoma"] [class*="cm-stat"]{
  background:transparent !important;
}

/* 主题/外观选项卡片晶体化 */
body[data-ds-custom-theme="sequoia"] [role="dialog"] [class*="themeCube"]{
  background:rgba(255, 255, 255, 0.35) !important;
  border:1px solid rgba(0, 0, 0, 0.08) !important;
  border-radius:14px !important;
  box-shadow:inset 0 1px 0 rgba(255, 255, 255, 0.70) !important;
  transition:all 0.15s ease !important;
}
body[data-ds-custom-theme="sequoia"] [role="dialog"] [class*="themeCube"]:hover:not([class*="selected"]){
  background:rgba(255, 255, 255, 0.60) !important;
  border-color:rgba(0, 0, 0, 0.14) !important;
  box-shadow:0 4px 12px rgba(0, 0, 0, 0.04), inset 0 1px 0 #fff !important;
}
body[data-ds-custom-theme="sonoma"] [role="dialog"] [class*="themeCube"]{
  background:rgba(255, 255, 255, 0.04) !important;
  border:1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius:14px !important;
  box-shadow:inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
  transition:all 0.15s ease !important;
}
body[data-ds-custom-theme="sonoma"] [role="dialog"] [class*="themeCube"]:hover:not([class*="selected"]){
  background:rgba(255, 255, 255, 0.08) !important;
  border-color:rgba(255, 255, 255, 0.15) !important;
}
/* 下拉选择器药丸晶体化 */
body[data-ds-custom-theme="sequoia"] [role="dialog"] [class*="selector"]{
  background:rgba(255, 255, 255, 0.50) !important;
  border:1px solid rgba(0, 0, 0, 0.08) !important;
  border-radius:12px !important;
  box-shadow:inset 0 1px 0 rgba(255, 255, 255, 0.80) !important;
}
body[data-ds-custom-theme="sonoma"] [role="dialog"] [class*="selector"]{
  background:rgba(255, 255, 255, 0.06) !important;
  border:1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius:12px !important;
  box-shadow:inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
}
/* 操作按钮与关闭按钮：规范化弹窗内操作组按键，区分主次状态与禁用对比度。
   🚨 排除守卫：严格排除开关控件（role="switch"、aria-checked、switch 类）与图标操作钮，
   防止列表操作栏（如 dssm-skill-actions 等）内的开关被强制加上 6px 16px padding 与次级按钮白底。 */
[role="dialog"] [class*="actions"] button:not([role="switch"]):not([aria-checked]):not([class*="switch"]):not([class*="Switch"]):not([class*="icon"]):not([class*="Icon"]){
  font-weight:500 !important;
  font-size:13px !important;
  padding:6px 16px !important;
  border-radius:8px !important;
  transition:all 0.15s ease !important;
}
/* 主按钮（保存）：激活态 */
body[data-ds-custom-theme="sequoia"] [role="dialog"] [class*="actions"] button[data-tone="primary"]{
  background:#0071e3 !important;
  color:#ffffff !important;
  border:1px solid rgba(0, 113, 227, 0.40) !important;
  box-shadow:0 1px 2px rgba(0, 113, 227, 0.25) !important;
}
body[data-ds-custom-theme="sonoma"] [role="dialog"] [class*="actions"] button[data-tone="primary"]{
  background:#2997ff !important;
  color:#ffffff !important;
  border:1px solid rgba(41, 151, 255, 0.40) !important;
  box-shadow:0 1px 3px rgba(0, 0, 0, 0.35) !important;
}
/* 主按钮（保存）：禁用态保持清晰弱化轮廓与字色，杜绝白底白字 */
body[data-ds-custom-theme="sequoia"] [role="dialog"] [class*="actions"] button[data-tone="primary"]:disabled{
  background:rgba(0, 113, 227, 0.12) !important;
  color:rgba(0, 113, 227, 0.55) !important;
  border:1px solid rgba(0, 113, 227, 0.22) !important;
  box-shadow:none !important;
  opacity:1 !important;
  cursor:not-allowed !important;
}
body[data-ds-custom-theme="sonoma"] [role="dialog"] [class*="actions"] button[data-tone="primary"]:disabled{
  background:rgba(41, 151, 255, 0.16) !important;
  color:rgba(41, 151, 255, 0.55) !important;
  border:1px solid rgba(41, 151, 255, 0.25) !important;
  box-shadow:none !important;
  opacity:1 !important;
  cursor:not-allowed !important;
}
/* 次级按钮（放弃）：激活态 */
body[data-ds-custom-theme="sequoia"] [role="dialog"] [class*="actions"] button:not([data-tone="primary"]):not([role="switch"]):not([aria-checked]):not([class*="switch"]):not([class*="Switch"]):not([class*="icon"]):not([class*="Icon"]){
  background:rgba(255, 255, 255, 0.65) !important;
  color:var(--dsw-alias-label-primary, #1d1d1f) !important;
  border:1px solid rgba(0, 0, 0, 0.14) !important;
  box-shadow:inset 0 1px 0 rgba(255, 255, 255, 0.80) !important;
}
body[data-ds-custom-theme="sonoma"] [role="dialog"] [class*="actions"] button:not([data-tone="primary"]):not([role="switch"]):not([aria-checked]):not([class*="switch"]):not([class*="Switch"]):not([class*="icon"]):not([class*="Icon"]){
  background:rgba(255, 255, 255, 0.08) !important;
  color:var(--dsw-alias-label-primary, #f5f5f7) !important;
  border:1px solid rgba(255, 255, 255, 0.16) !important;
  box-shadow:inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
}
/* 次级按钮（放弃）：禁用态保持可见细边框与清爽底色，文字不溶解 */
body[data-ds-custom-theme="sequoia"] [role="dialog"] [class*="actions"] button:not([data-tone="primary"]):not([role="switch"]):not([aria-checked]):not([class*="switch"]):not([class*="Switch"]):not([class*="icon"]):not([class*="Icon"]):disabled{
  background:rgba(0, 0, 0, 0.03) !important;
  color:rgba(0, 0, 0, 0.38) !important;
  border:1px solid rgba(0, 0, 0, 0.10) !important;
  box-shadow:none !important;
  opacity:1 !important;
  cursor:not-allowed !important;
}
body[data-ds-custom-theme="sonoma"] [role="dialog"] [class*="actions"] button:not([data-tone="primary"]):not([role="switch"]):not([aria-checked]):not([class*="switch"]):not([class*="Switch"]):not([class*="icon"]):not([class*="Icon"]):disabled{
  background:rgba(255, 255, 255, 0.03) !important;
  color:rgba(255, 255, 255, 0.38) !important;
  border:1px solid rgba(255, 255, 255, 0.10) !important;
  box-shadow:none !important;
  opacity:1 !important;
  cursor:not-allowed !important;
}

/* 弹窗内 Switch 开关规范：彻底排除 actions/button 规则污染，确保两态对比鲜明与质感统一。
   🚨 判据必须是 aria-checked（真正的「两态开关」语义），**不得**用 [class*="switch"]。
   实踩回归 1：宽通配会命中 ui-kanye-pet 的 .KanyeCard_switch（42×24 / 18px ::after 滑块 /
   translateX(18px)，用的是 aria-pressed 而非 aria-checked），把它强改成 36×20 /
   16px / translateX(16px)，滑块尺寸与位移全错位 —— 表现为「桌宠 tab 开关 UI 异常」。
   实踩回归 2：dsh-notify-me 的 .dnm-switch 使用标准 role="switch" + aria-checked，
   但自身基于 position:absolute + left:16px 进行动画位移；若被此处的 transform: translateX(16px) 叠加，
   会导致 16px(left) + 16px(transform) = 32px 双重位移，滑块在打开时直接溢出轨道右侧外壁 —— 表现为「通知提醒 tab 开关在打开时显示异常」。
   排除守卫：必须显式排除自带几何/位移动画的第三方自绘开关（:not([class*="dnm-switch"]) 等），
   仅对官方原生 Switch 与 dsh-skills-manager 的 .dssm-enable-switch 等标准几何开关照常规范化。 */
[role="dialog"] button[aria-checked]:not([class*="dnm-switch"]) {
  box-sizing: border-box !important;
  position: relative !important;
  flex: 0 0 auto !important;
  width: 36px !important;
  height: 20px !important;
  padding: 2px !important;
  border: none !important;
  border-radius: 999px !important;
  corner-shape: round !important;
  box-shadow: none !important;
  cursor: pointer !important;
  transition: background-color 0.15s ease !important;
}

/* 关闭态：清爽中性深浅两档底槽，避免弹窗内 l3 边框极淡导致开关隐形 */
body:not([data-ds-dark-theme]) [role="dialog"] button[aria-checked]:not([aria-checked="true"]):not([class*="dnm-switch"]) {
  background: rgba(0, 0, 0, 0.15) !important;
}

body[data-ds-dark-theme] [role="dialog"] button[aria-checked]:not([aria-checked="true"]):not([class*="dnm-switch"]) {
  background: rgba(255, 255, 255, 0.18) !important;
}

/* 开启态：高对比度的品牌主色（Sequoia 天蓝 / Sonoma 曜蓝 / 各主题 brand-primary） */
[role="dialog"] button[aria-checked="true"]:not([class*="dnm-switch"]) {
  background: var(--dsw-alias-brand-primary, #147ce5) !important;
}

/* 开关滑块（Thumb）：纯白微投影，平滑滑动 */
[role="dialog"] button[aria-checked]:not([class*="dnm-switch"]) > span {
  box-sizing: border-box !important;
  display: block !important;
  width: 16px !important;
  height: 16px !important;
  border-radius: 50% !important;
  corner-shape: round !important;
  background: #ffffff !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.20) !important;
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
  pointer-events: none !important;
}

[role="dialog"] button[aria-checked="true"]:not([class*="dnm-switch"]) > span {
  transform: translateX(16px) !important;
}
/* 弹窗原生独立输入框与下拉选择框：仅对顶层孤立的原生控件生效，严禁污染任何复合输入组件内部字段 */
body[data-ds-custom-theme="sequoia"] [role="dialog"] input:not([type="checkbox"]):not([type="radio"]):not([class*="value"]):not([class*="input"]):not([class*="Input"]):not(span > input):not([class*="wrap"] input):not([class*="Wrap"] input):not([class*="wrapper"] input):not([class*="Wrapper"] input):not([class*="stepper"] input):not([class*="search"] input):not([class*="Search"] input),
body[data-ds-custom-theme="sequoia"] [role="dialog"] select{
  background:rgba(255, 255, 255, 0.55) !important;
  border-color:rgba(0, 0, 0, 0.08) !important;
}
body[data-ds-custom-theme="sonoma"] [role="dialog"] input:not([type="checkbox"]):not([type="radio"]):not([class*="value"]):not([class*="input"]):not([class*="Input"]):not(span > input):not([class*="wrap"] input):not([class*="Wrap"] input):not([class*="wrapper"] input):not([class*="Wrapper"] input):not([class*="stepper"] input):not([class*="search"] input):not([class*="Search"] input),
body[data-ds-custom-theme="sonoma"] [role="dialog"] select{
  background:rgba(0, 0, 0, 0.25) !important;
  border-color:rgba(255, 255, 255, 0.10) !important;
}
/* 全局复合输入容器免疫层：任何由外层容器（span/wrap/stepper/search）托管外框的 input，内层 input 彻底杜绝白框 */
[class*="wrap"] > input,
[class*="Wrap"] > input,
[class*="wrapper"] > input,
[class*="Wrapper"] > input,
[class*="stepper"] input,
[class*="Stepper"] input,
[class*="search"] input,
[class*="Search"] input,
[class*="searchBox"] input,
[class*="search-box"] input,
[class*="searchRow"] input,
[class*="search-row"] input,
[class*="tabSearch"] input,
[class*="themeSearch"] input,
[class*="backupInput"] input,
[class*="inlineInput"] input,
[class*="noteInput"] input,
[class*="pluginSearch"],
span:has(> input) > input,
span > input[class*="input"],
span > input[class*="Input"],
[role="dialog"] [class*="wrap"] input,
[role="dialog"] [class*="Wrap"] input,
[role="dialog"] [class*="wrapper"] input,
[role="dialog"] [class*="Wrapper"] input,
[role="dialog"] [class*="stepper"] input,
[role="dialog"] [class*="Stepper"] input,
[role="dialog"] [class*="search"] input,
[role="dialog"] [class*="Search"] input,
[role="dialog"] [class*="tabSearch"] input,
[role="dialog"] [class*="themeSearch"] input,
[role="dialog"] span > input,
[role="dialog"] span:has(> input) input {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}
/* 弹窗细滚动条 */
[role="dialog"] [class*="options"]::-webkit-scrollbar{
  width:5px !important;
}
[role="dialog"] [class*="options"]::-webkit-scrollbar-thumb{
  background:var(--dsh-scrollbar-thumb, rgba(128,128,128,0.2)) !important;
  border-radius:999px !important;
}
[role="dialog"] [class*="options"]::-webkit-scrollbar-thumb:hover{
  background:var(--dsh-scrollbar-thumb-hover, rgba(128,128,128,0.4)) !important;
}

/* ══════════════════════════════════════════════════════════════════════════
   插件市场（dsh-market）在设置弹窗内的两处可读性缺陷
   ══════════════════════════════════════════════════════════════════════════

   ⚠️ 适用范围（与 §1.5 的材质门控一致）：**仅 液态 sequoia 与 曜黑 sonoma**。
   其余 4 个主题没有弹窗玻璃改写，市场的原生 layer-1/layer-2 本就是近实心，
   保持官方外观即可 —— 这里若也给它们加规则，反而会把可用的实心条改成透明。

   🚨 缺陷一：任务悬浮窗（.opPanel）透明度太高。
   真因不是本主题「故意调透」，而是**市场借用了会被弹窗玻璃规则改写的 token**：
     · dsh-market 的 .opPanel 写 background: var(--dsw-alias-bg-layer-1)；
     · 本主题为弹窗玻璃把 [role="dialog"] 内的 layer-1 改写成
       rgba(255,255,255,0.36)（深色 0.04，见上方 dialog 规则）；
     · 于是浮层只剩 36% 白，背后卡片标题/描述直接穿透 —— 实测截图中
       「暂无进行中的操作」浮层能清楚读出下面的插件名与版本号。
   修法：市场浮层改用 --dsw-alias-bg-overlay（各主题定义的近实心浮层档），
   不再借用会被弹窗规则改写的 layer token。

   🚨 缺陷二：上滑列表时筛选区（.stickyHead）透明度太高。
   真因是**吸顶态永远不会被触发**，不是填充值不够：
     · dsh-market 1.66 的 catsStuck 只用于组件内部「分类行折叠」计算，
       **不向 DOM 输出任何 stuck 标记**（实测其 client.js 中 data-stuck 出现 0 次，
       Stuck 仅出现在源码注释里）；
     · 而本主题的两态设计是「未吸顶 transparent / 吸顶才给填充」，
       依赖的正是 [data-stuck="true"] / [class*="Stuck"] 这两个永不命中的选择器；
     · 结果：吸顶后筛选区仍是 transparent，卡片从它下面滚过时完全穿透。
   修法：由 market-sticky.ts 观测市场自带的哨兵节点
   （dsh-market 在 stickyHead 前渲染的 <div ref={setCatsSentinel} />），
   按几何关系补出 data-stuck 标记，让这里的两态规则真正生效。

   三条硬规则：
   1. 填充只用 token（--dsw-alias-bg-overlay / --dsw-alias-bg-layer-2），禁止写死主题色；
   2. 未吸顶态必须保持 transparent —— 否则会在弹窗顶部留一条与玻璃底不同色的横带；
   3. 全部规则必须带 sequoia / sonoma 主题门控（§1.5 材质适用范围）。 */

/* 未吸顶：透明融入弹窗玻璃底（不新增可见色带） */
body[data-ds-custom-theme="sequoia"] [data-dsh-market-root] [class*="stickyHead"],
body[data-ds-custom-theme="sonoma"] [data-dsh-market-root] [class*="stickyHead"] {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  box-shadow: none !important;
  transition: background 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sequoia"] [data-dsh-market-root] [class*="stickyHead"]::before,
body[data-ds-custom-theme="sonoma"] [data-dsh-market-root] [class*="stickyHead"]::before {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  transition: background 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

/* 吸顶激活态：近实心遮罩，真正阻断下层卡片文字穿透。
   data-stuck 由 market-sticky.ts 补出（宿主自己不输出）。 */
body[data-ds-custom-theme="sequoia"] [data-dsh-market-root] [class*="stickyHead"][data-stuck="true"],
body[data-ds-custom-theme="sonoma"] [data-dsh-market-root] [class*="stickyHead"][data-stuck="true"] {
  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-2, rgb(245, 245, 247))) !important;
  backdrop-filter: var(--dsh-glass-blur, blur(20px)) saturate(180%) !important;
  -webkit-backdrop-filter: var(--dsh-glass-blur, blur(20px)) saturate(180%) !important;
  box-shadow: 0 4px 16px -4px rgba(15, 23, 42, 0.06) !important;
}
/* ::before 是贴在吸顶条上方那 14px 的补白带（宿主用 bottom:100% 画出），
   必须一起上色，否则吸顶条上方仍有一条透明的「漏字缝」。 */
body[data-ds-custom-theme="sequoia"] [data-dsh-market-root] [class*="stickyHead"][data-stuck="true"]::before,
body[data-ds-custom-theme="sonoma"] [data-dsh-market-root] [class*="stickyHead"][data-stuck="true"]::before {
  background: inherit !important;
  backdrop-filter: inherit !important;
  -webkit-backdrop-filter: inherit !important;
}

/* 任务悬浮窗（.opPanel）：近实心浮层 + 与弹窗一致的柔和投影。
   🚨 不要用 --dsw-alias-bg-layer-1：弹窗内的 layer-1 已被玻璃规则改写成 0.36。 */
body[data-ds-custom-theme="sequoia"] [data-dsh-market-root] [class*="opPanel"],
body[data-ds-custom-theme="sonoma"] [data-dsh-market-root] [class*="opPanel"] {
  background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-2, rgb(255, 255, 255))) !important;
  backdrop-filter: var(--dsh-glass-blur, blur(20px)) saturate(180%) !important;
  -webkit-backdrop-filter: var(--dsh-glass-blur, blur(20px)) saturate(180%) !important;
  border-color: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.10)) !important;
  box-shadow:
    0 20px 52px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 var(--dsh-glass-edge, rgba(255, 255, 255, 0.6)) !important;
}
/* 汇总条（.opAggregate）原本取 layer-2（弹窗内 0.48），叠在已实心的浮层上会
   形成一块比浮层更透的「补丁」。改为同系淡色 tint，层次保留但不破面。 */
body[data-ds-custom-theme="sequoia"] [data-dsh-market-root] [class*="opAggregate"],
body[data-ds-custom-theme="sonoma"] [data-dsh-market-root] [class*="opAggregate"] {
  background: color-mix(in srgb, var(--dsw-alias-label-primary, rgb(0, 0, 0)) 4%, transparent) !important;
}

/* 弹窗进场动画 */
@keyframes dsh-glass-dialog-in {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  body[data-ds-custom-theme="sequoia"] [role="dialog"],
  body[data-ds-custom-theme="sonoma"] [role="dialog"] {
    animation: none !important;
  }
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
   现改用 [data-composer-card]（官方 InputBar.tsx 自带该属性）——
   ⚠️ 不可用 [class$="_card"]：回答选择面板的卡片同样以 _card 结尾且挂在
   composerSeat 内，会被一并命中，把输入坞的聚焦环加到回答面板上。
   填充、虚化、颗粒均已由 A 组统一配方与 --dsh-glass-* 令牌接管，
   此处只保留「聚焦环 + 圆角」这两项纯交互反馈，避免与 A 组 !important 打架。 */
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [data-composer-card] {
  border-radius: 20px !important;
  transition: box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sequoia"] [class*="composerSeat"] [data-composer-card]:focus-within {
  box-shadow:
    inset 0 1px 0 var(--dsh-glass-edge),
    inset 0 -1px 1px var(--dsh-glass-bottom),
    0 0 0 3px rgba(0, 113, 227, 0.18),
    var(--dsw-elevation-prominent, none) !important;
}

body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [data-composer-card] {
  border-radius: 20px !important;
  transition: box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
body[data-ds-custom-theme="sonoma"] [class*="composerSeat"] [data-composer-card]:focus-within {
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
   ⚠️ 只给顶部高光与底部回光两道单向光，**不给闭合 rim**（避免包边）。

   🚨 实测回归（用户反馈「回答正文上方有一长串空白圆角条」）：
   0.2.1-rc.2 宿主把思考过程与工具调用也渲染成 flowItem，并带
   hidden="until-found" + data-turn-process-hidden="true"（默认折叠，实测 74 个
   assistant-step + 99 个 tool-call）。旧选择器 :has([class*="_markdown_"]) 命中这些
   隐藏成员，其 padding: 16px 20px 在内容不可见时把盒子撑成 32px 高的空玻璃条，
   连成一排「空白圆角卡片」。
   ⚠️ 陷阱：不能一刀切用 :not([data-turn-process-member])！因为在回答生成过程中
   （streaming / liveProcess 阶段），宿主 ChatNodeSeat 把正在输出的正文也挂上
   data-turn-process-member，直到回答结束 turnClosed 后才摘除；一刀切会导致正文在
   回答过程中失去卡片包裹，回答结束才突然收拢成卡片。
   修法：排除 [hidden] 与 [data-turn-process-hidden="true"]，并通过
   :is([data-chat-group-part="response"], :not([data-turn-process-member]))
   放行正在流式输出的正文，同时准确阻断折叠思考与工具成员。 */
body[data-ds-custom-theme="sequoia"] [data-slot="main.conversation"] [class*="flowItem"]:not([hidden]):not([data-turn-process-hidden="true"]):is([data-chat-group-part="response"], :not([data-turn-process-member])):has([class*="_markdown_"]),
body[data-ds-custom-theme="sonoma"] [data-slot="main.conversation"] [class*="flowItem"]:not([hidden]):not([data-turn-process-hidden="true"]):is([data-chat-group-part="response"], :not([data-turn-process-member])):has([class*="_markdown_"]) {
  background:var(--dsh-glass-sheen),var(--dsh-glass-fill) !important;
  /* ── 零收益项归零（性能）─────────────────────────────────────────────
     卡片躺在 flowItem 内，背后是 centerCol 的背景层，**不会有内容从卡片下方
     滚过** → blur 的输入恒为静态底色，输出与静态填充无异，纯浪费。
     长会话里每张卡片都是一个永久合成层，N 张 = N 份全尺寸纹理。
     本文件 97-99 行已记录同一判断：「纯色背景下 blur(纯色)=纯色，AI 卡片
     这类大面板不会有深色主题那样的通透感，是不要光晕的必然代价」。
     故只保留 sheen + fill 的静态玻璃外观（观感不变），去掉滤镜。
     ✅ 输入坞 / 任务卡 / 撤回气泡（303 行）背后有内容滚过，**保留 blur**。 */
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
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
  /* ── 零收益项归零（性能）─────────────────────────────────────────────
     sequoia 的 --dsw-alias-bg-app-image 是 none（用户明确不要光晕），
     故侧栏背后恒为纯色 rgb(245,245,247)。blur(纯色)=纯色 —— 该层在数学上
     不产生任何像素差异，却要每帧为整条侧栏分配一张全高合成纹理并跑高斯卷积。
     按本文件「观感 = 模糊半径 ÷ 填充不透明度」公式衡量：此处分子零收益。
     门禁 sequoia-neutral-check C 组相应由「断言 56px」翻转为「断言 none」。
     ⚠️ sonoma 背后有静态径向光斑（1807 行），保留其 34px 不动。 */
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
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
body[data-ds-custom-theme="sequoia"] [class*="rightbarCol"] [data-sidebar-right-panel]:not([aria-hidden="true"]) {
  background:
    linear-gradient(180deg,
      rgb(245, 245, 247) 0,
      rgb(245, 245, 247) var(--dsh-fusion-top, 44px),
      rgba(245, 245, 247, 0.88) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(245, 245, 247, 0.72) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    rgba(245, 245, 247, 0.68) !important;
  box-shadow: none !important;
}
body[data-ds-custom-theme="sonoma"] [class*="rightbarCol"] [data-sidebar-right-panel]:not([aria-hidden="true"]) {
  background:    linear-gradient(180deg,
      rgb(22, 24, 30) 0,
      rgb(22, 24, 30) var(--dsh-fusion-top, 44px),
      rgba(22, 24, 30, 0.55) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(22, 24, 30, 0) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    radial-gradient(ellipse 85% 65% at 52% 28%, rgba(41, 151, 255, 0.12) 0%, transparent 100%),
    rgba(18, 20, 25, 0.55) !important;
  /* 去掉顶部 inset 亮线（会在顶栏正下方形成横贯亮线） */
  box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.09) !important;
}

/* ══════════════════════════════════════════════════════════════════════════
   右栏面板「全屏态」必须实心（用户反馈：文件 diff 悬浮面板透明度太高）
   ══════════════════════════════════════════════════════════════════════════

   🚨 根因：右栏面板在 **push 态**是停在对话右侧的窄栏，背后是页面底色，
   0.68 的半透明填充读作「玻璃侧栏」，是设计意图。
   但在 **fullscreen 态**（data-sidebar-right-panel="fullscreen"，
   官方 SidebarRight.tsx:313）面板铺满 100vw，**直接压在对话正文之上** ——
   此时 0.68 填充就变成正文透光的纱窗：实测 dsh-git-panel 的 diff 视图
   （GitDiffView，注册在 sidebar.right.pane.tab 槽位）铺满全屏后，
   对话里的中文正文与代码 diff 叠印在一起，两者都读不清。

   两条硬规则：
   1. 判据用**属性值** [data-sidebar-right-panel="fullscreen"]，
      不用类名、不用 :has() 猜 —— 该属性值是官方明确的状态标识；
   2. push 态**保持原样**（半透明玻璃侧栏是设计意图，不能一起改成实心）。

   ⚠️🚨 特异性陷阱（实测踩到）：通栏规则带 :not([aria-hidden="true"])，
   特异性是 (0,4,1)；若 fullscreen 规则只写 [data-sidebar-right-panel="fullscreen"]
   则只有 (0,3,1) —— **即使写在后面也赢不了**，实测计算值仍是 0.68。
   故 fullscreen 规则必须带同样的 :not() 守卫，把特异性拉平到 (0,4,1)，
   再靠「源序在后」取胜。 */
body[data-ds-custom-theme="sequoia"] [class*="rightbarCol"] [data-sidebar-right-panel="fullscreen"]:not([aria-hidden="true"]) {
  background:
    linear-gradient(180deg,
      rgb(245, 245, 247) 0,
      rgb(245, 245, 247) var(--dsh-fusion-top, 44px),
      rgba(245, 245, 247, 1) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(245, 245, 247, 1) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    rgb(245, 245, 247) !important;
  box-shadow: none !important;
}
body[data-ds-custom-theme="sonoma"] [class*="rightbarCol"] [data-sidebar-right-panel="fullscreen"]:not([aria-hidden="true"]) {
  background:
    linear-gradient(180deg,
      rgb(22, 24, 30) 0,
      rgb(22, 24, 30) var(--dsh-fusion-top, 44px),
      rgba(22, 24, 30, 1) calc(var(--dsh-fusion-top, 44px) + 52px),
      rgba(22, 24, 30, 1) calc(var(--dsh-fusion-top, 44px) + 100px)) no-repeat,
    rgb(22, 24, 30) !important;
  box-shadow: none !important;
}

/* 强制保障设置与模态弹窗全屏视口居中，彻底消除包含块压迫 */
[role="presentation"]:has(> [role="dialog"]) {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

/* ⚠️ 严禁让遮罩通顶（inset: 0）。
   桌面端 y=0..40 那条顶栏是 **Windows 原生绘制**的（Electron titleBarOverlay），
   网页遮罩物理上永远盖不住它。若在此把 .mask 拉到 top:0，网页内遮罩变深、而
   原生顶栏和右上角三按钮仍是浅色，反而把色差放大成一块突兀的亮矩形。
   官方用 --dsh-frame-chrome-top 让遮罩从 40px 起画，正是为了让「遮罩」与
   「原生顶栏」各自完整、互不重叠；两者的颜色统一由探针色负责
   （见 resolveTitlebarProbeColor）。 */

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

/* 修复 markdown 表格 hover 时底边线下移与抖动：
   消解官方在 .tableScroll.md-table-wide 上常态 padding-bottom: 8px、hover 切换为 0 的 hack。
   统一常态与 hover 的 padding-bottom 为 0，并保持 overflow-x: auto。 */
[class*="tableScroll"].md-table-wide {
  overflow-x: auto !important;
  padding-bottom: 0 !important;
}
[class*="tableScroll"].md-table-wide:hover,
[class*="tableScroll"].md-table-wide:focus-visible {
  overflow-x: auto !important;
  padding-bottom: 0 !important;
}

/* ── 宽表格「出血」越界（液态/曜黑的玻璃回复卡片专属）──────────────────────
   🚨 症状（用户实测）：
     ① 长表格底部的横向滚动条，左端跑到表格/卡片边界之外，画在页面底色上；
     ② 表格右侧内容从卡片右侧透出来，压到右栏与滚动条槽上。

   🔍 真因不是本插件写错了宽度，而是**官方满幅出血公式 + 卡片内边距**叠加：
     官方 ui-chat 的 AssistantMarkdown.module.css 对 ≥4 列的表格加 .md-table-wide，
     用容器查询单位把表格撑到**整个会话滚动容器**的宽度：
       --dsh-table-spare: max(0px, (100cqw - --dsh-chat-content-width) / 2)
       --dsh-table-lead : calc(spare + min(--dsh-chat-content-width, 100cqw) - 100%)
       width      : calc(100% + lead + spare)
       margin-left: calc(-1 * lead)
       padding-left: lead
     在没有卡片时，这套算法让表格左右两边对齐**页面边界**（官方设计意图，正确）。
     但本插件给回复加了一层玻璃卡（padding:16px 20px，且**不能**加 overflow:hidden，
     否则会裁掉焦点环与展开态），于是「100%」变成**卡片内容盒**宽度，而 spare/lead
     仍按整列容器算 —— 表盒被撑到整列宽，再左移 lead，必然从卡片两侧各溢出一截。
     溢出量恰好随窗宽增大（spare ∝ 列宽），所以宽屏下尤其明显。

   ✅ 修法：在这两个玻璃主题里把出血系数**归零**，让滚动盒 = 卡片内容盒宽度
     （width:100% + max-width:100% + margin/padding 复位），横向滚动条自然落在卡片内侧。
     只动 sequoia / sonoma，且作用域**精确对齐上方卡片规则**（同一个 flowItem 谓词）——
     其余 4 个主题没有卡片，必须保留官方满幅出血；卡片外的表格（如弹窗内）也不动。
     ⚠️ 官方该规则是非 !important 的类选择器（.v5IAXa_body .md-table-wide，特异性 0,2,0），
        这里用 !important 覆盖，不受样式注入先后顺序影响。
     ⚠️ 不能改用 overflow:hidden 在卡片上裁掉溢出：那会同时裁掉表格的横向滚动能力、
        卡片内焦点环与展开态（见 §1.5 同类教训），属于遮盖而非修复。 */
body[data-ds-custom-theme="sequoia"] [data-slot="main.conversation"] [class*="flowItem"]:not([hidden]):not([data-turn-process-hidden="true"]):is([data-chat-group-part="response"], :not([data-turn-process-member])):has([class*="_markdown_"]) [class*="tableScroll"].md-table-wide,
body[data-ds-custom-theme="sonoma"] [data-slot="main.conversation"] [class*="flowItem"]:not([hidden]):not([data-turn-process-hidden="true"]):is([data-chat-group-part="response"], :not([data-turn-process-member])):has([class*="_markdown_"]) [class*="tableScroll"].md-table-wide {
  --dsh-table-spare: 0px !important;
  --dsh-table-lead: 0px !important;
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
  overflow-x: auto !important;
}

/* 左侧边栏工作区上方自动化任务入口显隐控制 */
html[data-dsh-hide-schedule="true"] [class*="panelRow"]:has([data-dsh-schedule-marker]),
body[data-dsh-hide-schedule="true"] [class*="panelRow"]:has([data-dsh-schedule-marker]),
html[data-dsh-hide-schedule="true"] [class*="panelRow"][aria-label="自动化任务"],
body[data-dsh-hide-schedule="true"] [class*="panelRow"][aria-label="自动化任务"],
html[data-dsh-hide-schedule="true"] [class*="panelRow"][aria-label="Automation tasks"],
body[data-dsh-hide-schedule="true"] [class*="panelRow"][aria-label="Automation tasks"] {
  display: none !important;
}
html[data-dsh-hide-schedule="true"] nav[class*="panelList"]:has(> [class*="panelRow"]:only-child:has([data-dsh-schedule-marker])),
body[data-dsh-hide-schedule="true"] nav[class*="panelList"]:has(> [class*="panelRow"]:only-child:has([data-dsh-schedule-marker])),
html[data-dsh-hide-schedule="true"] nav[class*="panelList"]:has(> [class*="panelRow"]:only-child[aria-label="自动化任务"]),
body[data-dsh-hide-schedule="true"] nav[class*="panelList"]:has(> [class*="panelRow"]:only-child[aria-label="自动化任务"]),
html[data-dsh-hide-schedule="true"] nav[class*="panelList"]:has(> [class*="panelRow"]:only-child[aria-label="Automation tasks"]),
body[data-dsh-hide-schedule="true"] nav[class*="panelList"]:has(> [class*="panelRow"]:only-child[aria-label="Automation tasks"]) {
  margin-bottom: 0 !important;
}

/* 左侧边栏面板列表「更多」入口显隐控制。
   官方 PanelMoreMenu 由 sidebar.panellist.actions 槽是否有注册项决定，本机注册者是
   dsh-client-ui-entry-customization，无法从插件侧注销，因此用 DOM 标记隐藏。
   锚点优先用语言无关的 aria-haspopup：PanelRow 的 button 没有这个属性，不会误伤。 */
html[data-dsh-hide-more="true"] nav[class*="panelList"] [class*="moreAnchor"],
body[data-dsh-hide-more="true"] nav[class*="panelList"] [class*="moreAnchor"],
html[data-dsh-hide-more="true"] nav[class*="panelList"] button[aria-haspopup="menu"],
body[data-dsh-hide-more="true"] nav[class*="panelList"] button[aria-haspopup="menu"],
html[data-dsh-hide-more="true"] nav[class*="panelList"] [class*="panelRow"][aria-label="更多"],
body[data-dsh-hide-more="true"] nav[class*="panelList"] [class*="panelRow"][aria-label="更多"],
html[data-dsh-hide-more="true"] nav[class*="panelList"] [class*="panelRow"][aria-label="More"],
body[data-dsh-hide-more="true"] nav[class*="panelList"] [class*="panelRow"][aria-label="More"] {
  display: none !important;
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
/** Marker attribute for the injected boot-spinner stylesheet. */
const BOOT_SPINNER_ATTRIBUTE = 'data-ui-theme-custom-boot-spinner';
/**
 * Re-inject the boot-spinner correction once the bundle activates, for pages
 * the node half served before it carried this style. Idempotent across HMR
 * re-applies and cheap enough to leave the node half's copy in place.
 * @returns disposer removing the style element.
 */
function injectBootSpinner() {
    if (typeof document === 'undefined')
        return () => { };
    if (document.head.querySelector(`style[${BOOT_SPINNER_ATTRIBUTE}]`) !== null)
        return () => { };
    const tag = document.createElement('style');
    tag.setAttribute(BOOT_SPINNER_ATTRIBUTE, '');
    tag.textContent = BOOT_SPINNER_CSS;
    document.head.appendChild(tag);
    return () => { tag.remove(); };
}
/** Theme id → tokens map for direct CSS-variable application. */
const THEME_TOKEN_MAP = {
    sequoia: SEQUOIA_TOKENS,
    sonoma: SONOMA_TOKENS,
    void: VOID_TOKENS,
    jade: JADE_TOKENS,
    solar: SOLAR_TOKENS,
    parchment: PARCHMENT_TOKENS,
};
/** Theme id → colorScheme map so light custom themes switch palette properly. */
const THEME_SCHEME_MAP = {
    sequoia: 'light',
    sonoma: 'dark',
    void: 'dark',
    jade: 'light',
    solar: 'dark',
    parchment: 'light',
};
/**
 * 把可能半透明的颜色合成到不透明底色上，得到 alpha=1 的 `rgb()`。
 *
 * 为什么必须自己合成：Windows 原生 WCO 控件收到带 alpha 的颜色后，会与窗口底层的
 * **黑**强制预乘混合（`rgba(245,245,247,0.66)` → `#a2a2a3`），表现为顶栏右侧一块
 * 突兀的脏灰块，比周围暗几十个色阶。所以探针必须交出合成后的实色。
 * @param color - 遮罩自身的 background-color，可能是 rgba。
 * @param base - 遮罩背后的不透明底色。
 */
function compositeOver(color, base) {
    const parse = (text) => {
        const match = text.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/u);
        if (match === null)
            return [0, 0, 0, 1];
        return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])];
    };
    const [red, green, blue, alpha] = parse(color);
    const [baseRed, baseGreen, baseBlue] = parse(base);
    const mix = (top, bottom) => Math.round(top * alpha + bottom * (1 - alpha));
    return `rgb(${mix(red, baseRed)}, ${mix(green, baseGreen)}, ${mix(blue, baseBlue)})`;
}
/**
 * 遮罩的底色是否已经可靠可读。
 *
 * 遮罩节点插入 DOM 的同一帧里，`background-color` 往往还是初始值（`rgba(0, 0, 0, 0)`
 * 或空），因为宿主的 CSS 类刚挂上、样式尚未生效。此时若照常合成，会先算出一个
 * 「等于主题实色」的假值并发一次 IPC，等下一轮才算出真值再发一次 —— 原生层收到
 * 两次不同的颜色，就是用户看到的「弹窗打开瞬间闪一下」。
 *
 * 判据：完全透明即视为未就绪，宁可这一轮不发。
 * @param color - 遮罩的 computed backgroundColor。
 */
function maskColorReady(color) {
    const match = color.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/u);
    if (match === null)
        return false;
    const alpha = match[4] === undefined ? 1 : Number(match[4]);
    return alpha > 0;
}
/**
 * 当前覆盖全屏的「舞台层」，找不到返回 null。
 *
 * 用途只有一个：识别**启动期开屏动画**那种整屏纯色覆盖层（如 dsh-ink-whale 的
 * `.dshiw-root`，背景 `#000`/`#fff`）。这类层只在启动瞬间出现一次、此时页面尚无
 * 内容，跟随它的颜色不会表现为"闪烁"；否则三个原生按钮会孤零零亮在整屏黑/白之上。
 *
 * ## 刻意排除模态弹窗遮罩
 *
 * 设置面板的遮罩同样是全屏元素，但**必须排除**：它每次开合都会出现，
 * 跟随它变暗就等于每次开合都让原生层重绘一次 —— 那正是用户反复报的"闪烁"。
 * 判据：位于 `role="dialog"` 的父容器内、或自身带 `aria-hidden="true"` 的兄弟遮罩。
 *
 * 判据只用可测事实：铺满视口、`position: fixed|absolute`、背景不透明、非弹窗附属。
 * @returns 舞台层元素；没有返回 null。
 */
function findStageMask() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // 必须全文档扫描，不能只看 body.children。
    // 实测教训：dsh-ink-whale 的 .dshiw-root 挂在 shell.overlay 槽位里，位于 #root 内
    // 而非 body 的直接子节点；只扫 body.children 会漏掉它，开屏动画时按钮照样凸显。
    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
    const dialogHost = dialog?.parentElement ?? null;
    const candidates = document.querySelectorAll('body *');
    let best = null;
    let bestArea = 0;
    for (const element of candidates) {
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE')
            continue;
        // 排除模态弹窗体系：宿主容器本身、遮罩兄弟、以及 dialog 的祖先链。
        if (dialogHost !== null && (element === dialogHost || element.contains(dialog)))
            continue;
        if (element.getAttribute('aria-hidden') === 'true')
            continue;
        const style = getComputedStyle(element);
        if (style.position !== 'fixed' && style.position !== 'absolute')
            continue;
        if (style.display === 'none' || style.visibility === 'hidden')
            continue;
        // 遮罩依赖 backdrop-filter 透出背后内容；开屏舞台层是自己画满整屏的实色。
        if (style.backdropFilter !== 'none' && style.backdropFilter !== '')
            continue;
        const rect = element.getBoundingClientRect();
        // 必须基本铺满视口：舞台层是整屏覆盖，面板本身不算。
        if (rect.width < viewportWidth * 0.95 || rect.height < viewportHeight * 0.95)
            continue;
        if (!maskColorReady(style.backgroundColor))
            continue;
        const area = rect.width * rect.height;
        if (area <= bestArea)
            continue;
        bestArea = area;
        best = element;
    }
    return best;
}
/**
 * 标题栏探针色：官方 Windows preload 读 body 上的 `--dsw-specific-sidebar-fill`
 * 来决定右上角三个原生按钮的底色。
 *
 * ## 设计取舍（2026-10-23 用户拍板：优先「不闪」）
 *
 * Windows 的 `setTitleBarOverlay` **每改一次颜色就重绘一次原生非客户区**，
 * 这个重绘在视觉上就是一次跳变。因此「顶栏随弹窗遮罩变暗」与「打开弹窗不闪」
 * 在物理上不可兼得 —— 联动必然伴随一次可见跳变。
 *
 * 用户选择不闪，于是本函数的策略是：
 * - **常态**：只回主题实色，与左侧顶栏逐像素同色，任何弹窗开合都不改色 → 零跳变。
 * - **例外（全屏舞台层）**：仅当出现铺满视口的纯色舞台层（如 dsh-ink-whale 开屏动画
 *   `#000`/`#fff`）时才跟随。这类层只在启动瞬间出现一次、且此时页面尚无内容，
 *   一次颜色变化不会表现为"闪烁"，而能避免按钮孤零零地亮在整屏黑/白之上。
 *
 * **不跟随模态弹窗遮罩**是刻意的：设置面板这类高频开合场景，一次跳变就是用户
 * 反复抱怨的"闪烁"；那种情况下按钮与顶栏同色（略亮于遮罩）是更小的代价。
 * @param base - 该主题顶栏的实色（alpha=1）。
 * @returns 探针色；舞台层色尚未就绪时返回 undefined，调用方应跳过本轮写入。
 */
function resolveTitlebarProbeColor(base) {
    if (base === undefined || base === '')
        return undefined;
    const stage = findStageMask();
    if (stage === null)
        return base;
    const stageColor = getComputedStyle(stage).backgroundColor;
    // 未就绪就不发：避免「先发主题实色、再发舞台色」的两次 IPC 造成闪烁。
    if (!maskColorReady(stageColor))
        return undefined;
    return compositeOver(stageColor, base);
}
/**
 * 上一次实际写入 body/html 的顶栏探针色。
 *
 * 存在的唯一目的：掐断自触发循环。官方 preload 监听 `body` 的 `style` 属性，
 * 我们自己写 `--dsw-specific-sidebar-fill` 也会让那个 observer 回调、进而触发
 * 一次原生 `setTitleBarOverlay` 重绘。若每次 MutationObserver 回调都无脑重写，
 * 就会形成「写 → 回调 → 再写」的抖动，表现为顶栏右侧闪烁。
 */
let lastTitlebarProbeColor;
/**
 * 把顶栏底色写到 **html 与 body 双端**（值未变时完全不动 DOM）。
 *
 * 为什么必须双写（层叠陷阱，AGENTS.md §6.3 已记录同类坑）：
 * - 官方 Windows 壳的 40px 顶栏填充规则是
 *   `[data-windows-titlebar] .frame { background: var(--dsw-specific-sidebar-fill) }`，
 *   该元素在 html 树下，读到的是 **html 上的同名变量**；
 * - 官方 preload 的探针 span 挂在 body 下，读到的是 **body 上的同名变量**；
 * - 两者若只写一端，另一端仍取旧值 → 顶栏与右上角按钮颜色不一致，正是
 *   「遮罩下三个按钮凸显」（或顶栏与按钮暗暗分家）的直接成因。
 * @param color - 已合成到 alpha=1 的实色。
 * @returns 是否真的写了 DOM。
 */
function writeTitlebarProbeColor(color) {
    if (color === lastTitlebarProbeColor)
        return false;
    lastTitlebarProbeColor = color;
    document.documentElement.style.setProperty('--dsw-specific-sidebar-fill', color);
    document.body.style.setProperty('--dsw-specific-sidebar-fill', color);
    return true;
}
/** Token names this plugin wrote inline (its retraction set). */
const APPLIED_TOKEN_NAMES = new Set();
const TITLEBAR_PRESETS = {
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
};
/**
 * Synchronize theme and background color with the Tauri desktop shell (if running in desktop).
 * Toggles Windows DWM native title bar dark/light mode and sets caption color on Windows 11.
 *
 * 刻意不下发字号：窗口顶栏属于 chrome（交通灯、托盘菜单都是固定尺寸），
 * 业界惯例与官方 --dsh-content-font-size（content 轴）都不缩放窗口装饰。
 * 字号只作用于页面内的内容区与侧边栏/设置面板。
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
    if (themeId) {
        document.body.setAttribute('data-ds-custom-theme', themeId);
    }
    else {
        document.body.removeAttribute('data-ds-custom-theme');
    }
    // 清理不再属于新主题的遗留内联 token（如已移除的字体变量）
    const nextKeys = new Set(Object.keys(tokens));
    for (const name of APPLIED_TOKEN_NAMES) {
        if (!nextKeys.has(name)) {
            document.documentElement.style.removeProperty(name);
            document.body.style.removeProperty(name);
            APPLIED_TOKEN_NAMES.delete(name);
        }
    }
    // 显式防御：若未定义自定义字体，彻底抹除内联残留，回退系统默认
    if (!tokens['--dsw-font-family']) {
        document.documentElement.style.removeProperty('--dsw-font-family');
        document.body.style.removeProperty('--dsw-font-family');
    }
    for (const [key, value] of Object.entries(tokens)) {
        // 跳过探针变量：它由下方 writeTitlebarProbeColor 统一以 alpha=1 实色写入。
        // 若这里先写主题自带的半透明值，紧接着再写实色，body.style 在一次主题应用里
        // 会变更两次 —— 官方 preload 的 observer 会先读到半透明中间态并发一次 IPC，
        // 再读到实色发第二次，原生层两次重绘就是可见的闪烁。
        // 只在「本插件自己写这个变量」时跳过；token 表里没有它时无需处理。
        if (key === '--dsw-specific-sidebar-fill' && themeId !== undefined)
            continue;
        document.documentElement.style.setProperty(key, value);
        document.body.style.setProperty(key, value);
        APPLIED_TOKEN_NAMES.add(key);
    }
    const titlebar = themeId ? TITLEBAR_PRESETS[themeId] : undefined;
    const titlebarBg = titlebar?.bg ?? tokens['--dsw-alias-bg-base'];
    // 去重缓存与 DOM 可能已被上面的循环改过，失效以防误判。
    lastTitlebarProbeColor = undefined;
    // 官方 Windows preload 探测挂在 body 上的 --dsw-specific-sidebar-fill 来设置
    // 右上角三个原生控制按钮 (WCO) 的底色。三个坑都在这里收口：
    // ① 带 alpha 的颜色会被 Windows DWM 与窗口黑底强制预乘（0.66 的 #f5f5f7 → #a2a2a3），
    //    表现为顶栏右侧一块脏灰；② 模态/舞台遮罩生效时顶栏已被压暗，探针若仍给主题实色，
    //    按钮就会比周围亮一大截而"凸显"；③ 半透明值必须先合成到 alpha=1。
    // 故探针色统一走 resolveTitlebarProbeColor。
    const probe = resolveTitlebarProbeColor(titlebarBg);
    if (probe !== undefined)
        writeTitlebarProbeColor(probe);
    // 探针变量被跳过写入，但仍属本插件写的内联变量，必须登记以便切回内置主题时清理。
    if (themeId !== undefined && tokens['--dsw-specific-sidebar-fill'] !== undefined) {
        APPLIED_TOKEN_NAMES.add('--dsw-specific-sidebar-fill');
    }
    syncDesktopTitlebar(colorScheme, titlebarBg, titlebar);
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
    document.body.removeAttribute('data-ds-custom-theme');
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
    // ── 主题偏好与 adopt 防抖保护 ───────────────────────────────────────
    // 官方 ThemeRuntime.adopt() 收到 settings 镜像时，若发现 preference !== section.preference，
    // 会无条件回退为内置主题并 publish()。由于科技主题 ID 无法存入官方 settings schema，
    // 任何外部插件保存配置（广播 settings/document-updated）都会导致 adopt() 误判回滚，
    // 造成 DOM 剧烈抖动与 Windows 原生标题栏 WCO 黑闪。
    // 此处包装 adopt：当启用了科技主题且用户未显式切回内置主题时，锁定 preference 为科技主题，
    // 仅在字号/字体发生真实变更时同步并 publish，从源头阻断回滚和黑闪。
    const rawTheme = theme;
    const originalAdopt = rawTheme.adopt ?? Object.getPrototypeOf(theme)?.adopt;
    if (typeof originalAdopt === 'function') {
        rawTheme.adopt = function () {
            const desired = readSaved();
            if (desired && !builtinPickWins(this.preference, liveBuiltinPick)) {
                if ((this.pendingWrites ?? 0) > 0)
                    return;
                const section = this.host?.getSnapshot?.()?.value;
                if (!section)
                    return;
                const sizesChanged = this.fontSizes && ((section.fontSize !== undefined && this.fontSizes.text !== section.fontSize) ||
                    (section.codeFontSize !== undefined && this.fontSizes.code !== section.codeFontSize) ||
                    (section.terminalFontSize !== undefined && this.fontSizes.terminal !== section.terminalFontSize));
                const fontsChanged = this.fontFamilies && ((section.textFontFamily !== undefined && this.fontFamilies.text !== (section.textFontFamily || '')) ||
                    (section.codeFontFamily !== undefined && this.fontFamilies.code !== (section.codeFontFamily || '')) ||
                    (section.terminalFontFamily !== undefined && this.fontFamilies.terminal !== (section.terminalFontFamily || '')));
                if (this.preference === desired && !sizesChanged && !fontsChanged) {
                    return;
                }
                if (sizesChanged || fontsChanged) {
                    if (sizesChanged && this.fontSizes) {
                        this.fontSizes = Object.freeze({
                            text: section.fontSize ?? this.fontSizes.text,
                            code: section.codeFontSize ?? this.fontSizes.code,
                            terminal: section.terminalFontSize ?? this.fontSizes.terminal,
                        });
                    }
                    if (fontsChanged && this.fontFamilies) {
                        this.fontFamilies = Object.freeze({
                            text: section.textFontFamily !== undefined ? (section.textFontFamily || '') : this.fontFamilies.text,
                            code: section.codeFontFamily !== undefined ? (section.codeFontFamily || '') : this.fontFamilies.code,
                            terminal: section.terminalFontFamily !== undefined ? (section.terminalFontFamily || '') : this.fontFamilies.terminal,
                        });
                    }
                    this.preference = desired;
                    this.publish?.();
                    return;
                }
                if (this.preference !== desired) {
                    this.preference = desired;
                    this.publish?.();
                    return;
                }
            }
            return originalAdopt.call(this);
        };
        ctx.effect(() => () => {
            rawTheme.adopt = originalAdopt;
        }, 'ui-theme-custom: restore adopt wrapper');
    }
    // ── 字号持久化意图保护 ──────────────────────────────────────────────
    // 官方 ThemeRuntime.setFontSize(role, px) 先乐观改本地 fontSizes[role]，
    // 再 void host.set() 异步写盘；adopt() 收到 settings 镜像就覆盖本地 fontSizes。
    // 0.2.1 的 write() 已在 finally 里 adopt()、adopt() 又用 pendingWrites 守住飞行
    // 窗口，但仍留有缝隙：写盘 resolve 后镜像快照尚未推达时，adopt() 会读到旧值。
    // 这里记住用户显式提交的 (role, px)，发现被旧镜像回滚就重新断言，落地后静默。
    // ponytail: 以「静默窗口」判定落地，不引入 settingsScope 依赖；若日后官方暴露
    // setFontSize 的写盘 Promise，应改为 await 该 Promise 精确清除意图。
    let pendingFontSize = null;
    let pendingFontSizeSettle;
    const originalSetFontSize = theme.setFontSize;
    const recordFontSizeIntent = (role, px) => {
        pendingFontSize = { role, px };
        if (pendingFontSizeSettle !== undefined)
            clearTimeout(pendingFontSizeSettle);
        pendingFontSizeSettle = undefined;
    };
    theme.setFontSize = function (role, px) {
        recordFontSizeIntent(role, px);
        originalSetFontSize.call(this, role, px);
    };
    ctx.effect(() => () => {
        theme.setFontSize = originalSetFontSize;
        if (pendingFontSizeSettle !== undefined)
            clearTimeout(pendingFontSizeSettle);
    }, 'ui-theme-custom: restore setFontSize wrapper');
    /**
     * 若快照里的字号被旧镜像回滚，重新断言用户意图。
     * @returns true 表示已重新断言（调用方应中止本次后续处理）。
     */
    const assertFontSizeIntent = (snapshotFontSizes) => {
        if (pendingFontSize === null)
            return false;
        const { role, px } = pendingFontSize;
        if (snapshotFontSizes[role] === px) {
            // 已追上用户意图：再观察一个静默窗口，确认写盘落地后清除意图
            if (pendingFontSizeSettle === undefined) {
                pendingFontSizeSettle = setTimeout(() => {
                    pendingFontSize = null;
                    pendingFontSizeSettle = undefined;
                }, 1500);
            }
            return false;
        }
        // 被回滚：重新断言（用原函数，不重置意图与计时器）
        if (pendingFontSizeSettle !== undefined) {
            clearTimeout(pendingFontSizeSettle);
            pendingFontSizeSettle = undefined;
        }
        try {
            originalSetFontSize.call(theme, role, px);
        }
        catch { /* 超出该 role 的区间时忽略，保持当前渲染 */ }
        return true;
    };
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
        // 字号意图保护必须在其它处理之前：若快照被旧镜像回滚，先重新断言用户的字号，
        // 再走主题恢复逻辑。重新断言会再次触发 theme/change，但此时快照已等于意图，
        // 第二轮只登记静默计时器即返回，递归自然终止。
        if (assertFontSizeIntent(snapshot.fontSizes))
            return;
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
    }, TechThemeRow));
    // ── 新会话版面设置行 ───────────────────────────────────────────────
    // order 10.6：紧随科技主题(10.5)之后，在 Claude 挂件开关(10.7)之前。
    const HOME_LAYOUT_STORAGE_KEY = 'dsh-home-layout';
    function readHomeLayout() {
        try {
            const v = localStorage.getItem(HOME_LAYOUT_STORAGE_KEY);
            if (v === 'classic' || v === 'studio')
                return v;
        }
        catch { }
        return 'studio';
    }
    function writeHomeLayout(val) {
        try {
            localStorage.setItem(HOME_LAYOUT_STORAGE_KEY, val);
        }
        catch { }
    }
    let currentHomeLayout = readHomeLayout();
    let bookPick = Math.random();
    const homeUsage = createHomeUsage(ctx);
    function isHeroPhase() {
        if (typeof document === 'undefined')
            return false;
        // `_composerHero` (and the phase attribute) are the authoritative signals:
        // the composer stack carries that class only in the hero tree. Do NOT probe
        // `[class*="_headline"]` — unrelated popovers use a `…_headline` class too
        // (the context-usage dialog renders `<span class="…_headline">上下文已用</span>`),
        // which flipped this predicate on an ordinary conversation and made the
        // usage panel appear when that popover opened.
        // ⚠️ 通配 [class*="_composerHero"] 是 [class*="composerHero"] 的子集，
        // 两者并列属于纯冗余（每次调用多一次全文档子串扫描），已合并。
        return document.querySelector('[data-phase="hero"]') !== null
            || document.querySelector('[class*="composerHero"]') !== null;
    }
    let coldSeat = null;
    function unmountColdSeat() {
        if (coldSeat === null)
            return;
        coldSeat.root.unmount();
        if (coldSeat.element.parentElement !== null) {
            coldSeat.element.parentElement.removeChild(coldSeat.element);
        }
        coldSeat = null;
    }
    /**
     * @param isHeroProbe - 调用方已算出的 hero 判定；省略则自行探测。
     *   syncHeroAttrs 每次都会先算一次，传进来可省掉一整轮全文档 querySelector。
     */
    function syncColdSeat(isHeroProbe) {
        if (typeof document === 'undefined')
            return;
        const isHero = isHeroProbe ?? isHeroPhase();
        const studioHero = currentHomeLayout === 'studio' && isHero;
        const stack = studioHero
            ? document.querySelector('[class*="_composerStack"][class*="_composerHero"]')
                || document.querySelector('[class*="composerStack"][class*="composerHero"]')
            : null;
        if (stack === null || stack.querySelector(':scope > [data-slot="conversation.input.dock"]') !== null) {
            unmountColdSeat();
            return;
        }
        if (coldSeat !== null && coldSeat.stack === stack && coldSeat.element.parentElement === stack)
            return;
        unmountColdSeat();
        const element = document.createElement('div');
        element.className = 'dsh-theme-home-seat';
        stack.appendChild(element);
        const root = ReactDOM.createRoot(element);
        root.render(React.createElement(HomeUsagePanel, {
            usage: homeUsage,
            bookPick,
        }));
        coldSeat = { stack, element, root };
    }
    let lastHeroState = false;
    let heroPollTimer = null;
    function syncHeroAttrs() {
        if (typeof document === 'undefined')
            return;
        const hero = isHeroPhase();
        const studioHero = currentHomeLayout === 'studio' && hero;
        // 用量轮询只在「工作室版首页」有意义：离开首页或页面进入后台立即停，
        // 否则服务端算完后仍在空转拉取（详见 usage/data.ts 的 setPollEnabled）。
        homeUsage.setPollEnabled(studioHero && !document.hidden);
        if (studioHero) {
            document.body.setAttribute('data-dsh-home-hero', '');
        }
        else {
            document.body.removeAttribute('data-dsh-home-hero');
        }
        if (hero !== lastHeroState) {
            lastHeroState = hero;
            if (hero) {
                bookPick = Math.random();
                if (currentHomeLayout === 'studio') {
                    homeUsage.load(true);
                    homeUsage.loadList();
                    if (heroPollTimer)
                        clearTimeout(heroPollTimer);
                    heroPollTimer = setTimeout(() => {
                        homeUsage.load(true);
                    }, 1500);
                }
            }
            homeUsage.notify();
        }
        syncColdSeat(hero);
    }
    function applyHomeLayout(layout) {
        currentHomeLayout = layout;
        if (typeof document === 'undefined')
            return;
        if (layout === 'studio') {
            document.body.setAttribute('data-dsh-home-layout', 'studio');
            homeUsage.load(false);
            homeUsage.loadList();
        }
        else {
            document.body.removeAttribute('data-dsh-home-layout');
        }
        syncHeroAttrs();
        syncColdSeat();
        homeUsage.notify();
    }
    const homeLayoutStore = createHomeLayoutStore();
    let homeLayoutBound;
    let homeLayoutRevision = 0;
    const syncHomeLayoutRow = () => {
        homeLayoutBound?.sync(readHomeLayout(), ++homeLayoutRevision);
    };
    const homeLayoutInjected = (actions) => {
        homeLayoutBound = actions;
        syncHomeLayoutRow();
        return {
            setLayout: (next) => {
                writeHomeLayout(next);
                applyHomeLayout(next);
                syncHomeLayoutRow();
            },
        };
    };
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'home-layout-custom',
        order: 10.6,
        store: homeLayoutStore,
        locale: SETTINGS_NS,
        inject: homeLayoutInjected,
    }, HomeLayoutRow));
    // ── 注册新会话页输入坞插槽面板 ─────────────────────────────────────
    ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
        name: 'conversation.input.dock',
        id: 'ui-theme-custom-usage',
        order: 40,
    }, () => React.createElement(HomeUsagePanel, {
        usage: homeUsage,
        bookPick,
    })));
    // ── 注册新会话页 Better Call Saul 专属指弹图标 ──────────────────────
    ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({
        name: 'conversation.hero.brand.mark',
        priority: -5,
    }, (props) => {
        if (readHomeLayout() === 'studio') {
            return React.createElement(SaulFingerGunIcon, { size: props?.size ?? 34, className: props?.className });
        }
        return null;
    }));
    // ── Claude 挂件开关行 ───────────────────────────────────────────────
    // order 10.7：紧随科技主题(10.5)之后，在官方字号(11)之前。
    const mascotStore = createMascotStore();
    let mascotBound;
    let mascotRevision = 0;
    const syncMascotRow = () => {
        mascotBound?.sync(readMascotEnabled(), ++mascotRevision);
    };
    const mascotInjected = (actions) => {
        mascotBound = actions;
        syncMascotRow();
        return {
            setMascotEnabled: (enabled) => {
                writeMascotEnabled(enabled);
                syncMascotRow();
                notifyMascotChange(enabled);
            },
        };
    };
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'mascot-toggle-custom',
        order: 10.7,
        store: mascotStore,
        locale: SETTINGS_NS,
        inject: mascotInjected,
    }, MascotRow));
    // ── 右侧边栏初始百分比宽度 ───────────────────────────────────────────
    // order 10.8：紧随输入框挂件(10.7)之后，在官方字号(11)之前。
    let activeLayout;
    let layoutHooked = false;
    const resolveLayout = () => {
        try {
            return ctx.layout ?? ctx.get?.('layout');
        }
        catch {
            return undefined;
        }
    };
    const applyCalculatedRightbar = (targetLayout) => {
        const l = targetLayout ?? activeLayout ?? resolveLayout();
        if (!l?.panels?.setRightbar)
            return;
        const ratio = readRightbarRatio() / 100;
        const viewport = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 1920;
        const targetPx = Math.round(viewport * ratio);
        try {
            l.panels.setRightbar(targetPx);
        }
        catch {
            /* 静默处理 */
        }
    };
    const hookLayout = (l) => {
        if (!l || layoutHooked)
            return;
        activeLayout = l;
        const originalOpen = l.openRightbar;
        if (typeof originalOpen === 'function') {
            layoutHooked = true;
            l.openRightbar = function (track, fullscreen) {
                originalOpen.call(this, track, fullscreen);
                applyCalculatedRightbar(l);
            };
        }
        applyCalculatedRightbar(l);
    };
    ctx.effect(() => {
        const immediate = resolveLayout();
        if (immediate) {
            hookLayout(immediate);
        }
        else {
            ctx.inject(['layout'], (scope) => {
                hookLayout(scope.layout ?? resolveLayout());
            });
        }
        let attempts = 0;
        const timer = setInterval(() => {
            attempts++;
            const l = resolveLayout();
            if (l) {
                hookLayout(l);
                clearInterval(timer);
            }
            else if (attempts >= 50) {
                clearInterval(timer);
            }
        }, 100);
        return () => {
            clearInterval(timer);
        };
    }, 'ui-theme-custom: rightbar initial width ratio');
    const rightbarWidthStore = createRightbarWidthStore();
    let rightbarWidthBound;
    let rightbarWidthRevision = 0;
    const syncRightbarWidthRow = () => {
        rightbarWidthBound?.sync(readRightbarRatio(), ++rightbarWidthRevision);
    };
    const rightbarWidthInjected = (actions) => {
        rightbarWidthBound = actions;
        syncRightbarWidthRow();
        return {
            setRightbarRatio: (ratio) => {
                const next = normalizeRightbarRatio(ratio);
                writeRightbarRatio(next);
                applyCalculatedRightbar();
                syncRightbarWidthRow();
            },
        };
    };
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'rightbar-width-custom',
        order: 10.8,
        store: rightbarWidthStore,
        locale: SETTINGS_NS,
        inject: rightbarWidthInjected,
    }, RightbarWidthRow));
    // ── 自动化任务入口显隐设置行 ─────────────────────────────────────────
    // order 10.85：紧随右侧边栏宽度(10.8)之后，在官方字号(11)之前。
    applyScheduleEntryVisible(readScheduleEntryVisible());
    const scheduleEntryStore = createScheduleEntryStore();
    let scheduleEntryBound;
    let scheduleEntryRevision = 0;
    const syncScheduleEntryRow = () => {
        scheduleEntryBound?.sync(readScheduleEntryVisible(), ++scheduleEntryRevision);
    };
    const scheduleEntryInjected = (actions) => {
        scheduleEntryBound = actions;
        syncScheduleEntryRow();
        return {
            setScheduleEntryVisible: (visible) => {
                writeScheduleEntryVisible(visible);
                applyScheduleEntryVisible(visible);
                syncScheduleEntryRow();
            },
        };
    };
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'schedule-entry-custom',
        order: 10.85,
        store: scheduleEntryStore,
        locale: SETTINGS_NS,
        inject: scheduleEntryInjected,
    }, ScheduleEntryRow));
    // ── 面板列表「更多」入口显隐设置行 ───────────────────────────────────
    // order 10.86：紧随自动化任务入口(10.85)，同在右侧边栏宽度(10.8)与官方字号(11)之间。
    applyMoreEntryVisible(readMoreEntryVisible());
    const moreEntryStore = createMoreEntryStore();
    let moreEntryBound;
    let moreEntryRevision = 0;
    const syncMoreEntryRow = () => {
        moreEntryBound?.sync(readMoreEntryVisible(), ++moreEntryRevision);
    };
    const moreEntryInjected = (actions) => {
        moreEntryBound = actions;
        syncMoreEntryRow();
        return {
            setMoreEntryVisible: (visible) => {
                writeMoreEntryVisible(visible);
                applyMoreEntryVisible(visible);
                syncMoreEntryRow();
            },
        };
    };
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'more-entry-custom',
        order: 10.86,
        store: moreEntryStore,
        locale: SETTINGS_NS,
        inject: moreEntryInjected,
    }, MoreEntryRow));
    // ── 侧边栏字号行 ───────────────────────────────────────────────────
    // order 11.5：紧随官方「字号大小」行(11)，与它构成连续的字号控制组。
    // 对话区字号归官方(11)，侧边栏字号归本插件(11.5)，随后才是对话显示(12)。
    const sidebarStore = createSidebarFontStore();
    let sidebarBound;
    let sidebarRevision = 0;
    const syncSidebarFontRow = () => {
        sidebarBound?.sync(readSidebarFont(), ++sidebarRevision);
    };
    const sidebarInjected = (actions) => {
        sidebarBound = actions;
        syncSidebarFontRow();
        return {
            setSidebarFont: (px) => {
                const next = normalizeSidebarFont(px);
                writeSidebarFont(next);
                applySidebarFont(next);
                syncSidebarFontRow();
            },
        };
    };
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'sidebar-font-custom',
        order: 11.5,
        store: sidebarStore,
        locale: SETTINGS_NS,
        inject: sidebarInjected,
    }, SidebarFontRow));
    ctx.effect(() => {
        const disposeSequoia = ctx.theme.register(SEQUOIA);
        const disposeSonoma = ctx.theme.register(SONOMA);
        const disposeVoid = ctx.theme.register(VOID);
        const disposeJade = ctx.theme.register(JADE);
        const disposeSolar = ctx.theme.register(SOLAR);
        const disposeParchment = ctx.theme.register(PARCHMENT);
        const removeKeyframes = injectButtonDrift();
        const removeSurfaceGlass = injectSurfaceGlass();
        const removeHomeUsageStyles = injectHomeUsageStyles();
        const removeBootSpinner = injectBootSpinner();
        return () => {
            disposeSequoia();
            disposeSonoma();
            disposeVoid();
            disposeJade();
            disposeSolar();
            disposeParchment();
            removeKeyframes();
            removeSurfaceGlass();
            removeHomeUsageStyles();
            removeBootSpinner();
            clearTokens();
        };
    }, 'ui-theme-custom: tech theme registrations + drift keyframes + surface glass');
    // 全主题通用挂件：输入框右上角 Claude 像素小伙伴 Mascot
    ctx.effect(() => {
        return initMascot(ctx);
    }, 'ui-theme-custom: claude mascot companion');
    // 插件市场吸顶筛选区：宿主不输出 stuck 标记，由本插件补出（详见 market-sticky.ts）
    ctx.effect(() => {
        return initMarketStickySync();
    }, 'ui-theme-custom: market sticky head state');
    // 新会话版面状态与用量面板 DOM 观察
    ctx.effect(() => {
        applyHomeLayout(readHomeLayout());
        let rafScheduled = false;
        const scheduleSync = () => {
            if (rafScheduled)
                return;
            rafScheduled = true;
            requestAnimationFrame(() => {
                rafScheduled = false;
                syncHeroAttrs();
            });
        };
        // 🚨 性能（2026-10-29）：这里原本还有 setInterval(syncHeroAttrs, 200)。
        // 它每秒 5 次无条件跑 isHeroPhase()（3 次全文档 querySelector，
        // 含 [class*="composerHero"] 这条子串选择器），空闲时也烧 CPU。
        // 现改为纯事件驱动 + 精确过滤：
        //   · attributes 只过滤真正影响 hero 判定的属性（原先裸 attributes:true 会订阅
        //     全文档所有属性变化，包括聊天区每帧的 class/style 抖动）；
        //   · 回调先在原始记录上过滤，只有「确实出现/移除了 data-phase 容器」才排帧，
        //     否则连 rAF 都不开。
        const HERO_ATTRS = ['data-phase', 'data-content-phase', 'class'];
        const observer = new MutationObserver((records) => {
            for (let i = 0; i < records.length; i += 1) {
                const record = records[i];
                if (record === undefined)
                    continue;
                // 结构变化：与改造前同样直接排帧（合并到每帧至多一次），
                // 逐节点做子树匹配反而更贵，且首页/对话页切换都由它驱动。
                if (record.type === 'childList') {
                    scheduleSync();
                    return;
                }
                const target = record.target;
                if (!(target instanceof Element))
                    continue;
                // data-phase / data-content-phase 变化只发生在持有者身上（ConversationMainPanel
                // 的 hero|active|settling 等），出现即可能翻转判定 —— 频率极低，直接放行。
                if (record.attributeName !== 'class') {
                    scheduleSync();
                    return;
                }
                // class 变化是高频噪音（聊天区每帧大量节点改 class），必须收窄：
                // 只有「hero 容器类持有者」或「phase 属性持有者」的 class 才影响判定。
                // ⚠️ data-phase 在普通对话页取值 'active'，不能用 closest 当 hero 判据。
                if (target.hasAttribute('data-phase') || target.hasAttribute('data-content-phase')
                    || (target.getAttribute('class') ?? '').includes('composerHero')) {
                    scheduleSync();
                    return;
                }
            }
        });
        observer.observe(document.body, { attributes: true, subtree: true, childList: true, attributeFilter: HERO_ATTRS });
        // 页面切到后台：停掉用量轮询；切回前台：按当前版面恢复。
        const onVisibility = () => { syncHeroAttrs(); };
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            observer.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            if (heroPollTimer)
                clearTimeout(heroPollTimer);
            unmountColdSeat();
            homeUsage.stop();
            document.body.removeAttribute('data-dsh-home-layout');
            document.body.removeAttribute('data-dsh-home-hero');
        };
    }, 'ui-theme-custom: home studio layout & usage panel sync');
    // ── 模态遮罩与 Windows 标题栏底色动态联动 ─────────────────────────
    // ── 开屏舞台层与标题栏底色联动 ────────────────────────────────────
    // Windows 原生 WCO 三按钮在硬件层浮于 DOM 之上，网页覆盖层盖不住它。
    // 但 setTitleBarOverlay 每改一次颜色就重绘一次原生非客户区（= 一次可见跳变），
    // 所以这里**只跟随启动期开屏舞台层**（整屏纯黑/纯白，启动时只出现一次），
    // 不跟随模态弹窗遮罩（每次开合都跳变 = 用户反复报的闪烁）。
    // 详见 resolveTitlebarProbeColor 的取舍说明与 findStageMask 的排除条件。
    ctx.effect(() => {
        let retryFrame;
        /** 重新计算探针色并落到 html + body（重复值由 writeTitlebarProbeColor 去重）。 */
        const refresh = () => {
            if (retryFrame !== undefined) {
                cancelAnimationFrame(retryFrame);
                retryFrame = undefined;
            }
            const activeTheme = readSaved();
            const base = activeTheme !== undefined
                ? (TITLEBAR_PRESETS[activeTheme]?.bg ?? THEME_TOKEN_MAP[activeTheme]?.['--dsw-alias-bg-base'])
                : getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base').trim();
            const probe = resolveTitlebarProbeColor(base);
            if (probe !== undefined) {
                // writeTitlebarProbeColor 自己会去重：值没变就不碰 DOM，
                // 从而不会再次触发监听 body style 的 observer（那会引发原生重绘抖动）。
                writeTitlebarProbeColor(probe);
                return;
            }
            // 舞台层色未就绪：保持现状，下一帧再试，避免把中间态推给原生层。
            retryFrame = requestAnimationFrame(() => {
                retryFrame = undefined;
                refresh();
            });
        };
        const sync = () => {
            refresh();
        };
        // childList 覆盖舞台层的挂载与卸载；attributes 覆盖开屏主题切换带来的
        // background-color 变动。
        const observer = new MutationObserver(sync);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'data-ds-dark-theme', 'data-ds-custom-theme'],
        });
        sync();
        return () => {
            observer.disconnect();
            if (retryFrame !== undefined)
                cancelAnimationFrame(retryFrame);
        };
    }, 'ui-theme-custom: splash stage titlebar sync');
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
    // 侧边栏字号：apply() 期间立即落变量，首帧就用用户设定值（无闪动）。
    try {
        applySidebarFont(readSidebarFont());
    }
    catch { /* localStorage unavailable */ }
}
//# sourceMappingURL=index.js.map