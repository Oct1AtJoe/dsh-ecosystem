# ui-theme-custom 维护注意与核心踩坑指南

> 本文件为 `plugins/ui-theme-custom/` 专属架构规范与光斑/毛玻璃避坑速查表。
> **涉及光斑、刺眼白斑、侧边栏背景、弹窗颜色修改时，必读第 2 章与第 3 章！**

---

## 1. 插件架构与构建流程

### 1.1 文件拓扑
- `src/index.ts`：Node 宿主半，在服务启动时向 HTML body 注入 `BOOT_SCRIPT`，根据 localStorage 预填主题 token，防止首帧白屏/闪烁。
- `src/client/index.ts`：浏览器客户端入口，注入 `SURFACE_GLASS_CSS` 全局样式、注册 6 大主题定义，管理主题切换与恢复、字号意图保护与全局字号覆盖。
- `src/client/<theme>.ts`：各主题的具体 Token 字典（`sequoia`、`sonoma`、`void`、`jade`、`solar`、`parchment`）。
- `src/client/TechThemeRow.tsx`：设置页「外观」行下方的科技主题色块选择器。
- `tests/badge-token-check.mjs`：主题对比度合规门禁（必须通过）。
- `tests/font-size-check.mjs` / `tests/font-size-race.mjs`：字号持久化与全局生效的门禁（含竞态行为验证）。

### 1.2 标准两阶段构建命令
```powershell
cd C:\dsh-ecosystem\plugins\ui-theme-custom
$env:NODE_OPTIONS=""
node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
node tests\badge-token-check.mjs
node tests\font-size-check.mjs
```
构建成功后浏览器按 `Ctrl+F5` 硬刷新即可生效（profile 中为 `link:` 软链）。

### 1.3 字号（--dsh-content-font-size）的三条硬规则

> 🚨 **踩坑零（最先排查这条！）：所有设置改不动，先看 `settings.yaml.lock`**。
> 实测症状：改字号后 2.5 秒弹回旧值、**重启也没用**、改任何设置都不落盘。
> 真因**不是代码 bug**，而是 `.dsh/settings.yaml.lock` 成了**孤儿锁**（上一个服务进程崩溃/被杀后残留），
> 新进程拿不到写锁，`settings/mutate` 一律返回：
> ```json
> {"ok":false,"error":{"code":"settings/rejected",
>  "message":"atomic-write: timed out waiting for the writer lock at ...settings.yaml.lock"}}
> ```
> 服务端从未写入 → `describe` 持续推旧值 → 客户端被覆盖 → 表现为「自动回弹」。
> 锁是**文件系统状态，重启进程不会清**，所以「重启无效」。
>
> **排查手法**：浏览器 DevTools Network 里看 `POST /api/settings/mutate` 的响应；
> 或直接查 `Get-Item $HOME\.dsh\settings.yaml.lock` 的创建时间 —— 若远早于当前服务进程启动时刻，即为孤儿锁。
>
> **处置**：确认无进程持有后删除该锁（官方文档明确「孤儿锁恢复是运维动作」，不做自动回收）。
> 注意 `settings.yaml` 的 mtime 若长期不变，就是写入从未成功的铁证。

> ⚠️ **踩坑一：字号会「改完几秒自动弹回」**。官方 `ThemeRuntime.setFontSize` 是「先乐观改本地 → `void host.set()` 异步写盘」，而 `adopt()` 每次收到 settings 镜像变更就**无条件**用镜像值覆盖本地 `fontSize`。写入飞行窗口内任何镜像抖动（其他命名空间落盘、`document-updated`、`connection/reset`）都会把字号回滚成旧值。官方已为 `preference` 用 `liveBuiltinPick` 防住同类竞态，字号却没有。
>
> **正解**：插件层补「字号意图」防护（`recordFontSizeIntent` + `assertFontSizeIntent`），在 `theme/change` 最前面优先断言；发现被旧镜像回滚就用**原函数**重发，追上意图后经静默窗口清除意图。修改字号逻辑后必须跑 `tests/font-size-race.mjs`（含负向对照）。
>
> 注意：该防护只能兜住「写盘成功但快照暂时滞后」；若是踩坑零的孤儿锁（写盘压根失败），它会反复重试直到放弃 —— 所以**遇到回弹先排锁，再怀疑竞态**。

