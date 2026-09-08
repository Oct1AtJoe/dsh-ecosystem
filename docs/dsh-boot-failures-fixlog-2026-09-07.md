# dsh 服务启动故障修复全记录（2026-09-07）

> 覆盖范围：终端 `pnpm dsh web` 起不来（7 个连环故障）+ exe 壳拉不起服务（1 个独立故障）。
> 环境前置：dsh 0.1.1 → 0.1.2-rc.1 升级迁移期；宿主以 repo 源码运行（`DSH_DESKTOP_BACKEND` = nodejs24 + tsx + `apps/cli/src/bin.ts`）；profile 在 `C:\Users\Administrator\.dsh\profiles\web\`（pnpm, nodeLinker: hoisted）。

## 0. 故障总览

| # | 故障 | 一句话根因 | 状态 |
|---|------|-----------|------|
| 1 | `pnpm install` 卡在 fs-ext 编译 463ms 失败 | 系统无 Python，node-gyp configure 即跪 | ✅ 已修 |
| 2 | `cannot resolve profile bundle "dsh-session-title-custom"` | 上次 install 中断，symlink 残缺 | ✅ 已修 |
| 3 | `cannot get required service "sessions" in inactive context` | recall 插件 2.3.6 探活不完整 | ✅ 已 patch |
| 4 | `ERR_MODULE_NOT_FOUND .../dsh-http-proxy/lib/index.js` | 构建产物缺失（升级后未 build:lib） | ✅ 已修 |
| 5 | `does not provide an export named 'admitPromptContent'` | npm 插件与宿主 attachment API 代差 | ✅ 已 patch |
| 6 | `unsupported Harness subagent contract`（agent-teams） | 插件验老契约，宿主已移除 symbol | ✅ 已卸载 |
| 7 | `StorageError: json backend is closed` | **file-upload 缺 lib/client.js → boot 回滚 → storage 被级联关闭** | ✅ 已修 |
| 8 | exe 双击拉不起服务 | **exe cwd 在 repo 外 → tsx 拿不到 paths → 走旧产物，const enum 被内联** | ✅ 已修 |
| 9 | 更新 3 个插件后 exe 又起不来 | **市场更新把 agent-teams 写回 bundles → fatal**；壳误报"服务就绪"（502） | ✅ 已修（双保险） |

---

## 1. 故障 1：fs-ext 原生模块编译失败

**现象**
```
Failed in 463ms at E:\...\node_modules\.pnpm\fs-ext@2.1.1\...\fs-ext
Error: Could not find any Python installation to use
```

**根因**：fs-ext@2.1.1 是 0.1.2-rc.1 新增依赖（session-persistence-jsonl 引入），纯原生无 prebuilt。系统 PATH 只有微软商店 python 存根，node-gyp 判定不可用。`Failed in NNNms` 毫秒数极小 = configure 阶段就跪，不是编译问题。

**修复**
```powershell
winget install -e --id Python.Python.3.12          # 装 Python 3.12.10
[Environment]::SetEnvironmentVariable('PYTHON','C:\Users\Administrator\AppData\Local\Programs\Python\Python312\python.exe','User')
```
然后手动编译（pnpm 11 不读 .npmrc 的 python，只有 `PYTHON` 环境变量可靠）：
```bash
cd E:/vibeCoding/deepseek-harness/node_modules/.pnpm/fs-ext@2.1.1/node_modules/fs-ext
npx node-gyp@11 rebuild --python="$PYTHON"
```

**⚠️ 后续教训（见故障 7-附）**：编译产物绑定 node ABI（node22=127 / node24=137），必须用**与运行时相同的 node 版本**编译和验证。

---

## 2. 故障 2：profile bundle 解析失败

**现象**：`dsh: cannot resolve profile bundle "dsh-session-title-custom"`

**根因**：上次 install 中断，profile 的 symlink 残缺。

**修复**：profile 目录重跑 `pnpm install` 补回链接。

---

## 3. 故障 3：recall 插件 service 竞态

**现象**：`cannot get required service "sessions" in inactive context`（recall/lib/index.js:326）

**根因**：dsh-recall-plugin 2.3.6 只给 shell 加了 10s 探活，同段代码的 `ctx.sessions.list()` 没防护；npm 上 2.3.6 已是最新。

**修复**（patch `profiles/web/node_modules/dsh-recall-plugin/lib/index.js`）：
```js
function safeSessions() {
  try { const l = ctx.sessions.list(); return Array.isArray(l) ? l : [] } catch { return [] }
}
// 三处 for (const session of ctx.sessions.list()) 全部换成 safeSessions()（行 139/169/334）
```

---

## 4. 故障 4：构建产物缺失

**现象**：`ERR_MODULE_NOT_FOUND .../apps/cli/node_modules/@deepseek-ai/dsh-http-proxy/lib/index.js`

**根因**：0.1.2-rc.1 起 workspace 包 `main` 指向 `lib/index.js`（tsdown 产物），升级/clean 后没重建。**这是产物问题不是依赖问题**，别去查"装没装"。

**修复**：
```bash
cd E:/vibeCoding/deepseek-harness && pnpm build:lib:host
```
**⚠️ 此处埋下故障 7 的雷**：只跑了 `:host`，没跑 client face（详见故障 7）。

---

## 5. 故障 5：attachment API 代差

**现象**：`SyntaxError: The requested module '@deepseek-ai/dsh-attachment' does not provide an export named 'admitPromptContent'`

**根因**：npm `dsh-subagent@0.1.2-rc.1` 用包级导出 `admitPromptContent(attachments, x)`，宿主 0.1.3-alpha.1 已改成 `AttachmentStore` 类方法。

**踩坑**：先试了把 profile 里的 subagent 换成宿主同源版（junction）→ 引爆故障 6（agent-teams 老契约）。**两个版本各缺一半，替换法必然顾此失彼。**

**正解**：patch npm 版 `lib/index.js`，只改调用形态：
```js
// 行 1：import { AttachmentError } from "@deepseek-ai/dsh-attachment";   （去掉 admitPromptContent）
// 行 2911：content = await attachments.admitPromptContent(request.content);  （该处 attachments 本就是 service 实例）
```
判定 patch 安全性：被调用方是否"把第一个参数当 receiver 的自由函数"。是 → 改方法调用即可。

---

## 6. 故障 6：agent-teams 契约不兼容 → 卸载

**现象**：`unsupported Harness subagent contract`

**根因**（实测，与 npm 包无关）：`ctx.subagents` service 由**宿主**提供，宿主把 `queuePrompt` 做成普通类方法（`packages/subagent/subagent/lib/index.js:1131`），而 agent-teams 0.1.16-rc.1 取 `host[Symbol.for('dsh.subagent.queuePrompt')]`（symbol 属性）永远取不到。npm 上无适配版。

**处理**：从 profile `package.json` 的 `dsh.profile.bundles` 数组移除 `"@nanmicoder/dsh-agent-teams"`（dependencies 声明保留，仅不加载）。

**教训**：判断"补丁该打在哪"要看**运行时 service 是谁提供的**，不是谁在 import。

---

## 7. 故障 7：`StorageError: json backend is closed`（本次核心）

### 7.1 症状
```
dsh: fatal load failure: StorageError: json backend is closed (unit=dsh_session_folders_custom layout=undefined root=C:\Users\Administrator\.dsh\storages)
```

### 7.2 排查弯路（记录在案）

| 尝试 | 结果 |
|------|------|
| 怀疑 session-folders 的 `apply` 返回 Promise | **证伪**：宿主官方插件（client/connection、mcp-client、tool-fs-search、lsp-stdio）全用 `async function apply`，写法合法 |
| 从 bundles 摘掉 `dsh-session-folders-custom` 二分 | **无效**：点名的 unit 是受害者，摘掉只会换下一个 open domain 的插件报错（已撤销） |
| 怀疑 `layout=undefined` 异常 | **证伪**：`descriptor.layout === 'per-record'` 为假就走 single-unit 分支，undefined 是默认路径 |

### 7.3 拿证据：探针两连

**探针 1**：`storage-json/src/index.ts` 的 `close()` 落盘完整栈（`Error.stackTraceLimit = 100`，默认 10 帧看不到触发者）→ 显示 close 由 **cordis `Fiber.restart` → `Fiber.await` → `_unload`** 触发，即整棵树被卸载。

**探针 2**：`app-boot/src/index.ts` 的 `boot()` catch 开头打印原始 cause → **首发异常浮出**：
```
failed to apply loader entry modules (@deepseek-ai/dsh-client-modules):
client bundles not found; run `pnpm run build` before launch:
  - package: @deepseek-ai/dsh-client-file-upload
    path: E:\vibeCoding\deepseek-harness\packages\client\file-upload\lib\client.js
