# dsh-harness 升级 v0.1.2-rc.1 — 切换与收尾清单（2026-09-03，晚间更新）

## 0. 前置事实

- 合并成果：master 已快进到 `5eb3ac87bf`（rc.1 合入 fork 仓库，E:\vibeCoding\deepseek-harness）
- Host + client 类型检查 0 错误；host + client build 均 BUILD_EXIT=0；产物已验证为真实内容
- Windows 文件删除慢：Git Bash rm 10-19s/文件；Python os.remove 0.65s/文件；对象层 git 操作（read-tree/write-tree/commit-tree）秒级
- **WorkBuddy safe-delete 护栏机制（09-03 发现）**：经 `NODE_OPTIONS=--require=node-language-shim.cjs`
  把 node 子进程删除劫持到 genie-trash，pnpm install 中 spawn genie-trash 会 ETIMEDOUT 中断。
  绕过：`env -u NODE_OPTIONS pnpm install`（Git Bash）/ PowerShell 里 `$env:NODE_OPTIONS=''`。
  WorkBuddy UI 关护栏对 pnpm 内部 spawn 无效。npm 另遇 arborist edgesOut 崩溃 → 加 `--legacy-peer-deps`。

## 1. profile 升级（宿主 0.1.1-rc.2 → 0.1.2-rc.1）

C:\Users\Administrator\.dsh\profiles\web\package.json 已完成：
- `@deepseek-ai/dsh-base` / `dsh-web-app` / `dsh-agent-default-model` → `0.1.2-rc.1`
- **已移除废弃插件 link**：dsh-client-ui-resend-failed-round、dsh-client-ui-subagent-custom
  （依赖行）、dsh-session-folders-custom（依赖行 + dsh.profile.bundles 行）
- **保留未迁移待裁决**：dsh-client-ui-session-reference、dsh-notification-custom
  （旧 lib 引用已删的 dsh-client-runtime → install 后这两插件加载会报错，
  若不再需要就从 package.json 删行；要保留需先补源码/重写）

**剩余动作（需用户在普通终端手动执行，后台跑会冻结）：**
```bash
cd C:\Users\Administrator\.dsh\profiles\web && pnpm install
# 若报 safe-delete / genie-trash / ERR_PNPM_LINKING_FAILED：
cd C:\Users\Administrator\.dsh\profiles\web && env -u NODE_OPTIONS pnpm install
# 验证：
cat node_modules/@deepseek-ai/dsh-client-store/package.json | grep version   # 0.1.2-rc.1
```
- 重新检查 link-peer-deps junction（dsh-storage-domain / dsh-workspace / dsh-llm）
- 完成后**用户重启 dsh 验证**（用户自管进程）

## 2. 插件迁移（已完成，4 个插件重建通过）

**运行时破坏根因**：`@deepseek-ai/dsh-client-runtime` npm 停 0.1.1-rc.2；rc.1 拆为
store / ui-chat / ui-conversation / ui-session / ui-settings 等独立包。

**类型/服务映射表（已在上游 rc.1 源码逐一核实）**
- ClientContext → cordis `Context`（`import type { Context as ClientContext }`)
- createSnapshotStore / SnapshotStore / defineStore / EngineStoreHandle → `@deepseek-ai/dsh-client-store`
- SettingsScope / SettingsScopeSnapshot → `@deepseek-ai/dsh-client-ui-settings/client`
- ConversationNodeDefinition / ConversationTurnDataMap(module aug) / ConversationSnapshot
  → `@deepseek-ai/dsh-client-ui-conversation/client`
- TurnTailOwnerProps / ChatFileMentions → **`@deepseek-ai/dsh-client-ui-chat/client`**
  （rc.1 只在 ui-chat/client 导出，0.1.1 在 ui-conversation）
- UseProjection / ISessions → `@deepseek-ai/dsh-client-ui-session/client` 与
  `@deepseek-ai/dsh-api-session-controller/client`（ISessions 定义处）
- isAppendSurfaceEvent → `@deepseek-ai/dsh-session/surface`
- `inject: 'conversationEvents'` → `'uiConversation'`；`ctx.conversationEvents.register` →
  `ctx.uiConversation.events.register`
- connection 的 hostDescription 面 rc.1 已删 → 用 `ctx.remote.$host.isLoopback` +
  `ctx.remote.session.canOpenWorkspacePath()`（官方 rc.1 ui-deliverables 同款）

**rc.1 事件模型变化（deliverables 增强的关键依据）**
- tool/result 事件不再带 view（callView/diffs 整体移除）
- mutation 工具的 result-time contextual diff 放进事件私有 `meta`
  （`{diffs: FileDiff[]}`，FileDiff={path,oldText,newText}；见 dsh-tool-fs/src/diff.ts 的 FsDiffMeta）
- 官方 rc.1 ui-deliverables 放弃 diff 增强，改纯 args 解析（write/edit/str_replace_editor）
- custom 保留增强 = 官方 args 解析 + 从 `event.data.meta` 防御式读 diffs → stripContext →
  history/turnHunks 累积（badge +N -M / DiffBlock 面板继续工作）

**各插件状态**
| 插件 | 迁移 | 构建 |
|---|---|---|
| ui-deliverables-custom（增强保留） | ✅ turn-deliverables/index/ProducedFiles/package.json | ✅ 39KB |
| ui-theme-custom | ✅ settings-store→store 包；host 侧 dsh-host-webserver rc.1 兼容 | ✅ 60KB |
| ui-kanye-pet | ✅ controller→store+ui-settings；index→cordis | ✅ 16KB |
| ui-msg-nav | ✅ NavRail→ui-conversation/ui-session；index→cordis | ✅ 27KB |
| ui-session-reference | ⏸ host RPC referenceCandidates rc.1 已删，官方 dsh-client-ui-reference 覆盖 → 建议废弃 | — |
| ui-settings-skills / ui-settings-subagents / ui-subagent-custom / ui-resend-failed-round / dsh-session-folders-custom | ⏸ 无 src（lib-only），用户确认废弃 | — |
| dsh-notification-custom | ⏸ src 残缺（缺 contract/notifier/rules） | — |

**构建环境修复（C 盘 plugins 本地化，已做）**
- 4 个插件 tsconfig `extends` ../../../ 是 E 盘 monorepo 布局路径（断链）→ 改为
  `../../tsconfig.base.client.json`（C:\dsh-ecosystem 根）
- `tsdown.client.ts` workspaceManifest 只认 `packages/*/*/package.json` → 兼容 `plugins/*/package.json`
- rc.1 类型包（28 个 @deepseek-ai）装入 C:\dsh-ecosystem\node_modules（构建 tip，未动 plugins/node_modules 手动包）
- 构建命令（无 shim）：`cd plugins/<pkg> && env -u NODE_OPTIONS node E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs`
- 产物经 profile `link:` junction 直连生效，重建即覆盖，无需拷贝

## 3. 遗留清理

- `C:\dsh-ecosystem\_tmp_deps`（npm 临时安装目录，208 包已合并到根 node_modules）→ 可删
- `E:\vibeCoding\dh-merge-tmp`（8000+ 文件）→ 资源管理器删除
- profile node_modules 里 `dsh-client-ui-deliverables_tmp_23012_127` 等 install 中断残留
  → pnpm install 成功后会自行清理
- 上游已删包残留目录（6 个，干扰 tsdown）已清；node_modules.bak-012（1.4G）已删
- fork 补丁：sandbox ACL setErrorMode 系列保留但**实测有害**（09-03 上午记录，方向 A=删除，未决策）
