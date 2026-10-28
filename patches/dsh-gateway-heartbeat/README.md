# 放宽网关 WebSocket 心跳阈值

## 症状

桌面端跑长任务时，左下角偶发「重新连接中 → 连接成功」闪一下。
http 请求、SSE 频道都正常，只有 WebSocket 反复重建。

## 根因

`@deepseek-ai/dsh-api-gateway` 的 `RemoteStreamMuxServer.startHeartbeat()`：

```js
const missed = this.missedHeartbeats.get(socket)
if (missed >= MAX_MISSED_HEARTBEATS) { socket.terminate(); continue }
this.missedHeartbeats.set(socket, missed + 1)   // ← 每发一次 ping 就 +1
socket.ping()
```

`missed` 每次发 ping 都自增，只有收到 pong 才清零（`alive()` 回调）。

| 常量 | 值 |
|---|---|
| `MAX_MISSED_HEARTBEATS` | **2** |
| `heartbeatIntervalMs` | 2000 |

→ **容错窗口只有约 6 秒**。

Electron 的 pong 由 Chromium 网络进程自动回复。该进程同时处理两条 SSE
与渲染负载时偶尔慢一拍，服务端就 `terminate()`。被 terminate 后客户端只能
看到 close code **1006**（无 close 握手），`ConnectionController` 随即重连。

这也解释了官方 UI 的两个常量：`CONNECTING_MIN_VISIBLE_MS = 800`、
`RECOVERY_CONFIRMATION_MS = 2000` —— 设计上就预期会有这种极短的重连。

## 修法

一处常量：

```diff
- const MAX_MISSED_HEARTBEATS = 2;
+ const MAX_MISSED_HEARTBEATS = 10;
```

容错窗口 **6 秒 → 30 秒**。仍能回收真正僵死的连接，但不会因一次网络进程
抖动就杀掉健康连接。

## ⚠ 与其它补丁的本质区别

前面几个补丁改的是 `lib/main.js`（已被 `desktop-menu` 摊到 unpacked）。
**本补丁改的是 asar 里一个此前未解包的官方包**，走同一手法：

1. 把目标文件正文写到 `app.asar.unpacked/dsh/node_modules/.../stream-server.js`
2. 把 asar 头里对应条目改为 `{ size, unpacked: true, integrity } `
3. 数据区**一个字节都不移动**（头部 JSON 等长填充）

所以**必须能写 asar**，即桌面端完全退出。运行中会报「文件正由另一进程使用」。

## 文件

| 文件 | 作用 |
|---|---|
| `patch.mjs` | `apply` / `--check` / `--revert` / `--dry-run`，幂等 |
| `verify.mjs` | 双层判据：独有符号 + asar 头确实标了 unpacked |
| `lib/rules.mjs` | 替换规则（命中数必须恰好 1） |
| `lib/asar.mjs` | asar 头读写（复制自 `desktop-menu`，同一套已验证实现） |

## 用法

```powershell
# 1. 先完全退出 DSH 桌面端（托盘退出，不是关窗口）
# 2. 再打补丁
cd C:\dsh-ecosystem\patches\dsh-gateway-heartbeat
node patch.mjs --check
node patch.mjs
node verify.mjs
```

回滚：

```powershell
node patch.mjs --revert
```

## 判据说明

- **必须验 asar 头**：只写磁盘文件不改头，Electron 仍读包内副本，等于没打。
  `verify.mjs` 会同时检查 `entry.unpacked === true`。
- `PATCH_MARK` 写在文件首行，用于幂等判断与版本追溯。

## 升级注意

`E:\dshDesktop` 升级会整体替换 `app.asar`，本补丁**全部丢失**，必须重打。
重打前先 `--check`；若报「already unpacked but is not this patch」，
说明官方已把这个包改成 unpacked（极罕见），需人工核对。

## 已知局限

这是**调参**，不是消除竞态。若 30 秒仍不够（极端负载），可再调大，
但要注意：阈值过大时，真正僵死的连接会占用 mux 资源更久。
更彻底的做法是让服务端只在**连续**未收到 pong 时计数，而非每次 ping 自增，
但那需要改动心跳状态机本身，风险高于调常量。
