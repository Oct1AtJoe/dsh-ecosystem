# Kanye-Pet 内置桌宠插件开发文档

## 一、插件架构

### 1.1 双端分离（Host / Client Split）

Kanye-pet 是一个 **双端插件**（dual-face plugin），由两个独立半部分组成：

```
kanye-pet/                  # 单包双端：0.3.0 起原 dsh-kanye-pet-settings 已并入
├── src/
│   ├── index.ts           # tsdown lib 占位入口（不发布，见 §4.1）
│   └── client/            # Client half 源码（设置卡片 + 通知 shim + 跳转监听）
│       ├── index.ts
│       ├── KanyeCard.tsx
│       ├── kanye-card-controller.ts
│       └── locales.ts
├── lib/
│   ├── index.mjs          # Host half（Node 端，手写，不经 tsdown）
│   ├── src/               # Host 子模块（config / routes / assets / session-events …）
│   └── client.js          # Client half 构建产物（tsdown 出，__ModuleLoader__ 壳）
└── cordis.patch.yml       # 宿主组合挂载描述
```

| 半部分 | 运行位置 | 职责 | 加载方式 |
|--------|---------|------|---------|
| **Host half** | Node.js / DSH 服务 | 提供资产、状态、配置 REST API | `cordis.patch.yml` 行 `id: kanye-pet` |
| **Client half** | 浏览器 / Webview | 渲染浮宠、处理交互 | `__ModuleLoader__.load({ id, factory })` |

### 1.2 Electron 桌面窗 vs Web GUI 浮宠

Kanye-pet 有 **两个独立的宠物渲染通道**，互不依赖：

| 通道 | 入口 | 渲染技术 | 控制方式 |
|------|------|---------|---------|
| **Electron 透明窗口** | `kanye-pet/lib/assets/pet/pet.html` + `pet.js`（由 Host 的 `GET /kanye-pet/window` 提供） | CSS background sprite 动画 | `patches/kanye-pet-electron` 在主进程建窗 |
| **Web GUI 浮宠** | ~~`kanye-pet/lib/client/index.mjs`~~ | 源码已于 0.3.0 合并时删除 | 不再提供 |

> **关键决策**：只保留桌面窗。网页浮宠在 0.3.0 合并时**彻底移除**——旧源码 `lib/client/index.mjs` 与它的生成器 `scripts/build-client.mjs` 已删除，现在的 `lib/client.js` 由 tsdown 从 `src/client/` 构建，内容是设置卡片 + 通知 shim + 跳转监听，**不再渲染任何网页浮宠**。
>
> 🔄 **2026-10-20 换壳**：桌面窗宿主从自研 Tauri 壳换成 **官方 Electron 桌面端**。前端文件已迁进插件（`lib/assets/pet/`），壳侧只剩一个透明置顶 `BrowserWindow` + `preload-pet.cjs` 桥（见 §三）。前端改动从此**只需重启 Host**，不必重编壳——这是换壳带来的最大维护性收益。

### 1.3 数据流

```
设置面板（kanye-pet）
    ↓ edit('size', value) → staged
    ↓ save() → scope.set('size', value)
    ↓
DSH Settings Namespace（kanye-pet）
    ↓ Zod schema 校验（config.mjs）
    ↓ 持久化
    ↓
/kanye-pet/config 端点（routes.mjs）
    ↓ 轮询（每 2s）
    ↓
Electron pet.js → applyConfig() → 重设窗口尺寸/透明度/角色
  （尺寸/显隐走 window.petDesktop → 壳补丁 IPC）

---- 通知链路（桌宠气泡接管，v3 终版） ----

用户发消息 → agent 处理 → turn 结束（turn/end 写入会话事件日志）
    ↓ 下一条事件到来时（或 /state 轮询兜底）
    ↓ kanye-pet 扫描 snapshotEvents() 发现新 turn/end → 读 reason.kind
    ↓ completed → 任务完成 / error → 任务出错 / aborted/interrupted → 任务中止
    ↓ 写 petNotification 单槽队列
    ↓
/kanye-pet/state 端点 → notification 字段
    ↓ 轮询（每 2s）
    ↓
Electron pet.js → pollState() → showBubble() → 气泡显示 8s
    ↓ 点击气泡
    ↓ window.petDesktop.openSession(id) → 壳补丁 `dsh-pet:open-session`
    ↓ 主进程 mainWindow.show() + webContents.executeJavaScript
    ↓ eval `dsh:open-session` CustomEvent
    ↓ kanye-pet 客户端监听 → ctx.uiWorkspace.openSession(id)
      （宿主已删 sessions.open，导航归 ui-workspace view owner）
```

---

## 二、配置系统

### 2.1 Config Schema（Host 端，权威；0.2.1 起由 loader 直接投影成设置页）

`lib/src/config.mjs`（导出名固定为 `Config`）：

```javascript
export function buildSchema() {
  return z.object({
    enabled: z.boolean().default(true).volatile(),
    desktopPetEnabled: z.boolean().default(true).volatile(),
    size: z.number().min(100).max(300).default(150).volatile(),  // ← 这里改范围/默认值
    opacity: z.number().min(0.2).max(1).default(1).volatile(),
    character: z.string().default('kanye').volatile(),
    walk: z.object({ /* 子字段同样逐个 .volatile() */ }),
  })
}

export const Config = buildSchema()   // lib/index.mjs 里 `export { Config }`
```

> **0.2.1 机制（2026-10-18 实证）**：设置页 = **loader 条目 id + 插件导出的 `Config`**。
> `SettingsForms.describe()` 以 `entry.options.id` 出条目、以 `entry.fiber.runtime.Config` 取 schema，
> 只投影 `.volatile()` 字段（`volatileForm`）。**`settings.register()` 已被删除**——旧代码里
> `typeof settings.register === 'function'` 的守卫会静默跳过 → 命名空间永不出现 → 客户端
> `configForms` 快照恒为 `unavailable` → 自定义卡片 `if (!state.available) return null` →
> **tab 还在、内容整块空白、零报错**（§七 #40）。写入落点是 profile 的 `cordis.patch.yml`
> （`- id: <entryId>` + `config`，**整体替换、不做深合并**）。
> 字段路径必须是固定对象成员：volatile 不能放进数组/联合的元素内部（schemastery 会抛错）。
>
> ⚠️ **volatile 是「稳定引用」，不是一次性值**（2026-10-18 实测）：写入设置时 cordis 只把新值
> 写进 apply 收到的那个 ref（`cosmokit` 的 `createVolatile` / `updateVolatile`），**不会重跑 apply**。
> 所以必须每次读 `cfg()` 重新 `.get()`。在 apply 里 `{ ...DEFAULTS, ...unwrapConfig(config) }`
> 快照成普通对象会永远停在启动时的配置——症状极具迷惑性：设置页显示已改、UI 开关变、patch 文件
> 也写对了，但 `/config` 仍返回旧值、桌宠行为不变，全程零报错（§七 #40）。

> **坑点**：Zod schema 是保存时的**最后一道关卡**。即使前端校验通过，host 端校验失败也会拒绝写入并回滚。

### 2.2 默认值单一来源

`config.mjs` 中的 `DEFAULTS` 对象是默认值的单一来源。浏览器 half 的 `CFG_DEFAULTS` 必须与此一致（`verify-config-sync` 门禁守护）。

### 2.3 三个校验层必须同步

| 层 | 文件 | 作用 |
|----|------|------|
| Host schema | `kanye-pet/lib/src/config.mjs` | 服务端保存时校验 |
| Client validation | `kanye-pet/src/client/kanye-card-controller.ts` | 前端实时校验 |
| Locale hint | `kanye-pet/src/client/locales.ts` | 用户看到的范围提示 |