> ⚠️ **踩坑二：字号只作用于对话区**。官方只把 `--dsh-content-font-size` 挂在 `body`，且只有 `ui-chat`/`ui-conversation` 等对话模块消费；两侧边栏（`ui-workspace` 行、better-sidebar）与设置面板（`ui-settings-general`）用硬编码 px，调字号时纹丝不动。
>
> **正解**：见 §1.4「字号是两条独立轴」—— 侧边栏走本插件的 `--dsh-sidebar-font-size`（有独立设置行），设置面板跟随对话区增量轴 `--dsh-content-font-delta`。

> ⚠️ **踩坑三：选择器写错会静默失效（实测坑）**。CSS Modules 哈希后类名形如 `V41CyG_frame`、`GLea6a_navCell`，
> **源码目录名（AppFrame / SettingsRoot / Rows）根本不出现在 DOM 里**。曾把增量锚点写成 `[class*="AppFrame_frame"]`，
> 结果 `--dsh-shell-font-delta` 恒为空、字号完全没生效，且**不报任何错**。
>
> 三条硬规则：
> 1. 增量锚点挂 **`body`**（官方轴所在处，必然命中），不要挂猜测的容器类名；
> 2. 区域钩子只能用**实测存在的片段**：`sidebarCol` / `rightbarCol` / `role="dialog"` / `dsh-ff__*`（better-sidebar）；
> 3. **禁止 `[class*="title"]` 这类过宽通配**：实测命中 49 个元素，会误伤对话区标题。
>
> 改字号选择器后，务必用真实浏览器打开 3080 端口实测 `getComputedStyle(...).fontSize`，**不要只看源码断言**。

**边界（刻意不跟随）**：**窗口顶栏不随字号缩放**。顶栏属于 chrome —— 交通灯、托盘菜单、原生菜单弹出项都是固定尺寸，只缩放中间标题会让 52px 紧凑条失衡；官方 `--dsh-content-font-size` 是 content 轴，本就不覆盖窗口装饰。插件因此**不向桌面壳下发字号**。

### 1.4 字号是两条独立轴（对话区 / 侧边栏）

| 轴 | 变量 | 控制方 | 默认 |
| :--- | :--- | :--- | :--- |
| **对话区**（阅读内容） | `--dsh-content-font-size` | 官方「字号大小」行 | 14px |
| **侧边栏**（导航 chrome） | `--dsh-sidebar-font-size` | 本插件「侧边栏字号」行 | **13px（比对话区小一档）** |
| 设置面板 | 跟随对话区轴 | — | — |

**为什么不共用一个轴**：侧边栏是导航 chrome，对话区是阅读内容；同字号会让内容主体失去视觉重量。VS Code / Slack / Notion 的侧边栏都固定比正文小一档。

**实现要点**：
- 官方 `FontSizeRow` 属 ui-theme 包且不可改（铁律 1），故本插件经 `settings.general.item` 槽位**新增一行**（`id: sidebar-font-custom`, `order: 11.5`，紧随官方 order 11 会话字号）。
- 科技主题设置区块（`id: appearance-custom`）设为 `order: 10.5`，紧随官方 `appearance`（10）下方，从而形成 `外观(10) -> 科技主题(10.5) -> 会话字号(11) -> 侧边栏字号(11.5) -> 对话显示(12)` 的自然操作流，彻底避免混在底部。
- 组件 `SidebarFontRow.tsx` 几何与排版严格对齐官方 `FontSizeRow.module.css`：药丸容器（`72x36 r18`，模块填充）、居中数值输入（`14px / lh22 / tabular-nums`）、右侧绝对定位微调箭头列（`hover / focus-within` 显现，与官方微交互完全一致）以及后置 `px` 单位标签。
- 侧边栏字号存 **localStorage**（`dsh-sidebar-font-size`），不写官方 settings 命名空间。
- 非法值在 blur/Enter 时经 `normalizeSidebarFont` 夹取到 11..16，因此不会持久化空值或越界值。
- 内联变量**必须 html + body 双写**（见 6.3 层叠陷阱）；`apply()` 期间立即落变量，首帧即用用户设定值。
- CSS 兜底值与 TS 默认值必须一致（都是 13px），否则未设置时设置页显示与渲染不符。

