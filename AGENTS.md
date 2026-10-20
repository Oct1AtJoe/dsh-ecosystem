# DSH 本地定制生态开发规范（C:\dsh-ecosystem）

> 本文件为工作区级开发指南。DSH 按 用户全局（`~/.dsh/AGENTS.md`）→ 项目根（`C:\dsh-ecosystem\AGENTS.md`）→ cwd 链 顺序加载。
> 本工作区所有插件开发、缺陷修复与维护任务均须严格遵守本文档。

> 🚨 **升级 `E:\dshDesktop` 桌面端后，必读
> [docs/desktop-upgrade-checklist.md](docs/desktop-upgrade-checklist.md)。**
>
> 桌面端从 `app.asar` 加载官方包，升级会替换其中的版本。凡是我们用 `link:`
> 覆盖过的官方包（见 §6），版本错位会导致**整块界面崩溃**。
> 该清单给出逐步核对流程、官方是否已自带补丁的判断方法，以及回滚命令。

---

## 0. 桌面端现状（必读，2026-10-20 修订）

### 0.1 当前桌面端 = 官方 Electron 客户端

**正在运行的桌面端是 `E:\dshDesktop` 的官方 Electron 客户端，不是自研 Tauri 壳。**

| 事实 | 值 |
|---|---|
| 可执行文件 | `E:\dshDesktop\DeepSeek Harness.exe`（Electron） |
| 应用包 | `E:\dshDesktop\resources\app.asar`（约 182 MB） |
| 官方包根 | `E:\dshDesktop\resources\app.asar\dsh\` |
| 升级方式 | 官方 NSIS 安装包；升级会整体替换 `app.asar` |
| 网页端 | 同一个 Host 进程，`dsh web` 监听随机端口（如 `http://127.0.0.1:25063`） |

### 0.2 改官方 Electron 端的唯一途径 = `patches/`

官方桌面端的 `app.asar` 是**官方产物**，源码在 `E:\vibeCoding\deepseek-harness` 里改**不会**进 asar。
要改壳层行为，只能走 `patches/` 下的 asar 补丁（每个补丁带 `patch.mjs` / `verify.mjs` / `revert.mjs`）：

| 补丁 | 作用 |
|---|---|
| `patches/desktop-menu` | 给「应用」菜单与托盘右键各加「刷新页面」「重启应用」两项。**改 `lib/main.js` 为 `unpacked`，是其它补丁的前置** |
| `patches/kanye-pet-electron` | 给官方 Electron 壳注入透明置顶宠物窗与 IPC 桥，配套 `kanye-pet` 插件的 `GET /kanye-pet/window` |
| `patches/chat-virtual-rows` | 聊天区只画可见行（`content-visibility`），切长会话不再卡顿 |
| `patches/cost-meter-lock` | `dsh-cost-meter` 的 Windows 锁身份不再同步调 PowerShell |

> 🚨 **打补丁前必须完全退出 DSH 桌面端**（托盘退出，不是关窗口）：`main.js` 在运行期被映射进进程。
> 🚨 **`desktop-menu` 是前置**：它把 `lib/main.js` 摊到 `app.asar.unpacked/lib/main.js`，后续补丁只改那个磁盘文件，**不重写 asar 头**。
> 🚨 改完必须验证：`node verify.mjs`。判据用**补丁自己的独有符号**，不能用 locale 文案键（会撞车复用字典）。

### 0.3 `desktop/`（Tauri 壳）已弃用，仅作历史参考

`C:\dsh-ecosystem\desktop` 是**早期自研的 Tauri 2 无边框双 WebView 壳**（Rust + WebView2），
**当前不再使用、不再维护、不再随版本迭代**。保留原因：其中踩坑记录对理解壳层问题仍有参考价值。