> **坑点**：改范围/默认值时，**三层必须同步改**，否则会出现前端显示一个范围、保存时又被拒绝的情况。

---

## 三、Electron 桌面窗

> **2026-10-20 换壳**：桌面窗宿主从自研 Tauri 壳换成**官方 Electron 桌面端**（`E:\dshDesktop`）。
> 本节全部换成 Electron 语义。Tauri 那套实现（`desktop-tauri/src-tauri/src/lib.rs` 的
> `pet_open_session` / `pet_show_main` / `ShimNotification` / `initialization_script`）已**不再参与**
> 打包路径，仅作为历史参考留在 `desktop/` 目录里。

### 3.1 职责划分（换壳后最重要的认知）

| 层 | 位置 | 职责 | 改动代价 |
|---|---|---|---|
| **前端页** | `lib/assets/pet/pet.html` + `pet.js` | 精灵动画、拖拽、气泡、音效 | **重启 Host 即生效**，无需重打壳补丁 |
| **Host 路由** | `lib/index.mjs` 的 `WINDOW_PATH` | `GET /kanye-pet/window` 返回 pet.html | 重启 Host |
| **壳补丁** | `patches/kanye-pet-electron/` | 建透明置顶窗 + 5 个 IPC + preload 桥 | **重跑 patch.mjs 并重启应用** |

Tauri 时代前端嵌在 exe 里（Brotli 压缩），改一个字符都要 `cargo build`；现在前端走 HTTP，
改完重启 Host 就生效。**这是换壳带来的最大维护性收益，不要退回把前端塞进壳里的做法。**

### 3.2 窗口创建（壳侧，`patches/kanye-pet-electron/lib/rules.mjs`）

官方 `createWindow` 的 `setWindowOpenHandler` 一律 `deny`，页面**无法**自建窗口，
所以宠物窗只能由主进程创建：

```javascript
petWindow = new BrowserWindow({
	...position, width: PET_WIDTH, height: PET_HEIGHT,
	show: false, frame: false, transparent: true, hasShadow: false,
	alwaysOnTop: true, skipTaskbar: true,
	resizable: false, minimizable: false, maximizable: false, fullscreenable: false,
	webPreferences: {
		preload: preloadPath, contextIsolation: true, nodeIntegration: false, sandbox: true,
		backgroundThrottling: false,   // ← 关键，见 3.4
	}
});
petWindow.setAlwaysOnTop(true, "floating");
```

默认尺寸 150×255（精灵帧 122×207 的比例）。位置默认主屏右下角向内 24px。

> **坑点**：`transparent: true` 必须配 `hasShadow: false`，否则 Windows 会在透明区域描一圈阴影。

### 3.3 页面来源与同源（为什么不再有 CORS）

Tauri 版 pet.js 硬编码 `http://127.0.0.1:3080`，因为 Tauri 窗口跨源访问 DSH 服务。
Electron 官方壳的 Host **端口每次启动随机**，且鉴权 cookie 由主进程注入，硬编码必然打空。

因此改为：

```
壳 loadURL('dsh-app://app/kanye-pet/window')
  → protocol.handle('dsh-app') 的 forwardWebRequest
  → 带 cookie 转发到 Host 的 /kanye-pet/window
  → 插件 Host 返回 pet.html
  → 页内相对请求（/kanye-pet/state、/kanye-pet/assets/...）走同一 origin
```

**同源 ⇒ 免 CORS、免 cookie 管理、免端口发现。** pet.js 里的 `DSH_BASE` 因此是空串：

```javascript
const DSH_BASE = '';
const CONFIG_URL = `${DSH_BASE}/kanye-pet/config`;
```

> **坑点**：pet.html 里不能写相对的 `src="pet.js"` —— 那会解析成 `/kanye-pet/pet.js`，
> 而 assets 挂在 `/kanye-pet/assets`。必须写绝对路径 `/kanye-pet/assets/pet/pet.js`。

### 3.4 显隐：`hide()/show()`，不再缩 0×0

Tauri 版关闭桌宠时用 `set_size(0,0)` 而非 `hide()`，因为 Tauri 默认背景节流
（`BackgroundThrottlingPolicy::Suspend`）会挂起隐藏 WebView 的 JS，2s 轮询停摆后开关再也回不来。

Electron 的节流是**可显式关闭**的：建窗时 `backgroundThrottling: false`，于是
`hide()/show()` 语义干净，轮询永不断。**不要照搬 0×0 那套 workaround。**

```javascript
// pet.js —— 顺序是契约：先 setSize，再 setVisible
// 开启态才设尺寸；关闭态不缩窗
if (show && hasSize) {
  const FRAME_W = 122, FRAME_H = 207;
  await window.petDesktop?.setSize(Math.round(newSize), Math.round(newSize * FRAME_H / FRAME_W));
}
window.petDesktop?.setVisible(show);          // 主进程 hide()/showInactive()
```

> **为什么用 `showInactive()` 而不是 `show()`**：开启桌宠不该抢走主窗口的输入焦点。

> 🚨 **顺序不可颠倒（2026-10-27 实测）**：壳侧建窗恒为默认 `PET_W×PET_H`（150×255），
> 用户尺寸只能由页内 `setSize` 下发。若先 `setVisible(true)` 再 `setSize`，窗口会以 150×255
> 先亮一帧、下一帧才被拉成设置尺寸 —— 表现为「桌宠加载出来后尺寸才跳变」。
> 隐藏态改尺寸不可见，**先设尺寸再显示**，首帧就是用户设置的像素尺寸。
> 门禁：`tests/pet-window.test.mjs` 的「先设尺寸再显示」用例（比较两处调用在源码里的先后）。

### 3.5 IPC 桥（`window.petDesktop`）

`preload-pet.cjs` 是宠物页唯一的能力入口（`contextIsolation: true` + `sandbox: true` 下必须走 contextBridge）：

| `window.petDesktop` | IPC 通道 | 行为 |
|---|---|---|
| `setPosition(x, y)` | `dsh-pet:set-position` | 移窗 + 落点校验 + 写 `userData/pet-window.json` |
| `setSize(w, h)` | `dsh-pet:set-size` | 改窗尺寸（≤0 忽略） |
| `setVisible(bool)` | `dsh-pet:set-visible` | `showInactive()` / `hide()` |
| `showMain()` | `dsh-pet:show-main` | 还原 + 显示 + 聚焦主窗口 |
| `openSession(id)` | `dsh-pet:open-session` | 显示主窗 + `executeJavaScript` 派发 `dsh:open-session` |

**每个 handler 首行都校验 `event.sender === petWindow.webContents`**，只信宠物窗自己。

> **坑点**：`pet.js` 里**不得出现任何 `__TAURI_INTERNALS__`**。`tests/pet-window.test.mjs`
> 的「pet.js 已脱离 Tauri 桥」用例会拦这个回归。

### 3.6 拖拽（保留手动移窗，避开 Windows Snap）

逻辑与 Tauri 版一致：`pointerdown` 记录锚点 → 位移超 6px 才判定为拖拽 → RAF 节流后
`setPosition` → `pointerup` flush 最后一帧。**不用系统拖拽 API**，避免触发 Aero Snap。

```javascript
function handlePointerMove(e) {
  if (!dragStart) return;
  if (!isDragging) {
    if (Math.hypot(e.screenX - dragStart.screenX, e.screenY - dragStart.screenY) <= 6) return;
    isDragging = true; dragging = true;
    try { pet.setPointerCapture(dragStart.pointerId); } catch {}
  }
  // clientX/Y 作为抓取锚点偏移，天然自洽，免多屏/DPI 时序错位
  scheduleSetPosition(e.screenX - dragStart.clientX, e.screenY - dragStart.clientY);
}
```