> ⚠️ **测试手法坑**：用 `Object.getOwnPropertyDescriptor(...).set` 直接赋 `input.value` 会**绕过 React 的 value tracker**，`onChange` 不触发，看起来像功能失效。验证输入框务必用**真实键入**（Playwright `locator.type()`），不要用 setter 赋值。

### 1.5 接缝可见性：真因是「色差」不是「线条」（核心认知）

> 🚨 **用户反馈「顶栏 / 侧边栏 / 主页面之间有条线」时，不要先去删 border**。
> 实测结论：在**大面积纯色相邻**的场景里，任何叠加在 `--dsw-alias-bg-base` 之上的
> 白色径向、白色渐变或白色发丝高光，都会让该区域比顶栏亮 1~3 阶；
> **人眼的色阶跳变会被直接读成一条线**，即使那个元素根本没有 border。

**已实测定位的四个「隐形线」来源（去色差才算真修）**：

| 位置 | 来源 | 表现形式 |
| :--- | :--- | :--- |
| 内容区顶边（顶栏正下方） | `AppFrame` 的 `inset 0 1px 1px rgba(255,255,255,0.95)` + 全周 `inset 0 0 0 1px` | 横贯全宽的白色高光横线 |
| 左侧栏右缘 | `sidebarCol` 的 `border-right: 1px solid rgba(0,0,0,0.08)` | 竖向暗线 |
| 左侧栏内容层 | `> * > [class*="root"]` 的 `linear-gradient(rgba(255,255,255,0.25))` + `inset -1px 0 0 rgba(255,255,255,0.65)` | 比顶栏亮 2~3 阶 + 右缘白线 |
| 右面板左缘 | 右面板的 `inset 1px 0 0 rgba(255,255,255,0.65)` | 竖向白线（展开时） |

**液态主题（sequoia）的最终解法**（用户迭代确认后的状态）：

| 项 | 取值 | 理由 |
| :--- | :--- | :--- |
| `bg-base` | `rgb(245,245,247)` 不透明 | 与壳顶栏逐字节同色 → 横向接缝零色差 |
| `bg-app-image` | `none` | **用户明确不要光晕**（那层白蒙蒙的辉光） |
| `surface-glass-spot` | `transparent` | 同上，侧边栏/右面板不发漫反射斑 |
| `AppFrame` 发丝高光 | 液态主题**不发** | 该高光贴在接缝正下方，是横向白线根因 |
| 左侧栏右缘 | `border-right: 0.5px solid rgba(0,0,0,0.10)` | **用户明确要求保留竖线**；用中性浅灰而非高反差黑白 |
| 侧边栏填充 | `rgba(245,245,247,0.66)` | 实而仍透（详见下方「回调教训」） |

**玻璃强度公式**：`观感 ≈ 模糊半径 ÷ 填充不透明度`。填充越淡、半径越大，玻璃越透。
「玻璃太弱」的典型误判是去加大 `backdrop-filter`，实则真正卡住观感的是**填充不透明度太高**
（如 0.82 会把背后模糊完全盖住，视觉上等于实心白板）。

> ⚠️ **回调教训（用户二次反馈「透明度太高」）**：把填充一味压淡（曾到 0.34）会走向另一个极端 ——
> 面板整体发虚、文字与底衬对比不足、边界感消失。**玻璃要「透而有形」**：
> 保留大 blur 提供磨砂质感，填充停在能看清面板边界的中庸区间。调整时**只动填充、不动 blur**。

当前落地数值（第二次回调后）：

| 浮层 | 填充 | blur |
| :--- | :--- | :--- |
| 输入坞 `InputBar_card` | `rgba(255,255,255,0.74)` | `blur(64px)` |
| AI 回复卡片 | `rgba(255,255,255,0.80)` | `blur(40px)` |
| 侧边栏内容层 | `rgba(245,245,247,0.66)` | `blur(56px)` |
| 右侧面板 | `rgba(245,245,247,0.68)` | — |
| 弹窗 `[role="dialog"]` | `--dsw-alias-bg-overlay` = 0.94 | `blur(48px)` |
| `bg-layer-1/2/3` | `0.88 / 0.90 / 0.94` | — |
| `--dsw-specific-sidebar-fill` | `0.66` | — |
| `selector` / `tip` / `bubble` | `0.94 / 0.92 / 0.93` | — |

