# dsh-theme-tech 渲染性能修复计划

> 目标：消除「输出会话内容时掉帧」。
> 插件版本基线：`dsh-theme-tech` **0.2.9**
> 建档时间：2026-10-29
> 对标插件：`dsh-claude-style` 0.19.5 的「钠(Sodium)渲染引擎」
> 状态：**计划待执行**（本文档只描述方案，未改动任何源码）

---

## 0. 结论摘要

掉帧的主因**不是**毛玻璃、不是主题配色，而是 **JS 侧在流式输出期间每帧制造强制同步布局（forced reflow）+ 全文档选择器扫描**。

按收益排序的四条根因：

| # | 根因 | 位置 | 性质 |
|---|---|---|---|
| 1 | 挂件观察 `document.body` 全树，回调里读 8 处 `offsetHeight` | `src/client/mascot.ts:379` → `:267/:306` | **P0，流式期每帧强制布局** |
| 2 | `setInterval(syncHeroAttrs, 200)` 每秒 5 次全文档 `[class*=]` 扫描 | `src/client/index.ts:3294` | **P0，空闲也烧 CPU** |
| 3 | 4 个独立的 `document.body` MutationObserver 并存 | `index.ts:3293` / `:3347` / `market-sticky.ts:76` / `mascot.ts:379` | P1，回调风暴 |
| 4 | 431 处 `[class*=]` 子串选择器 + 44 处 `:has()` | `SURFACE_GLASS_CSS` 全区 | P2，样式重算成本 |

---

## 1. 实测证据

### 1.1 静态度量（本次实测）

| 指标 | theme-tech | claude-style | 倍数 |
|---|---|---|---|
| 客户端 `client.js` | 563 KB | 971 KB | 0.58× |
| 注入 CSS 字符数 | **94,163** | — | — |
| CSS 规则条数 | **180** | — | — |
| `!important` | **491** | 315 | 1.56× |
| `[class*=...]` 子串选择器 | **439** | **9** | **48.8×** |
| `:has()` | **44** | 10 | 4.4× |
| `backdrop-filter` | **62** | 3 | 20.7× |
| `data-*-part~=` 稳定属性锚点 | **0** | **647** | — |
| `new MutationObserver` | **4** | **1** | 4× |
| `new ResizeObserver` | 0 | 1（引用计数复用） | — |
| `document.body` 级观察器 | **4** | 0（统一调度器） | — |
| `content-visibility` | 0 | 1（两段式安全启用） | — |

### 1.2 关键代码位置

```
mascot.ts:267   function findAnchor()          // 内含 8 处 offsetHeight
mascot.ts:306   function syncMount()
mascot.ts:379   mountObserver.observe(document.body, { childList: true, subtree: true })
mascot.ts:380   const mountInterval = setInterval(syncMount, 2000)

index.ts:2892   function isHeroPhase()         // 3 次 document.querySelector，含 [class*="composerHero"]
index.ts:2916   function syncColdSeat()        // 2 次 document.querySelector
index.ts:2943   function syncHeroAttrs()
index.ts:3290   const observer = new MutationObserver(() => { scheduleSync() })
index.ts:3293   observer.observe(document.body, { attributes: true, subtree: true, childList: true })
index.ts:3294   const interval = setInterval(() => { syncHeroAttrs() }, 200)

index.ts:3346   const observer = new MutationObserver(sync)       // titlebar 同步
index.ts:3347   observer.observe(document.body, { childList, subtree, attributes, attributeFilter })

market-sticky.ts:76   observer.observe(document.body, { childList: true, subtree: true })
market-sticky.ts:84   const onScroll = () => { syncStuck() }      // 同步读 getBoundingClientRect
```

### 1.3 掉帧链路（现状）

