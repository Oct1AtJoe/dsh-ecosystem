# DSH 会话载入性能修复 — 执行计划（交给其他 agent）

> 目标：把已验证的「首屏窗口」改动应用到正在运行的 3080 实例，并在官方仓库提一个 Discussion。
> 本文件自包含，执行者不需要上下文。
>
> **状态（2026-10-19）**：任务 A 已应用并验收（分页、加载更早、跳转第 1 轮正常）；任务 B 已发布
> Discussion [#10181](https://github.com/deepseek-ai/deepseek-harness/discussions/10181)。

---

## 0. 已核实的环境事实（不要重复踩坑）

| 事实 | 值 |
|---|---|
| 3080 实例 | 运行中，进程 PID `49932`，源码直跑 `apps/cli/src/bin.ts web` |
| 3081 隔离实例 | **已停止**，不要依赖它 |
| 官方 checkout | `E:\vibeCoding\deepseek-harness`，分支 master，`ahead 6027 / behind 52` |
| 工作区改动 | 9 项未提交（ui-chat 相关 + LOCAL-CHANGES.md + .env.backend），**与本次改动无关，不要动** |
| `lib/client.js` | **gitignore 的构建产物**（`.gitignore:7: lib/`），`git status` 看不见它 |
| HMR | `packages/client/hmr` 每 500ms stat 轮询 `lib/client.js`，改动后**无需重启 host** |
| 上游权限 | `deepseek-ai/deepseek-harness` 的 `permissions.push = false`，**Issues 关闭**，只能发 Discussion |
| Discussion 分类 | `General` = `DIC_kwDOT3T1g84DDSUb` |
| 仓库 id | `R_kgDOT3T1gw` |

**备份已存在**：`C:\dsh-ecosystem\tmp-perf\client.js.orig`（166568 字节，原版 500/2）。
**备份前的原文件当前就位**：`E:\vibeCoding\deepseek-harness\packages\api\session-controller\lib\client.js`，166568 字节，`LastWriteTime 2026-10-19 00:05:14`，内容为原版（`maxMessages: 500`）。

---

## 任务 A：把改动应用到 3080

### A1. 前置检查（必须全部通过再动手）

```powershell
$f = 'E:\vibeCoding\deepseek-harness\packages\api\session-controller\lib\client.js'
$c = Get-Content $f -Raw
"bytes=$($c.Length)"                                  # 期望 166568
"has500=$($c.Contains('maxMessages: 500'))"           # 期望 True
"has30=$($c.Contains('maxMessages: 30'))"             # 期望 False
"3080=$(Test-NetConnection -ComputerName 127.0.0.1 -Port 3080 -InformationLevel Quiet -WarningAction SilentlyContinue)"
```

任一项不符 → 停下报告，不要继续。

### A2. 备份（再备一次，防止覆盖好备份）

```powershell
Copy-Item $f 'C:\dsh-ecosystem\tmp-perf\client.js.before-apply' -Force
```

### A3. 精确文本替换（唯一推荐方式）

> ⚠️ 构建产物已经把 `PAGE_MESSAGES` / `JUMP_PAGE_MESSAGES` 内联成字面量，文件里**没有同名声明**。
> 任何插入 `JUMP_PAGE_MESSAGES` 引用的补丁都会在 import 时 `ReferenceError`，导致 `sessions`
> 服务缺失、35 个插件 pending。JUMP 块必须直接写字面量 `200`。

不要从 `E:\dsh-perf-fix` 直接拷文件——那是重新构建的产物，含构建差异。只替换两个常量块。

运行已验证脚本（JUMP 块使用字面量）：

```powershell
node C:\dsh-ecosystem\tmp-perf\apply-window-fixed.mjs
```

期望输出：`bytesAfter` 约 166426，`snippet` 含 `maxMessages: 30` 与 `maxMessages: 200`。

### A4. 等待 HMR 发布

```powershell
Start-Sleep -Seconds 3
Get-Item $f | Select-Object Length,LastWriteTime
```

`LastWriteTime` 应更新。若 10 秒内未更新，说明 HMR 未轮询到，重启 3080（见 A6）。

### A5. 验证改动真的被服务端提供

**关键**：`/plugins/<id>/client.js` 需要带 `rev` 查询参数，直接请求不带 rev 会 404。必须从页面 HTML 里取真实 URL。

```powershell
$cookie = 'dsh-auth-VPhEEcLKeqRDBoBalzN2Nm7CnfxKhLE00pKIDWxt1sw=v1.eyJ2ZXJzaW9uIjoxLCJhdXRob3JpdHkiOiIxMjcuMC4wLjE6MzA4MCIsImlzc3VlZEF0IjoxNzkyMzMyMDE4ODQwLCJleHBpcmVzQXQiOjE3OTI5MzY4MTg4NDB9.a4cMwcq3C-cHbGOc0K6eG65OwRDTjkCLDCLhPuveg3c'

$html = (Invoke-WebRequest -Uri 'http://127.0.0.1:3080/' -Headers @{ Cookie = $cookie } -UseBasicParsing).Content
$url = ([regex]::Matches($html, '/plugins/[^"''<> ]*session-controller[^"''<> ]*') | ForEach-Object { $_.Value } | Select-Object -First 1)
"url=$url"

$body = (Invoke-WebRequest -Uri "http://127.0.0.1:3080$url" -Headers @{ Cookie = $cookie } -UseBasicParsing).Content
"has30=$($body.Contains('maxMessages: 30'))"
$i = $body.IndexOf('HISTORY_PAGE_OPTIONS'); if ($i -ge 0) { $body.Substring($i, 180) }
```

期望 `has30=True`。

> 如果 cookie 失效（返回 401）：从 `C:\Users\Administrator\.dsh\dsh-web.out.log` 找不到 token（host 重启后才打印），改为在浏览器 DevTools → Application → Cookies 里读 `dsh-auth-*`，或直接跳过 A5，用 A7 的浏览器观察确认。

### A6. 重启 3080（仅当 A4/A5 失败）

当前 3080 是前台进程 PID 49932，父进程 33496。重启会中断当前会话，**执行前先确认用户同意**。

```powershell
Stop-Process -Id 49932 -Force
cd E:\vibeCoding\deepseek-harness
node --env-file=E:\vibeCoding\deepseek-harness\.env.backend --import tsx/esm apps/cli/src/bin.ts web --host 127.0.0.1 --port 3080
```

### A7. 人工验收

1. 浏览器硬刷新 `http://127.0.0.1:3080`（Ctrl+F5，清掉旧 bundle 缓存）。
2. 打开侧边栏长会话（如「1018｜优化｜会话加载性能」或任一 4MB+ 会话）。
3. 观察「载入历史」时长，与改动前对比。
4. 往上滚，确认出现「加载更早」，点击能正常加载。
5. 用轮次导航跳到很早的轮次，确认不报错（验证 `JUMP_PAGE_OPTIONS` 未被破坏）。

### A8. 回退（一条命令）

```powershell
Copy-Item 'C:\dsh-ecosystem\tmp-perf\client.js.orig' 'E:\vibeCoding\deepseek-harness\packages\api\session-controller\lib\client.js' -Force
```

然后硬刷新浏览器。**不要用 `git checkout`**——`lib/` 未跟踪，git 还原不了。

---

## 任务 B：提官方 Discussion

### B1. 渠道约束

- `deepseek-ai/deepseek-harness` **Issues 已关闭**，Discussions 开启。
- 不接受外部 PR（`CONTRIBUTING.zh.md:9`）。
- 分类选 **General**（现有 Bug 报告都在这里）。
- 当前 `gh` 登录账号 `Oct1AtJoe`，对该仓库只有 read 权限，但**创建 Discussion 不需要写权限**。

### B2. 创建命令

先把正文写入 UTF-8 文件（无 BOM），再提交：

```powershell
$body = @'
...正文见 B3...
'@
$file = 'C:\dsh-ecosystem\tmp-perf\discussion-body.md'
[IO.File]::WriteAllText($file, $body, [Text.UTF8Encoding]::new($false))
```

```powershell
$query = @'
mutation($repoId: ID!, $catId: ID!, $title: String!, $body: String!) {
  createDiscussion(input: {
    repositoryId: $repoId,
    categoryId: $catId,
    title: $title,
    body: $body
  }) { discussion { number url } }
}
'@
$payload = @{
  query = $query
  variables = @{
    repoId = 'R_kgDOT3T1gw'
    catId = 'DIC_kwDOT3T1g84DDSUb'
    title = '[Perf] 长会话切换时「载入历史」慢：初始窗口由 turnWindow 主导，首帧载荷达 1.1-2.8MB'
    body = (Get-Content 'C:\dsh-ecosystem\tmp-perf\discussion-body.md' -Raw)
  }
} | ConvertTo-Json -Depth 5 -Compress

$f = [IO.Path]::GetTempFileName()
[IO.File]::WriteAllText($f, $payload, [Text.UTF8Encoding]::new($false))
try { gh api graphql --input $f } finally { Remove-Item $f -ErrorAction SilentlyContinue }
```

成功返回 `discussion.number` 与 `url`。

### B3. 正文（英文，技术数据完整，不含隐私）

```markdown
## Summary

Switching to a long session shows "载入历史" (loading history) for several seconds. The opening
`session/follow` snapshot is far larger than expected, and the client must parse, assemble, and
render all of it before `openState` becomes `open`.

Measured on a 6.66 MB v3 log (24.6 MB raw JSON, 8024 events): the opening snapshot carried
**450 records / 1.09 MB**, and cold open took **379 ms** on the host.

## Root cause

`HISTORY_PAGE_OPTIONS` in `packages/api/session-controller/src/client/sessions/session.ts`:

```ts
const HISTORY_PAGE_OPTIONS = { maxMessages: 500, turnWindow: { minMessages: 50, minTurns: 2 } }
```

`turnWindow` dominates `maxMessages`. `paginate()` in
`packages/api/session-controller/src/history.ts` walks backwards and stops at a `turn/start`
once both minima are met — so a single long turn returns **everything in that turn**,
regardless of `maxMessages`. On the measured session, the most recent turn alone contained
450 events, so `maxMessages` never triggered.

Reducing `maxMessages` alone does **not** help:

| request | records | payload |
|---|---|---|
| `maxMessages: 500` + `turnWindow {50, 2}` (current) | 450 | 1.09 MB |
| `maxMessages: 120` + `turnWindow {50, 2}` | 450 | 1.09 MB |
| `maxMessages: 120`, no `turnWindow` | 597 | 1.27 MB |
| `maxMessages: 80`, no `turnWindow` | 407 | 0.89 MB |
| `maxMessages: 50`, no `turnWindow` | 259 | 0.56 MB |
| `maxMessages: 30`, no `turnWindow` | 156 | 0.35 MB |

The client contract already permits a window that begins mid-turn
(`packages/api/session-controller/src/client/contract/session.ts:123`:
"partial Turn at the window's beginning").

## Proposed change

```ts
const HISTORY_PAGE_OPTIONS = { maxMessages: 30 }

const JUMP_PAGE_OPTIONS = {
  maxMessages: JUMP_PAGE_MESSAGES,
  turnWindow: { minMessages: JUMP_PAGE_MESSAGES, minTurns: 2 },
}
```

`JUMP_PAGE_OPTIONS` must restate `maxMessages` explicitly: it previously spread
`HISTORY_PAGE_OPTIONS`, and `minMessages: 200 > maxMessages` is rejected by
`validateHistoryWindow()` in `history.ts`.

## Measured effect

Same three sessions, cold / warm / live:

| session | records before → after | payload before → after |
|---|---|---|
| b724f314 (6.66 MB v3) | 450 → 156 | 1.09 MB → 0.35 MB (−68%) |
| c7912d98 (5.17 MB v3) | 312 → 151 | 0.51 MB → 0.23 MB (−56%) |
| 56d07a1c (6.24 MB v3, unmigrated) | 403 → 169 | 1.37 MB → 0.73 MB (−47%) |

Host cold-read time is unchanged (379 → 418 ms), which is expected: the cold path still
decodes the full log. What shrinks is the work the client does between receiving the snapshot
and flipping `openState` to `open` — `replaceWindow()` rebuilds every context, then ChatFlow
renders all rows without virtualization.

## Secondary observations (not in the patch)

- Cold read decodes and `JSON.parse`s the entire log to serve one tail page
  (`packages/session-query/session-query/src/cold-read.ts:37`,
  `packages/session/session-persistence-jsonl/src/index.ts:992`). ~250 ms for a 24 MB log.
- Legacy v3 sessions migrate synchronously on first open: 1955 ms measured, including two
  full-corpus header scans (607 files × ~0.3 ms each) in
  `prepareStoredMigration()`.
- `COLD_LOG_MEMO_MAX_ENTRIES = 2` and `SESSION_QUERY_DEFAULT_PREPARED_SESSION_CACHE_SIZE = 5`
  are small enough that switching among several long sessions repeatedly pays the cold cost.

## Trade-off

Fewer messages on first paint: users may need one "加载更早" click. 30 messages was chosen as
the balance point; 50 is a more conservative alternative.

Happy to test a different value if the maintainers prefer another default.
```

---

## 执行顺序

1. A1 前置检查
2. A2 备份
3. A3 替换
4. A4 等 HMR
5. A5 验证服务端已提供
6. A7 人工验收
7. B2 提 Discussion

任何一步失败就停，**先回退 A8**，再报告。

---

## 绝对不要做的事

- 不要 `git checkout` / `git restore` `lib/` —— 未被跟踪，还原不了。
- 不要动 `E:\vibeCoding\deepseek-harness` 里那 9 个未提交改动。
- 不要在 `E:\dsh-perf-fix` 或 `E:\dsh-perf-home` 里继续工作，它们是验证环境，已完成使命。
- 不要试图给上游开 Issue 或 PR —— 权限不足且渠道关闭。
- 不要重启 3080 而不先确认用户同意。
