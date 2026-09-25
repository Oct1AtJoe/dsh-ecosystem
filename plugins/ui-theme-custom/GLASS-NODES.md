# 毛玻璃质感 · 完整 DOM 挂载清单（已实施）

> 参数基准（用户已确认 **t3**）：填充 `rgba(255,255,255,.38)` + `blur(92px) saturate(180%)`
>
> 🚨 **适用范围：仅 液态 sequoia 与 曜黑 sonoma 两个主题。**
> 用户实测确认「只有给液态以及曜黑这两个主题加好看，其他 4 个主题加了都不好看」，
> 故 void / jade / solar / parchment **完全不加玻璃**，保持官方原始外观。
> 本清单下方所有选择器都带主题门控，实际实现见 `src/client/index.ts`。
>
> 全部选择器与尺寸均来自 **3080 真实页面实测**（`getComputedStyle` + `querySelectorAll`），非源码推测。
> 状态：**已实施并通过门禁**（`badge-token-check` + `sequoia-neutral-check` + `font-size-check` 全绿）。
> 配方与踩坑详见 [GLASS-EFFECT.md](GLASS-EFFECT.md)。

---

## 零、分级原则

`backdrop-filter` 的收益取决于**背后是什么**，据此分三级：

| 级别 | 判据 | 处理 |
| :--- | :--- | :--- |
| **A 组** | 背后**有内容滚过**（浮层压在正文/列表上） | 上完整毛玻璃：填充 + `blur(92px)` + 光学边缘 |
| **B 组** | 背后是**均匀纯色**（`blur(纯色)=纯色`） | **只做填充透明度**，不加 blur、不加任何 box-shadow |
| **C 组** | Portal 到 body 的**瞬态浮层** | 与 A 组同配方，但需各自处理 z-index 与遮罩 |

> ⚠️ **实施期修正（性能）**：原 A4「侧栏会话行」已**降级到 B 组**。
> 侧栏一次渲染 40+ 个会话行，各挂 `blur(92px)` 会让页面 `backdrop-filter` 节点数冲到 **49**，
> 而它们背后是侧栏自身纯色填充，blur 看不出差别，纯属白烧 GPU。
> 降级后节点数降到 **9**。列表类元素一律归 B 组 —— 这是本清单最重要的一条修订。

> ⚠️ **B 组三轮修正**：B 组最终**不给任何 box-shadow**（含顶部高光）。
> 列表项高仅 36px，顶部 1px 高光堆叠起来会变成「每行一条横线」；
> 成本卡则因官方 border + elevation 外环叠加我给的 rim 成为「三重包边」。
> 详见 GLASS-EFFECT.md「踩坑 A」。

---

## A 组 — 完整毛玻璃（背后有内容）· 实施 5 项

| # | 选择器 | 真实类名 ✅ | 实测尺寸 / 圆角 | 所在区域 | 现状背景 |
| --- | --- | --- | --- | --- | --- |
| A1 | `[class*="composerSeat"] [class$="_card"]` | `QwfZkG_card` | 877×98, r22 | 输入区 | `rgba(255,255,255,.93)` 无 blur |
| A2 | `[class*="composerStack"] > section` | `ZJGXmW_root` | 845×38, r12 | 输入区 | `rgba(245,245,247,.92)` |
| A3 | `[class*="dsh-recall-bubble"]` | `dsh-recall-bubble` | 470×44, r22 | 中央区 | `rgba(255,255,255,.93)` |
| A4 | `[class*="cm-footer-stack"]` | `cm-footer-stack` | 256×140, r10 | 左侧栏 | `rgba(255,255,255,.88)` |
| A5 | `[class*="_bannerWrap"]` | `_bannerWrap_rsn9u_24` | 845×36, sticky z6 | 中央区 | `rgb(245,245,247)` |

> **A6 代码块 · A7 回底按钮：用户确认排除**（可读性/辨识度优先，见 §D 组说明）。
> **会话行：实施期从 A 组降级到 B 组**（性能，见上文修正说明）。

---

## B 组 — 仅填充 + 光学边缘（背后纯色，不加 blur）· 实施 11 项

> 🚨 **修正（用户实测反馈「每个单独 DOM 都有外边框」）**：
> B 组原用闭合 `inset 0 0 0 1px` 描边，在列表项/小控件上每项都出现一圈矩形白线。
> 现 B 组**只保留 `inset 0 1px 0` 顶部高光**，不再有闭合描边。
> A 组（大面积浮层）保留闭合 rim —— 那里它读作玻璃厚度而非边框。

| # | 选择器 | 真实类名 ✅ | 实测尺寸 / 圆角 | 所在区域 |
| --- | --- | --- | --- | --- |
| B1 | `[class*="sidebarCol"] > * > [class*="root"]` | `_6faJFq_root` | 280×950 | 左侧栏 |
| B2 | `[class*="rightbarCol"] > * > [class*="root"]` | `V41CyG_rightbarCol` | 全高 | 右侧栏 |
| B3 | `[data-sidebar-right-panel]` | `LHWPSW_panel` | 385×950, z10 | 右侧栏 |
| B4 | `[class*="dsh-ff__session-row"]` | `dsh-ff__session-row` | 268×36, r8 | 左侧栏 |
| B5 | `[class*="_newSession"]` | `_6faJFq_newSession` | 252×38, r12 | 左侧栏 |
| B6 | `[class*="cm-chip"]` | `cm-chip` | 86×22, r6 | 中央区 |
| B7 | `[class*="cm-gw-switcher"]` | `cm-gw-switcher` | 44×20, r999 | 左侧栏 |
| B8 | `[role="dialog"] [class*="stepper"]` | `SPvkaW_stepper` / `LcL5XW_stepper` | 72×36, r18 | 设置弹窗 |
| B9 | `[role="dialog"] [class*="selector"]` | `SPvkaW_selector` | 110×36, r18 | 设置弹窗 |
| B10 | `[role="dialog"] [class*="themeCube"]` | `bNLuYa_themeCube` | 180×84, r14 | 设置弹窗 |
| B11 | `[role="dialog"] [class*="navCell"]` | `GLea6a_navCell` | 164×40, r8 | 设置弹窗 |