- 若出于考古需要阅读，见 [desktop/DESKTOP-SHELL.md](desktop/DESKTOP-SHELL.md)：Win32 无边框机制
  （WM_STYLECHANGING / WM_NCCALCSIZE / WM_GETMINMAXINFO / WM_NCHITTEST）、边缘拖拽缩放的跨进程
  `border_resizing` 方案、标题栏交互、三条 initialization_script、重启语义与全部踩坑记录。
- **不要再基于它改功能**：它和当前 Electron 端是两套独立实现，改它不会影响你正在用的客户端。
- Tauri 版的 pet 窗口、重启语义等能力，在 Electron 端的对应实现见 `patches/kanye-pet-electron` 与 `patches/desktop-menu`。

---

## 1. 核心铁律（硬约束）

1. **官方源码零修改**：严禁向官方 checkout（`E:\vibeCoding\deepseek-harness\`）写入任何文件或执行修改。上游必须保持 `git pull` 零冲突干净状态。
2. **挂载只走 Profile 原生机制**：所有自定义插件均置于 `C:\dsh-ecosystem\plugins\<包名>`，通过 `~/.dsh/profiles/web/` 的 `link:` 协议依赖与 `cordis.patch.yml` 注入，不得反向侵入宿主。
3. **构建纯度门**：Client bundle 严禁运行时符号跨插件混入（禁止直接 value-import `@deepseek-ai/*` 非白名单内部模块），交互一律通过 Cordis 服务、API Controller 或 Slot 机制解耦。
4. **主题令牌契约**：禁止硬编码颜色，界面样式必须严格消费 `--dsw-*`（better-sidebar 令牌）或 `--ds-*`（DSH 官方设计令牌）CSS 变量。

---

## 2. 插件架构总览（Node Host + Browser Client）

DSH Web 插件采用双端架构：

```
plugins/<plugin-name>/
├── src/
│   ├── index.ts                 # Node-half 桩入口（空 apply，供 Cordis/Loader 拓扑识别）
│   ├── css-modules.d.ts         # CSS Modules 类型声明（如有样式）
│   └── client/
│       ├── index.ts             # Browser-half 客户端入口（apply + 业务/Slot 注册）
│       ├── locales.ts           # 本地化字典（NS 命名空间，zh / en）
│       ├── Component.tsx        # React 界面组件
│       └── Component.module.css # 局部作用域样式
├── package.json                 # 包元数据、exports、dsh.client、peerDependencies
├── tsconfig.json                # 继承 ../../tsconfig.base.client.json
└── tsdown.config.ts             # 调用 ../tsdown.client.ts 的 clientBundle 预设
```

### 端职责分工
- **Node Host 半**：通常为纯 UI 插件的桩，提供空 `export function apply(): void {}`，供宿主 Cordis 加载器将插件名册编入 `window.__DSH_BOOT__`。
- **Browser Client 半**：由 `dsh-client-modules` 打包为外部 Combo 脚本，通过惰性工厂（`window.__ModuleLoader__.load`）加载，由浏览器端 Cordis 容器编排激活。

---

## 3. Slot 组合机制与 Shadowing 规则

### 3.1 显式注入（Slot Declaration Injection）
- 必须通过 `ctx.slots.inject(slotName, callback)` 监听槽声明，禁止未注入直接 `register()`。
- `ctx.slots.inject` 会跟随声明方的生命周期与 declaration epoch，声明方重载或卸载时自动清理。

### 3.2 Shadowing 遮蔽规则（核心覆盖机制）
- **单占位 / 列表项判定**：`single` 槽按槽本身遮蔽，`list` 槽按相同 `id` 遮蔽（如 `conversation.input.dock` 内的 `id: 'queue'`）。
- **优先级升序**：相同 cell 的多个条目按 `priority` 升序排列，**数值最小者胜出渲染（lowest renders）**。
- **负优先级准则**：自定义插件替换官方默认组件时，**必须显式指定负 priority（如 `priority: -5`）**，确保同时遮蔽官方默认项（`0`）与第三方插件（如 better-sidebar 的 `-1`）。

### 3.3 上下文标准 Props 与核心 API
挂载在 `scope: 'session'` 的 Slot 组件自动注入标准 Props：
- `useSession`：获取当前会话状态（`session.queue`、`session.running` 等）。
- `useInput`：获取当前输入框状态（`inputState.draft` 等）。
- `inputActions`：会话公共输入动作：
  - `setDraft(text: string)`：替换/回填草稿文本，光标置于末尾。
  - `addImages(ids)` / `removeImage(id)`：附件图片操作。
- `ctx.conversation` / 会话级服务：
  - `updateQueue(itemId, { kind: 'remove' | 'edit' | 'steer' })`：原子操作排队消息（撤回/修改/插话）。
  - `loadImage(attachment)`：解析持久化会话图片 URL。

---

## 4. 本地工程与构建流水线

本地定制生态具备独立构建闭包，构建过程**不依赖官方源码仓库**：

### 4.1 核心配置文件标准模版

#### `package.json`
```json
{
  "name": "@deepseek-ai/dsh-client-<name>",
  "description": "<description>",
  "version": "0.1.0-rc.1",
  "type": "module",
  "main": "lib/index.js",
  "types": "lib/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./lib/types/index.d.ts",
      "default": "./lib/index.js"
    },
    "./client": {
      "types": "./lib/types/client/index.d.ts",
      "default": "./lib/client.js"
    },
    "./src/*": "./src/*",
    "./package.json": "./package.json"
  },
  "dsh": {
    "client": {
      "inject": [
        "@deepseek-ai/dsh-api-session-controller",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-conversation",
        "@deepseek-ai/dsh-client-ui-renderer",
        "@deepseek-ai/dsh-client-ui-slots"
      ],
      "platform": "web"
    }
  },
  "scripts": {
    "bundle": "tsdown"
  },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "@deepseek-ai/dsh-api-session-controller": "^0.1.2-rc.1",
    "@deepseek-ai/dsh-client-locale": "^0.1.2-rc.1",
    "@deepseek-ai/dsh-client-ui-conversation": "^0.1.2-rc.1",
    "@deepseek-ai/dsh-client-ui-primitives": "^0.1.2-rc.1",
    "@deepseek-ai/dsh-client-ui-slots": "^0.1.2-rc.1"
  },
  "files": [
    "lib/index.js",
    "lib/client.js",
    "lib/types/**/*.d.ts"
  ]
}
```

#### `tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.client.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib/types",
    "typeRoots": [
      "E:/vibeCoding/deepseek-harness/scripts/types",
      "../../node_modules/@types"
    ]
  },
  "include": [
    "src"
  ]
}
```

#### `tsdown.config.ts`
```ts
import { clientBundle } from '../tsdown.client.ts'

