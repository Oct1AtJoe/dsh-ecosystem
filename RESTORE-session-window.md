# 还原「会话首屏窗口 30 条」相关改动 —— 执行手册

> 交给其他 agent 执行。目标：把本机上由「载入历史优化」引入的全部改动还原到原始状态，
> 不触碰用户原有修改，不重启服务。
>
> 所有路径已核实。执行前请完整读一遍，尤其是第 6 步（LOCAL-CHANGES.md）不能 `git checkout`。

---

## 0. 背景与安全原则

本次要还原的改动分四块：

| 位置 | 改动 | 原始值 |
|---|---|---|
| `E:\vibeCoding\deepseek-harness\packages\api\session-controller\src\client\sessions\session.ts` | 首屏窗口 500→30 | `git` 已跟踪，checkout 还原 |
| `E:\vibeCoding\deepseek-harness\packages\api\session-controller\lib\client.js` | 构建产物同名改动（gitignore） | 166568 字节原版 |
| `E:\vibeCoding\deepseek-harness\LOCAL-CHANGES.md` | 追加了 §13 | 只删 §13，**不能 checkout** |
| `C:\dsh-ecosystem\external-repos\dsh-cost-meter\lib\index.js` | 关闭自动价格/汇率刷新 | 198316 字节原版 |

另有一个临时 PR worktree 和本地分支需要清理。

**不要做的事：**

- 不要 `git checkout LOCAL-CHANGES.md`。该文件在本轮开始前就已有用户自己的未提交修改。
- 不要重启 3080。还原文件后由用户自行决定何时重启/硬刷新。
- 不要动 `.env.backend`（未跟踪，用户原有）。
- 不要动 ui-chat 那 7 个已有修改文件。

---

## 1. 前置检查

```powershell
cd E:\vibeCoding\deepseek-harness
git status --porcelain
```

期望看到 **10 项**（9 项原有 + 1 项本次引入的 `session.ts`）：

```
 M LOCAL-CHANGES.md
 M packages/api/session-controller/src/client/sessions/session.ts   <- 本次引入
 M packages/client/ui-chat/src/client/chat/TurnTailNodeView.tsx
 M packages/client/ui-chat/src/client/chat/TurnUsagePanel.tsx
 M packages/client/ui-chat/src/client/contract/chat-nodes.ts
 M packages/client/ui-chat/src/client/contract/turn-metrics.ts
 M packages/client/ui-chat/src/client/conversation-nodes/assistant.ts
 M packages/client/ui-chat/src/client/conversation-nodes/event-projection.ts
 M packages/client/ui-chat/src/client/conversation-nodes/turn-tail.ts
?? .env.backend
```

并确认备份存在：

```powershell
Test-Path C:\dsh-ecosystem\patches\session-window-30\client.js.orig   # 必须 True
Test-Path C:\dsh-ecosystem\patches\cost-meter-idle\index.js.orig      # 必须 True
Get-Item C:\dsh-ecosystem\patches\session-window-30\client.js.orig | Select-Object Length  # 166568
Get-Item C:\dsh-ecosystem\patches\cost-meter-idle\index.js.orig    | Select-Object Length  # 198316
```

任一项不符，停下报告，不要继续。

---

## 2. 还原官方 checkout 源码

```powershell
cd E:\vibeCoding\deepseek-harness
git checkout -- packages/api/session-controller/src/client/sessions/session.ts
```

验证：

```powershell
(Get-Content packages\api\session-controller\src\client\sessions\session.ts -Raw).Contains('maxMessages: 500')  # True
(Get-Content packages\api\session-controller\src\client\sessions\session.ts -Raw).Contains('maxMessages: 30')    # False
```

---

## 3. 还原构建产物

`lib/` 是 `.gitignore` 排除的构建产物，git 不能还原，必须用备份覆盖：

```powershell
Copy-Item C:\dsh-ecosystem\patches\session-window-30\client.js.orig `
  E:\vibeCoding\deepseek-harness\packages\api\session-controller\lib\client.js -Force