> **坑点**：`setPointerCapture` 保证鼠标移出元素仍收事件，但**移出 OS 窗口后会丢失**——
> 这是平台限制，与 Tauri 版相同。

### 3.7 位置持久化

`userData/pet-window.json`，拖拽结束即写。启动时读回并做**屏幕边界校验**：

```javascript
const clampPetPosition = (x, y, width, height) => {
  const visible = screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    return x < a.x + a.width && x + width > a.x && y < a.y + a.height && y + height > a.y;
  });
  if (visible) return { x, y };
  const a = screen.getPrimaryDisplay().workArea;
  return { x: Math.round(a.x + a.width - width - 24), y: Math.round(a.y + a.height - height - 24) };
};
```

> **为什么必须校验**：拔掉副屏后位置记忆会把窗口送到屏幕外，用户以为"宠物消失了"。

### 3.8 加载失败自愈（最容易漏的一条）

```javascript
const loadPetPage = () => {
  petWindow.loadURL(PET_URL).catch(() => {
    setTimeout(loadPetPage, 2000);   // ← 503 走这里
  });
};
```

> ⚠️ **`did-fail-load` 不会在 503 时触发**：503 是**正常完成的 HTTP 响应**，不是网络失败。
> Host 未就绪时 `dsh-app://app` 正是返回 503 —— 只挂 `did-fail-load` 会让窗口永久空白。
> 同理，**不要**在 `did-finish-load` 里 `show()`：503 也算"加载完成"，那样会闪一个空白窗。
> 显隐的唯一权威是页面自己的配置轮询。

### 3.9 Sprite 渲染

使用 CSS `background-image` + `background-position` 实现帧动画：

```css
#pet {
  width: 100%; height: 100%;
  background-repeat: no-repeat;
  background-position: center bottom;  /* 锚定底部，地球不被裁 */
}
```

```javascript
// 百分比选帧：pct = frame / (frames - 1) * 100
pet.style.backgroundPosition = `${pct}% 0`
```

> **坑点**：`background-size: contain` 会露出多帧（显示多个复制体），必须用 `100% 100%`。

### 3.10 精灵图透明边距（已修复 2026-08-21）

- **历史现象**：窗口 260×260，精灵图每帧 256×256，但角色实际只占画面中心约 60-80px
- **根因**：精灵图导出时留了过多透明 padding，属素材设计问题
- **修复**：用 `Bitmap.Clone` 将 15 个状态的 PNG 从 256×256 帧裁剪为 122×207 帧（union bbox (68,24)-(189,230)），原始文件备份在 `originals_bak/`。因 assets 路由设 `immutable` 缓存，文件名从 `.v2.png` 改为 `.v3.png`
- **涉及文件**：`lib/assets/characters/kanye/*.v3.png`（15 个文件）
- **相关改动**：`manifest.json` 的 `stageSize` 从 256→207；壳补丁的窗口初始尺寸 150×255

## 四、设置面板（kanye-pet）

### 4.1 包结构

```
plugins/kanye-pet/
├── package.json            # dsh-kanye-pet（0.3.0 起含原 settings 包）
├── tsdown.config.ts        # clientBundle('dsh-kanye-pet', ['src/index.ts'])
├── src/
│   ├── index.ts            # tsdown lib 占位入口（产物 lib/index.js 不发布）
│   └── client/
│       ├── index.ts        # Client half apply 入口
│       ├── KanyeCard.tsx   # React 组件（设置卡片 UI）
│       ├── kanye-card-controller.ts  # 表单状态机 + 校验
│       └── locales.ts      # 中英文文案
└── lib/
    └── client.js           # tsdown 构建产物（__ModuleLoader__ 壳）
```

### 4.2 加载路径

- **加载端点**：`/plugins/??<包名>/client.js,...&rev=<hash>`（**单包路径 `/plugins/<pkg>/client.js` 是 404**，别用它判断新代码是否生效）
- **包名** = `dsh-kanye-pet`；目录名 `plugins/kanye-pet`
- **loader 条目 `id:` = `kanye-pet`**（0.3.0 合并后只剩一条；client 用 `ctx.configForms.get('kanye-pet')`，与本条目 id 一致 —— 改 id 会让设置 tab 整块空白）
- **构建**：`npx tsdown`（tsdown.config.ts 配置）

### 4.3 staged 编辑模式

```
用户输入 → staged Map（内存草稿）
    ↓ 点击保存
    ↓ scope.set(field, value) → DSH Settings Service
    ↓ host Zod schema 校验
    ↓ 成功 → staged.clear() + store 更新
    ↓ 失败 → 回滚（值恢复到保存前）
```

### 4.4 校验逻辑

```typescript
private field(field: 'size' | 'opacity'): KanyeFieldState {
  const staged = this.staged.get(field)
  if (staged === undefined) {
    const value = this.value()?.[field]
    return { text: typeof value === 'number' ? String(value) : '', invalid: false }
  }
  const trimmed = staged.text.trim()
  if (trimmed === '' || !Number.isFinite(Number(trimmed)))
    return { text: staged.text, invalid: trimmed !== '' }
  const num = Number(trimmed)
  if (field === 'size' && (num < 100 || num > 300)) return { text: staged.text, invalid: true }
  if (field === 'opacity' && (num < 0.2 || num > 1)) return { text: staged.text, invalid: true }
  return { text: staged.text, invalid: false }
}
```

### 4.5 重置按钮硬编码

`kanye-pet/src/client/KanyeCard.tsx` 中每个 `NumberField` 的 `onReset` 直接写死了重置值：

```tsx
onReset={() => { props.edit('size', '150') }}     // ← 改默认值时同步改这里
onReset={() => { props.edit('opacity', '1') }}    // ← 透明度默认值
```

> **坑点**：改 `DEFAULTS.size` 时，**必须同时改 KanyeCard.tsx 里的 reset 硬编码**，否则点重置会恢复到旧值。

---

## 五、通知系统（气泡通知，v3 终版）

### 5.1 触发规范（与 dsh-notification-custom 对齐）

| 规则 | 说明 |
|------|------|
| 触发时机 | **主对话 turn 结束**（turn/end 写入会话事件日志） |
| 与回复内容无关 | 不看 assistant/message 内容 |
| 子进程不触发 | 子进程 job 完成（onJobDone）**不**直接发通知 |
| 子代理不触发 | 子代理子会话（`session.header.origin === 'subagent'`）的 turn/end、审批、提问**一律不出气泡、不报警、不庆祝**；一个对话任务内的子任务完成不打扰用户，只有该对话自身 turn/end 才通知/庆祝。**不静音**范围：think 陪伴（`sessionThink`）、等待姿态、账本 XP/称号/回忆 |
| 只看主对话 | 只看主 session 的 turn/end |
| 状态映射 | `completed` → 任务完成 / `error` → 任务出错 / `aborted`/`interrupted` → 任务中止 |

### 5.2 实现机制（关键：去重基线 + snapshotEvents() 读日志）

**核心认知（rc.1 更新）**：
- `turn/start`/`turn/end` 与其它事件一样经 `session/event` 广播（`parseTurnEvent` 靠回调事件驱动 think 陪伴/庆祝；turn 边沿若收不到，宠物会永久卡在思考态）。扫描日志的价值不在"收不到事件"，而在**历史抑制**（重启不重放旧通知）与**去重基线**（一次 turn 一条）。
- **rc.1 起 Session 事件日志私有化**：`session.events` 属性已删除（恒 `undefined`），公开读法是 **`session.snapshotEvents()`**（无参 = 全量日志，返回冻结数组，缓存到下次 append）。0.1.1 的公开数组读法不可用。
- ⚠️ **守卫式兼容读会静默失效**：`typeof session?.events?.slice === 'function' ? session.events : []` 不报错、只把破坏吞成空数组，扫描永不命中。升级宿主后必须 grep 插件里所有 `.events` 引用（2026-09-04 即因此全量丢通知，见 §七 #35/#36）。

