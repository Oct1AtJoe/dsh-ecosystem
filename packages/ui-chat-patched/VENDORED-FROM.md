# Vendored: @deepseek-ai/dsh-client-ui-chat

来源：`E:\vibeCoding\deepseek-harness\packages\client\ui-chat`
版本：**0.2.2-rc.5**（基线 tag `dsh-v0.2.2-rc.5` = `9c2670d3bc`）
重建：2026-11-19，桌面端升级到 0.2.2-rc.5 后在隔离 worktree `E:\vibeCoding\deepseek-harness-rc5` 重建
补丁来源：
- `e8ce7bf5d0 fix(local): 重贴业务补丁到 0.2.1` — `use-chat-viewport.ts` 跳到折叠回合自动展开
- `603ce1067b feat(local): 用量悬浮窗补回 TPS` — `deriveTurnMetrics()` + TPS 行
- `ee926e3ff4 feat(local): 用量悬浮窗新增「首字用时」行` — TTFT 行
- `patches/chat-virtual-rows` — `ChatView.module.css` 的 `content-visibility: auto`

## 为什么固化

DSH 桌面端从 `E:\dshDesktop\resources\app.asar` 加载 ui-chat，那是官方原版，
**不含** `deriveTurnMetrics()`，所以 `TurnUsagePanel` 收不到 `tokensPerSecond`，
「本轮用量」悬浮窗末行不显示 TPS。

本目录是一份**带补丁的 ui-chat 运行时副本**，由 profile 以 `link:` 方式覆盖 asar 内的同名包。

## 补丁内容（相对官方 0.2.2-rc.5）

1. `contract/turn-metrics.ts` 加回 `deriveTurnMetrics()`
2. `contract/chat-nodes.ts` 的 `TurnTailChatData` 加 `tokensPerSecond?` 与 `ttftMs?`
3. `conversation-nodes/turn-tail.ts` 调用它并把两个字段写入
4. `chat/TurnUsagePanel.tsx` props 加 `tokensPerSecond?` / `ttftMs?`，
   在「输出」行后依次追加「首字用时」与「输出速度（TPS）」两行
5. `chat/TurnTailNodeView.tsx` 透传两个字段
6. `conversation-nodes/assistant.ts` / `event-projection.ts` 恢复 `assistantStreamFirstTokenTime`
   （会话沉淀/重开后首字与 TPS 不丢失）
7. `chat/locale.ts` 新增 `message.turnUsage.ttft`；**0.2.2 起有 8 种 locale**
   （zh/en/ja/es/fr/de/ru/pt），8 份字典都要加
8. `chat/use-chat-viewport.ts` 跳到折叠回合时自动展开

### 0.2.2 起不再移植的部分

`chat/stat-dialog.ts` 的自适应定位 + zoom 单位校正（`computeSmartPosition` /
`resolvePageZoom` / `MEASURE_STYLE`）**已废弃**：官方 0.2.2 把浮动面板改成了
CSS anchor 定位（`useStatDialog()` 返回 `anchorName`，面板用 `positionAnchor`），
问题在另一层面解决。重建时冲突处的正确解法是保留官方的 `anchorName`，
只把 TPS/TTFT 字段并入 props。

## 重建流程（0.2.2-rc.5 实测）

```powershell
# 隔离 worktree，不动主工作树
git -C E:\vibeCoding\deepseek-harness fetch upstream --tags
git -C E:\vibeCoding\deepseek-harness worktree add E:\vibeCoding\deepseek-harness-rc5 dsh-v0.2.2-rc.5
cd E:\vibeCoding\deepseek-harness-rc5
pnpm install --no-frozen-lockfile
node --import tsx/esm scripts/generate-typert.ts   # 否则 */remote 声明缺失，tsc -b 必挂
git apply -3 C:\dsh-ecosystem\packages\ui-chat-patched\local-changes.patch
# 注意指向 worktree；apply.mjs 默认写主 checkout。local-changes.patch 已含
# content-visibility 块，因此这里是幂等 no-op（changed:false）
$env:DSH_CHECKOUT='E:\vibeCoding\deepseek-harness-rc5'
node C:\dsh-ecosystem\patches\chat-virtual-rows\apply.mjs
cd packages\client\ui-chat
node ..\..\..\node_modules\typescript\bin\tsc -b tsconfig.json      # 必须 exit 0
node ..\..\..\node_modules\tsdown\dist\run.mjs --config tsdown.config.ts
```