export default clientBundle('@deepseek-ai/dsh-client-<name>', ['lib/types/index.js'])
```

### 4.2 构建标准命令（两阶段构建）
构建产物分为两步：`tsc` 产出 `lib/types`，再由 `tsdown` 打包出 `lib/client.js` 与 `lib/index.js`：

```powershell
cd C:\dsh-ecosystem\plugins\<包名>
$env:NODE_OPTIONS=""
node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
```

> 🚨 **`tsc` 必须 exit 0，不许「有报错但 emit 了就当通过」**。
> `tsdown` 不做类型检查，`tsc` 报错时它照样打包成功——于是类型错误可以静默存活很久，
> 直到某次真实契约变更才暴露。判据只看 `$LASTEXITCODE`，不看产物是否生成。

### 4.3 依赖解析必须「单实例」（核心坑点）

> 🚨 **同一符号被解析成两个物理文件，TypeScript 的类型增强就合并不了。**

本生态的依赖实际由两处提供：

| 位置 | 内容 |
|---|---|
| `C:\dsh-ecosystem\plugins\node_modules\@deepseek-ai\*` | **junction → `E:\vibeCoding\deepseek-harness\packages\*`**（权威） |
| `C:\dsh-ecosystem\node_modules\@deepseek-ai\*` | 真实目录，9 月 3 日安装的旧快照（`0.1.2-rc.1`） |

解析优先命中的是 `plugins/node_modules`，**所以任何 harness 包都必须在 `plugins/node_modules/@deepseek-ai/` 下有 junction**。
一旦缺失，解析会回落到生态根那份旧快照，与 harness 的 `.d.ts` 形成两份互不相认的模块：

- `declare module '@deepseek-ai/cordis' { interface Context { slots/theme/locale } }` 写进 A 份，
- 插件 `import type { Context }` 拿到 B 份，
- 结果：`Property 'slots' does not exist on type 'Context'` 之类假报错铺满整个文件。

**已踩过的两个实例（2026-10-18 修复）**：

| 缺失/错指的 junction | 症状 |
|---|---|
| `@deepseek-ai/cordis` 缺失 | 全生态 4 插件报 `ctx.slots` / `ctx.theme` / `ctx.locale` 不存在（cordis 4.0.2 vs 4.0.5） |
| `@deepseek-ai/dsh-llm` 指向 profiles 的 pnpm 副本 | `MessageId` 等 branded 类型「缺少 `[BRAND]` 属性」 |

**修复范式**（junction 一律指向 harness 源，与其余 24 个包保持一致）：

```powershell
$link   = "C:\dsh-ecosystem\plugins\node_modules\@deepseek-ai\<包名>"
$target = "E:\vibeCoding\deepseek-harness\packages\<路径>"
if (Test-Path $link) { cmd /c rmdir "$link" }
cmd /c mklink /J "$link" "$target"
```

**排查手法**（比读报错快得多）：

```powershell
cd C:\dsh-ecosystem\plugins\<包名>
node "...\typescript\bin\tsc" -p tsconfig.json --traceResolution > trace.txt 2>&1
Select-String -Path trace.txt -Pattern "Module name '<包>' was successfully resolved" |
  ForEach-Object { ($_.Line -split "resolved to '")[1] -split "'" | Select-Object -First 1 } |
  Sort-Object -Unique