**检测算法**：
1. `lastTurnEndNotif` Map（sessionId → seq）记录每个 session 已通知过的最后 turn/end 位置
2. **首次**遇到某个 session 时，扫描 `snapshotEvents()` 找最后一个 turn/end 记录 seq，**无条件写入（含 -1）**；该 seq 之前的回合不通知（跳过历史）
3. 后续每条事件到来时，扫描找 `seq > lastSeq` 的 turn/end，发现即通知
4. 通知标题从 `turn/end.data.reason.kind` 映射

```javascript
// lib/index.mjs session/event handler 内的核心逻辑（示意）
const events = typeof session?.snapshotEvents === 'function' ? session.snapshotEvents() : []
if (!lastTurnEndNotif.has(id)) {
  // 首次：记录最后 turn/end 位置，不通知历史。
  // 必须无条件 set（含 -1）——否则新会话首个 turn/end 会重进本分支被当历史回合抑制
  let lastSeq = -1
  for (const e of events) {
    if (e?.type === 'turn/end' && (e.seq ?? 0) > lastSeq) lastSeq = e.seq
  }
  lastTurnEndNotif.set(id, lastSeq)
} else {
  const lastSeq = lastTurnEndNotif.get(id) ?? -1
  for (const e of events) {
    if (e?.type === 'turn/end' && (e.seq ?? 0) > lastSeq) {
      // 发通知 + lastTurnEndNotif.set(id, e.seq)
    }
  }
}
```

### 5.3 系统通知抑制（Electron 换壳后：kanye-pet 的 Notification shim）

> 🔄 **2026-10-20 换壳**：Tauri 版的 `ShimNotification`（由 Rust `bridge_init_script` 注入）
> 已随 Tauri 壳一起停用。Electron 官方壳是**真 Chromium**，主窗口里 `new Notification()`
> 会直接弹 Windows Toast，所以抑制逻辑改由 **`kanye-pet` 的 client shim** 承担
> （`plugins/kanye-pet/src/client/index.ts` 的 `DynamicNotification`）。

shim 按宿主分两支：

```
new Notification(title, options)
  → 有 window.__dshNotifyBridge？（Tauri 壳遗留分支）
      是 → 查 desktopNotificationEnabled，经桥转 Windows Toast
      否 → Electron / 浏览器分支：
            fetch('/kanye-pet/config', { cache: 'no-store' })
            desktopPetEnabled === true  → 直接吞掉（由桌宠气泡接管）
            否则 / fetch 失败          → 原生 new Notification(...)
```

> **关键**：Electron 分支的 fetch 用**相对路径** `/kanye-pet/config`。
> 硬编码 `http://127.0.0.1:3080` 在桌面端会打空（Host 端口随机）、且跨源。
> 配置读不到时**保持原行为**（宁可多弹一条，也不静默丢通知）。


### 5.4 通知链路细节

| 环节 | 实现 |
|------|------|
| 通知队列 | 单槽 `petNotification`（最新覆盖旧），60s TTL 防残留 |
| tag 去重 | pet.js `lastNotifTag` 防轮询重复显示 |
| 气泡时长 | 8s 自动消失 |
| 点击跳转 | `window.petDesktop.openSession(id)` → 壳补丁 `dsh-pet:open-session` → 主进程 `mainWindow.show()` + `webContents.executeJavaScript` 派发 `dsh:open-session` CustomEvent → **kanye-pet client 监听 → `ctx.uiWorkspace.openSession(id)`**（导航归 view owner；宿主已删除 `ctx.sessions.open()`，旧调用是静默 no-op，2026-10-18 修正；2026-09-04 起由 kanye-pet 承担，原提供方 dsh-notification-custom 已退役）；点击后气泡立即消失 |
| 会话标题兜底链 | `resolveSessionTitle` → `session.label` → `session.id`（启动初期标题未就绪时兜底） |
| 延迟 | turn/end 写入 log 后，下一条 session/event 到来时检测（通常毫秒级） |

### 5.5 通知触发源的演进（历史，勿回退）

| 版本 | 触发源 | 问题 |
|------|--------|------|
| v1 | `onJobDone` | 只覆盖子进程 job，纯对话 turn 不触发 |
| v2 | `assistant/message` | 频次太高：命令结果、子智能体都发 |
| v3（终版） | 扫描 `session.events` 的 turn/end | 与 dsh-notification-custom 同源，一次 turn 一条 |

### 5.6 通知系统架构（v4 终版）

kanye-pet 的通知系统通过三个检测路径覆盖所有需要通知用户的场景：

#### 5.6.1 三条检测路径

| 路径 | 触发事件 | 覆盖场景 | 延迟 |
|------|---------|---------|------|
| **turn/end 扫描** | `session/event` 回调时扫描 `session.snapshotEvents()` | 所有 turn/end（completed/error/aborted/interrupted/max-tokens） | 下一事件到达时 |
| **approval/asked 检测** | `session/event` 回调中 `event.type === 'approval/asked'` | 工具审批（sandbox_permissions 等） | 即时 |
| **tool/call 快速路径** | `session/event` 回调中 `event.data.name` 匹配 | `ask_user_question` / `exit_plan_mode` | 即时 |

#### 5.6.2 标题映射

```javascript
// turn/end reason kind → 通知标题（TITLE_MAP）
completed  → 任务完成
error      → 任务出错
aborted    → 任务中止
interrupted→ 任务中止
blocked    → 等待你的操作    // 注：实际不产生 turn/end blocked
max-tokens → Token 已超限

// pending interaction kind → 通知标题（PENDING_TITLE_MAP）
question    → 需要你的选择    // ask_user_question
plan-review → 请评审计划      // exit_plan_mode
approval    → 等待你的审批    // approval/asked 事件
```

#### 5.6.3 单槽队列

`petNotification` 是单槽变量，每次设通知覆盖上一条。TTL 60s，超时后 `/state` 端点自动清除。

#### 5.6.4 点击消失

`pet.js` 的 `showBubble` 创建的气泡点击后立即隐藏并清除定时器（`clearTimeout` + `display: none`），同时调用 `window.petDesktop.openSession(id)` 跳转会话。

#### 5.6.5 关键坑点

- **工具审批不产生 turn/end blocked**：审批等待时 turn 保持 OPEN，批准后直接 `completed`。必须靠 `approval/asked` 事件检测
- **`ask_user_question` / `exit_plan_mode` 不产生 turn/end**：工具 async 等待用户回答，turn 不结束。必须靠 tool/call 快速路径
- **ShimNotification 对 pending 标签的特判**：原逻辑对 `-pending-` 标签通知永远走 Windows，与 pet 气泡重复。改为统一查 `desktopPetEnabled`（见 5.3）
- **子代理过滤只允许一处**：三条路径的唯一汇聚点是 `setPetNotification()`，子代理拦截守卫（`session.header.origin === 'subagent'`）写在函数首行。**新增任何检测路径必须经 `setPetNotification()` 发通知**，否则绕过的路径会把子代理子任务重新变成气泡噪音（§七 #37）
- **庆祝（animation）有三个写入点，必须同规则**：① `session/event` 的 turn/end → `turnCompletedUntil`；② `onJobDone` 完成 → `celebrateUntil` + `emitSignal('celebrate')`；③ `activity()` 里由 job 翻转派生的 celebrate burst。① 直接读 `session.header.origin`；②③ 读 `JobSnapshot.ownerSession` 查 `subagentSessions` 集合（事件流首见子代理会话时登记）。**账本（XP/称号/回忆）不受抑制**——只静音表现层（§七 #38）