```
模型流式吐 token
  → chat DOM 每个 token 增删节点
  → 4 个 body 级 MutationObserver 全部排队
  → 每个回调排队 rAF
  → mascot 的 rAF 里执行 syncMount() → findAnchor()
      → 内部 8 处 offsetHeight 读取
      → 此时 DOM 已被本帧的流式写入污染
      → **强制同步布局（forced reflow）**
  → 布局还没稳定，index.ts:3294 的 200ms 定时器又插入一次
      → isHeroPhase() 的 [class*=] 全文档子串扫描 ×3
  → 主线程被挤占 → 掉帧
```

**关键点**：这套开销**与是否启用自定义主题无关**，也不判断 `document.hidden`，后台也在跑。

---

## 2. 对标分析：Sodium 做了什么

### 2.1 Sodium 是「样式表就地改写引擎」

`dsh-claude-style` 在 `lib/client.js` 中内置了 `sheet-rewrite` 模块：

```js
// 遍历 document.head 中 <style data-plugin="..."> 的 cssRules
function* Z3(e){ for (const t of e) {
    if (t instanceof CSSStyleRule) yield t
    if (t instanceof CSSGroupingRule || t instanceof CSSStyleRule) yield* Z3(t.cssRules)
}}

function Pp(e,t,a){ /* 正则匹配宿主选择器 → 记录 rewrite 结果 */ }
function X3(e){ /* a.rule.selectorText = a.rewritten 就地改写 */ }
```

带版本闸门 `since: "0.2.1-rc.2"` 与失效检测（`sodiumLost` = 宿主改了规则、改写已失效）。

**它改写的目标**：官方 `ChatView.module.css` 第 68-71 行那条

```css
:is(.column, [data-slot="conversation.chat.flow"])
  > :not([hidden]):not(.flowItem:is(:empty, :has(> [data-slot="conversation.chat.node"]:empty)))
  ~ :not([hidden]):not(.flowItem:is(:empty, :has(> [data-slot="conversation.chat.node"]:empty)))
```

这是 **`~` 通用兄弟 + 两侧各嵌一层 `:has()`**，N 个子元素 = **O(N²)** 次子树匹配。改写后变成单一属性选择器 `[data-dsh-claude-flow-child]`，并配套只给「流容器直接子元素」盖章，且（CHANGELOG 495 行）**「一批变化只标记这一批新增的子元素，流式输出期间不再读整页的变化记录」**。

### 2.2 四个可直接借鉴的架构

| 机制 | 实现 | 价值 |
|---|---|---|
| **共享观察器 + options 合并** | `Dm()` 把所有 `K(target, options, cb)` 订阅按 target 合并后只 `observe` 一次；全插件仅 **1 个** MutationObserver、**1 个** ResizeObserver | 消除回调风暴 |
| **读/写分相帧调度器** | `Z(task)` 单 rAF 内先跑全部 `read`、再 `scroll`、最后 `write`；37 处调用 | **零 layout thrashing** |
| **缓存选择器注册表** | `u8(selector)` 带 `readers` 引用计数，多特性共享同一份 DOM 列表；`ve(sel)` 缓存 `querySelector` 结果 | 省掉重复扫描 |
| **`content-visibility` 两段式** | 先只给 `contain-intrinsic-size`，由 `M6()` 在 rAF **read 相**用 `checkVisibility()` 判定、write 相才盖 `data-dsh-claude-laid-out`，CSS 只对带该属性的行启用 | 长会话只画可见行，且不破坏滚动锚定 |

### 2.3 `content-visibility` 的安全排除清单（直接抄）

```css
[data-chat-flow-kind]:not([data-chat-flow-kind=user])          /* 用户行不折叠 */
  :not([data-turn-process-answer],                             /* 正在生成的答案 */
       [data-turn-process-hidden],
       [data-disclosure-row] [hidden],
       [hidden],
       [data-dsh-claude-holds~=hidden-row])
```

### 2.4 两个零成本小设计

```js
// 后台休眠：只挂一个 visibilitychange，不跑定时器
document.body.setAttribute('data-dsh-claude-asleep', '')
```
```css
body[data-dsh-claude-asleep] *, body[data-dsh-claude-asleep] *:before, ...:after {
  animation-play-state: paused !important
}
```

