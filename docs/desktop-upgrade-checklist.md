# DSH 桌面端（dshDesktop）升级清单

> **每次升级 `E:\dshDesktop` 后按此单核对。**
> 与 `upgrade-<版本>-checklist.md` 不同：那些是一次性迁移记录，本文件**长期有效**，
> 每升级一次都要重走一遍。
>
> 核心原则：桌面端升级会替换 `app.asar`，其中打包的官方包版本可能变动。
> 凡是我们以 `link:` 覆盖过的官方包，都要检查版本是否还对得上。

---

## 0. 升级前

- [ ] 记录当前可用状态：现有 profile 能正常启动、界面无异常
- [ ] 备份 profile 清单：
      ```powershell
      Copy-Item C:\Users\Administrator\.dsh\profiles\desktop\package.json `
                C:\dsh-ecosystem\archive\profile-desktop-package.json.bak -Force
      ```
- [ ] 记录当前固化包版本（见 §2 表格），供升级后比对

---

## 1. 升级后先做基础连通检查

- [ ] 启动 DSH，确认能进主界面
- [ ] **看控制台**：若出现 `web boot: N entries did not activate` 或
      `slot entry crashed in '<slot>'`，说明某个包契约不匹配 —— 多半是 §2 的固化包版本错位
- [ ] 打开一轮对话，确认聊天区正常渲染、输入框可用

> 🚨 **不要跳过这一步直接去用。** 固化包版本错位会让**整块聊天界面**白屏或崩掉，
> 而症状很容易被误判成"DSH 自身坏了"。

### 启动失败时：先读崩溃日志，别信对话框

弹「The application could not start」时，**对话框文案经常是笼统的、甚至残留成上一次的错误**。
真话只在这里：

```
%APPDATA%\@deepseek-ai\dsh-desktop\logs\crash-<时间戳>-host.log
```

看 `--- host diagnostic ---` 段的第一行。已踩过的两种「启动失败」，症状一样、根因无关：

| 日志里的真话 | 根因 | 处理 |
|---|---|---|
| `Unexpected token '', "... is not valid JSON` | profile 清单带 UTF-8 BOM | `patches/dsh-host-profile-bom` |
| `desktop welcome: Web authentication failed` + 约 70 个 `dsh-auth-*` cookie | Cookie 头撑爆 Node 16 KiB → 431 | `patches/dsh-desktop-cookie-prune` |

> 🚨 界面上的「Disable third-party plugins, back up profile patch, and restart」
> 会改 profile patch、把 bundle 重置成核心集 —— 对上面两种都不是解法，**误伤**。

---

## 2. 核对固化包（vendored patches）版本

当前固化包清单：

| 包 | 固化版本 | 覆盖原因 |
|---|---|---|
| `@deepseek-ai/dsh-client-ui-chat` | `0.2.1-rc.5` | 「本轮用量」悬浮窗补回 TPS 行与「首字用时」行 |
| `dsh-tabbit` | `0.4.0` | 中文 Windows 安装探测（见 §4.2） |