> B1/B2 原有的 sequoia 专属噪声层**已一并移除**。

### AI 回复卡片（仅 sequoia / sonoma）

| 选择器 | 实测 | 处理 |
| --- | --- | --- |
| `[data-slot="main.conversation"] [class*="flowItem"]:has([class*="_markdown_"])` | `kdtA_a_flowItem`，845×1342 ✅ | 接入统一配方（`blur(92px)` + `.38` 填充） |

> 🚨 **修正（用户反馈「浅色主题跟实色一样，深色才有玻璃质感」）**：
> 原规则**没有 `backdrop-filter`** 且填充 `.80` 近乎不透明 → 就是一块白色板。
> 现接入统一毛玻璃配方。但仍有物理限制：
>
> ⚠️ **物理限制**：卡片宽 845px，背后就是对话区根背景。能否显玻璃取决于
> `--dsw-alias-bg-app-image`：sonoma/void/solar/jade 有光晕底 → 可透出；
> **sequoia 为 `none`（用户此前要求「不要光晕」）→ 背后恒纯色，透不出东西**。
> 这是「去光晕消除接缝」决定的副作用，需用户取舍。

---

## C 组 — 瞬态浮层 / Portal

| # | 选择器 | 真实类名 | 实测 | 处理结果 |
| --- | --- | --- | --- | --- |
| C1 | `[role="dialog"]` | `GLea6a_panel` | 800×800, r32 ✅ | 已接入 92px；**填充单独一档 `.78`**（内容面板可读性优先） |
| C2 | `[role="menu"]` | `_list_1nxmc_8._portal_1nxmc_4` | 218×128, **z 9501** ✅ | 已接入；Portal 到 body，z-index 沿用既有 9501 规则 |
| C3 | `[role="tooltip"]` | `.bubble`（`position:fixed; z-index:100`） | 小 | 已接入统一配方 |
| C4 | `[role="presentation"]`（遮罩层） | `GLea6a_overlay` | 1600×950, z9500 ✅ | **无需处理**（透明遮罩） |
| C5 | `[class*="toast"]` | `.toast`（z 1100，深色实底） | — | **刻意排除**：官方是强调提示，改半透明会削弱力度（用户确认保持实底） |

---

## D 组 — 失效选择器（已全部清理/改写）

实施前实测命中均为 **0**，是「玻璃效果整体缺失」的直接原因。已按下表处理：

| 旧选择器 | 旧命中 | 处理 |
| --- | ---: | --- |
| `[class*="InputBar_card"]` | 0 | 改写为 `[class*="composerSeat"] [class$="_card"]`（→ A1） |
| `[class*="ChatView_column"]` | 0 | 删除（结构已不存在） |
| `[class*="AssistantMarkdown_root"]` | 0 | 改写为 `[data-slot="main.conversation"] [class*="flowItem"]:has([class*="_markdown_"])` |
| `[class*="MessageItem_bubble"]` | 0 | 改写为 `[class*="userStack"] > [class$="_bubble"]` |
| `[class*="codeBlock"]` | 0 | 改写为 `[class*="md-code-block"]` |
| `[class$="_pane"]` | 0 | 删除（原生右栏无此类） |
| `[class$="_float"]` | 0 | 删除（原生右栏无此类） |
| `[class*="lensBar"]` | 0 | 删除（better-sidebar 已被原生右栏取代） |

**实施期额外剔除 2 项**（原清单的 B11/B12）：
`GwCMNq_chip`（小 diff 标签）、`XvM5kW_frame`（图片缩略图按钮）——
这两个是**构建哈希前缀**，写死会复制 D 组的失效成因，故不纳入实现。

---

## 统计（实施后）

| 组 | 数量 | 是否加 `backdrop-filter` |
| :--- | ---: | :--- |
| A 组 | 5 | ✅ 加（`blur(92px)`） |
| B 组 | 11 | ❌ 不加（只填充 + 边缘） |
| C 组 | 3 | ✅ 加 |
| D 组 | 8 项清理 + 2 项剔除 | — |
| **实测 `backdrop-filter` 节点数** | **9** | 含 sidebarCol/rightbarCol 的 `::before` |

---

## 关键前提（漏了则全部无效）

```css
/* 必须先去输入区实色压底，正文才滚得到输入框背后 */
[class*="composerSeat"]{ background-image: none !important; }
```

实测：`composerSeat` 自刷 `linear-gradient(transparent, rgb(245,245,247) 36px)`。
不去掉则 `blur(纯色)=纯色`，A1/A2 的毛玻璃**数学上不可能生效**。

---

## 验收结果

| 项 | 结果 |
| :--- | :--- |
| 六主题逐一实测 | ✅ 5 主题 `blur(92px)` 生效；parchment `blur:none` 且节点数 0 |
| 浅/深填充分支 | ✅ 浅 `.38` / 深 `rgba(26,30,38,.46)` |
| 弹窗 | ✅ 深色 `rgba(26,30,38,.78)` + `blur(92px)`，文字可读 |
| `backdrop-filter` 节点数 | ✅ 9（性能红线内） |
| 横向溢出 | ✅ 无（`scrollWidth == clientWidth`） |
| `badge-token-check` | ✅ 全部通过（最低 4.69:1） |
| `sequoia-neutral-check` | ✅ 全部通过（C3 组已改写为毛玻璃断言） |