### 5.7 通知提示音

kanye-pet 支持通知音效，默认为 Web Audio API 合成音，可通过自定义 wav 文件覆盖。

#### 5.7.1 音效映射

| 通知类型（reason） | 合成音效 | 自定义文件名 |
|-------------------|---------|------------|
| `completed` | C5→E5 上行双音「叮叮」 | `complete.wav` |
| `question` / `plan-review` / `approval`（pending 类） | A4 柔和单音「叮」 | `pending.wav` |
| `error` | 200→100Hz 锯齿波下坠「嗡」 | `error.wav` |
| 其他兜底 | 660Hz 短促「啵」 | `notify.wav` |

#### 5.7.2 音效配置

配置项在 `lib/src/config.mjs` 的 `DEFAULTS.sound`（用户可在设置里改）：

| 字段 | 默认 | 说明 |
|------|------|------|
| `sound.enabled` | `true` | 音效总开关；`false` = 完全静音（气泡照常弹，只是不出声） |
| `sound.volume` | `0.3` | 音量 0–1，自定义 wav 与合成音共用同一基准 |

合成音最终增益 = `sound.volume` × 权重，权重表见 `pet.js` 的 `SYNTH_WEIGHT`
（complete 0.5 / pending 0.6 / error 0.7 / notify 0.35）。权重存在的意义是抵消
各音色听感差异——早先各音硬编码 0.12/0.15/0.2/0.05，导致 error 明显偏响、
notify 几乎听不见。

#### 5.7.3 自定义音效

在 `kanye-pet/lib/assets/sounds/` 放置对应文件名的 `.wav` 文件，pet.js 自动优先加载：

```
lib/assets/sounds/
├── complete.wav     # 任务完成
├── pending.wav      # 审批/提问/评审
├── error.wav        # 任务出错
└── notify.wav       # 兜底
```

pet.js 在**配置首次到达时一次性**探测这四个文件（各发一次
`HEAD /kanye-pet/assets/sounds/<name>.wav`），结果缓存在 `soundProbe`：

- 存在 → 建 `Audio` 元素并 `preload='auto'`，后续通知直接重播（不再发请求）
- 不存在 → 记 `null`，后续通知直接回退 Web Audio 合成，不再发请求

**不需重编 exe**，放好文件重启 DSH 即可（服务器侧改动，与前端 pet.js 无关）。

> 为什么能"重启就生效"：assets 路由对 `sounds/` 下发 `no-cache, must-revalidate`
> 而非 immutable（见 `lib/src/assets.mjs` 的 `cacheControlFor`）。早期对所有 assets
> 一律下发 immutable 一年，导致"放好文件重启"静默失效——听见的仍是旧音且无报错。

#### 5.7.4 实现细节

- 音效播放位于 `lib/assets/pet/pet.js` 的 `playNotifSound(reason)` 函数
- 服务器 `/state` 端点返回的 `notification` 对象包含 `reason` 字段（如 `'completed'`、`'question'`、`'approval'`），pet.js 据此选择音效
- Web Audio API 上下文懒初始化（首次播放时才创建 `AudioContext`），且**每次取用都检查
  `state === 'suspended'` 并 `resume()`**：自动播放策略下无用户手势创建的 ctx 是
  suspended，声音会被丢弃，而用户手势**不会**自动恢复已存在的 ctx——不显式 resume，
  整个进程生命周期内合成音都是哑的。另在首次 pointerdown 调 `primeAudio()`，
  播一个 0 音量的极短音借手势解锁 ctx
- 合成音改用 `OscillatorNode` + `GainNode` 实现，带缓起缓落防爆音
- 连续通知有 250ms 最小间隔（`SOUND_MIN_GAP_MS`），防多条通知叠成爆音
- 自定义 wav 播放音量 = `sound.volume`（不再固定 0.3）

**改动生效范围**：换音效文件、改 assets 路由 = 服务器侧，重启 DSH 生效；
改 `pet.js`/`pet.html` = **必须重编 exe**（见下方更正）。

> ⚠️ **2026-10-13 实证更正（原结论错误，曾导致一次静默失效）**：
> 本节此前断言「pet.js 是运行时从 `desktop/src/` 磁盘读取、未嵌入 exe，
> 所以改完重启桌宠即可、别白跑 cargo build」——**这是错的**。
>
> 错因是取证不完整：只做了明文扫描与 gzip 成员扫描，**漏了 Brotli**。Tauri 把
> `frontendDist`（`../src`）里的资源以 **Brotli 压缩**嵌进 exe，因此
> `Select-String` 在 exe 里搜 `playNotifSound`/`showBubble`/`scheduleSetPosition`
> 全部 `absent`，看起来"没嵌入"，实际明文只是被压掉了。
>
> **正确取证法**（可复现）：把 `tauri-codegen-assets/*.js` 用
> `zlib.brotliDecompressSync` 解出来，即得 pet.js 全文；或直接断言
> 「压缩后的 asset 字节序列出现在 exe 内」：
>
> ```js
> const exe = fs.readFileSync('desktop/dist/DeepSeekHarness.exe')
> const asset = fs.readFileSync('<target>/release/build/deepseek-harness-desktop-*/out/tauri-codegen-assets/<hash>.js')
> console.log(exe.includes(asset))            // true  → 确已嵌入
> console.log(exe.includes(plainPetJsText))   // false → 明文当然搜不到（Brotli）
> ```
>
> **后果**：只改磁盘 `desktop/src/pet.js` 却**不重编 exe**，运行中的桌宠
> **行为完全不变**（实证：改完实测窗口仍 140×238，与改动前一致）。
> 改 pet.js 后必须走 §6.3 的「删 build 产物 → 重建 → 覆盖 dist」全流程。

---

## 六、构建与部署

> 🔄 **2026-10-20 换壳**：Tauri 的 `cargo build` / frontendDist 嵌入流程已随壳一起废弃。
> 本节换成 Electron 语义。Tauri 时代的 §6.1–6.5（Brotli 嵌入取证、WebView2 缓存、
> 端口 3080 复用）**不再适用**，仅作历史参考保留在本节末尾。

### 6.1 三层各自的改动代价

| 改了什么 | 需要做什么 | 不需要做什么 |
|---|---|---|
| `lib/assets/pet/*`（pet.html / pet.js） | 重启 Host（或仅硬刷新宠物窗） | 不重打壳补丁、不重编任何二进制 |
| `lib/index.mjs`、`lib/src/*`（Host 逻辑/路由） | 重启 Host | 不重打壳补丁 |
| `kanye-pet` 的 TS 源码 | `tsc` + `tsdown` 重建 → 主窗口 Ctrl+F5 | 不重打壳补丁 |
| `patches/kanye-pet-electron/lib/rules.mjs` | 退出应用 → `node patch.mjs` → `node verify.mjs` → 重启 | — |
| 插件 `package.json` / `cordis.patch.yml` | 重启宿主（启动期配置，不走 HMR） | — |

### 6.2 常规构建命令

```powershell
# kanye-pet（client bundle；tsc 必须 exit 0）
cd C:\dsh-ecosystem\plugins\kanye-pet
$env:NODE_OPTIONS=""
node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts

# 一次性（等价上面两行）：npm run build
```

### 6.3 开发期把 profile 切到本地源码

```powershell
cd C:\dsh-ecosystem
node scripts\plugin-dev-link.mjs link kanye-pet --profile desktop
```

