# Vendored: @deepseek-ai/dsh-client-ui-chat

来源：`E:\vibeCoding\deepseek-harness\packages\client\ui-chat`
版本：**0.2.1-rc.5**（基线 tag `dsh-v0.2.1-rc.5` = `b830ec950f`）
补丁提交：
- `e8ce7bf5d0 fix(local): 重贴业务补丁到 0.2.1` — `use-chat-viewport.ts` 跳到折叠回合自动展开
- `603ce1067b feat(local): 用量悬浮窗补回 TPS` — `deriveTurnMetrics()` + TPS 行
- `ee926e3ff4 feat(local): 用量悬浮窗新增「首字用时」行` — TTFT 行

## 为什么固化

DSH 桌面端从 `E:\dshDesktop\resources\app.asar` 加载 ui-chat，那是官方原版，
**不含** `deriveTurnMetrics()`，所以 `TurnUsagePanel` 收不到 `tokensPerSecond`，
「本轮用量」悬浮窗末行不显示 TPS。

本目录是一份**带补丁的 ui-chat 运行时副本**，由 profile 以 `link:` 方式覆盖 asar 内的同名包。

## 补丁内容（相对官方）

见 `E:\vibeCoding\deepseek-harness\LOCAL-CHANGES.md` §12：
1. `contract/turn-metrics.ts` 加回 `deriveTurnMetrics()`
2. `contract/chat-nodes.ts` 的 `TurnTailChatData` 加 `tokensPerSecond?` 与 `ttftMs?`
3. `conversation-nodes/turn-tail.ts` 调用它并把两个字段写入
4. `chat/TurnUsagePanel.tsx` props 加 `tokensPerSecond?` / `ttftMs?`，
   在「输出」行后依次追加「首字用时」与「输出速度（TPS）」两行
5. `chat/TurnTailNodeView.tsx` 透传两个字段
6. `conversation-nodes/event-projection.ts` 从持久化 stream 记录恢复首 token 时间
7. `chat/locale.ts` 新增 `message.turnUsage.ttft`（zh「首字用时」/ en「Time to first token」）

> **「首字用时」用的是单次值，不是平均。** `deriveTurnMetrics()` 取该轮
> **最低 step 的单次 TTFT**；官方的 `StatsPills` 全局面板才用 `ttftMs / ttftSteps`
> 算平均。所以这里刻意**没有**复用 `stats.dialog.ttft`（文案带"平均"二字，
> 用在单次值上是错的），另建了 `message.turnUsage.ttft`。
> 复用现成的 `formatDuration()` 做格式化，不新增格式化逻辑。

## ⚠️ 升级桌面端时必须核对

本副本无 `src/`，**不能重新构建**。升级 `E:\dshDesktop` 后要做：

1. 查 asar 里 ui-chat 的新版本号（见 `docs/desktop-upgrade-checklist.md` §2）。
2. 若版本 ≠ **0.2.1-rc.5**，本副本可能 API 不匹配 → 整块聊天界面会崩。
   此时对策（按优先级）：
   - **先查官方是否已自带 TPS**：搜 asar 是否含 `deriveTurnMetrics`。若有 → 直接删掉本覆盖，回官方版。
   - 否则：按下方「重建流程」重做。

## 重建流程（0.2.1-rc.5 实测有效）

```powershell
cd E:\vibeCoding\deepseek-harness
git checkout dsh-v0.2.1-rc.5                              # detached HEAD，不动 master
git checkout <补丁提交> -- packages/client/ui-chat/src/client/...   # 只取 8 个补丁文件
cd packages\client\ui-chat
$env:NODE_OPTIONS=""
node "...\typescript\bin\tsc" -b tsconfig.json            # 必须 exit 0
node "...\tsdown\dist\run.mjs" --config tsdown.config.ts
git -C E:\vibeCoding\deepseek-harness checkout -- . && git checkout <补丁提交>
```