```

验证：

```powershell
$f='E:\vibeCoding\deepseek-harness\packages\api\session-controller\lib\client.js'
(Get-Item $f).Length                                                              # 166568
(Get-Content $f -Raw).Contains('maxMessages: 500')                                # True
(Get-Content $f -Raw).Contains('maxMessages: 30')                                 # False
```

> 3080 正在运行的进程里仍是旧模块，HMR 会在约 500ms 内检测到文件变化并重新发布。
> 页面需要用户手动硬刷新（Ctrl+F5）才回到原窗口行为。不要替用户刷新。

---

## 4. 还原 LOCAL-CHANGES.md（只删 §13）

这一步必须用脚本精确截断，**不能用 git checkout**。

```powershell
$file = 'E:\vibeCoding\deepseek-harness\LOCAL-CHANGES.md'
$text = Get-Content $file -Raw
$marker = "## 13. 会话首屏窗口 30 条"
$index = $text.IndexOf($marker)
if ($index -lt 0) { throw "§13 marker not found; 文件可能已被改动，停止" }
$trimmed = $text.Substring(0, $index).TrimEnd() + "`r`n"
[IO.File]::WriteAllText($file, $trimmed, [Text.UTF8Encoding]::new($false))
```

验证：

```powershell
(Get-Content E:\vibeCoding\deepseek-harness\LOCAL-CHANGES.md -Raw).Contains('会话首屏窗口 30 条')  # False
(Get-Content E:\vibeCoding\deepseek-harness\LOCAL-CHANGES.md -Raw).Contains('discussions#10181')    # False
```

> 文件末尾原本以「## 相关提交」段落结束，截断后应保持该结构。
> 如果 §13 后面还有别的段落，上面的截断会误删——执行前先确认 §13 是最后一节：
> `Select-String -Path ... -Pattern '^## ' | Select-Object -Last 3`。

---

## 5. 还原 dsh-cost-meter 插件

```powershell
Copy-Item C:\dsh-ecosystem\patches\cost-meter-idle\index.js.orig `
  C:\dsh-ecosystem\external-repos\dsh-cost-meter\lib\index.js -Force
```

验证：

```powershell
$f='C:\dsh-ecosystem\external-repos\dsh-cost-meter\lib\index.js'
(Get-Item $f).Length                                                       # 198316
(Get-Content $f -Raw).Contains('DSH_COST_METER_AUTO_REFRESH')               # False
```

```powershell
cd C:\dsh-ecosystem\external-repos\dsh-cost-meter
git status --porcelain     # 应为空
```

若插件 repo 当前不在 `master`，先确认：

```powershell
git branch --show-current   # 期望 master
git log -1 --oneline        # 期望 dbdd40f
```

---

## 6. 清理临时 PR worktree 与分支

worktree 里有 `node_modules` junction，直接删会跟随到真实目录。先删 junction：

```powershell
$wt = 'C:\dsh-ecosystem\external-repos\dsh-cost-meter-pr'
if (Test-Path "$wt\node_modules") { cmd /c "rmdir `"$wt\node_modules`"" }
```

确认 junction 已移除后清理 worktree：

```powershell
cd C:\dsh-ecosystem\external-repos\dsh-cost-meter
git worktree remove --force $wt
git branch -D perf/pricing-history-retention
git worktree prune
```

验证：

```powershell
git worktree list
# 只应剩 C:/dsh-ecosystem/external-repos/dsh-cost-meter  dbdd40f [master]

git branch --list 'perf/*'
# 应为空

Test-Path $wt   # False
```

> 若 `worktree remove` 报 `contains modified or untracked files`，先 `--force`；
> 仍失败则手动删目录后再 `git worktree prune`。

---

## 7. 可选：清理临时分析产物

以下都是本轮生成的，不影响功能。确认不再需要后删除：

```powershell
# 独立验证环境（约 2.2GB + 43MB）
Remove-Item E:\dsh-perf-fix  -Recurse -Force
Remove-Item E:\dsh-perf-home -Recurse -Force