link 会重装 profile 的 `node_modules` 并改写依赖版本，所以**必须重启宿主**——
宿主只在启动时解析并缓存每个插件的 `client.js` 路径。之后改源码不再需要重启
（HMR watcher 每 500ms 轮询 bundle，变化时经 SSE 推新 graph，此时重建 + Ctrl+F5 即可）。

> ⚠️ 新增插件的 `dsh.profile.bundles` 条目不会自动加，需手工补 profile 的
> `package.json`（否则依赖装上了但 loader 不挂载）。

### 6.4 壳补丁的自检与回滚

```powershell
cd C:\dsh-ecosystem\patches\kanye-pet-electron
node patch.mjs --dry-run   # 锚点唯一性命中检查
node patch.mjs
node verify.mjs            # 17 项产物断言
node revert.mjs            # 从 main.js.orig-<版本> 还原并删 preload
```

> **必须完全退出 DSH 桌面端再打补丁**：`main.js` 在运行期被映射进进程，
> 写入会失败或只对下次启动的半截生效。

### 6.5 （历史）Tauri 时代的构建坑 —— 已不适用

保留以便读懂旧记录，**不要照着做**：

- `tauri build` + Brotli 嵌入 `frontendDist` → 改 pet.js 必须重编 exe；
- `tauri-build` 的 rerun-if-changed 不跟踪目录内文件，得删 `target/.../build/dsh-desktop-*`；
- WebView2 缓存目录 `%LOCALAPPDATA%\ai.deepseek.harness.desktop\EBWebView`；
- 端口 3080 复用导致「重启 exe 不加载新 lib/index.mjs」。

## 七、避坑清单

> **换壳后的读法**：`#1–#40` 是历史累计条目，其中标 **［Tauri 专属］** 的已不适用
>（保留用于读懂旧记录），标 **［通用］** 的仍然有效。`#41–#48` 是 Electron 换壳新增。