```

**只要输出超过一行，就是重复解析**，先修 junction，不要动业务代码。

### 4.4 harness 升级后的契约适配

`tsc` 报错里要区分两类：

- **重复解析**（4.3）——先修 junction，往往一次消掉几十条；
- **真实契约变更**——签名/字段真的变了，必须改代码。已发生的：

| 变更 | 适配 |
|---|---|
| `ThemeRuntime.setFontSize(px)` → `setFontSize(role, px)`；快照 `fontSize` → `fontSizes: Record<'text'\|'code'\|'terminal', number>` | 字号意图保护改按 `(role, px)` 记录与重发 |
| `ToolResultMessage.content[].isError` → 标志上移到 `message.isError` | `tool/result` 判定改读 `event.data.message.isError` |
| `conversation.chat.turnTail` 由 `chain` 改 `list` | 注册需 `id`，原 `select` 选举逻辑移进组件（不满足自返 `null`） |

---

## 5. Profile 挂载与生效验证流程

> 🚨 **本机跑的是「发布版」插件**（profile 依赖指向 GitHub Release 的 .tgz），
> 所以**改完源码不会立刻生效** —— 必须先把 profile 切成 `link:` 源码（§5.2），
> 用户在页面上验证通过后，再切回发布版并重新打包（§5.3）。
> **不要跳过 link 这一步就打包**：那等于让用户拿旧产物去验收新代码。

### 5.1 挂载依赖（新增插件时）
1. 编辑 `C:\Users\Administrator\.dsh\profiles\<profile>\package.json`：
   在 `dependencies` 中添加：
   ```json
   "@deepseek-ai/dsh-client-<name>": "link:C:/dsh-ecosystem/plugins/<包名>"
   ```
2. 编辑 `C:\Users\Administrator\.dsh\profiles\<profile>\cordis.patch.yml`：
   在 `- insert:` 列表末尾挂载该条目：
   ```yaml
   - id: <name>
     name: '@deepseek-ai/dsh-client-<name>'
   ```
   （客户端专用插件若自带 `cordis.patch.yml` 且 `package.json` 声明了
   `dsh.bundle.patch`，则由该文件提供 loader 条目，**不要**再手写一条。）

### 5.2 开发期：把 profile 切到本地源码（link）

```powershell
# 切到源码并重装（脚本会改 profile/package.json 的依赖并跑 pnpm install）
cd C:\dsh-ecosystem
node scripts\plugin-dev-link.mjs link ui-theme-custom --profile desktop

