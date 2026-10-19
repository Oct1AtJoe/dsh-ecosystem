# dsh-cost-meter 本地补丁：Windows 锁身份不再同步调 PowerShell

## 问题

`dsh-cost-meter` 的 `lib/ledger-lock-owner.js` 在 Windows 上获取进程启动时间时用
`execFileSync` 同步启动一次 PowerShell：

```js
const start = execFileSync(powershell, ['-NoProfile', '-NonInteractive', '-Command',
  `(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().Ticks`], ...)
```

`withLedgerLock()` 每次拿账本锁都会调 `ledgerLockOwner()`，进而调
`localIdentity()` → `processIdentity(process.pid)`。实测：

```
[1382ms] execFileSync powershell.exe
  processIdentity -> localIdentity -> ledgerLockOwner -> withLedgerLock -> Ledger.open
[1190ms] execFileSync powershell.exe
  同上
```

启动时阻塞宿主单线程 2.5 秒，期间所有 HTTP 接口、WebSocket 帧、工具调用排队。

## 补丁

- `process.pid === pid` 时不再起 PowerShell，改用模块加载时就有的
  `ownStartMs = Date.now() - process.uptime() * 1000`，标记 `unit: 'ms'`
- 其他 PID（锁竞争路径）保留 PowerShell 查询
- `staleLedgerLockOwner()` 只在同单位之间比较；`ms` 与 ticks 混用时保守判定「未过期」
- 两个 `ms` 身份用 2 秒容差比较，足以区分 PID 复用

效果：`ledgerLockOwner()` 1382ms → **0ms**。

## 文件

- `ledger-lock-owner.js.orig-1.9.7`：替换前的官方 1.9.7 原文件

## 应用方式（每次 pnpm install 后需重做）

```powershell
Copy-Item C:\dsh-ecosystem\external-repos\dsh-cost-meter\lib\ledger-lock-owner.js `
  C:\Users\Administrator\.dsh\profiles\web\node_modules\dsh-cost-meter\lib\ledger-lock-owner.js -Force
```

属主文件是 registry 包内容，`pnpm install` 会覆盖回官方版本。

## 上游

PR：<https://github.com/Han-1413141/dsh-cost-meter/pull/327>

合并发版后升级即可删除本地补丁。

## 回滚

```powershell
Copy-Item C:\dsh-ecosystem\patches\cost-meter-lock\ledger-lock-owner.js.orig-1.9.7 `
  C:\Users\Administrator\.dsh\profiles\web\node_modules\dsh-cost-meter\lib\ledger-lock-owner.js -Force
```