> ⚠️ **主窗口不透明**（无 `.transparent(true)`、无 Mica/Acrylic；`.transparent(true)` 只属于桌宠窗口
> `pet.html`）。因此 CSS 里写 `transparent` **不会透出桌面壁纸**，只会露出 WebView2 默认白底
> `#ffffff` —— 既让玻璃更弱（模糊纯白仍是纯白），又会让顶栏接缝（`245,245,247` vs `fff`，差 10 阶）重新出现。
> 若要真·透桌面，必须改 `desktop/` 加窗口材质并重编译，属于另一条路线。

### 1.5.1 磨砂材质：`blur()` 在纯色背景上**永远出不来磨砂**（核心认知）

> 🚨 **用户正确指出「从始至终都没有磨砂的感觉，只有玻璃质感」** —— 这不是透明度问题，是**材质缺失**。
>
> - **玻璃质感** = 透明，能看清背后
> - **磨砂质感** = 表面微观颗粒 + 光线漫射，看不清背后
>
> **根因**：`backdrop-filter: blur()` 模糊的是**背后内容**。而我们的背景是均匀纯色
> `rgb(245,245,247)` —— **模糊纯色仍然是纯色**。所以无论把填充 alpha 或 blur 半径调到什么值，
> 都只能得到「通透 / 不透」的区别，**永远出不来磨砂颗粒感**。
>
> **正解**：叠加一层**噪声纹理**。这与 macOS `NSVisualEffectView` 内部叠一层高斯噪声的做法一致。

**实现**（单一来源，见 `index.ts` 的 `--dsh-frost-noise`）：

```
SVG feTurbulence(type=fractalNoise, baseFrequency=0.85, numOctaves=4, stitchTiles=stitch)
  → feColorMatrix(type=saturate, values=0)   ← 必须去色，否则彩色噪点污染主题色
  → <rect filter=url(#n) opacity=0.10>       ← 强度克制，过高会让面板发灰
```

**五处消费点**：输入坞 `InputBar_card`、AI 卡片、侧边栏内容层、右侧面板、弹窗 `[role="dialog"]`。

三条硬规则：

1. **必须带兜底 `var(--dsh-frost-noise, none)`** —— 该变量只在 `body[data-ds-custom-theme]` 下定义，
   而弹窗规则对**所有**浅色主题生效；变量未定义且无兜底时，**整条 `background` 声明会失效**（弹窗变透明）。
2. **噪声必须排在融合屏障之后**（CSS `background` 第一项在最上层）。侧边栏顶部 44px 是
   与壳顶栏逐字节同色的屏障，颗粒若叠在其上会污染该区域、破坏无边框融合。
3. **噪声用 `repeat`，屏障用 `no-repeat`** —— 屏障是整块渐变，平铺会产生接缝。

> **门禁**：`sequoia-neutral-check.mjs` 的 C3 组有 10 条磨砂断言（噪声源/去色/强度/五处消费/兜底/次序）。

> **门禁**：`tests/sequoia-neutral-check.mjs` 锁死三条不变式（彩色清零 / 无光晕且竖线保留 / 玻璃强度），
> 含负向对照。改液态主题或接缝样式后必须跑。

### 1.6 无边框融合（方案 C：视觉融合）

> **目标**：让顶栏看起来与页面融为一体（macOS 那种「侧边栏直通顶端、交通灯悬浮其上」的观感）。

**架构前提（决定了只能做视觉融合）**：壳顶栏与内容区是**两个物理不重叠的 WebView**
（`layout_webviews`：壳占 `(0,0,W,44)`，内容占 `(0,44,W,H-44)`），且主窗口**不透明**、
无 Mica/Acrylic。真正让两窗重叠会撞上 Win32 Airspace / Z-Order 剪裁限制。因此方案 C
的做法是**让两侧色值逐字节一致**，用「看不出色差」实现「看不出边框」。

**三条硬规则**：

1. **壳体顶栏与该主题页面底色必须逐字节同色**。`TITLEBAR_PRESETS[id].bg` 必须等于
   对应 `<theme>.ts` 的 `--dsw-alias-bg-base`。历史上 `void`（差 11 阶）、`solar`（差 22 阶）、
   `sonoma`（半透明 0.74）三个主题不一致，已全部对齐为实色同值。
2. **6 个主题的 `line` 全部 `transparent`**。顶栏与画布同色后，任何有色的发丝线都会
   在同色底上重新变成一条可见的分界。