# 分析脚本、日志、临时副本
Remove-Item C:\dsh-ecosystem\tmp-perf -Recurse -Force

# 补丁与备份（最后删，删前确认第 2/3/5 步已验证）
Remove-Item C:\dsh-ecosystem\patches\session-window-30 -Recurse -Force
Remove-Item C:\dsh-ecosystem\patches\cost-meter-idle      -Recurse -Force
```

> 建议先完成第 8 步验证，再删备份。

---

## 8. 最终验证

```powershell
cd E:\vibeCoding\deepseek-harness
git status --porcelain
```

期望 **9 项**，且 `session.ts` 消失：

```
 M LOCAL-CHANGES.md
 M packages/client/ui-chat/src/client/chat/TurnTailNodeView.tsx
 M packages/client/ui-chat/src/client/chat/TurnUsagePanel.tsx
 M packages/client/ui-chat/src/client/contract/chat-nodes.ts
 M packages/client/ui-chat/src/client/contract/turn-metrics.ts
 M packages/client/ui-chat/src/client/conversation-nodes/assistant.ts
 M packages/client/ui-chat/src/client/conversation-nodes/event-projection.ts
 M packages/client/ui-chat/src/client/conversation-nodes/turn-tail.ts
?? .env.backend
```

```powershell
# 源码与产物均为原版
Select-String -Path packages\api\session-controller\src\client\sessions\session.ts -Pattern 'maxMessages: 500'
(Get-Item packages\api\session-controller\lib\client.js).Length   # 166568

# 插件为原版
(Get-Item C:\dsh-ecosystem\external-repos\dsh-cost-meter\lib\index.js).Length  # 198316

# 无残留实例
Test-NetConnection -ComputerName 127.0.0.1 -Port 3081 -InformationLevel Quiet  # False（3081 早已停止）
Test-NetConnection -ComputerName 127.0.0.1 -Port 3080 -InformationLevel Quiet  # True（用户在用，不要动）

# 无残留分支
git -C C:\dsh-ecosystem\external-repos\dsh-cost-meter branch --list 'perf/*'    # 空
```

---

## 9. 可选：撤回官方 Discussion

已发起的提案：
<https://github.com/deepseek-ai/deepseek-harness/discussions/10181>

如果用户要求撤回：

```powershell
$f = [IO.Path]::GetTempFileName()
$json = @'
{"query":"mutation { deleteDiscussion(input: { discussionId: \"D_kwDOT3T1g84AqM3K\" }) { clientMutationId } }"}
'@
[IO.File]::WriteAllText($f, $json, [Text.UTF8Encoding]::new($false))
try { gh api graphql --input $f } finally { Remove-Item $f -ErrorAction SilentlyContinue }
```

> 需要 `gh` 已登录为作者 `Oct1AtJoe`。删除不可恢复；若不删，帖子里已有完整实测数据。

---

## 10. 不可还原的部分

以下变化是本轮操作的副作用，但不属于「代码改动」，无法/不应回滚：

- **会话格式迁移**：验证时打开过若干旧 `v3` 会话，DSH 自动生成了对应
  `session.v4.jsonl.zstd`。这是应用正常行为，`v3` 原件仍在。
- **`~/.dsh` 下的临时目录**：`C:\Users\Administrator\profiles`、
  `sessions`、`.credentials.yaml` 曾因变量名冲突误建，当时已清理，无需处理。
- **`gh` 拉取的 tags**：`dsh-cost-meter` 仓库多了若干 tag，无副作用，可保留。
- **cost-meter 真实账本**：压缩脚本只在副本上跑过，真实
  `ledger.json` 未修改（仍约 7.35MB）。

---

## 11. 完成后回报

请回报：

1. 第 8 步 `git status` 的实际输出
2. 三个文件的大小（166568 / 166568 / 198316）
3. `git worktree list` 与 `git branch --list 'perf/*'` 输出
4. 是否执行了第 7 步清理、第 9 步撤回

任何一步与期望不符，停止并报告，不要继续删除备份。