```

### 7.4 完整因果链
```
file-upload/lib/client.js 缺失
  → @deepseek-ai/dsh-client-modules 组装 client bundle 失败
  → boot() 进 catch → ctx.fiber.dispose()（app-boot/src/index.ts:823）
  → 逐层 dispose 整棵树 → storage-json 的 ctx.effect disposer → JsonStorageBackend.close()
  → 并行挂起中的 session-folders storageDomain.open() 撞上已关闭的后端
  → StorageError('json backend is closed') 被记为 deepest cause → fatal
```

### 7.5 为什么 file-upload 会缺
`build:lib = build:lib:host + build:lib:client`（两个 face）。上次只跑了 `:host`：
- file-upload/lib 里有 typert/types（host 侧 tsc 产物）→ **目录存在 ≠ 构建完整**
- `lib/index.js`、`lib/client.js` 属 client face（tsdown bundle），从没跑过 → file-upload 是升级新增包，无历史产物兜底

### 7.6 修复与验证
```bash
pnpm --filter @deepseek-ai/dsh-client-file-upload bundle
# → lib/index.js 12.40 kB │ lib/client.js 12.29 kB 产出
pnpm dsh web   # → http://127.0.0.1:3080 正常启动，client ready / ws client ready
```

### 7.7 附：排查中的 node22/24 ABI 假象
AI 助手在自己 shell 里复现时先撞上 fs-ext ABI 错配（`NODE_MODULE_VERSION 137 vs 127`）——
- **WorkBuddy 给自己的进程注入托管 node22**，而用户终端实际是 `C:\Users\Administrator\.local\bin\nodejs24`（用户 PATH 唯一 node 本体目录，Machine PATH 无 node）
- 统一用 node24 重编：`PATH=<nodejs24>:$PATH npx node-gyp@11 rebuild`
- **教训**：验证原生模块必须在目标 node 版本下做；AI 的 shell 环境 ≠ 用户终端环境

### 7.8 收尾
两处探针 `git checkout` 还原（`packages/storage/storage-json/src/index.ts`、`packages/boot/app-boot/src/index.ts`），storage-json/lib 里误埋的 DBG 行手删（构建产物，下次 build 覆盖也行）。

---

## 8. 故障 8：exe 壳双击拉不起服务

### 8.1 症状
终端 `pnpm dsh web` 正常；双击 exe → `%LOCALAPPDATA%\ai.deepseek.harness.desktop\logs\dsh-desktop.log`：
```
E:\vibeCoding\deepseek-harness\apps\cli\src\profile-boot.ts:17
import { FiberState, type Context } from '@deepseek-ai/cordis'
SyntaxError: The requested module '@deepseek-ai/cordis' does not provide an export named 'FiberState'
[ERROR] 等待本地服务就绪超时（60s）
```
**该日志时间戳是 UTC**，对"刚才那次启动"要 +8h。

### 8.2 根因（三层叠加）
1. `tsconfig.base.json` 的 paths 把 `@deepseek-ai/cordis` 等 vendor 包映射到**源码**（`./vendor/cordis/src`）；tsx 靠 **cwd 向上找 tsconfig.json** 拿 paths（repo tsconfig.json 的注释写明了此契约）
2. vendor 包 lib 产物（tsc -b / tsdown host face）把 `export const enum FiberState` **内联**，运行时无该绑定；tsx/esbuild 跑源码则保留运行时 enum 对象 → **"源码有导出、产物没导出"并存**
3. exe 双击的 cwd 不在 repo 内（快捷方式起始位置）→ tsx 拿不到 paths → 走 lib 产物 → 炸

### 8.3 决定性对照实验
```bash
CMD='"C:/Users/Administrator/.local/bin/nodejs24/node.exe" --import file:///E:/vibeCoding/deepseek-harness/node_modules/tsx/dist/esm/index.mjs E:/vibeCoding/deepseek-harness/apps/cli/src/bin.ts web --host 127.0.0.1 --port 3080'
cd /c/Users/Administrator && timeout 45 $CMD
# → 复现 FiberState 报错（exe 行为一致）