3. **内容区顶端加同色屏障带**（`--dsh-fusion-top`）。在背景层最前面插一条 `bg-base`
   实心带，向下渐隐到主题原有渐变；否则带极光渐变的主题顶部仍是彩色，融合不成立。

> ⚠️ `--dsh-fusion-top` **必须等于** `desktop/src-tauri/src/lib.rs` 的 `TITLEBAR_HEIGHT`
> （当前均为 **44px**）。三处保持一致：`shell.html` 的 `--dsh-titlebar-height`、
> `lib.rs` 的 `TITLEBAR_HEIGHT`、插件的 `--dsh-fusion-top`。

> 🚨 **实测坑（截图定位到 y≈44 的白线）**：侧边栏内容层 `> * > [class*="root"]` 上的
> `box-shadow: inset 0 1px 1px rgba(255,255,255,·)` 会画在该层**顶部**，即壳顶栏正下方
> （y=44）—— 在纯色底上直接表现为一条横贯的白线。融合态下该层必须 `box-shadow: none`。

> 🚨 **另一处隐蔽色偏**：壳 `#titlebar` 曾带 `backdrop-filter: blur(32px) saturate(190%)`。
> `saturate()` 会改变颜色 —— 液态顶栏 `rgb(245,245,247)` 是近中性灰（RGB 差仅 2），
> 经 190% 饱和度强化后**明显偏蓝**，这正是「顶栏与页面看得出分家」的隐藏原因。
> 融合态下 `#titlebar` **严禁 backdrop-filter 与任何内部渐变/内阴影**。

> **部署**：方案 C 同时改了 `shell.html`（壳侧）与插件，因此**必须**
> `cargo build --release` 重编译 + 重启桌面端；只刷新页面不生效。

---

## 2. 左右两个面板与中央区光斑样式在哪儿（每次都遗漏的核心！）

很多维护者修改或关闭光斑时，**只改了 `src/client/<theme>.ts` 里的 token，结果侧边栏依然有白斑**。
**根因：光斑样式分散在两处，最大重灾区在 `src/client/index.ts` 的 `SURFACE_GLASS_CSS` 中！**

### 2.1 光斑样式分布全景（四大注入点）

| 区域 | 具体文件与 CSS 选择器 | 渲染机制与控制 Token |
| :--- | :--- | :--- |
| **① 左侧边栏底层光晕** | `src/client/index.ts`<br>`[class*="sidebarCol"]::after` | `radial-gradient(440px 320px at 12% 38%, var(--dsw-alias-surface-glass-spot, transparent), transparent 56%)`<br>底层绝对定位伪元素，由 `--dsw-alias-surface-glass-spot` 驱动。 |
| **② 左侧边栏表层漫反射光斑** | `src/client/index.ts`<br>`body[data-ds-dark-theme] [class*="sidebarCol"] > * > [class*="root"]`<br>`body:not([data-ds-dark-theme]) [class*="sidebarCol"] > * > [class*="root"]` | - 深色：`radial-gradient(ellipse 80% 60% at 50% 30%, color-mix(... var(--dsw-alias-surface-glass-spot)...))`。<br>- 浅色：同样由 `var(--dsw-alias-surface-glass-spot)` 动态驱动。<br>⚠️ **历史巨坑**：此前浅色模式曾在此**硬编码** `rgba(255, 255, 255, 0.75)`，导致主题文件哪怕把 spot 改成 transparent，左侧边栏也永远有一大块 75% 椭圆白斑！**严禁硬编码静态白**！ |
| **③ 右侧面板底层光晕** | `src/client/index.ts`<br>`[class*="rightbarCol"]::after` | `radial-gradient(440px 320px at 78% 68%, var(--dsw-alias-surface-glass-spot, transparent), transparent 56%)`<br>底层绝对定位伪元素，由 `--dsw-alias-surface-glass-spot` 驱动。 |
| **④ 右侧面板表层漫反射光斑** | `src/client/index.ts`<br>`body[data-ds-dark-theme] [class*="rightbarCol"] [data-sidebar-right-panel]`<br>`body:not([data-ds-dark-theme]) [class*="rightbarCol"] [data-sidebar-right-panel]` | 逻辑与左侧边栏完全对称，深色与浅色均受 `var(--dsw-alias-surface-glass-spot)` 驱动。<br>⚠️ **历史巨坑**：浅色模式下同样曾在此硬编码 75% 纯白径向渐变及高反差白色 inset 边框，严禁写死！ |
| **⑤ 中央聊天区主背景光斑** | `src/client/index.ts`<br>`[class$="centerCol"] > :first-child > [class$="_root"]`<br>`[class$="centerCol"] [data-slot="main.conversation"] > [class*="_root"]` | `background: var(--dsw-alias-bg-app-image), var(--dsw-alias-bg-base) !important;`<br>由各主题 token 的 `--dsw-alias-bg-app-image` 直接提供径向光晕。 |