> 🚨 rc.5 的 `tsconfig.json` 是 **project references**（`"files": []` + 两个 reference），
> 裸 `tsc -p tsconfig.json` 不产出 `lib/types` 却 exit 0。必须用 `-b`。

再把 `lib/index.js`、`lib/client.js`、`lib/types/**/*.d.ts`、`locale/*.json` 拷回来，
`package.json` 只改两处：

| 字段 | 值 | 原因 |
|---|---|---|
| `version` | 与 asar 内的新版本一致 | 便于识别 |
| `peerDependencies["@deepseek-ai/cordis"]` | `~4.0.5` | 源码里是 `workspace:~`，profile 里解析不了 |

> **`package.json` 的 `devDependencies` 全是 `workspace:*`，整份拷进固化包会污染 profile 解析。**
> 实际只需要上面两处改动，其余字段保持固化后的形态。

### rc.2 → rc.3 的经验（下次升级可复用）

`git diff --stat dsh-v0.2.1-rc.2 dsh-v0.2.1-rc.3 -- packages/client/ui-chat/` 只有
`package.json` 一行版本号变化，**8 个补丁源文件全部零改动**。所以重建产物与升级前
**逐字节相同**（`client.js`、`index.js`、97 个 `.d.ts`、`locale` 全一致）。

差异只出现在 CSS Modules 类名哈希：`tsdown.client.ts` 用 `pattern: '[hash]_[local]'`，
哈希取自源码绝对路径。CI 在 `D:\ci\runners\...`，本地在 `E:\vibeCoding\...`，
所以官方产物前缀是 `V4vHZW`，本地构建是 `kdtA_a`。**这不影响功能**，
但**不要**拿类名前缀当判据去比对官方与本地产物。

### rc.3 → rc.5 的经验（2026-10-30 重建）

`git diff --numstat dsh-v0.2.1-rc.3 dsh-v0.2.1-rc.5 -- <8 个补丁源文件>` 输出为空：
**rc.3 → rc.5 期间官方没动这 8 个文件**，所以整文件覆盖即可，产物语义与 rc.3 一致。
差异只在 CSS Modules 类名前缀（见上）与 `package.json` 版本号。

本版验收：`deriveTurnMetrics` / `assistantStreamFirstTokenTime` / `turnUsage.ttft` / `首字用时` / `输出速度` / `reasoningText` 六个符号在
`lib/client.js` 全命中；`version = 0.2.1-rc.5`；`cordis` peer 保持 `~4.0.5`（rc.5 官方就是它，未改）。

> 🚨 **2026-11-03 补丁源文件防漏警示**：
> 补丁共涉及 **9 个文件**（需确保 conversation-nodes 的 3 个文件全进）：
> 1. `chat/TurnTailNodeView.tsx`
> 2. `chat/TurnUsagePanel.tsx`
> 3. `chat/use-chat-viewport.ts`
> 4. `contract/chat-nodes.ts`
> 5. `contract/turn-metrics.ts`
> 6. `conversation-nodes/assistant.ts`（必须带 `assistantStreamFirstTokenTime`，否则会话沉淀/重开后首字和 TPS 丢失）
> 7. `conversation-nodes/event-projection.ts`（实现 `assistantStreamFirstTokenTime`）
> 8. `conversation-nodes/turn-tail.ts`
> 9. `locale.ts`
> 官方在 rc.5 新增的 `reasoning-text.ts` 必须保留，不能被旧 commit 冲掉。

## 回滚

删掉 profile 的这条依赖并重装即可：
```json
"@deepseek-ai/dsh-client-ui-chat": "link:C:/dsh-ecosystem/packages/ui-chat-patched"
```
```powershell
cd C:\Users\Administrator\.dsh\profiles\desktop
node ...\pnpm\bin\pnpm.mjs install --no-frozen-lockfile
```

升级前的完整副本：rc.5 之前 → `C:\dsh-ecosystem\archive\ui-chat-patched-pre-rc5-20261030-103943\`；
更早（rc.3 时）→ `C:\dsh-ecosystem\archive\ui-chat-patched-pre-rc3-20261024-144013\`
