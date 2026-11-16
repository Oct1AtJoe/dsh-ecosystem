# 桌面壳：清理失效的 `dsh-auth-*` cookie（修 431 启动崩溃）

## 症状

桌面端点开就弹「DeepSeek Harness is unavailable」，日志只有一行：

```
Error: desktop welcome: Web authentication failed
    at connectDesktopWelcome (file:///E:/dshDesktop/resources/app.asar/lib/main.js:8890:31)
```

- **Host 本身是健康的**：日志里 `dsh web: http://127.0.0.1:<随机端口>/?token=...` 正常打印，
  用 curl 直接请求那个 URL 也能拿到 `303` + `set-cookie`。
- 「禁用第三方插件」「重装」「重置 profile」全都无效 —— 因为跟插件无关。
- 界面上的「Disable third-party plugins, back up profile patch, and restart」按钮不但没用，
  还会把 profile patch 改名、bundle 重置成核心集，属于**误伤**，别点。

## 根因

**`Cookie` 请求头超过 Node HTTP 默认 16 KiB 上限 → Host 回 `431` → 壳把 431 报成认证失败。**

链条（官方 discussion
[#9924](https://github.com/deepseek-ai/deepseek-harness/discussions/9924)
与 [discussioncomment-19276392](https://github.com/deepseek-ai/deepseek-harness/discussions/9924#discussioncomment-19276392)
同因；本机已实测复现 `HTTP 431`）：

1. Host 每次以 `--port 0` 启动 → **端口随机**；
2. `packages/client/connection/src/browser-auth.ts` 的 cookie 名 =
   `dsh-auth-` + `sha256(authority)`，而 `authority` 是 `host:port`
   → **每个新端口都是一个新 cookie 名**；
3. cookie 存活 30 天（`Max-Age=2592000`），Electron 持久化，**壳从不清理**；
4. Chromium 发 `Cookie` 头时**不看端口**，`127.0.0.1` 名下所有 cookie 一起发；
5. 攒到约 70 个后，`Cookie` 头超过 Node 的 16 KiB 默认上限
   → Host 回 `HTTP/1.1 431 Request Header Fields Too Large`；
6. `connectDesktopWelcome()` 把所有非 2xx 一律当成认证失败，
   于是真实状态码 431 被吞掉，用户只看到「认证失败」，完全无从下手。

本机实测（2026-10-30）：

```
cookieCount        71      # 全部是 127.0.0.1 的 dsh-auth-*
localhostBytes     16117   # name+value+2，合计约 16.1 KB
uniqueNames        71      # 名字各不相同（每个端口一个）
status             431     # connectDesktopWelcome 收到的真实响应
```

> 失败的那次启动**不会再写新 cookie**（请求在 set-cookie 之前就被 431 拒了），
> 所以计数是稳定的，不会因为反复重启而无限增长；但也永远自愈不了。

## 修法

本补丁做两件事（`lib/rules.mjs`）：

1. **进欢迎握手前清掉本 Host 已失效的 `dsh-auth-*` cookie**；
2. **把真实 HTTP 状态补进报错**（`... (HTTP 431 at http://127.0.0.1:xxxx)`），
   下次再遇到类似问题能一眼看出不是认证问题。

清旧 cookie 是安全的：签名载荷里带 `authority`（`host:port`），
`isAuthenticated` 会校验 authority 相符。**换过端口之后，旧 cookie 永远验不过**，
纯属死重 —— 留着只会继续撑大请求头。

> 没有选择「提高 `maxHeaderSize`」或「缩短 `cookieMaxAgeDays`」：
> 前者只是把墙推远，后者延长窗口但治不了本。两条都记在讨论区的候选清单里，
> 真正干净的是不让死 cookie 堆起来。

## 打补丁

> 🚨 **必须先完全退出 DSH 桌面端**（托盘右键退出，不是关窗口）。
> 🚨 **`desktop-menu` 是前置**：它把 `lib/main.js` 摊到 `app.asar.unpacked`，
> 本补丁只改那个磁盘文件，不重写 asar 头。

```powershell
cd C:\dsh-ecosystem\patches\dsh-desktop-cookie-prune
node --test tests\rules.test.mjs     # 7/7，判据自检
node patch.mjs --dry-run             # 期望 patchedBytes ≈ 527315（rc.5 实测）
node patch.mjs
node verify.mjs                      # 期望 "ok": true
```

`verify.mjs` 的三条判据：

| 判据 | 含义 |
|---|---|
| `symbolHits === 1` | `pruneStaleHostCookies` 函数体存在且唯一 |
| `pruneBeforeWelcome` | 清理调用排在欢迎握手**之前** |
| `statusReported` | 报错已带 HTTP 状态，且旧的笼统报错已消失 |

`syntaxOk` 由 `node --check` 保证：改完的模块必须还能解析。

## 升级桌面端后

`app.asar` 被整体替换 → `app.asar.unpacked/lib/main.js` 一起被重写 → **本补丁丢失，需重打**。
重打前先 `node patch.mjs --dry-run`：`wouldChange: true` 且不报 `anchor not found` 才继续。
锚点漂移时 `applyRules` 会**抛错而不是写半截文件**。

> 若官方某版本已自带修复（判据：asar 内 `connectDesktopWelcome` 是否还吞状态码 /
> 是否在握手前清理 cookie），则**删掉本补丁目录并 `--revert`**，回官方版。

## 回滚

```powershell
cd C:\dsh-ecosystem\patches\dsh-desktop-cookie-prune
node patch.mjs --revert      # 从 live 文件撤，安全
```

`main.js.pre-cookie-prune` 只是最后手段的整份快照（它已含兄弟补丁，
恢复它会把 cookie-prune 之后的所有改动一起回退），**不要**用它来单独回滚本补丁。

## 紧急手救（补丁没打上、又急着用）

完全退出 DSH 后，删掉本机累积的认证 cookie 即可启动：

```powershell
# 1. 备份
Copy-Item "$env:APPDATA\@deepseek-ai\dsh-desktop\Network\Cookies" `
          "$env:APPDATA\@deepseek-ai\dsh-desktop\Network\Cookies.bak" -Force
```

```js
// 2. 只删 dsh-auth-*（Node 24 自带 node:sqlite）
node -e "const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync(process.env.APPDATA+'/@deepseek-ai/dsh-desktop/Network/Cookies');
db.exec(\"DELETE FROM cookies WHERE host_key='127.0.0.1' AND name LIKE 'dsh-auth-%'\");
db.exec('VACUUM'); db.close()"
```

3. 重新启动 → 会重新铸一个当前端口的 cookie，工作正常。

> 这只是清账，**不防复发**：再启动约 70 次又会满。要根治请打本补丁。

Cookie 库位置：

| 平台 | 路径 |
|---|---|
| Windows | `%APPDATA%\@deepseek-ai\dsh-desktop\Network\Cookies` |
| macOS | `~/Library/Application Support/@deepseek-ai/dsh-desktop/Cookies` |
| Linux | `~/.config/@deepseek-ai/dsh-desktop/Cookies` |

## 上游状态

截至 2026-10-30 官方 discussion #9924 仍无维护者回复，rc.5 代码未变。
本补丁是本地兜底，官方修复后应及时移除（见「升级桌面端后」）。
