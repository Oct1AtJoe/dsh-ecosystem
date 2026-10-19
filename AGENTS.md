# DSH 本地定制生态开发规范（C:\dsh-ecosystem）

> 本文件为工作区级开发指南。DSH 按 用户全局（`~/.dsh/AGENTS.md`）→ 项目根（`C:\dsh-ecosystem\AGENTS.md`）→ cwd 链 顺序加载。
> 本工作区所有插件开发、缺陷修复与维护任务均须严格遵守本文档。

---

## 0. 桌面壳（desktop/）参考文档

**凡涉及 `C:\dsh-ecosystem\desktop` 桌面壳（Tauri 无边框双 WebView 窗口）的修改，必须先读 [desktop/DESKTOP-SHELL.md](desktop/DESKTOP-SHELL.md)**。

该文档涵盖：窗口/WebView 布局与生命周期顺序、Win32 无边框机制（WM_STYLECHANGING / WM_NCCALCSIZE / WM_GETMINMAXINFO / WM_NCHITTEST）、边缘拖拽缩放的跨进程 `border_resizing` 方案、标题栏交互（双击最大化、菜单对齐）、三条独立 initialization_script、重启语义、部署流程与全部踩坑记录。改动壳子前请对照其中的「踩坑记录」表，避免重复引入历史回归。

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

# 4. 把 dist-tarballs\*.tgz 上传到对应的 GitHub Release
```

`pack-plugins.mjs` 会把每个插件打成 `dist-tarballs/<扁平名>-<版本>.tgz`，
并生成 `manifest.json`；上传后 Release 的下载 URL 即为
`https://github.com/Oct1AtJoe/dsh-ecosystem/releases/download/<tag>/<文件名>`。

### 5.4 改动插件源码后，必须提示用户是否打包发布

> 🚨 **硬性要求**：本次会话**只要改动了 `plugins/<任一插件>/` 下的源码**，
> 在最终回复里**必须**明确询问用户：
> **「源码已改好，是否现在打包发布？（或先在页面上验证，确认没问题后再发布）」**

不得擅自打包、不得擅自发布、也不得默认「改完就算完」。
用户的默认节奏是：**先 link 到源码 → 页面验证 → 确认无误 → 再打包发布**。

### 5.5 生效与调试验证
- **浏览器刷新**：构建完成后浏览器执行 `Ctrl+F5` 硬刷新即可加载最新 Combo bundle。
- **软链断链排查**：若页面未更新，检查 `C:\Users\Administrator\.dsh\profiles\<profile>\node_modules\@deepseek-ai\dsh-client-<name>\lib\client.js` 内容与修改时间戳；`status` 命令会直接打印源码产物的 size/mtime 对比。
- **服务重启**：若新增了 patch 条目或修改了 Node-half，重启 DSH 服务（`pnpm dsh web`）。

