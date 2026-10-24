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

---

## 2. 核对固化包（vendored patches）版本

当前固化包清单：

| 包 | 固化版本 | 覆盖原因 |
|---|---|---|
| `@deepseek-ai/dsh-client-ui-chat` | `0.2.1-rc.3` | 「本轮用量」悬浮窗补回 TPS 行与「首字用时」行 |

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
- `E:\vibeCoding\deepseek-harness\LOCAL-CHANGES.md` §12 —— TPS 补丁的六处改动
