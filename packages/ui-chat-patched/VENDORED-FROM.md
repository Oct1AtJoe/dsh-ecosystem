# Vendored: @deepseek-ai/dsh-client-ui-chat

来源：`E:\vibeCoding\deepseek-harness\packages\client\ui-chat`
版本：**0.2.1-rc.2**
补丁提交：`603ce1067b feat(local): 用量悬浮窗补回 TPS`

## 为什么固化

DSH 桌面端从 `E:\dshDesktop\resources\app.asar` 加载 ui-chat，那是官方原版，
**不含** `deriveTurnMetrics()`，所以 `TurnUsagePanel` 收不到 `tokensPerSecond`，
「本轮用量」悬浮窗末行不显示 TPS。

本目录是一份**带补丁的 ui-chat 运行时副本**，由 profile 以 `link:` 方式覆盖 asar 内的同名包。

## 补丁内容（相对官方）

见 `E:\vibeCoding\deepseek-harness\LOCAL-CHANGES.md` §12：
1. `contract/turn-metrics.ts` 加回 `deriveTurnMetrics()`
2. `contract/chat-nodes.ts` 的 `TurnTailChatData` 加 `tokensPerSecond?`
3. `conversation-nodes/turn-tail.ts` 调用它并写入
4. `chat/TurnUsagePanel.tsx` props 加 `tokensPerSecond?`，「输出」行后追加 TPS 行
5. `chat/TurnTailNodeView.tsx` 透传
6. `conversation-nodes/event-projection.ts` 从持久化 stream 记录恢复首 token 时间

## ⚠️ 升级桌面端时必须核对

本副本无 `src/`，**不能重新构建**。升级 `E:\dshDesktop` 后要做：

1. 查 asar 里 ui-chat 的新版本号：
   ```powershell
   $py = "C:\Users\Administrator\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
   & $py -c "import json,io; d=json.load(io.open(r'<新asar解出路径>\node_modules\@deepseek-ai\dsh-client-ui-chat\package.json',encoding='utf-8')); print(d['version'])"
   ```
2. 若版本 ≠ **0.2.1-rc.2**，本副本可能 API 不匹配 → 整块聊天界面会崩。
   此时对策（按优先级）：
   - **先查官方是否已自带 TPS**：搜 asar 是否含 `deriveTurnMetrics`。若有 → 直接删掉本覆盖，回官方版。
   - 否则：从新版本源码重新打 `LOCAL-CHANGES.md` §12 的补丁，重建 `lib/client.js`，覆盖本目录。

## 回滚

删掉 profile 的这条依赖并重装即可：
```json
"@deepseek-ai/dsh-client-ui-chat": "link:C:/dsh-ecosystem/packages/ui-chat-patched"
```
```powershell
cd C:\Users\Administrator\.dsh\profiles\desktop
node ...\pnpm\bin\pnpm.mjs install --no-frozen-lockfile
```
