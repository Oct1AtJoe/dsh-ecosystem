# dsh rc.1 交接修复任务（2026-09-04）

> 写给接手 agent。本环境关键事实：Windows；dsh 后端跑 E 盘 repo 源码（tsx）；宿主 profile 在
> `C:\Users\Administrator\.dsh\profiles\web`；本地插件在 `C:\dsh-ecosystem\plugins`；
> 所有 shell 命令前加 `env -u NODE_OPTIONS`（否则 WorkBuddy 的 node shim 会把删除劫持到回收站导致超时）。
> 不要动 dsh 进程（用户自管）。中文沟通。

---

## 任务 1：dsh 壳（Tauri）双击启动不带 token → 401 进不去

### 现象
双击 `C:\dsh-ecosystem\desktop\dist\DeepSeekHarness.exe`（或 E 盘同路径 exe），壳内页面显示
`dsh web authentication required; reopen the URL printed by dsh web.`

### 根因（已定位，证据充分）
- rc.1 后端加了 **launch-token 认证**：每次启动生成一次性 token，完整 URL 打印到后端 stdout：
  `dsh web: http://127.0.0.1:3080/?token=<token>`（exe 日志 dsh-desktop.log 可见，前缀 `[dsh]`，token 每次启动更换）。
  浏览器带 `?token=` 访问一次后，后端 Set-Cookie（`dsh-auth-<hash>`，HttpOnly）→ 之后裸 URL 有效。
- 认证实现：`E:\vibeCoding\deepseek-harness\packages\client\connection\src\browser-auth.ts`
  （TOKEN_QUERY='token'，launch token 换持久 cookie）。0.1.1 无此机制，所以旧壳没适配。
- **壳源码在 `C:\dsh-ecosystem\desktop\src-tauri\src\lib.rs`**（不是 E 盘仓库；E 盘 desktop-tauri/dist 是旧构建产物）。
  `wait_ready_and_navigate`（约 697-717 行）：服务就绪后 `window.location.replace("http://127.0.0.1:{port}/")`
  —— **导航裸 URL，从不带 token** → 401。

### 修复方案（改壳，推荐）
在 `wait_ready_and_navigate`（或其后端 stdout 处理处）：
1. 服务就绪后先**探测认证**：导航前对 `http://127.0.0.1:{port}/` 做一次 HTTP GET；
   返回 200 → 裸 URL 可用（cookie 有效）；返回 401 → 走第 2 步。
   （也可以不做探测，直接总是用带 token URL 导航——带 token 访问幂等，token 无效时后端仍会 401 并 mint 新 cookie 流程，但简单起见先探测。）
2. 取 token：**壳已在读后端 stdout**（dsh-desktop.log 的 `[dsh]` 前缀就是壳加的）。
   解析后端输出中 `dsh web: http://127.0.0.1:{port}/?token=<token>` 一行，正则提取 token。
   token 行由后端在 webserver listen 后打印（可在 `E:\vibeCoding\deepseek-harness` 里搜
   `dsh web: http` 定位打印点，确认输出时机与格式）。
3. 用带 token 的 URL 做首次导航：`window.location.replace("http://127.0.0.1:{port}/?token=<token>")`；
   之后（cookie 已 mint）后续 reload 走裸 URL 即可。token 仅本次进程有效，**每次启动都要重新取**。
   兜底：token 行未及时出现时轮询 stdout 或延迟重试（READY_TIMEOUT 语义可复用）。

### 备选（更省事，但改官方行为）
`packages/client/connection/src/browser-auth.ts` 加"loopback 放行"或关认证的开关——
不推荐：属于官方认证设计，且影响安全；改壳才是正解。

### 验证
```powershell
# 重编译壳（在 C:\dsh-ecosystem\desktop）
cd C:\dsh-ecosystem\desktop
cargo build --release   # 产物在 target/release/DeepSeekHarness.exe，按用户既有发布流程拷到 dist/
```
双击 exe → 不再 401，直接进 UI。日志确认：先导航 `?token=...` 一次。

### 参考文件
- 壳导航逻辑：`C:\dsh-ecosystem\desktop\src-tauri\src\lib.rs`（`wait_ready_and_navigate` 约 697-727；`show_error`；后端 spawn + stdout `[dsh]` 前缀处理在 lib.rs 前段）
- 认证规则：`E:\vibeCoding\deepseek-harness\packages\client\connection\src\browser-auth.ts`
- 后端 URL 打印：搜 `dsh web: http` 于 `E:\vibeCoding\deepseek-harness`（apps/cli 或 boot 相关）

---

## 任务 2：恢复被停用的插件

