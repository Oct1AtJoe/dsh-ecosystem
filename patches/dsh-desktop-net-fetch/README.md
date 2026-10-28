# 桌面壳转发层：把 `fetch` 换成 `net.fetch`

## 症状

桌面端跑长任务时，左下角反复「重新连接中 → 连接成功」，控制台：

```
GET dsh-app://app/plugins/events   net::ERR_FAILED 200 (OK)
[connection] connection lost, retry #1
```

**200 和 ERR_FAILED 同时出现**：Host 正常响应了，是响应流在转发层被掐断。
同时「给会话发排队消息显示发送中，要等几秒才队列上」。

## 根因

桌面端页面跑在 `dsh-app://app/` 下，除静态资源外所有 HTTP 都经主进程转发：

```
页面 → protocol.handle(SCHEME) → forwardWebRequest() → fetch(hostUrl) → Host
```

`forwardWebRequest`（`lib/main.js:8271`）用的是 **Node 全局 `fetch`，即 undici**。

undici 有连接级 `bodyTimeout`，默认 **`300_000ms`**，而且是**空闲计时器**：
每收到一个 body chunk 就重置。**静默超过 5 分钟，undici 直接销毁 socket。**

两个长连接频道正是「长期静默」型：

| 频道 | 何时才写数据 |
|---|---|
| `GET /plugins/events`（HMR） | 只有 rebuild 时 |
| `GET /plugins/dsh-status-rotator/events` | 只有状态变化时 |

跑任务时不改代码、状态也不变 → 静默 5 分钟 → undici 掐断 → Chromium 看到
`net::ERR_FAILED` → `EventSource` 无限重连 → 连接在开关之间抖动。

> 权威描述（`dsh-undici-timeout-fix` 上游文档）：
> "Node's built-in `fetch` runs on undici, whose connection-level `bodyTimeout`
> defaults to `300,000ms`. That timer is an *idle* timer: every body chunk resets it.
> A model that is busy prefilling sends no bytes at all, so undici destroys the
> socket the moment the five minutes run out."

**这解释了全部现象**：

- **「偶尔」重连** —— 要等满 300 秒才触发
- **跑任务时才犯** —— 任务跑得久；不跑任务 5 分钟内到不了阈值
- **梯子无关** —— 改系统代理 / 关 TUN 都没用，本机 `127.0.0.1` 也不走代理
- **插件无关** —— 禁用 `dsh-smooth-stream` 无效，别人机器同样插件不犯
- **队列消息卡顿** —— 同一转发层的连接槽被泄漏的连接占着

## 为什么 WebSocket 没事

WebSocket 根本不走转发层。壳在 `boot` IPC 返回 `streamBaseUrl`
（`main.js:12432`），客户端据此**直连** `ws://127.0.0.1:<port>/api/remote.mux`
（`api/gateway/src/client/stream-client.ts:507`）。

**SSE 没走这条路**，所以它被 undici 的超时打死。

## 修法

一处改动，`lib/main.js:8296`：

```diff
- const response = await fetch(target, init);
+ const response = await net.fetch(target, init);
```

`net` 该文件第 8 行已 import（`connectDesktopWelcome` 早就在用 `net.fetch`）。

### 为什么是 `net.fetch` 而不是别的

| 方案 | 问题 |
|---|---|
| 给 undici 设 `bodyTimeout: 0` | 要改全局 dispatcher，影响壳内所有 Node 请求；且 `forwardWebRequest` 用的是全局 `fetch`，没有现成的 dispatcher 可传 |
| 保留 SSE 传输层头 | **验证过无效**：Node 侧剥不剥 `transfer-encoding` 读流行为完全一致 |
| 每个 SSE 加心跳 | 要改官方 Host 代码，进不了 asar |
| **`net.fetch`** | **走 Chromium 网络栈**，与 `protocol.handle` 天然配套；无 undici 计时器；流桥接正确；顺带尊重系统代理 |

> Electron 官方文档：`protocol.handle` 的 handler 应返回 `net.fetch` 的响应。
> Node `fetch` 与 `net.fetch` 是**两套完全不同的网络栈**（libuv vs Chromium）。

## ⚠ 已知风险（必须知道）

`init` 里带 Node 专有选项，换栈后行为需实机确认：

```js
const init = { method, headers, body: request.body, signal, duplex: 'half', redirect: 'manual' };
```

- `duplex: 'half'` —— undici 专用，Chromium 的 fetch 无此概念
- `body: request.body` —— 是 `ReadableStream`；undici 需要 `duplex` 才接受流式 body

**这两个只影响带 body 的请求（POST 等）**。SSE 是 GET，无 body，不受影响。
若重启后发现 RPC/提交类操作异常，先 `--revert` 再排查，不要硬留。

## 文件

| 文件 | 作用 |
|---|---|
| `patch.mjs` | `apply` / `--check` / `--revert`，幂等 |
| `verify.mjs` | 三层判据：独有符号 + 落在 `forwardWebRequest` 函数体内 + `node --check` |
| `lib/rules.mjs` | 纯文本变换规则 |
| `main.js.orig-0.2.1-rc.3` | 原始备份，回滚用 |

## ⚠ 前置与生效

- **前置：`desktop-menu` 补丁**。它把 `lib/main.js` 摊成 `app.asar.unpacked`，
  本补丁只改那个磁盘文件，**不重写 asar 头**。
- **打完必须完全退出并重启 DSH 桌面端**（托盘退出，不是关窗口）。

## 用法

```powershell
node C:\dsh-ecosystem\patches\dsh-desktop-net-fetch\patch.mjs --check
node C:\dsh-ecosystem\patches\dsh-desktop-net-fetch\patch.mjs
node C:\dsh-ecosystem\patches\dsh-desktop-net-fetch\verify.mjs
node C:\dsh-ecosystem\patches\dsh-desktop-net-fetch\patch.mjs --revert
```

换安装路径：`$env:DSH_MAIN_JS = 'D:\other\...\lib\main.js'`

## 判据说明（踩过的坑）

**不能用括号计数判语法。** 原文件里字符串、正则、注释本就含不平衡括号
（实测 orig 开 12463 / 闭 12471），一律误判。必须 `node --check`。

**不能用 Node 侧读流实验验证。** 剥不剥 `transfer-encoding`，Node `fetch` 都读到
同样的字节数 —— 问题出在 **Chromium 的协议层**，Node 侧测不出来。

## 升级注意

`E:\dshDesktop` 升级会整体替换 `app.asar`，本补丁**全部丢失**，必须重打。
顺序：`desktop-menu`（前置）→ 其它补丁。重打前先 `--check` 确认锚点还命中。
锚点漂移说明官方改过 `forwardWebRequest`，要重新核对再改规则。

## 与上游的关系

- Electron issue [#47097](https://github.com/electron/electron/issues/47097)
  「SSE requests forwarded using protocol.handle and net.fetch cannot be properly closed」
  —— 同区域缺陷，截至 Electron 44.7.0 仍 OPEN。本补丁换栈可缩小其影响面。
- 同类问题在上游 DSH 的 LLM 出口也有：`dsh-undici-timeout-fix` 插件
  用 `setGlobalDispatcher(new Agent({ bodyTimeout: 0 }))` 解决**模型请求**那一条路径。
  本补丁解决的是**桌面壳转发层**，两者不重叠。