| # | 坑 | 解决方案 |
|---|-----|---------|
| 1 | ［通用］config.mjs 改了但限制没变 | 确认宿主加载的是哪份插件（link 源码还是发布 tarball）；改完重启 Host |
| 2 | ［通用］保存时值被重置到旧上限 | host Zod schema 还是旧范围。改 `config.mjs` 后重启 Host |
| 3 | ［通用］设置面板显示范围不对 | 三层同步改：config.mjs + controller + locales.ts |
| 4 | ［Tauri 专属］桌宠窗口拖拽触发 Windows Snap | `start_dragging` 触发 Aero Snap。已改为手动 `pointermove` + 移窗，Electron 侧沿用同一策略 |
| 5 | ［Tauri 专属］set_size IPC 报 missing required key value | 旧参数格式 `{ value: { Logical: … } }`；Electron 侧改 `setSize(w, h)` 直传数字 |
| 6 | ［Tauri 专属］set_size 不生效 | Tauri 需 `resizable(true)`；Electron 用 `petWindow.setSize()`，不受 `resizable` 限制 |
| 7 | ［通用］桌宠显示三个复制体 | `background-size: contain` 会露出多帧，改 `auto 100%`（当前实现） |
| 8 | ［通用］桌宠底部被裁 | pet div 尺寸不够或缺 `background-position: center bottom` |
| 9 | ［通用］拖拽时精灵抖动 | 拖拽中暂停帧动画（pet.js 里 `dragging` 已参与 `tick()` 早退） |
| 10 | ［Tauri 专属］修改后刷新页面没用 | 旧 WebView2 缓存；Electron 侧前端走 HTTP + `pet/` 目录 `no-cache`，重启 Host 即生效 |
| 11 | ［Tauri 专属］新 exe 启动后旧 DSH 还在 | 端口 3080 复用；Electron 官方壳端口随机且单实例锁，无此问题 |
| 12 | ［Tauri 专属］找不到 `__TAURI_INTERNALS__` | Electron 侧**不存在**该对象；页面必须经 `dsh-app://app/kanye-pet/window` 加载才能拿到 `window.petDesktop` |
| 13 | ［通用］保存设置后值被回退成旧值 | 写入被拒：Windows 下 `settings.yaml` 被其他进程持句柄时 rename 报 EPERM。`dsh-atomic-write` 已有 unlink+rename 回退 |
| 14 | ［通用］lib/index.mjs 加载报错（SyntaxError） | 文件有无效 UTF-8 字节（中文第三字节被 `?` 替换）。只能用纯 UTF-8 编辑器改，见 §9.3 |
| 15 | ［通用］DSH 启动后插件不生效（404） | `cordis.patch.yml` 中 kanye-pet 行被注释；或 profile 的 `dsh.profile.bundles` 缺条目 |
| 16 | ［Tauri 专属］Tauri 打开了但桌宠窗口空白 | 旧 capabilities `windows` 缺 `"pet"`；Electron 侧无 capability 概念 |
| 17 | ［Tauri 专属］改 pet.js/pet.html 后重编 exe 不生效 | Tauri build script 缓存问题；Electron 侧改前端**根本不用重编** |
| 18 | ［Tauri 专属］点击气泡无反应 | 旧 `pet_open_session` 注册问题；Electron 侧查 `preload-pet.cjs` 是否就位 + 主窗口是否装了 kanye-pet |
| 19 | ［Tauri 专属］Windows 通知仍弹（桌宠启用时） | 旧 ShimNotification 分支判断；Electron 侧见 #44 |
| 20 | ［通用］气泡被窗口裁剪 | 气泡必须放在窗口可视区域内（`bottom: 4px`），不能用 `calc(100% - …)` 推到窗口外 |
| 21 | ［通用］气泡标题和正文挤在一行 | `showBubble()` 里 `display: 'flex'`（CSS 已定 `flex-direction: column`）；用 `'block'` 会覆盖 |
| 22 | ［通用］气泡底部透明蒙版 | `box-shadow` 在透明窗口内形成半透明渐变带；用纯色背景 + 实色边框 |
| 23 | ［Tauri 专属］双通知（气泡 + Windows Toast） | 旧 ShimNotification 转发到已删除端点后兜底 fire；Electron 侧见 #44 |
| 24 | ［通用］通知两头空 | 抑制逻辑生效但桌宠气泡没发出。查 `/kanye-pet/state` 的 `notification` 字段与日志 `[kanye-pet] notify` |
| 25 | ［通用］onJobDone 不触发（纯对话） | 它只对子进程 job 触发；通知不能以它为唯一源 |
| 26 | ［通用］assistant/message 触发通知太频繁 | 通知必须按 turn/end 粒度（见 §5.2） |
| 27 | ［通用］启动时通知历史 turn | 首次扫描只记 `lastTurnEndNotif` 基线，不通知 |
| 28 | ［通用］启动时桌宠透明（manifest 加载失败） | `loadManifest()` 只在 `pollConfig()` 里按 `!manifestReady` 重试 |
| 29 | ［通用］精灵图角色显示很小 | 精灵图透明 padding 过多，见 §3.10（已修复，`.v3.png`） |
| 30 | ［通用］PowerShell 测 curl JSON 报 invalid JSON | `Set-Content -Encoding UTF8` 加 BOM；用 `[IO.File]::WriteAllText(..., UTF8Encoding($false))` 写无 BOM 文件 |
| 31 | ［通用］会话标题未就绪显示"未命名会话" | 兜底链 `resolveSessionTitle` → `session.label` → `session.id` |
| 32 | ［通用］工具审批通知两头空 | 审批不产生 `turn/end blocked`（turn 保持 OPEN）。必须靠 `approval/asked` 事件（§5.6.1） |
| 33 | ［通用］ask_user_question / exit_plan_mode 无通知 | 工具 async 等待时 turn 不结束。必须靠 `tool/call` 快速路径 |
| 34 | ［Tauri 专属］pending 通知与 Windows toast 重复 | 旧 ShimNotification 的 `-pending-` 特判；Electron 侧统一查 `desktopPetEnabled` |
| 35 | ［通用］rc.1 升级后任务完成气泡全失效（零报错） | `session.events` 已删除，守卫式兼容读会静默兜成空数组。三处读日志全改 `session.snapshotEvents()` |
| 36 | ［通用］新会话首个回合完成不通知 | seed 分支必须**无条件** `lastTurnEndNotif.set(id, lastSeq)`（含 -1） |
| 37 | ［通用］子代理子任务完成也弹气泡 | `setPetNotification()` 首行按 `session.header.origin === 'subagent'` 拦截；三条路径都经它汇聚 |
| 38 | ［通用］子代理跑一轮宠物就庆祝 | 庆祝三个写入点都要过滤：`session.header.origin` + `JobSnapshot.ownerSession` 查 `subagentSessions`。**只静音表现层**，账本不变 |
| 39 | ［通用］网页浮宠从哪来的 | 0.3.0 前：源码禁用但旧产物仍在跑。0.3.0 合并后源码与生成器都已删除，`lib/client.js` 只含设置卡片/通知 shim/跳转监听，**浮宠彻底消失**（有意为之） |
| 40 | ［通用］设置页 tab 整块空白（零报错） | 0.2.1 删除 `settings.register()`；改为 loader 条目 id + 插件导出的 `Config`（全字段 `.volatile()`），client 用 `ctx.configForms.get('<loader 条目 id>')` |
| 41 | ⚠️［Electron］宠物窗完全不出现 | ① `node patches/kanye-pet-electron/verify.mjs` 是否 17/17；② 是否漏了 `desktop-menu` 前置（main.js 未 unpacked 时本补丁拒绝写入）；③ 改完 main.js 是否真的退出了应用再重启 |
| 42 | ⚠️［Electron］宠物窗一片空白 / 永不加载 | **`did-fail-load` 对 503 不触发**（503 是正常完成的响应）。必须 `loadURL().catch()` 里重试；也不要在 `did-finish-load` 里 `show()`，那会闪空白窗（§3.8） |
| 43 | ⚠️［Electron］拖拽/点击全无反应 | `window.petDesktop` 没注入 → `preload-pet.cjs` 是否与 `main.js` 同目录；`preload-error` 会进壳日志。**页面必须经 `dsh-app://app` 加载**，直接开 `file://` 拿不到桥 |
| 44 | ⚠️［Electron］桌宠开着仍弹 Windows Toast | `kanye-pet` 的 Notification shim 未加载或还是旧 bundle。它用**相对路径** `/kanye-pet/config`；硬编码 3080 在桌面端必打空 |
| 45 | ⚠️［Electron］关掉桌宠开关后宠物还在 | `desktopPetEnabled` 未落到 profile `cordis.patch.yml` 的 `- id: kanye-pet` 节；或旧 bundle 缓存（重启 Host） |
| 46 | ⚠️［Electron］改了 pet.js 没反应 | assets 路由对 `pet/` 下发 `no-cache`，但 Host 进程内的模块不重启就不会换页；确认重启了 Host。别去清 WebView 缓存（不是那个原因） |
| 47 | ⚠️［Electron］宠物跑到屏幕外不见了 | 位置记忆写的是副屏坐标，副屏拔了。`clampPetPosition` 会把完全出屏的落点拉回主屏右下角；若仍丢失，删 `%APPDATA%\@deepseek-ai\dsh-desktop\pet-window.json` |
| 48 | ⚠️［Electron］官方更新后宠物/菜单一起消失 | 官方「检查更新」整包覆盖 `app.asar` 与 `app.asar.unpacked`。按序重跑两个补丁：先 `patches/desktop-menu`，再 `patches/kanye-pet-electron` |
| 49 | ⚠️［通用］桌宠 tab 在、内容整块空白（2026-10-26 实踩） | **profile 的 `cordis.patch.yml` 里 `- id: kanye-pet` 出现两次**（一条带 `name/config`，末尾又有一条 `disabled: false`）。宿主 `ConfigEditor.entries()` 用 `counts.get(id) === 1` 过滤，重复 id 被整条丢弃 → `volatileForm` 拿不到 schema → client `configForms.get('kanye-pet')` 恒 `unavailable` → 卡片 `if (!state.available) return null` → **tab 在、零报错、整块空白**（与 #40 同款静默失败）。查法：`Select-String -Path <profile>\cordis.patch.yml -Pattern '^- id: kanye-pet'` 必须只有 1 条；改完**必须重启宿主**（entries 在启动期构建，刷新页面无效） |
| 50 | ⚠️［通用］桌宠「加载出来后才变大小」 | `pet.js` 的 `applyConfig` 里 **`setVisible` 排在 `setSize` 之前**：窗口先以建窗默认 150×255 亮起，下一帧才被拉成设置尺寸。改成「先 `await setSize` 再 `setVisible`」（隐藏态改尺寸不可见）。门禁 `tests/pet-window.test.mjs` 断言调用先后 |
| 51 | ⚠️［Electron］改了顺序仍「先默认尺寸再变」（2026-10-28 实踩，真正根因） | 页内顺序只是**一半**。壳侧 `setSize` 有竞态：`petWindow.setSize()` **同步触发 `resize` 事件**，而 resize 守卫拿 `desiredSize` 纠偏；旧实现先 `setSize` 再写 `desiredSize` → 守卫用旧值（建窗 150×255）把这次设置**原样回滚**。壳日志实证：`setSize req=130x221 before=150x255 after=150x255`，随后 `resize event 130x221 -> restore 150x255`，要等第三次轮询才碰巧成功 —— 用户看到的就是「先 150×255 出来、5 秒后才变」。修法：**先 `desiredSize = requested` 再 `setSize`**（`patches/kanye-pet-electron/lib/rules.mjs`，补丁标记升 v2）。改完必须 `node revert.mjs` → `node patch.mjs` → **完全退出应用**重开；`verify.mjs` 18 项含顺序断言 |

## 八、相关文件清单

```
plugins/kanye-pet/                        # 插件本体（本仓）
├── lib/index.mjs                         # Host half（通知队列 + turn 检测 + 路由）
├── lib/src/config.mjs                    # Host schema + 默认值
├── lib/src/routes.mjs                    # HTTP 路由常量（含 WINDOW_PATH）
├── lib/src/assets.mjs                    # 路径净化 / MIME / 缓存策略
├── lib/src/session-events.mjs            # turn 边沿判定（parseTurnEvent）
├── lib/assets/pet/pet.html               # 桌面宠物窗口页（Electron 壳加载）
├── lib/assets/pet/pet.js                 # 宠物窗口逻辑（拖拽 + 轮询 + sprite + 气泡 + 音效）
├── lib/assets/manifest.json              # 角色 sprite 清单
├── src/client/index.ts                   # Client half 源码（设置卡片 + shim + 跳转）
├── lib/client.js                         # Client half 构建产物（tsdown 出）
├── tests/pet-window.test.mjs             # 窗口页路由 + 前端去 Tauri 化门禁
├── tests/subagent-notify.test.mjs        # 子代理不通知回归
├── tests/jump-check.mjs                  # dsh:open-session 跳转回归
├── tests/verify-notif-and-buttons.mjs    # DEFAULTS/schema/bundle 一致性
└── cordis.patch.yml                      # 宿主组合挂载

patches/kanye-pet-electron/               # Electron 壳补丁（宠物窗口宿主）
├── patch.mjs                             # 打补丁（幂等，语法自检，自动备份）
├── verify.mjs                            # 17 项产物断言
├── revert.mjs                            # 还原 main.js + 删 preload
├── lib/asar.mjs                          # 最小 asar 读工具（定位与前置检查）
├── lib/rules.mjs                         # 注入规则 + preload 源码（唯一真值来源）
└── README.md                             # 依赖顺序、升级重跑、排查表

patches/desktop-menu/                     # 前置补丁：把 lib/main.js 解包（菜单项）
desktop/                                  # 自研 Tauri 壳（已弃用，仅历史参考）
├── src/pet.html / src/pet.js             # 旧窗口前端（已迁至插件 assets）
└── src-tauri/src/lib.rs                  # 旧 Rust 侧（pet_open_session / ShimNotification）
```