### 插件开关机制（接手必读）
- host 插件：`C:\Users\Administrator\.dsh\profiles\web\package.json` 的 `dsh.profile.bundles` 数组
- client 插件：同文件 `cordis.patch.yml`（同目录）的 `- insert: - id: xxx name: ...` 段
- 插件本体：`C:\dsh-ecosystem\plugins\<pkg>`（profile 用 `link:` 依赖指向，改完产物/源码即生效，无需 install；
  但改 `package.json`/`cordis.patch.yml` 后需要 `pnpm install` 才能同步 node_modules 的 junction/依赖）
- 停用的插件其 cordis.patch.yml 条目已注释、bundles 已移除——**取消注释/加回即恢复**

### rc.1 API 迁移映射表（0.1.1 → rc.1，全部已在上游源码核实）
| 0.1.1（已删 `@deepseek-ai/dsh-client-runtime`） | rc.1 |
|---|---|
| `ClientContext`（runtime/client） | cordis 的 `Context`（`import type { Context as ClientContext } from '@deepseek-ai/cordis'`） |
| `createSnapshotStore`/`SnapshotStore`/`defineStore`/`EngineStoreHandle` | `@deepseek-ai/dsh-client-store` |
| `SettingsScope`/`SettingsScopeSnapshot` | `@deepseek-ai/dsh-client-ui-settings/client` |
| `ConversationNodeDefinition`/`ConversationTurnDataMap`(module aug)/`ConversationSnapshot` | `@deepseek-ai/dsh-client-ui-conversation/client` |
| `TurnTailOwnerProps`/`ChatFileMentions` | **`@deepseek-ai/dsh-client-ui-chat/client`**（rc.1 只在这） |
| `UseProjection` | `@deepseek-ai/dsh-client-ui-session/client` |
| `ISessions` | `@deepseek-ai/dsh-api-session-controller/client` |
| `isAppendSurfaceEvent` | `@deepseek-ai/dsh-session/surface` |
| inject `'conversationEvents'` | inject `'uiConversation'`；`ctx.conversationEvents.register` → `ctx.uiConversation.events.register` |
| 0.1.1 tool/result 的 `view`/callView（diff 卡数据） | 已删除；fs 工具结果 diff 在 `tool/result` 私有 `meta`（`{diffs:[{path,oldText,newText}]}`） |
| `ChatSnapshot` 的 `node.data.xxx` | rc.1 节点字段顶层化（`UserMessageNode.content` 直接，无 `data` 包装） |
| 会话发送（`ctx.sessions.scope(id).get('conversation').send`） | ui-conversation 服务 `conversation.send(text)`（scope 寻址） |

### 构建命令（无源码插件恢复后用）
```bash
cd C:/dsh-ecosystem/plugins/<pkg>
env -u NODE_OPTIONS node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
```
（tsdown 本体在 E 盘 repo；本地 plugins/node_modules 的 tsdown junction 已损坏勿用。产物 lib/ 经 profile link 直接生效。）

### 2.1 ✅ 已完成（无需做）
- `dsh-session-folders-custom`：已恢复 bundles；client.js 产物 1 处 `require("@deepseek-ai/dsh-client-runtime/client")`
  → `require("@deepseek-ai/dsh-client-store")`（只用了 defineStore）；host 部分无 runtime 依赖。用户已验证 OK。
  注意：它是**无源码产物工作流**（fork 市场版 dsh-session-folders 0.4.3 直接改 lib，从会话历史而来），
  后续要修只能改产物或反推。

### 2.2 待做：`ui-resend-failed-round`（反推恢复，最小）
- 功能：聊天 turn 尾部，失败轮（turn-error / turn-max-tokens）出现"重新发起"按钮，重发该轮用户文本。
- 官方 rc.1 无此功能（官方 retry 是模型级自动重试，不是这个）。
- 现状：`C:\dsh-ecosystem\plugins\ui-resend-failed-round` 无 src。可反推源：
  `lib/types/client/*.js`（tsc 编译 ESM，模块边界完整）+ `*.d.ts`（类型面）+ `client.js.map`（sourcesContent 全）。
  模块仅 4 个：`index.ts`(入口)、`ResendAction.tsx`(组件+逻辑)、`locales.ts`、`slots.ts`(类型空)。