cd /e/vibeCoding/deepseek-harness/desktop-tauri/dist && timeout 45 $CMD
# → 成功！dist 在 repo 内，tsx 向上能找到 tsconfig —— 别被这个骗了

cd /c/Users/Administrator && TSX_TSCONFIG_PATH="E:/vibeCoding/deepseek-harness/tsconfig.json" timeout 45 $CMD
# → 成功！修复方案验证通过
```

### 8.4 修复（已落地）
用户级环境变量（exe 继承用户 env，**重启 exe 生效**）：
```
TSX_TSCONFIG_PATH = E:\vibeCoding\deepseek-harness\tsconfig.json
```
副作用评估：dsh 的 paths 只映射 `@deepseek-ai/*` vendor 包名，其它项目（vite 等）不撞车；tsx 拿不到 paths 对应文件时回落正常 node_modules 解析，无影响。

备选（不推荐，违反 repo 零冲突原则）：`vendor/cordis/src/fiber.ts` 的 `export const enum FiberState` 改成 `export enum` 再重建 vendor lib。**注意直接重建 vendor lib 没用**——tsc 产物对 const enum 依然内联。

---

## 9. 故障 9：更新 3 个插件后 exe 又起不来

### 9.1 现象
市场更新 3 个插件后，exe 双击后页面打不开。`dsh-desktop.log`（UTC 时间戳）两条关键行：
```
[11:33:25] Error: dsh: plugin tree failed to load: failed to apply loader entry include
           → failed to apply loader entry agent-teams (@nanmicoder/dsh-agent-teams):
             agent-teams: unsupported Harness subagent contract          ← 真 fatal
[11:34:40] WARN 本地服务就绪，已导航到 http://127.0.0.1:3080/
           （未取得本次启动的 launch token…）                            ← 壳误报
```

### 9.2 根因
**市场更新把之前手动移除的 `@nanmicoder/dsh-agent-teams` 写回了 `dsh.profile.bundles`**
（故障 6 中移除的），它验老契约 fatal → boot 回滚 → 进程死。

**壳的"本地服务就绪"是误报**：3080 的响应（502）就能让它导航，与后端死活无关——
"拉不起来"的真实判定要看 fatal 栈，不是这条 INFO/WARN。

### 9.3 修复（双保险）
1. 从 `bundles` 再次移除 `"@nanmicoder/dsh-agent-teams"`；
2. **在 `cordis.patch.yml`（用户 patch 层）加禁用行**——市场更新只写 package.json
   碰不到这个文件，下次更新不再复发：
   ```yaml
   # id 见该包 cordis.patch.yml 的 insert 段
   - id: agent-teams
     disabled: true
   ```
3. 验证：新配置下启动，日志零 WARN（agent-teams 未再加载），服务正常。
   另外两个更新的插件无异常。

### 9.4 判定速查（这次学到的）
| 日志特征 | 含义 |
|---|---|
| `plugin tree failed to load` + boot:835 栈 | 后端真死 |
| `本地服务就绪，已导航`（未取得 launch token） | 壳误报，可能是 502 错误页 |
| `curl 127.0.0.1:3080` → 200 | 后端真活；502 = 上游死了 |

---

## 10. 经验教训汇总

1. **报错点名的 unit/插件几乎一定是受害者，不是凶手**。真凶在回滚链的上游（boot catch → dispose 整树 → storage 被关）。
2. **首发异常被 fatal message 折叠**：在 `boot()` catch 开头加探针打印原始 cause，一次跑完即得。
3. **lib 目录存在 ≠ 构建完整**；升级/clean 后跑完整 `pnpm build:lib`（host + client 两个 face），只跑 `:host` 会漏 client bundle 且炸后端启动。
4. **原生模块必须在目标 node 版本下编译和验证**；AI 的 shell 环境可能被注入不同 node，与用户终端不同。
5. **"终端好 exe 坏"先怀疑 cwd 差异 + tsconfig paths**；复现必须用 repo 外 cwd 才是真实验。
6. **const enum 的运行时绑定取决于转译器**（esbuild 系保留 / tsc·rolldown 内联），与构建时间无关。
7. 判断 patch 打在哪，看**运行时 service 是谁提供的**，不是谁在 import；npm 插件与宿主 API 代差优先 patch 插件调用形态，不要替换成同源包。
8. pnpm 11 不读 `.npmrc` 的 `python`，只有 `PYTHON` 环境变量可靠；node-gyp 在沙箱里会被 SIGTERM，需要脱离沙箱执行。
9. **市场更新会重写 profile package.json，把手动移除的插件写回 bundles**——对抗手段是 `cordis.patch.yml` 禁用行（patch 层市场更新碰不到）；每次市场更新后 exe 起不来，先查 bundles 再看日志。
10. **exe 壳的"本地服务就绪"日志不可信**（502 也算就绪），后端死活的判定以 fatal 栈 / `curl 3080` 的 200 为准。

## 附录：关键路径

| 用途 | 路径 |
|---|---|
| exe 二进制 | `E:\vibeCoding\deepseek-harness\desktop-tauri\dist\DeepSeekHarness.exe` |
| exe 后端日志（UTC 时间戳） | `%LOCALAPPDATA%\ai.deepseek.harness.desktop\logs\dsh-desktop.log` |
| profile（插件清单/依赖） | `C:\Users\Administrator\.dsh\profiles\web\package.json`（`dsh.profile.bundles`） |
| 本地插件 | `C:\dsh-ecosystem\plugins\` |
| vendor 框架源码 | `E:\vibeCoding\deepseek-harness\vendor\`（cordis/loader/include/group/...） |
| storage-json 源码（两处抛 closed） | `packages/storage/storage-json/src/index.ts` |
| boot 兜底清理（dispose 整树） | `packages/boot/app-boot/src/index.ts:823` |
| 用户级环境变量（本次新增） | `PYTHON`（Python 3.12）、`TSX_TSCONFIG_PATH`（repo tsconfig） |
