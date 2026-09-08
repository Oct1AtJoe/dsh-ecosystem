# @deepseek-ai/dsh-client-ui-subagent-custom

Composer 工具行的子代理按钮：机器人头像 + 运行中子代理数量 badge，点击打开
dsh-better-sidebar 的 subagent 页签。挂在官方 rc.1 `ui-subagent` 之上的增量
client 插件——官方包负责 header lineage、只读 composer 等其余界面，本包只提供
`conversation.input.right` 列表座席上的这一个按钮（0.1.1 的 '@' 引用源与
目录菜单已被官方 rc.1 ui-reference / ui-subagent 覆盖，不再移植）。

## 结构

- `src/client/index.ts` — apply：注册 `subagent-composer` 词典与按钮 seat（`id: 'subagent-activity'`）
- `src/client/SubagentComposerAction.tsx` — 按钮组件（runningCount 由会话列表快照零 RPC 投影）
- `src/client/subagent-lineage.ts` — `indexSubagentDescendants` 的本地副本（官方 ui-subagent 未发布该导出，规则禁止跨 feature 插件取值）
- better-sidebar 服务为可选依赖：`ctx.get('betterSidebar')`，未挂载时按钮点击为 no-op

## 历史

0.1.1 版无源码（lib 直接改产物）；0.2.0-rc.1 从 `lib/types/client/*.js` +
source map 反推回源码并迁移到 rc.1 API（`indexSubagentDescendants` 从已删的
dsh-client-runtime 改为本地副本；`openTab({ type, pane })` 适配 0.18.0 的
`openTab(seed, scope?)`）。

## 构建

```sh
cd C:/dsh-ecosystem/plugins/ui-subagent-custom
rm -rf lib
env -u NODE_OPTIONS node /e/vibeCoding/deepseek-harness/node_modules/typescript/bin/tsc -p tsconfig.json
env -u NODE_OPTIONS node /e/vibeCoding/deepseek-harness/node_modules/tsdown/dist/run.mjs --config tsdown.config.ts
```

改 cordis.patch.yml / package.json 后需在 profile 目录重跑 `pnpm install` 并重启 dsh。