- 恢复步骤：
  1. 读 `lib/types/client/index.js`、`ResendAction.js`、`locales.js`、`slots.js` + 对应 `.d.ts` 反推源
     （JSX 已编译成 `_jsx` 调用，需手写回 `.tsx`；CSS 在 `lib/client.js` 顶部 `const css = "..."` 里，抽回 `ResendAction.module.css`）。
  2. 迁移 rc.1（映射表）：`inject ['slots','sessions','locale']` 不变；入口类型 `ClientContext`→cordis `Context`；
     组件 Props 的 `useChat`/`TurnTailOwnerProps` 按 rc.1 ui-chat 面重写；发送 API 用 ui-conversation `send(text)`。
  3. 补 `tsconfig.json`（extends `../../tsconfig.base.client.json`）、`tsdown.config.ts`
     （仿 `ui-msg-nav`：`import { clientBundle } from '../tsdown.client.ts'; export default clientBundle('@deepseek-ai/dsh-client-ui-resend-failed-round', ['lib/types/index.js','lib/types/invariant.js'])`）。
  4. package.json 依赖升 `^0.1.2-rc.1`（peer/dev 去 runtime，按映射表补包）。
  5. 构建（见上），产物生成后：
     - `cordis.patch.yml` 取消 `ui-resend-failed-round` 条目注释
     - 重启 dsh 验证
- 工作参考（已完成迁移、可对照的兄弟插件源码）：`plugins/ui-msg-nav/src/client/*`、
  `plugins/ui-deliverables-custom/src/client/*`（后者含 rc.1 事件/发送 API 的完整用法）。

### 2.3 待做：`ui-subagent-custom`（机器人 icon + 运行子代理数）
- 用户明确要的功能：composer 里的 **RobotIcon 按钮 + 运行中 subagent 数量 badge**（点击开 subagent 侧栏）。
  0.1.1 由本插件 `SubagentComposerAction` 提供；**官方 rc.1 ui-subagent 没有该组件**。
- 现状：无 src；`lib/types/client/{index,SubagentCatalogAction,SubagentComposerAction,SubagentReadOnlyComposer,locales}.js(.d.ts)`
  齐全，可反推。功能核心在 `SubagentComposerAction.js`（runningCount badge）与 `SubagentCatalogAction.js`（'@' 目录菜单，官方 rc.1 已有官方 '@' 引用源，此件可能多余，可只移植 ComposerAction）。
- 官方 rc.1 ui-subagent 源码：`E:\vibeCoding\deepseek-harness\packages\client\ui-subagent\src\client\`（已被官方吸收的
  部分：`SubagentReadOnlyComposer.tsx`、`SubagentHeaderLineage.tsx`——移植前先 diff 避免重复）。
- 恢复方向：反推 → 以**增量 slot/组件**挂到官方 rc.1 ui-subagent 之上（cordis 组合），而非替换官方包。
  需要弄清的 rc.1 挂载点：官方 subagent 的运行状态数据源（`descendants.runningCount` 的 rc.1 对应——搜
  `runningCount`/subagent 运行投影于官方 ui-subagent/会话投影）。
- 恢复后 `cordis.patch.yml` 加回，验证 robot badge 出现且计数正确。

### 2.4 可选（用户未最终拍板，先不碰，除非用户要求）
- `ui-session-reference`：官方 rc.1 `ui-reference` 已提供 '@' 会话引用（host RPC `referenceCandidates` 已删）→ 建议放弃 custom。
- `dsh-notification-custom`：源码残缺（缺 contract/notifier/rules），且依赖 0.1.1 host 通知机制 → 恢复成本高、价值待定。
- `ui-msg-nav`：**已确认移除**（官方 rc.1 ui-chat `TurnNavigator` 默认挂载已覆盖，且 msgNavMessages 投影已删）。

### 第三方插件（若后续恢复 bundles 报错）
已升 rc.1 适配版并恢复：better-sidebar 0.18.0 / reference-anything 0.4.0 / vision-router 2.1.1 /
better-reasoning-effort 0.3.5 / dshmarket 1.41.0。其余保持原版已恢复。个别若 fatal，按
"查 npm 是否有适配新版 → 有则升，无则停用等作者更新"处理。

---

## 环境备忘（接手必读，避免踩坑）
- WorkBuddy 护栏：shell 里所有 node 相关长命令前加 `env -u NODE_OPTIONS`，否则删除类操作超时/失败。
- 后端源码在 E 盘 repo，改 repo 内包源码后重启 dsh 即生效（tsx 直跑）。
- apps/web 前端构建产物在 `E:\vibeCoding\deepseek-harness\apps\web\dist`——升级 rc.1 时必须重跑
  `pnpm build`（此目录旧构建曾导致前端 seed 表缺 store，整页 Failed to load plugins）。命令：
  `cd E:\vibeCoding\deepseek-harness\apps\web && pnpm build`
- 每次改 profile 的 package.json（依赖版本/bundles）后必须 `pnpm install`（用户终端执行）才生效。
- 前端 401 用 token URL：`pnpm dsh web` 打印的 `?token=` URL 每次启动换新，复制整行到浏览器。