## 九、扩展指南

### 9.1 新增角色

1. 在 `kanye-pet/assets/characters/<id>/` 放置 sprite sheet
2. 在 `assets/manifest.json` 的 `characters` 对象中添加角色定义
3. 每个角色需要 15 个状态的 sprite（`verify-assets` 门禁强制）

### 9.2 新增配置项

1. 在 `config.mjs` 的 `buildSchema()` 中添加 Zod 字段
2. 在 `DEFAULTS` 中添加默认值
3. 在 `kanye-pet` 的 `KanyeSettings` interface 中添加字段
4. 在 `KanyeCard.tsx` 中添加 UI 控件 + **reset 硬编码**
5. 在 `kanye-card-controller.ts` 中添加校验
6. 在 `locales.ts` 中添加文案
7. 若影响桌宠窗口尺寸，同步改 `lib/assets/pet/pet.js` 的 `applyConfig` 与壳补丁 `lib/rules.mjs` 的 `PET_W`/`PET_H`（改壳补丁需重跑 patch.mjs）

> **坑点**：改默认值时，reset 硬编码（§4.5）、schema default、`DEFAULTS`、前端校验、locale 提示、`pet.js` 的 `Math.min` 上限**六处必须同步**。

### 9.3 lib/index.mjs 损坏修复

`lib/index.mjs` 是手写的 Cordis 插件入口，曾因 UTF-8 字节损坏导致无法加载：

- **症状**：Node.js 报 `SyntaxError: Unexpected token 'export'`（实际是注释和字符串里的中文第三字节被 `?` 替换）
- **损坏模式**：中文字符 `务`（`E5 8A A1`）→ `E5 8A 3F`（第三字节变 `?`），导致：
  - 字符串字面量闭合引号丢失（`'未命名任务'` → `'未命名任`）
  - `//` 注释与后续代码行合并，`import`/`const`/`let`/`ctx.`/`...(`/`})` 被吞
- **修复工具**：项目内附 `fix-v5.mjs`（已删除，可从 git 历史找回），自动修复 43 处合并 + 2 处字符串

```bash
# 从修复脚本恢复（该脚本已删除，若需要请从 git 历史获取）
git show <commit>:packages/desktop/kanye-pet/fix-v5.mjs > fix-v5.mjs
```

> **预防**：编辑 `lib/index.mjs` 时只能用纯 UTF-8 编辑器（VS Code、Vim），避免 GBK/GB2312 编码工具。文件包含大量中文注释，编码转换会直接破坏字符。

### 9.4 调试技巧

```javascript
// pet.js 中加可见调试指示器
const dbg = document.createElement('div')
dbg.style.cssText = 'position:fixed;top:0;left:0;font:9px monospace;color:#0f0;background:rgba(0,0,0,.8);padding:1px 3px;z-index:99999'
document.body.appendChild(dbg)
dbg.textContent = 'debug info'
```

### 9.5 排查链路速查

| 症状 | 查什么 |
|------|--------|
| 宠物窗不出现 | ① `node patches/kanye-pet-electron/verify.mjs`（应 17/17）② 是否真的退出应用后重启 ③ `desktop-menu` 前置是否打过 |
| 宠物窗空白 | `curl http://127.0.0.1:<当前端口>/kanye-pet/window` 是否 200；Host 未就绪时壳返回 503（补丁每 2s 重试，见 §3.8） |
| 拖拽/点击无反应 | 页里 `typeof window.petDesktop` 应为 object；`file://` 打开拿不到桥，必须走 `dsh-app://app` |
| 会话气泡不出现 | `curl <host>/kanye-pet/state` 看 `notification` 字段；日志查 `[kanye-pet] notify <id>: "<标题>"`（发出时必打）；只有 `/state` DEBUG 行而无 notify 行 = 检测路径失效（§七 #35） |
| 通知内容不对 | 检查 turn/end 的 `reason.kind` 映射；标题兜底链是否命中 |
| 桌宠开着仍弹 Windows Toast | `kanye-pet` 的 Notification shim 未生效或旧 bundle（§七 #44） |
| 点击气泡不跳转 | 主窗口是否加载了含 `dsh:open-session` 监听的 kanye-pet；监听存在仍不切 → 检查是否还调已删除的 `sessions.open()`（必须走 `ctx.uiWorkspace.openSession(id)`）；回归 `node plugins/kanye-pet/tests/jump-check.mjs` |
| 桌宠透明/无图 | `curl <host>/kanye-pet/assets/manifest.json` 是否 200；`loadManifest` 重试是否生效 |
| 改了 pet.js 不生效 | 重启 Host（不是清 WebView 缓存）；确认走的是 `link:` 源码而非发布 tarball |
| 想确认前端是否已去 Tauri 化 | `node --test plugins/kanye-pet/tests/pet-window.test.mjs`（9 项） |

### 9.6 经验总结

1. **换壳后的分层是核心心智**：前端（`lib/assets/pet/`）走 HTTP，改完重启 Host 即生效；只有窗口宿主（`patches/kanye-pet-electron`）需要重打补丁。别再把前端塞回壳里。
2. **Electron 的官方协议是免费的同源通道**：`dsh-app://app` 由主进程 `protocol.handle` 带 cookie 转发到 Host，所以宠物页与 `/kanye-pet/*` 天然同源——不需要 CORS，也不需要知道端口。
3. **`did-fail-load` 不管 HTTP 状态码**：503 属于「正常完成的响应」。自愈重试必须挂在 `loadURL().catch()` 上（§3.8）。同理别在 `did-finish-load` 里 show。
4. **`backgroundThrottling: false` 换掉了 Tauri 的 0×0 hack**：隐藏不再挂起 JS，`hide()/show()` 就是正确语义。
5. **会话事件有两套通道**：`session/event` 广播与完整事件日志。rc.1 起日志私有化，读法是 `session.snapshotEvents()`——**守卫式兼容读会把破坏静默吞成空数组而非报错**，宿主升级后必须 grep 插件里所有 `.events` 引用（§七 #35/#36）。
6. **通知语义要对齐 dsh-notification-custom**：按 turn 投影推进，一次 turn 一条；不要用 onJobDone（只覆盖 job）或 assistant/message（太频繁）。
7. **三条通知检测路径缺一不可**：turn/end 扫描 / `approval/asked` / `tool/call` 快速路径（§5.6.1）。
8. **通知抑制只有一个决策点**：`desktopPetEnabled`。开 → 桌宠气泡接管，关 → 原生通知。两个宿主（Tauri 桥 / Electron 原生）共用同一条判断，别分裂成两套语义。
9. **透明窗口的视觉坑**：`transparent` 必须配 `hasShadow: false`；气泡用纯色背景 + 窗口内定位，`box-shadow` 在透明窗里会形成渐变带。
10. **补丁锚点唯一命中是硬约束**：官方升级后 `--dry-run` 报命中 ≠1 就停下改 `rules.mjs`，绝不放宽断言。