# 查看当前是「源码」还是「发布版」
node scripts\plugin-dev-link.mjs status ui-theme-custom --profile desktop
```

**link 之后改源码的完整循环**：

```powershell
cd C:\dsh-ecosystem\plugins\ui-theme-custom
$env:NODE_OPTIONS=""
node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json      # 必须 exit 0
node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
# 跑该插件的门禁测试（见各插件 AGENTS.md）
node tests\badge-token-check.mjs
```

然后**重启 DSH 宿主**并在页面 `Ctrl+F5` 硬刷新。

> 🚨 **第一次 link 必须重启宿主**：profile 被重装过，而宿主在**启动时**解析并缓存
> 每个插件的 `client.js` 路径（`client-modules` 的 `resolveMeta` / `pkgMeta` 缓存），
> 所以光刷新页面仍会拿到旧 bundle。**重启之后**再改源码就不用重启了 ——
> HMR watcher 每 500ms 轮询各 bundle 的 stat，变化时通过 SSE 推送新 graph，
> 此时「重新构建 + Ctrl+F5」即可生效。
>
> ⚠️ `link:` 只替换**依赖解析**，`dsh.profile.bundles` 列表与 loader 条目不变，
> 所以插件仍然会被正常编进 `window.__DSH_BOOT__`。
> ⚠️ 若改了插件的 `package.json`（如新增 `dsh.bundle` 声明）或 `cordis.patch.yml`，
> **必须重启宿主**，光刷新页面不生效（这属于「启动期配置」，不走 HMR）。

### 5.3 发布期：切回发布版并重新打包

用户**在页面上验证通过**之后，才走这一步：

```powershell
cd C:\dsh-ecosystem
# 1. 切回发布版依赖（脚本把 link: 换回 Release 的 .tgz URL 并重装）
node scripts\plugin-dev-link.mjs release ui-theme-custom --profile desktop

# 2. 切版本号（package.json 的 version），让 tarball 文件名带上新版本
#    编辑 plugins\ui-theme-custom\package.json 的 "version"

# 3. 重新构建 + 打包全部插件
cd plugins\ui-theme-custom
node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
cd ..\..
node scripts\pack-plugins.mjs

# 4. 更新 另一台电脑安装指南.md（必须在第 5 步之前，见 §5.4 第 0 阶段）