> ⚠️ **全新 worktree 必须先构建要内联的 workspace 依赖**。否则 rolldown 解析不到它们的
> `lib/index.js`，会把 `@deepseek-ai/dsh-brand`、`dsh-util-values`、`dsh-util-crypto`、
> `@deepseek-ai/cosmokit` 当成 external，产物首行就 `require()` 它们；宿主模块表没有这些行，
> 启动即 `web boot: 1 required entry did not activate … import failed`，整块聊天区不渲染
> （2026-11-19 实测踩过）。最小前置构建：
>
> ```powershell
> $ts='E:\vibeCoding\deepseek-harness-rc5\node_modules\tsdown\dist\run.mjs'
> $cfg='C:\dsh-ecosystem\scripts\tsdown-lib.config.mjs'   # 含 fixedExtension:false + outExtensions .js
> foreach($d in 'packages\util\brand','packages\util\values','packages\util\crypto','vendor\cosmokit'){
>   Push-Location "E:\vibeCoding\deepseek-harness-rc5\$d"
>   node $ts "$PWD\lib\types\index.js" -c $cfg -d "$PWD\lib" --no-clean
>   Pop-Location
> }
> ```
>
> 判据：重建出的 `lib/client.js` 里 `require()` 只能出现 6 个平台模块——`react`、
> `react/jsx-runtime`、`react-dom`、`@tanstack/react-virtual`、`@deepseek-ai/dsh-client-store`、
> `@deepseek-ai/dsh-client-ui-primitives`。多一个就是依赖没内联，不要拷回固化包。

然后把 `lib/index.js`、`lib/client.js`、`lib/assets/`、`lib/types/**/*.d.ts`、
`locale/*.json` 拷回本目录，`package.json` 只保留固化形态（见下），最后：

```powershell
git -C E:\vibeCoding\deepseek-harness restore --source=HEAD --staged --worktree -- packages/client/ui-chat
```

### 固化 package.json 的三处改动

| 字段 | 值 | 原因 |
|---|---|---|
| `version` | 与 asar 内的新版本一致 | 便于识别 |
| `peerDependencies["@deepseek-ai/cordis"]` | `~4.0.5` | 源码里是 `workspace:~`，profile 里解析不了 |
| `devDependencies` / `dependencies` | 整块删除 | 全是 `workspace:*`，会污染 profile 解析 |

## 验收符号（`lib/client.js` 必须全命中）

`deriveTurnMetrics`、`assistantStreamFirstTokenTime`、`turnUsage.ttft`、
`首字用时`、`输出速度`、`content-visibility`。版本号 `0.2.2-rc.5`。
（2026-11-19 实测：deriveTurnMetrics=2、turnUsage.ttft=9、content-visibility=1、
assistantStreamFirstTokenTime=2。）

## ⚠️ 升级桌面端时必须核对

1. 查 asar 里 ui-chat 的版本号；不等于 `0.2.2-rc.5` 就有整块聊天界面崩溃风险。
2. **先查官方是否已自带 TPS**：搜 asar 是否含 `deriveTurnMetrics`。若有 → 删掉本覆盖回官方。
3. 否则按上面流程重建。注意每版都先跑 `generate-typert.ts`，否则一堆
   `@deepseek-ai/*/remote` 假报错。

## 回滚

删掉 profile 的这条依赖并重装即可：
```json
"@deepseek-ai/dsh-client-ui-chat": "link:C:/dsh-ecosystem/packages/ui-chat-patched"
```
```powershell
cd C:\Users\Administrator\.dsh\profiles\desktop
node ...\pnpm\bin\pnpm.mjs install --no-frozen-lockfile
```

升级前的完整副本（0.2.1-rc.5）：`C:\dsh-ecosystem\archive\ui-chat-patched-pre-0.2.2-20261116-100754\`