```css
/* 减少动态偏好 */
body[data-dsh-claude-motion=reduced] :is([class^=dsh-claude-],[class*=" dsh-claude-"]) {
  animation-duration: var(--dsh-claude-duration-reduced) !important;
  animation-iteration-count: 1
}
```

---

## 3. 修复任务清单

> 原则：**P0/P1 只在 JS 侧改，不动任何视觉参数**，可独立回滚、可单独验证。
> P2 涉及观感，必须逐项与用户确认后再动。

### P0-1 · 给挂件换观察目标（收益最大）

**目标**：流式输出期间不再每帧强制同步布局。

**改动**：`src/client/mascot.ts`

1. `mountObserver.observe(document.body, ...)` → 收缩到 composer 容器。
   ```ts
   // 现：mountObserver.observe(document.body, { childList: true, subtree: true })
   // 改：只盯 composer seat / stack 的增删
   const mountObserver = new MutationObserver(scheduleSyncMount)
   // seat 可能被宿主重建，用一层「锚点重取」包住
   ```
2. `findAnchor()` 加**短时结果缓存 + 连通性校验**：
   ```ts
   let anchorCache: { el: HTMLElement; place: Place; at: number } | null = null
   function findAnchorCached() {
     if (anchorCache && anchorCache.el.isConnected && performance.now() - anchorCache.at < 150) {
       return anchorCache
     }
     const fresh = findAnchor()
     anchorCache = fresh ? { ...fresh, at: performance.now() } : null
     return fresh
   }
   ```
3. `findAnchor()` 内 8 处 `offsetHeight` 保留（语义需要），但**只在缓存失效时执行**。
4. `mountInterval = setInterval(syncMount, 2000)` 保留作兜底，但加节流：
   ```ts
   const mountInterval = setInterval(() => {
     if (document.hidden) return
     scheduleSyncMount()
   }, 2000)
   ```

**验收**：
- DevTools Performance 录制一段流式输出，`Layout` 任务数下降 ≥ 60%
- 挂件位置在首页 / 对话页 / 替代面板 / 切换会话四种场景下均正确
- `node tests/mascot-position-check.mjs` 通过

---

### P0-2 · 干掉 200ms 全文档扫描

**目标**：空闲状态零全文档扫描。

**改动**：`src/client/index.ts`

1. 删除 `setInterval(syncHeroAttrs, 200)`（`index.ts:3294`）。
2. 改为**精确属性观察**——官方已有状态标识 `data-phase="hero"`：
   ```ts
   // 只盯持有 data-phase 的容器，attributeFilter 精确到实际变化的属性
   // 并在回调里做 1 次 isHeroPhase()，而不是每 200ms 无条件扫
   ```
3. `isHeroPhase()` 内部去掉 `[class*="composerHero"]` 这条兜底子串选择器，优先用 `[data-phase="hero"]`；保留兜底但加**短时缓存**（>= 200ms）。
4. 全部回调加 `if (document.hidden) return`。

**验收**：
- 空闲 10 秒无任何 `querySelector` 调用（DevTools Performance 或断点验证）
- 首页 ↔ 对话页切换，`data-dsh-home-hero` / `data-dsh-home-layout` 属性正确
- `node tests/hero-predicate-check.mjs` 通过

---

### P1-1 · 引入读/写分相帧调度器（通用基建）

**目标**：一次性根治全插件 layout thrashing，并给后续任务复用。

**新增**：`src/client/frame.ts`

```ts
/** 单 rAF 内分三个阶段：全部布局读 → 全部滚动处理 → 全部 DOM 写。 */
type FrameTask = {
  read?: (t: number) => void
  scroll?: (t: number) => void
  write?: (t: number) => void
}

const pending = new Set<FrameTask>()
let handle = 0

function flush(t: number) {
  handle = 0
  const batch = [...pending]
  for (const task of batch) if (pending.has(task)) task.read?.(t)
  for (const task of batch) if (pending.has(task)) task.scroll?.(t)
  for (const task of batch) if (pending.has(task)) { pending.delete(task); task.write?.(t) }
}

/** 请求一个帧任务；同一 task 重复请求会去重。返回取消函数。 */
export function requestFrame(task: FrameTask): () => void {
  if (pending.has(task)) throw new Error('frame: task already requested')
  pending.add(task)
  if (handle === 0) handle = requestAnimationFrame(flush)
  return () => {
    pending.delete(task)
    if (pending.size === 0 && handle !== 0) { cancelAnimationFrame(handle); handle = 0 }
  }
}
```