# 5. 把 dist-tarballs\*.tgz 上传到对应的 GitHub Release
```

> 🚨 **第 4 步不可跳过**：`另一台电脑安装指南.md` 是另一台电脑的安装依据，
> 它与 `dist-tarballs/` 的产物必须是同一版本。打包前不改指南 = 让另一台电脑装旧版。

`pack-plugins.mjs` 会把每个插件打成 `dist-tarballs/<扁平名>-<版本>.tgz`，
并生成 `manifest.json`；上传后 Release 的下载 URL 即为
`https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/<tag>/<文件名>`。

### 5.4 改动源码与打包发布的交付契约（硬约束）

> 🚨 **第 0 阶段（打包发布前）：必须同步更新 `另一台电脑安装指南.md`**
> 本次会话**只要改动了 `plugins/<任一插件>/` 下的源码**，在跑 `pack-plugins.mjs` **之前**，
> **必须**把 `C:\dsh-ecosystem\另一台电脑安装指南.md` 一并更新，使其与本次产物一致：
> 1. 新增/改名的插件 → 补进「插件清单」，写对包名、扁平名、版本号、功能说明；
> 2. 版本号变更 → 更新文中所有 `<扁平名>-<版本>.tgz` 的 URL、`dsh plugin add` 命令与 Release tag；
> 3. 新增的安装前置条件（依赖、宿主版本、配置项）→ 同步写进对应章节；
> 4. 已废弃/替换的功能 → 删掉旧描述，不留过期文案。
>
> - **顺序硬性**：先改指南 → 再 `pack-plugins.mjs` → 再上传 Release。
>   不允许「先打包发布、指南回头补」，因为指南一旦落后，另一台电脑就会装错版本。
> - 指南里的版本号必须与 `dist-tarballs/manifest.json` 的实际产物逐条对齐。

> 🚨 **第一阶段（改完源码）：必须询问是否打包发布**
> 本次会话**只要改动了 `plugins/<任一插件>/` 下的源码**，在回复里**必须**明确询问用户：
> **「源码已改好，是否现在打包发布？（或先在页面上验证，确认没问题后再发布）」**
> - 不得擅自打包、不得擅自发布、也不得默认「改完就算完」。
> - 用户的默认节奏是：**先 link 到源码 → 页面验证 → 确认无误 → 再打包发布**。

> 🚨 **第二阶段（完成发布）：必须返回 GitHub 安装命令与覆盖路径**
> 当用户确认打包发布、且执行完 `pack-plugins.mjs` 及 GitHub Release 上传后，最终回复里**必须**交付具体的安装命令与路径，供用户在 DSH UI 中快速安装覆盖：
> 1. **DSH UI 在线安装地址**（进入「设置 ⚙️ -> 插件 -> 添加插件」直接粘贴 URL）：
>    `https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/<tag>/<扁平名>-<版本>.tgz`
> 2. **本地离线包绝对路径**（免网络下载，适合网络受限时秒级安装覆盖）：
>    `C:\dsh-ecosystem\dist-tarballs\<扁平名>-<版本>.tgz`
> 3. **CLI 命令行安装命令**：
>    `dsh plugin add https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/<tag>/<扁平名>-<版本>.tgz`
> 4. **重启指引**：提示用户安装覆盖后，通过托盘右键「重启服务与客户端」或重启应用生效。

### 5.5 生效与调试验证
- **浏览器刷新**：构建完成后浏览器执行 `Ctrl+F5` 硬刷新即可加载最新 Combo bundle。
- **软链断链排查**：若页面未更新，检查 `C:\Users\Administrator\.dsh\profiles\<profile>\node_modules\@deepseek-ai\dsh-client-<name>\lib\client.js` 内容与修改时间戳；`status` 命令会直接打印源码产物的 size/mtime 对比。
- **服务重启**：若新增了 patch 条目或修改了 Node-half，重启 DSH 服务（`pnpm dsh web`）。

---

## 6. 覆盖官方包：vendored 补丁包（`packages/`）

### 6.1 为什么需要这一层

DSH 桌面端运行的是 `E:\dshDesktop\resources\app.asar` 里**打包好的官方产物**。
你在官方 checkout（`E:\vibeCoding\deepseek-harness`）里改的源码**不会自动进入 asar** ——
只有 `app.asar` 被重新打包才会。于是出现「源码改了、产物也重建了、页面上就是没变化」。

> 🚨 **典型误判**：在 asar 里 grep 到某个 locale 文案键（如 `stats.dialog.speed`）就以为功能已生效。
> 文案键可能来自别处复用的字典。**判据要用补丁自己的独有符号**（如 `deriveTurnMetrics`），
> 零命中才是真的没进 asar。

### 6.2 覆盖机制（唯一可行路径）

宿主加载客户端插件走 `client-modules` 的 `locatePkgJson()` → `loader.resolveSync()`，
**从 profile 目录向上解析**。所以只要 profile 的 `node_modules` 里有同名包，就命中它，
asar 内的副本被绕过。

```jsonc
// C:\Users\Administrator\.dsh\profiles\desktop\package.json
"@deepseek-ai/dsh-client-ui-chat": "link:C:/dsh-ecosystem/packages/ui-chat-patched"
```

```powershell
cd C:\Users\Administrator\.dsh\profiles\desktop
node ...\pnpm\bin\pnpm.mjs install --no-frozen-lockfile
```

**必须重启宿主**——路径在启动时解析并缓存进 `pkgMeta`，刷新页面拿的还是旧路径。

### 6.3 为什么固化进 `packages/` 而不是直接 link 官方 checkout

用户**升级桌面端**（`E:\dshDesktop`）时，asar 里的包版本会变；
若 profile 直接 link 官方 checkout，会造成「fork 产物版本 ≠ asar 其余生态版本」的错位，
可能整块界面崩溃。固化副本让官方 checkout 保持纯净（可随时 `git pull` 无冲突），
且补丁知识留在 `VENDORED-FROM.md` 里。

**目录约定**：`C:\dsh-ecosystem\packages\<包名>-patched\`

每个固化包**必须**带 `VENDORED-FROM.md`，写明：来源、版本、补丁提交、补丁内容、
升级时的核对步骤、回滚方法。

### 6.4 固化包只放运行时文件

按 `package.json` 的 `files` 字段 + `exports` 实际引用的路径拷贝：

| 必拷 | 不拷 |
|---|---|
| `package.json` | `src/` |
| `lib/index.js`、`lib/client.js` | `tsconfig*.json` |
| `lib/types/**`（.d.ts） | `tsdown.config.ts` |
| `locale/*.json` | `README*`、`*.tsbuildinfo` |

固化副本**不承担构建职责**（没有 src）。要改行为必须回到官方 checkout 打补丁、
重建 `lib/client.js`，再覆盖回来。

### 6.5 升级桌面端后的必检项

> 🚨 **每次升级 `E:\dshDesktop` 后，先查固化包版本是否与 asar 内的新版本一致。**
> 版本错位 = 整块界面崩溃风险。

> 🚨 **升级会整体替换 `app.asar`，`patches/` 里的补丁全部丢失，必须重打。**
> 顺序：`desktop-menu`（前置，摊开 `lib/main.js`）→ `kanye-pet-electron` → 其它。
> 每个补丁打完都要 `node verify.mjs`，认补丁独有符号，零命中就是没进去。
> 升级后 `resources/app.asar.orig-<版本>` 是官方原包备份，回滚时用它。

1. 查 asar 内该包的新版本：
   ```powershell
   $py = "C:\Users\Administrator\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
   & $py -c "import json,io; d=json.load(io.open(r'<asar解出路径>\node_modules\<包名>\package.json',encoding='utf-8')); print(d['version'])"
   ```
2. 版本一致 → 通常可继续用。
3. 版本不一致 → 按优先级：
   - **先查官方是否已自带该补丁**（grep 补丁独有符号）。若已有 → **删掉固化包与 profile 依赖**，回官方版。
   - 否则从新版本源码重打补丁、重建、覆盖固化包。
4. 出问题立即回滚：删 profile 里该条依赖 → `pnpm install` → 重启。

### 6.6 现有固化包

| 包 | 版本 | 补丁 | 说明 |
|---|---|---|---|
| `@deepseek-ai/dsh-client-ui-chat` | 0.2.1-rc.2 | `603ce1067b` | 「本轮用量」悬浮窗补回 TPS 行。详见 [packages/ui-chat-patched/VENDORED-FROM.md](packages/ui-chat-patched/VENDORED-FROM.md) |