---

## 3. 弹窗与确认按钮硬编码冷银色坑点（必查）

用户反馈「弹窗与确认框颜色还是银色，没有跟着主题走」时的排查点：

1. **设置/模态弹窗面板 `[role="dialog"]`**：
   - 位置：`src/client/index.ts` 中的 `body:not([data-ds-dark-theme]) [role="dialog"]`。
   - 规范：必须由 `var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-2))` 动态驱动，**严禁写死 `rgba(242, 244, 248)`**！各主题在自身 token 文件的 `--dsw-alias-bg-overlay` 中定义弹窗底色（如缃素为温润暖茶宣纸色 `rgb(236, 230, 218)`）。
2. **主操作/确认按钮 `[class*="_primary"]` 与 `[class*="gitCommitButton"]`**：
   - 位置：`src/client/index.ts` 中的 `body:not([data-ds-dark-theme]) [class*="_primary"]`。
   - 规范：必须由 `var(--dsw-alias-button-primary-bg)` 动态驱动，**严禁写死金属银渐变（`rgba(240, 242, 247)` ~ `rgba(222, 226, 235)`）**！各主题通过自身的 `--dsw-alias-button-primary-bg` 和 `--dsw-alias-button-contrast-fill` 决定按钮材质与文字对比度。

---

## 4. 如何做一个「纯色 / 纯净无光斑」的主题（以【缃素】为例）

当需求要求「纯色、温润护眼、不要任何光晕/白斑点」时，必须**两端联动修改**：

### 步骤 1：主题 Token 文件（`src/client/<theme>.ts`）
```ts
// 1. 中央聊天区背景设为 none，只保留基底纯色
'--dsw-alias-bg-app-image': 'none',
// 2. 左右侧边栏光斑源设为 transparent，两端所有径向光斑自动归零
'--dsw-alias-surface-glass-spot': 'transparent',
// 3. 关掉毛玻璃与杂散模糊
'--dsw-alias-glass-blur': 'none',
'--dsw-alias-surface-glass-blur': 'none',
// 4. 侧边栏填充设为 100% 实色（rgb 而非 rgba），防止任何底色透光
'--dsw-specific-sidebar-fill': 'rgb(226, 219, 206)',
// 5. 弹窗面板背景设为同系实色
'--dsw-alias-bg-overlay': 'rgb(236, 230, 218)',
```

### 步骤 2：检查 `src/client/index.ts` 全局注入样式
确保 `SURFACE_GLASS_CSS` 中没有任何绕过 token 的 hardcode：
- 侧边栏所有 `radial-gradient` 的 spot 参数必须是 `var(--dsw-alias-surface-glass-spot, transparent)`。
- 当 spot 为 `transparent` 时，渐变色自动坍缩为 `transparent`，不留下任何白斑。

---

## 5. 对比度合规守门（`badge-token-check.mjs`）

每次调整主题 token 或新增主题时，必须保证：
```
--dsw-specific-sidebar-nav-item-active-accent 对比 --dsw-alias-button-info-fill
```
两者对比度比率 **≥ 4.5:1**（WCAG 2.1 AA 级标准）。若低于该阈值，构建自检脚本将直接报错拦截，防止徽章文本不可见。

---

## 6. 桌面顶栏（Tauri 壳）联动与三态语义（必读）

主题色要贯通到桌面壳的顶栏（`TITLEBAR_HEIGHT = 44px`），链路是：
`src/client/index.ts` 的 `TITLEBAR_PRESETS` + `syncDesktopTitlebar()`
→ 通知桥 `POST /notify {type:'theme-change'}`
→ `desktop/src-tauri/src/lib.rs` 转发整个 payload 给 `shell_webview`
→ `desktop/src/shell.html` 的 `window.__dshSetTheme(payload)` 写 CSS 变量。