**改造点**：把下列逻辑拆成 read/write 两半挂上去
- `mascot.ts` 的 `syncMount`（read=取锚点，write=挂载）
- `index.ts` 的 `syncHeroAttrs` / `syncColdSeat`
- `market-sticky.ts` 的 `syncStuck`（read=`getBoundingClientRect`，write=写 `data-stuck`）

**验收**：
- Performance 面板中 `Recalculate Style` 与 `Layout` 不再交错
- 三个功能的行为与改造前逐帧一致（截图对比）

---

### P1-2 · 四个观察器合一

**目标**：`document.body` 级 observe 从 4 个降到 1 个。

**新增**：`src/client/dom-registry.ts`

```ts
/**
 * 共享观察器：所有订阅按 target 合并 options，只 observe 一次；
 * 选择器注册表带引用计数，多特性共享同一份节点列表。
 */
export function watchDOM(
  target: Element | Document,
  options: MutationObserverInit,
  cb: (records: MutationRecord[]) => void,
): () => void
```

要点：
- 合并规则与 claude-style 的 `Dm()` 一致：`childList` / `characterData` / `subtree` 取或；`attributes` 与 `attributeFilter` 需并集，**若任一订阅要全属性则整体不下 filter**
- 订阅数为 0 时 `disconnect()` 并清空
- 回调统一在 rAF **read 相**分发（与 P1-1 打通）

**迁移顺序**：`market-sticky` → `mascot` → `index.ts` titlebar → `index.ts` home-layout。

**验收**：性能面板确认页面上只存在 1 个 body 级 MutationObserver（可在 DevTools 用 `getEventListeners`/堆快照辅助）。

---

### P1-3 · 用量轮询成本收敛

**位置**：`src/client/usage/data.ts:15-16`

```ts
export const HOME_POLL_MS = 800
export const HOME_POLL_MAX = 15
```

现状：进入工作室版面首页后最多连拉 15 次 `/ui-theme-custom/usage`（≈12 秒）。

**改动**：
1. `HOME_POLL_MS` 800 → 1500，`HOME_POLL_MAX` 15 → 8
2. 页面不可见（`document.hidden`）或窗口失焦时暂停轮询
3. 离开首页（`isHeroPhase()` 为 false）立即 `stopPolling()`

**验收**：Network 面板确认首页最多 8 次请求且离开首页即停。

---

### P2-1 · `blur(92px)` 降档（**需用户确认观感**）

**位置**：`src/client/index.ts:170`

```css
--dsh-glass-blur: blur(92px) saturate(180%);
```

高斯模糊成本随半径上升，92px 远超可辨识范围。而同文件 `sequoia.ts:24` 已是 `blur(64px) saturate(200%)`，说明 92px 是「SURFACE 层默认值」而非设计必需。

**建议**：`blur(92px)` → `blur(28~32px)`，`saturate(180%)` 保留。

**注意**：`tests/sequoia-neutral-check.mjs` 断言了 `--dsh-glass-blur: blur(64px)` 与 `blur(56px)`，改默认值需同步核对门禁（第 291-292 行）。

---

### P2-2 · 去掉 flowItem 上的 `:has()` 组合（**需用户确认观感**）

**位置**：`index.ts:1746-1747`、`2110-2111`

```css
[data-slot="main.conversation"] [class*="flowItem"]:not([hidden])
  :not([data-turn-process-hidden="true"])
  :is([data-chat-group-part="response"], :not([data-turn-process-member]))
  :has([class*="_markdown_"])
```