目录：`C:\dsh-ecosystem\packages\<包名>-patched\`

### 2.1 查 asar 里的新版本

`app.asar` 是归档，不能直接读文件。两种查法：

**方法一：从 asar 头部目录表解（快，只查版本）**

```powershell
$asar = "E:\dshDesktop\resources\app.asar"
$bytes = [System.IO.File]::ReadAllBytes($asar)
$headerSize = [BitConverter]::ToUInt32($bytes, 12)
$json = [System.Text.Encoding]::UTF8.GetString($bytes, 16, $headerSize)
# 找目标包的 package.json 条目，再用 offset 取出内容
$json.IndexOf('"dsh-client-ui-chat"')
```

**方法二：用 asar 工具解出（准，可查内容）**

```powershell
npx @electron/asar extract "E:\dshDesktop\resources\app.asar" C:\dsh-ecosystem\.tmp\asar-check
# 然后直接读
$py = "C:\Users\Administrator\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
& $py -c "import json,io; d=json.load(io.open(r'C:\dsh-ecosystem\.tmp\asar-check\node_modules\@deepseek-ai\dsh-client-ui-chat\package.json',encoding='utf-8')); print(d['version'])"
```

### 2.2 按结果分支处理

- [ ] **版本一致** → 通常可继续用，跳到 §3
- [ ] **版本不一致** → 按下面顺序：

#### 分支 A：先查官方是否已自带该补丁（最省事，优先）

在解出的 asar 里搜补丁的**独有符号**：

```powershell
$f = "C:\dsh-ecosystem\.tmp\asar-check\node_modules\@deepseek-ai\dsh-client-ui-chat\lib\client.js"
$c = Get-Content $f -Raw
"deriveTurnMetrics : $($c.Contains('deriveTurnMetrics'))"
```

> 🚨 **本分支只看固化包自己的补丁符号，与官方版本号无关。**
> 2026-10-30 rc.5 升级实测：asar 版本从 `rc.3` 跳到 `rc.5`，但官方**仍未**自带
> `deriveTurnMetrics` / `message.turnUsage.ttft`。版本号变了不代表补丁被官方吸收。
> 判据永远是下面这条 grep 的结果。

- [ ] 若结果是 `True` → **官方已经加回来了**。
      直接删除固化包与 profile 依赖，回官方版：
      ```powershell
      # 1. 从 profile 删掉这条依赖
      #    删 C:\Users\Administrator\.dsh\profiles\desktop\package.json 里的
      #    "@deepseek-ai/dsh-client-ui-chat": "link:..."
      cd C:\Users\Administrator\.dsh\profiles\desktop
      node ...\pnpm\bin\pnpm.mjs install --no-frozen-lockfile
      # 2. 确认 TPS 行仍在（对话结束后点数据库图标）
      # 3. 确认无误后删掉 C:\dsh-ecosystem\packages\ui-chat-patched
      ```

> 🚨 **判据必须用补丁独有符号，不能用 locale 文案键。**
> `stats.dialog.speed` 这类键在官方字典里本来就有（别处也复用），
> grep 到它 **不代表** TPS 行会渲染。曾因此误判过一次。

#### 分支 B：官方没有 → 重打补丁

- [ ] 在 `E:\vibeCoding\deepseek-harness` 里切到新版本 tag：
      ```powershell
      git fetch upstream --tags
      git checkout dsh-v<新版本>          # detached HEAD，不动 master
      git checkout master -- packages/client/ui-chat/src/ packages/client/ui-chat/tests/
      ```
- [ ] 重建（`tsc` 必须 exit 0，**不许**「有报错但 emit 了就放过」）：
      ```powershell
      cd E:\vibeCoding\deepseek-harness\packages\client\ui-chat
      $env:NODE_OPTIONS=""
      node E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc -p tsconfig.json
      node E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs --config tsdown.config.ts
      ```
- [ ] 重新固化到 `C:\dsh-ecosystem\packages\ui-chat-patched`：
      只拷 `lib/index.js` / `lib/client.js` / `lib/types/**/*.d.ts` / `locale/*.json`
      （**不拷** `src/`、`*.map`、`tsconfig`）
- [ ] `package.json` 只改两处：
      - `version` → 与 asar 内新版本一致
      - `peerDependencies["@deepseek-ai/cordis"]` → `~4.0.5`
        （源码里是 `workspace:~`，profile 解析不了；profile 的
        `pnpm-workspace.yaml` 已设 `autoInstallPeers: false`，不会触发下载）
- [ ] 验证补丁符号：`deriveTurnMetrics` ≥ 2、`message.turnUsage.ttft` ≥ 3
      （**不要**用 CSS 类名前缀或 locale 文案键当判据，会撞车）
- [ ] 更新 `VENDORED-FROM.md` 里的版本号与补丁提交
- [ ] 重启宿主验证（`link:` 已在则无需 `pnpm install`，但必须完整重启）
- [ ] 更新 §2 表格与本文件

---

## 3. 核对插件（`plugins/`）

- [ ] 插件都还能加载：设置 → 插件，看有没有红色失败项
- [ ] `ui-theme-custom`：主题切换、字号、右栏宽度、输入框挂件是否正常
- [ ] `dsh-git-panel`：Git 标签页、分支胶囊是否正常
- [ ] 若某插件报契约错误（`ctx.xxx is not a function`、类型不存在），
      按 `AGENTS.md` §4.4 的「契约变更」表适配

---

## 4. 出问题时的回滚

**最小回滚（只撤固化包）**

```powershell
# 从 profile 的 package.json 删掉 @deepseek-ai/dsh-client-ui-chat 那一行
cd C:\Users\Administrator\.dsh\profiles\desktop
node C:\Users\Administrator\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs install --no-frozen-lockfile
# 重启 DSH
```

**整份 profile 回滚**

```powershell
Copy-Item C:\dsh-ecosystem\archive\profile-desktop-package.json.bak `
          C:\Users\Administrator\.dsh\profiles\desktop\package.json -Force
cd C:\Users\Administrator\.dsh\profiles\desktop
node ...\pnpm\bin\pnpm.mjs install --no-frozen-lockfile
```

---

## 4.1 重打 asar 补丁（升级必丢）

> 🚨 **升级会整体替换 `app.asar`，`patches/` 下的补丁全部丢失。**
> 必须按顺序重打，`desktop-menu` 是前置（它把 `lib/main.js` 摊到 `app.asar.unpacked/`），
> 后面的补丁只改那个磁盘文件，不重写 asar 头。

```powershell
cd C:\dsh-ecosystem
# 前置：摊开 lib/main.js
node patches\desktop-menu\patch.mjs
# 其余按需
node patches\kanye-pet-electron\patch.mjs
node patches\dsh-gateway-heartbeat\patch.mjs
node patches\dsh-desktop-net-fetch\patch.mjs
node patches\dsh-desktop-window-state\patch.mjs
node patches\dsh-desktop-cookie-prune\patch.mjs
node patches\dsh-host-profile-bom\patch.mjs
node patches\dsh-boot-spinner-corner-shape\patch.mjs
# 每个都必须 verify exit 0
node patches\dsh-desktop-window-state\verify.mjs
node patches\dsh-desktop-cookie-prune\verify.mjs
node patches\dsh-host-profile-bom\verify.mjs
node patches\dsh-boot-spinner-corner-shape\verify.mjs
```

### 补丁清单

| 补丁 | 作用 | 前置 |
|---|---|---|
| `desktop-menu` | 应用菜单与托盘加「刷新页面」「重启应用」；摊开 `lib/main.js` | — |
| `kanye-pet-electron` | 注入透明置顶宠物窗与 IPC 桥 | `desktop-menu` |
| `dsh-gateway-heartbeat` | 网关心跳修复 | `desktop-menu` |
| `dsh-desktop-net-fetch` | `dsh-app://` 转发改用 `net.fetch`（Chromium 网络栈），修 SSE 空闲超时断连 | `desktop-menu` |
| `dsh-desktop-window-state` | 主窗口位置/大小/最大化状态跨重启记忆 | `desktop-menu` |
| `dsh-desktop-cookie-prune` | 握手前清失效的 `dsh-auth-*` cookie，修 431 启动崩溃 | `desktop-menu` |
| `dsh-host-profile-bom` | 剥离 profile 清单的 UTF-8 BOM，修 `JSON.parse` 崩溃 | — |
| `dsh-boot-spinner-corner-shape` | 给 boot 页进度环 `::after` 补 `corner-shape: round`，修「启动页转圈圆环变方框」 | — |

> `dsh-boot-spinner-corner-shape`：桌面端冷启时 boot 页「Loading plugins…」上方那个进度环
> 四角被削平、像方框在转。只在支持 `corner-shape` 的引擎上复现（Chromium >= 155），
> 所以桌面端必现，老浏览器看 `dsh web` 正常。
> 根因是官方 `ui-theme` 的 `corner-shape.css` 通配把 `superellipse(1.5)` 刷到了 `::after`，
> 而 `border-radius: inherit` 传不了形状。详见 `patches/dsh-boot-spinner-corner-shape/README.md`。
> 🚨 判据**不要**用类名 `_spinner_<hash>`，哈希随版本变；用补丁独有符号。

> `dsh-host-profile-bom`：桌面端启动报「could not start」且日志里是
> `Unexpected token '', "... is not valid JSON` 时命中。与 `desktop-menu` 无前置关系。
> 详见 `patches/dsh-host-profile-bom/README.md`，内含剥 BOM 的紧急手救命令。

> `dsh-desktop-cookie-prune`：桌面端启动报 `desktop welcome: Web authentication failed` 时，
> 大概率是 `dsh-auth-*` cookie 攒了约 70 个把请求头撑爆（Node 16 KiB 上限 → `431`）。
> 详见 `patches/dsh-desktop-cookie-prune/README.md`，内含紧急手救 SQL。

> `dsh-desktop-window-state` 的状态文件是 `%APPDATA%\@deepseek-ai\dsh-desktop\desktop\window-state.json`。
> 窗口跑到屏幕外打不开时，删掉该文件即可回到默认 1280×820。
> 读取时会用 `screen.getAllDisplays()` 校验：落在任何屏幕 `workArea` 之外的坐标一律丢弃。

> ⚠️ 别和 `%APPDATA%\ai.deepseek.harness.desktop\window-geometry.json` 搞混：那是**已弃用的 Tauri 壳**留下的，
> 当前 Electron 端从不读写它。Electron 端的 userData 是 `%APPDATA%\@deepseek-ai\dsh-desktop`。

> ⚠️ `--revert` 只对本补丁做纯文本逆操作，**不会**回写任何 `main.js.orig-*` 备份 ——
> 那些备份是原始未打补丁的文件，回写会连带冲掉 `desktop-menu` 等兄弟补丁。

---

## 4.2 `dsh-tabbit` 安装探测补丁

> 这个包**不在 asar 里**，走 profile junction 指向 `packages/dsh-tabbit-patched`，
> 所以桌面端升级**不会**动它。判据只有一条：真跑一次探测。

```powershell
node --input-type=module -e "import('file:///C:/dsh-ecosystem/packages/dsh-tabbit-patched/lib/installer/detect.js').then(async m=>console.log('installations=' + (await m.detectTabbitInstallations()).installations.length))"
```

`installations` 非空（本机为 `1`，`edition: "domestic"`）= 正常。
`0` = 固化包被 `pnpm install` 覆盖回官方版，按
`packages/dsh-tabbit-patched/VENDORED-FROM.md`「依赖解析」一节重建 junction。

> ⚠️ `patches/dsh-tabbit-registry-identity/verify.mjs` 曾因 `MARKER` 与包内实际实现脱节
> 而误报 `symbolHits: 0`（找的符号是 `windowsIdentityOf`，包里实际是
> `WINDOWS_DISPLAY_NAMES.get(record.registryKey?.split(...))` 回退）。
> **判据以上面这条真实探测为准，不要看 verify 的符号命中数。**

---

## 4.3 官方 checkout（`E:\vibeCoding\deepseek-harness`）的定位

> **2026-10-30 起，该 checkout 是「纯参考源码」，本地补丁已全部清空。**

| 事实 | 值 |
|---|---|
| 位置 | `E:\vibeCoding\deepseek-harness` |
| 状态 | 与 `upstream/master` **完全对齐**（0 ahead / 0 behind），工作区干净 |
| 用途 | 只读参考 + 插件构建期的类型来源（25 个 junction 指向它的 `packages/*`） |
| **不再承担** | 起 `dsh web` 服务、承载本地补丁 |

### 为什么可以清空

桌面端跑 `app.asar` 自带的 runtime，**不经过这个 checkout**。
原先的 12 类本地补丁，去向已逐条落定：

| 原补丁 | 去向 |
|---|---|
| TPS / TTFT（§12） | **已固化**进 `packages/ui-chat-patched` |
| 单波浪号 markdown | **上游已自带** `singleTilde` |
| ui-chat 视图跳转、ui-layout 右栏宽度、llm-pi-ai `sessionHeader`、session-query `borrow()` | 桌面端不需要（仅 checkout dev 可见） |
| `--no-open` 默认不弹浏览器 | 桌面端不跑 `dsh web` |
| `start-dsh-web.ps1` / `stop-dsh-web.ps1` | 已弃用，已归档 |
| `const enum` → `enum` | 上游 tsdown 已能解析 |
| **WER 对话框抑制 / `SetErrorMode`** | ⚠️ **上游至今没有，见下方警示** |

### ⚠️ 唯一需要在跑服务时手工恢复的能力

`packages/sandbox/sandbox-policy` 的 `suppressCrashDialogs` 与
`packages/subprocess/win32-process` 的 `SetErrorMode` 绑定 —— **上游没有**。
它在 Windows 上抑制工具进程崩溃时弹出的 WER 对话框。

- **桌面端：不需要**（asar 自带 runtime，不经过 checkout）
- **哪天要在 checkout 里跑 `dsh web`：需要手工重贴**

重贴依据（不是直接 apply 那个过期 patch，上下文已漂移）：

```
C:\dsh-ecosystem\archive\checkout-local-20261030-110624\LOCAL-CHANGES.md   §1、§2
```

### 存档与恢复路径（三重冗余）

| 层 | 位置 |
|---|---|
| 本地 tag | `local/rc2-patches-20261030-110020` → `ee926e3ff4` |
| 本地 bundle | `archive/local-fork-6commits-20261030-110020.bundle`（235 MB，verified） |
| 远端分支 | `Oct1AtJoe/deepseek-harness` → `local/rc2-patches-20261030` |
| 可读补丁 | `archive/checkout-local-20261030-110624/local-6commits.patch`（172 KB） |
| 补丁说明 | `archive/checkout-local-20261030-110624/LOCAL-CHANGES.md` |
| 弃用脚本 | `archive/checkout-local-20261030-110624/start-dsh-web.ps1` 等 |

恢复整条历史：

```powershell
cd E:\vibeCoding\deepseek-harness
git reset --hard local/rc2-patches-20261030-110020
```

> 🚨 **恢复后 checkout 就回到「有本地补丁」状态**，与上游不再对齐。
> 只在确实要跑服务、且已确认 WER 抑制缺失会造成问题时才这么做。

### 若将来又要对齐上游

不要再 `reset --hard`（会丢补丁）。正确姿势是三方合并：

```powershell
git checkout -b sync/upstream-<日期>
git merge upstream/master
```

2026-10-30 实测：38 个本地文件与上游**全部**有交集，真实内容冲突 4 个
（`use-chat-viewport.ts`、`markdown/parse.ts`、`markdown.client.spec.tsx`、`sandbox-policy/index.ts`），
其余 34 个可自动合并。合并前建议先用 `git merge-tree --write-tree HEAD upstream/master` 零副作用试算。

---

## 5. 升级后必须重启

> 🚨 **`Ctrl+F5` 不够。** 宿主在**启动时**解析并缓存每个插件的 `client.js` 路径
> （`client-modules` 的 `resolveMeta` / `pkgMeta`）。
> 升级后必须完整重启 DSH（托盘右键「重启服务与客户端」或重启程序），
> 否则拿到的还是旧路径。
>
> 重启**之后**再改插件源码就不用重启了 —— HMR watcher 每 500ms 轮询 bundle stat，
> 变化时通过 SSE 推送新 graph，「重新构建 + Ctrl+F5」即可。
> 但**改 `package.json` / `cordis.patch.yml` 仍要重启**（属启动期配置，不走 HMR）。

---

## 相关文档

- [AGENTS.md](../AGENTS.md) §6 —— 覆盖官方包的机制与固化规范
- [packages/ui-chat-patched/VENDORED-FROM.md](../packages/ui-chat-patched/VENDORED-FROM.md) —— 该固化包的详细说明
- [archive/checkout-local-20261030-110624/LOCAL-CHANGES.md](../archive/checkout-local-20261030-110624/LOCAL-CHANGES.md) —— 12 类本地补丁的原始说明（checkout 已清空，此文件为唯一留存）
