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

### 1.3 字号（--dsh-content-font-size）的两条硬规则

> ⚠️ **踩坑一：字号会「改完几秒自动弹回」**。官方 `ThemeRuntime.setFontSize` 是「先乐观改本地 → `void host.set()` 异步写盘」，而 `adopt()` 每次收到 settings 镜像变更就**无条件**用镜像值覆盖本地 `fontSize`。写入飞行窗口内任何镜像抖动（其他命名空间落盘、`document-updated`、`connection/reset`）都会把字号回滚成旧值。官方已为 `preference` 用 `liveBuiltinPick` 防住同类竞态，字号却没有。
>
> **正解**：插件层补「字号意图」防护（`recordFontSizeIntent` + `assertFontSizeIntent`），在 `theme/change` 最前面优先断言；发现被旧镜像回滚就用**原函数**重发，追上意图后经静默窗口清除意图。修改字号逻辑后必须跑 `tests/font-size-race.mjs`（含负向对照）。

> ⚠️ **踩坑二：字号只作用于对话区**。官方只把 `--dsh-content-font-size` 挂在 `body`，且只有 `ui-chat`/`ui-conversation` 等对话模块消费；两侧边栏（`ui-workspace` 行、better-sidebar）与设置面板（`ui-settings-general`）用硬编码 px，调字号时纹丝不动。
>
> **正解**：复用官方增量轴 `--dsh-content-font-delta`（= 设置值 − 14px），对外壳区域做**等比增量**而非等值替换（12px 密集次级文本 +Δ 仍小于 14px 正文，层级保留）。Δ=0 时结果与原始硬编码完全一致，默认外观零变化。

**边界（刻意不跟随）**：**窗口顶栏不随字号缩放**。顶栏属于 chrome —— 交通灯、托盘菜单、原生菜单弹出项都是固定尺寸，只缩放中间标题会让 52px 紧凑条失衡；官方 `--dsh-content-font-size` 是 content 轴，本就不覆盖窗口装饰。插件因此**不向桌面壳下发字号**。

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

主题色要贯通到桌面壳的顶栏（`TITLEBAR_HEIGHT = 52px`），链路是：
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

- `TITLEBAR_PRESETS` 的 `bg` 采用各主题自身的**标志性实色底**，严禁使用肉眼不可分辨的近死黑色（如 `rgb(10,11,20)` 或 `rgb(18,14,16)` 会导致所有深色主题顶栏变成死黑）：
  - 液态（sequoia）：浅灰液态透光 `rgb(245, 245, 247)`
  - 曜黑（sonoma）：深空暗曜黑 `rgb(22, 24, 30)`
  - 灼日（solar）：落日暗炭金 `rgb(40, 28, 20)`
  - 冥夜（void）：玄武岩深灰 `rgb(24, 26, 30)`
  - 缃素（parchment）：温润茶宣纸 `rgb(230, 224, 212)`
  - 银曜（jade）：冷岩钛灰银 `rgb(226, 228, 233)`
- `shell.html` 的 `#titlebar` 只允许 `background: var(--bg)`，**不得**再引入 `--titlebar-bg-image` 之类的渐变图层。
- 底部 `border-bottom` 使用各主题专属的克制分界线（18% 微光），协调耐看。

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