每条 AI 回复都要跑一次子树 `:has()`，流式期节点变化就重算。宿主已提供 `[data-chat-group-part="response"]`，可作单条件替代。

---

### P2-3 · 热点 `[class*=]` 换 `data-*` 锚点（分步）

不追求一次改完 431 处。先覆盖 4 个最高频锚点：

| 现 | 改 |
|---|---|
| `[class*="composerSeat"]` | `[data-dsh-tt-part~="composer-seat"]` |
| `[class*="flowItem"]` | 用宿主 `[data-chat-flow-kind]` |
| `[class*="sidebarCol"]` | `[data-dsh-tt-part~="sidebar-col"]` |
| `[class*="rightbarCol"]` | `[data-dsh-tt-part~="rightbar-col"]` |

由 JS 在挂载时盖章（与 claude-style 的 `maintain` 同法：只给新增节点盖章，不扫全页）。

---

### P2-4 · 零成本收尾

1. 后台休眠属性：`visibilitychange` → `data-dsh-tt-asleep` → `animation-play-state: paused`
2. `prefers-reduced-motion` 已有部分支持，补齐 `--dsh-tt-duration-reduced`

---

## 4. 任务总表

| ID | 任务 | 改动文件 | 风险 | 需确认 | 预期收益 |
|---|---|---|---|---|---|
| P0-1 | 挂件换观察目标 + 锚点缓存 | `mascot.ts` | 低 | 否 | ★★★★★ |
| P0-2 | 删 200ms 扫描，改事件驱动 | `index.ts` | 低 | 否 | ★★★★☆ |
| P1-1 | 读/写分相调度器 | 新增 `frame.ts` + 3 处改造 | 中 | 否 | ★★★★☆ |
| P1-2 | 观察器合一 | 新增 `dom-registry.ts` + 4 处迁移 | 中 | 否 | ★★★☆☆ |
| P1-3 | 用量轮询收敛 | `usage/data.ts` | 低 | 否 | ★★☆☆☆ |
| P2-1 | `blur(92px)`→`28~32px` | `index.ts:170` | 低 | **是** | ★★★☆☆ |
| P2-2 | flowItem 去 `:has()` | `index.ts:1746,2110` | 中 | **是** | ★★☆☆☆ |
| P2-3 | 热点选择器换属性锚点 | `index.ts` + 新增盖章逻辑 | 中高 | 否 | ★★☆☆☆ |
| P2-4 | 休眠 / 减少动态 | 全部 | 低 | 否 | ★☆☆☆☆ |

**建议执行顺序**：`P0-1 → P0-2 → 验证 → P1-1 → P1-2 → 验证 → P1-3 → P2-4`，P2-1/P2-2/P2-3 待用户确认。

---

## 5. 构建与验证

### 5.1 构建（两阶段，来自 `plugins/theme-tech/AGENTS.md` §1.2）

```powershell
cd C:\dsh-ecosystem\plugins\theme-tech
$env:NODE_OPTIONS=""
node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
```

### 5.2 门禁测试（现有 20 个）

```powershell
cd C:\dsh-ecosystem\plugins\theme-tech
node tests\badge-token-check.mjs
node tests\font-size-check.mjs
node tests\sequoia-neutral-check.mjs      # ← P2-1 会撞，需同步核对
node tests\mascot-position-check.mjs      # ← P0-1 必跑
node tests\hero-predicate-check.mjs       # ← P0-2 必跑
node tests\market-sticky-check.mjs        # ← P1-2 必跑
node tests\usage-pending-check.mjs
node tests\usage-fallback-check.mjs       # ← P1-3 必跑
```

其余：`adopt-guard` / `dialog-switch` / `dialog-titlebar` / `font-size-race` / `input-transparency` / `panel-opacity` / `prompt-overlay-zindex` / `rightbar-width` / `schedule-entry` / `stats-pills-transparency` / `table-bleed`

### 5.3 性能验收方法

1. 打开一个 ≥ 50 轮的既有长会话
2. DevTools → Performance → 录制 10 秒流式输出
3. 对比改造前基线，记录：
   - `Layout` 任务总时长
   - `Recalculate Style` 次数
   - 长任务（> 50ms）数量
   - 帧率（FPS 图表连续红块数量）