### 6.1 titlebar 字段三态语义（核心坑点）

> ⚠️ **历史巨坑**：壳曾把「没有 titlebar 字段」一律当作「清除自定义配色」，导致服务就绪后桥的 DOM 观察者裸上报深浅时，顶栏被刷回默认纯白。

| `payload.titlebar` | 语义 | 壳的行为 |
| :--- | :--- | :--- |
| **对象** `{bg, accent, ...}` | 自定义主题生效 | 写入该主题顶栏纯实色，并记忆到 localStorage |
| **`null`** | 用户显式切回内置 light/dark | 清除全部内联变量，回退默认深浅调色板 |
| **`undefined`**（字段缺失） | 桥的 DOM 观察者旁路上报，只关心深浅 | **保持壳当前顶栏配色完全不动** |

- 插件侧：`applyTokens(tokens, scheme, themeId)` 传 `themeId` → 查 `TITLEBAR_PRESETS` 下发对象；切回内置主题的两处分支显式传 `null`。
- 桥侧：`syncThemeFromDom` 的裸调用**只传 theme**，不传 titlebar（即 `undefined`），绝不能让它清除配色。
- 壳侧：`if (tb === null) {...} else if (tb) {...} else {只更新深浅记忆}`。

### 6.2 顶栏必须纯实色，禁止任何渐变/光斑，且深色主题必须有辨识度

- `TITLEBAR_PRESETS` 的 `bg` **必须等于对应 `<theme>.ts` 的 `--dsw-alias-bg-base`**（融合前提，见 §1.6）。
  同时严禁使用肉眼不可分辨的近死黑色（会让顶栏变成死黑、与画布割裂）：
  - 液态（sequoia）：`rgb(245, 245, 247)`
  - 曜黑（sonoma）：`rgb(22, 24, 30)`
  - 灼日（solar）：`rgb(18, 14, 16)`
  - 冥夜（void）：`rgb(13, 13, 16)`
  - 缃素（parchment）：`rgb(230, 224, 212)`
  - 银曜（jade）：`rgb(226, 228, 233)`
- `shell.html` 的 `#titlebar` 只允许 `background: var(--bg)`，**不得**再引入 `--titlebar-bg-image` 之类的渐变图层，
  **也不得使用 `backdrop-filter`**（其 `saturate()` 会让近中性灰产生可辨色偏，见 §1.6）。
- `border-bottom` 统一为 `0.5px solid var(--line)`，由各主题下发 `line`；融合态下 6 个主题均为 `transparent`。

### 6.3 CSS 层叠陷阱：内联变量必须 html + body 双写（核心坑点）

> ⚠️ **历史巨坑（比 6.1 更隐蔽）**：即使 JS 三态逻辑完全正确，顶栏仍会在服务就绪后变白。
> **根因是 CSS 特异性**：浅色兜底调色板定义在 `body.light` 上，其特异性高于 `:root`。
> 只把内联变量写在 `document.documentElement` 时，`body.light` 的 `--bg: #f6f8fa` 会**覆盖**它，
> `#titlebar` 读 `var(--bg)` 就取到白色。

两条硬规则：

1. **禁止 `body:not(.dark)` 作浅色兜底选择器** —— 它几乎永远匹配（body 只要没 `.dark` 就命中），
   是历史遗留的过宽选择器。浅色兜底只允许 `:root.light, html.light, body.light`。
2. **内联主题变量必须同时写 html 与 body**：
   ```js
   var targets = [document.documentElement, document.body];
   var write = function (k, v) { for (var i=0;i<targets.length;i++) targets[i].style.setProperty(k, v); };
   ```
   首帧恢复脚本必须放在 `<body>` 起始处（`<head>` 里 `document.body` 还是 null，会整段抛错被 catch 吞掉）。

层叠优先级（`#titlebar` 读 `var(--bg)` 的真实顺序）：
```
body 内联 > body.light CSS 规则 > html 内联 > :root CSS 规则
```

### 6.4 回归自检

`desktop/scripts/check-boot-theme.mjs` 覆盖：桥的上报守卫、三态语义、**层叠解析**、源码选择器断言，
共 15 项含 3 条负向对照。改壳、改桥或改主题顶栏预设后必须跑：
```powershell
node C:\dsh-ecosystem\desktop\scripts\check-boot-theme.mjs
```