4. **基线需在改动前统一录制一次并留档**

---

## 6. 生效路径（重要：当前不是 `link:`）

### 6.1 现状不一致

- `C:\dsh-ecosystem\README.md` 与 `AGENTS.md` 描述的是 **`web` profile + `link:`** 流程
- 实际 `~/.dsh/profiles/web/package.json` 只有 `dsh-feishu-notifier`，**不含任何 theme-tech**
- 实际在用的是 **`~/.dsh/profiles/desktop/package.json`**，其中：
  ```json
  "dsh-theme-tech": "https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/v7/dsh-theme-tech-0.2.9.tgz"
  ```
  **走 GitHub Release tarball，不是 `link:`** —— 改源码不会自动生效。

### 6.2 开发期切到源码

```powershell
cd C:\dsh-ecosystem
node scripts\plugin-dev-link.mjs link theme-tech --profile desktop
# 然后重建 + 重启 DSH / 桌面端
node scripts\plugin-dev-link.mjs status theme-tech --profile desktop
```

### 6.3 发布期切回

```powershell
node scripts\plugin-dev-link.mjs release theme-tech --profile desktop
```

> 🚨 按 `AGENTS.md` §5.4 硬约束：
> 1. 改过 `plugins/theme-tech/` 源码后，**必须主动询问用户是否打包发布**；
> 2. 打包前**必须先更新** `C:\dsh-ecosystem\另一台电脑安装指南.md`（版本号 / tarball URL / 命令）；
> 3. 顺序：改指南 → `node scripts\pack-plugins.mjs` → 上传 Release；
> 4. 完成后交付在线 URL、本地 `dist-tarballs\<名>-<版本>.tgz` 路径与 `dsh plugin add` 命令。

**版本建议**：性能修复属行为优化，建议 `0.2.9 → 0.2.10`（P2 若改变观感则应 `0.3.0`）。

---

## 7. 回滚

| 阶段 | 回滚方式 |
|---|---|
| P0/P1（JS 侧） | `git revert` 对应 commit；或 `git checkout -- plugins/theme-tech/src/client/` |
| 新增文件 | 删除 `src/client/frame.ts` / `src/client/dom-registry.ts` |
| P2-1 / P2-2（CSS） | 单独 commit，`git revert` 即可恢复原观感 |
| 已发布 tarball | profile 改回上一版 URL + `pnpm install`，或 UI 重装旧版本 |

---

## 8. 明确不做的事

1. **不搬 Sodium 的样式表就地改写**——它直接改宿主 `cssRules`，是「牺牲兼容性换性能」的激进手段，且带版本闸门。theme-tech 目前没有对应的维护带宽，不引入。
2. **不重写整个 `SURFACE_GLASS_CSS`**——94KB / 180 条规则是一次性沉淀的视觉资产，重写风险远大于收益。
3. **不动 `patches/`**——本次只改插件源码，不碰 `E:\dshDesktop` 的 asar。
4. **不引入第三方性能库**——调度器与观察器各自 ≤ 60 行，自持更可控。

---

## 9. 参考

- `dsh-claude-style` 实现：`~/.dsh/profiles/desktop/node_modules/dsh-claude-style/lib/client.js`
  - 调度器 `Z()` / `e7()`（约 index 67869）
  - 观察器合并 `Dm()`（约 index 38819）
  - 选择器注册表 `u8()`（约 index 40922）
  - Sodium 改写引擎（约 index 725983）
  - `content-visibility` 两段式 `M6()`（约 index 965192）
- 官方 `ChatView.module.css`：`E:\vibeCoding\deepseek-harness\packages\client\ui-chat\src\client\chat\ChatView.module.css`（第 68-71 行为 Sodium 改写目标）
- 本仓库：`plugins/theme-tech/AGENTS.md`、`docs/ui-glass-modifications.md`、`docs/深色玻璃质感改造.md`