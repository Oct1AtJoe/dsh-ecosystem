# DSH 桌面端 0.2.2-rc.5 升级后 · 补丁重打与 ui-chat 重建 执行手册（Runbook）

> 交给执行 Agent 使用。目标：把 0.2.2-rc.5 桌面端升级后丢失/失效的本地补丁恢复，并重建 ui-chat 固化包。
> 所有路径按本机：桌面端 App `E:/dshDesktop`；定制生态 `C:/dsh-ecosystem`；官方源码仓库 `E:/vibeCoding/deepseek-harness`。

---

## 0. 适用与硬前提（先读）

**现状（已核实）**
- 桌面端 `E:/dshDesktop/resources/app.asar` 内 `package.json` / `dsh/package.json` / ui-chat / dsh-api-gateway / dsh-app-boot 版本均为 **0.2.2-rc.5**。
- 升级整体替换了 `app.asar`，`patches/` 下的 asar 补丁**全部丢失**（`app.asar.unpacked` 中已无 `lib/main.js`）。
- 唯一需要“改代码”的是 `dsh-gateway-heartbeat`（已改靶），唯一需要“重建”的是 ui-chat 固化包。

**硬前提（否则会失败）**
1. **打 asar 补丁时必须完全退出 DeepSeek Harness**（托盘右键退出，不是关窗口）。运行期 `app.asar` 被独占，写入会报 EBUSY。
2. 🚨 若执行 Agent 本身运行在这个桌面端的 Host 里，它**无法**在“应用未退出”的情况下改 asar（退出就会终止该 Agent）。此时 Phase 1 必须在**外部 PowerShell** 或**不占用该 app 的会话**中执行：先退出桌面端，再在独立终端跑重打脚本，最后重启。
3. 工具链：Node（实测 v24.16）、PowerShell、pnpm 均在 PATH。执行前用 `node -v` 确认。

**禁止**
- 不要用 `rm` / `del` / `Remove-Item` 删目录；需要清理请归档（移入 `C:/dsh-ecosystem/archive/`）或走回收站。
- 不要跑全项目 `eslint --fix` 之类的全量修复。

---

## 1. Phase 0 · 预检（全部只读）

```powershell
# 1.1 进程：Phase 1 之前这里必须没有任何输出
Get-Process -Name 'DeepSeek Harness' -ErrorAction SilentlyContinue

# 1.2 asar 版本（应为 0.2.2-rc.5）
node --input-type=module -e "import {openArchive,readHeader,entryAt,readPacked} from 'file:///C:/dsh-ecosystem/patches/desktop-menu/lib/asar.mjs'; const a=openArchive('E:/dshDesktop/resources/app.asar',{readOnly:true}); const h=readHeader(a.fd); const e=entryAt(h.json,'package.json'); console.log('asar version=', JSON.parse(readPacked(a.fd,e,h.dataStart).toString('utf8')).version); a.close();"

# 1.3 源码仓库状态（记录分支，尽量保持干净）
git -C E:/vibeCoding/deepseek-harness status -sb
git -C E:/vibeCoding/deepseek-harness rev-parse --short HEAD

# 1.4 关键固化/依赖版本（记录基线）
node -e "const p=require('C:/Users/Administrator/.dsh/profiles/desktop/package.json'); console.log('ui-chat=',p.dependencies['@deepseek-ai/dsh-client-ui-chat']); console.log('dsh-tabbit=',p.dependencies['dsh-tabbit']); console.log('dsh-cost-meter=',p.dependencies['dsh-cost-meter']);"
```

期望：1.2 输出 `asar version= 0.2.2-rc.5`；1.4 中 ui-chat 是 `link:C:/dsh-ecosystem/packages/ui-chat-patched`、dsh-tabbit=`0.4.1`、dsh-cost-meter=`1.9.73`。

---

## 2. Phase 1 · 重打 asar 补丁（6 个，1 个已改靶）

> 前置：Phase 0 的 1.1 为空（桌面端已完全退出）。
> 顺序固定：desktop-menu 先（摊开 `lib/main.js`）；kanye 必须早于 window-state（它给 electron import 补 `screen`）；gateway 用改靶后的规则。

### 2.1 一键执行（推荐）

```powershell
powershell -ExecutionPolicy Bypass -File C:/dsh-ecosystem/patches/reapply-after-upgrade.ps1
```

该脚本会依次对下列 6 个补丁执行 `node patch.mjs` + `node verify.mjs`，任一步失败即中止：

| # | 补丁 | 期望 verify |
|---|---|---|
| 1 | patches/desktop-menu | 17 项全通过（含负向对照） |
| 2 | patches/kanye-pet-electron | 18 项全通过 |
| 3 | patches/dsh-desktop-net-fetch | 独有符号 `net.fetch(target, init)` 命中、落在 forwardWebRequest、`node --check` 通过 |
| 4 | patches/dsh-desktop-window-state | 6 项全 true（helpersInjected/boundsRestored/maximizedRestored/saveWired/closeFlushed/offScreenGuard） |
| 5 | patches/dsh-host-profile-bom | `{"ok": true}`（headerUnpacked、symbolHits>0、bareCallsLeft===0、namespacedCalls>0、syntaxOk、bomParses） |
| 6 | patches/dsh-gateway-heartbeat | `symbolHits:1` 且 `headerUnpacked:true`，`ok:true` |

### 2.2 手动等价命令（不信任脚本时逐步跑）

```powershell
$ErrorActionPreference='Stop'
function Run($d){ Push-Location "C:/dsh-ecosystem/$d"; try { node patch.mjs; if($LASTEXITCODE){throw "patch $d"}; node verify.mjs; if($LASTEXITCODE){throw "verify $d"}; Write-Host "OK $d" } finally { Pop-Location } }
Run 'patches/desktop-menu'
Run 'patches/kanye-pet-electron'
Run 'patches/dsh-desktop-net-fetch'
Run 'patches/dsh-desktop-window-state'
Run 'patches/dsh-host-profile-bom'
Run 'patches/dsh-gateway-heartbeat'
```

### 2.3 注意点
- `desktop-menu` 首次会生成官方原包备份 `E:/dshDesktop/resources/app.asar.orig-0.2.2-rc.5`，回滚靠它。
- **gateway 特例**：rc.5 把 `RemoteStreamMuxServer` 内联打进 `dsh-api-gateway/lib/index.js`（文件内可见 `//#region lib/types/stream-server.js`）。补丁 `TARGET` 已改为 `dsh/node_modules/@deepseek-ai/dsh-api-gateway/lib/index.js`，锚点 `const MAX_MISSED_HEARTBEATS = 2;` 在该文件**恰好 1 次**。
- 改靶后 asar 头 JSON 余量仅约 **4 字节**（实测可写入）。若 `patch.mjs` 抛 `header grew ... refusing to shift the data area`：执行 `node patch.mjs --revert` 后**停止并回报**（不要硬改），该项可暂缓（症状仅是长任务时偶发“重新连接中”闪一下，非阻断）。
- 若 kanye / window-state 报“lib/main.js 尚未被解包 / target missing”，说明 desktop-menu 没打成功，回到第 1 步。

---

## 3. Phase 2 · 重建 ui-chat 固化包到 0.2.2-rc.5

> 原因：asar 内 ui-chat=0.2.2-rc.5，而固化包 `packages/ui-chat-patched` 仍是 0.2.2-rc.3；官方 rc.5 仍不含 `deriveTurnMetrics` / `turnUsage.ttft` / `content-visibility`。版本错位有整屏聊天界面崩溃风险，必须按 rc.5 重建。
> 该 Phase 不占用 app.asar，可在桌面端运行时做；但**生效需重启宿主**。

- 上游 tag 已确认存在：`dsh-v0.2.2-rc.5` = `9c2670d3bce5275e0d1610272958121af87787bb`。
- 用**隔离 git worktree** 构建，不动主工作树。

### 3.1 一键执行（推荐）

```powershell
powershell -ExecutionPolicy Bypass -File C:/dsh-ecosystem/scripts/rebuild-ui-chat-rc5.ps1
```

### 3.2 手动等价步骤

```powershell
$ErrorActionPreference='Stop'
$H='E:/vibeCoding/deepseek-harness'; $W='E:/vibeCoding/deepseek-harness-rc5'
git -C $H fetch upstream --tags
git -C $H worktree add $W dsh-v0.2.2-rc.5      # 已存在则复用
Push-Location $W
pnpm install --no-frozen-lockfile
node --import tsx/esm scripts/generate-typert.ts      # 必须先跑，否则 */remote 类型缺失
git apply -3 C:/dsh-ecosystem/packages/ui-chat-patched/local-changes.patch
node C:/dsh-ecosystem/patches/chat-virtual-rows/apply.mjs
Set-Location packages/client/ui-chat
node ../../../node_modules/typescript/bin/tsc -b tsconfig.json     # 必须 exit 0
node ../../../node_modules/tsdown/dist/run.mjs --config tsdown.config.ts
Pop-Location
```

把产物拷回固化包（只拷运行时文件）：
```powershell
$src='E:/vibeCoding/deepseek-harness-rc5/packages/client/ui-chat'; $dst='C:/dsh-ecosystem/packages/ui-chat-patched'
Copy-Item "$src/lib/index.js","$src/lib/client.js" "$dst/lib/" -Force
Copy-Item "$src/lib/assets/*" "$dst/lib/assets/" -Recurse -Force
robocopy "$src/lib/types" "$dst/lib/types" *.d.ts /S /NFL /NDL /NJH /NJS | Out-Null
Copy-Item "$src/locale/*.json" "$dst/locale/" -Force
```

再手改 `C:/dsh-ecosystem/packages/ui-chat-patched/package.json` 三处：
- `version` → `0.2.2-rc.5`
- `peerDependencies["@deepseek-ai/cordis"]` → `~4.0.5`（源码是 workspace:~，profile 解析不了）
- 删除 `dependencies` 与 `devDependencies` 整块

更新 `packages/ui-chat-patched/VENDORED-FROM.md` 的版本/基线 commit/补丁列表。

### 3.3 验收符号（`lib/client.js` 必须命中）
```powershell
node -e "const s=require('fs').readFileSync('C:/dsh-ecosystem/packages/ui-chat-patched/lib/client.js','utf8'); const c=x=>s.split(x).length-1; console.log({deriveTurnMetrics:c('deriveTurnMetrics'), ttft:c('turnUsage.ttft'), contentVisibility:c('content-visibility'), version:require('C:/dsh-ecosystem/packages/ui-chat-patched/package.json').version});"
```
期望：`deriveTurnMetrics >= 2`、`ttft >= 3`、`contentVisibility >= 1`、`version === '0.2.2-rc.5'`。

> 收尾（可选，保持源码仓库干净）：`git -C E:/vibeCoding/deepseek-harness worktree remove E:/vibeCoding/deepseek-harness-rc5 --force`（确认产物已拷回后）。

---

## 4. Phase 3 · 退役项（建议仅标注，不删除）

以下两个补丁已被官方吸收，**无需再打**；是否清理由负责人确认后再做（归档而非删除）。

| 项 | 证据 | 处置 |
|---|---|---|
| `patches/dsh-tabbit-registry-identity` + `packages/dsh-tabbit-patched` | 官方 dsh-tabbit **0.4.1** 的 `lib/installer/detect.js` 已含 `?? WINDOWS_DISPLAY_NAMES.get(record.registryKey?.split('\\\\').pop() ?? '')`；探测 `installations=1` | 若清理：移入 `C:/dsh-ecosystem/archive/retired-2026-11-19/`；profile 已用官方 `dsh-tabbit:0.4.1`，无需重装 |
| `patches/cost-meter-lock` | 官方 dsh-cost-meter **1.9.73** 的 `lib/ledger-lock-owner.js` 已含 `ownStartMs` 与 `unit:'ms'` | 同上归档即可，无需动作 |

核对命令：
```powershell
node --input-type=module -e "import('file:///C:/Users/Administrator/.dsh/profiles/desktop/node_modules/dsh-tabbit/lib/installer/detect.js').then(async m=>console.log('installations='+(await m.detectTabbitInstallations()).installations.length))"
Select-String -Path 'C:/Users/Administrator/.dsh/profiles/desktop/node_modules/dsh-cost-meter/lib/ledger-lock-owner.js' -Pattern 'ownStartMs','unit:.ms' | Select-Object -First 4
```
期望：`installations=1`；cost-meter 命中 `ownStartMs` 与 `unit:'ms'`。

---

## 5. Phase 4 · 重启与验收

**重启桌面端**（确保 Phase 1 已全部 verify 通过）。然后逐项验收：

```powershell
# 4.1 启动日志无契约错误：看控制台/崩溃日志，不应出现
#     "web boot: N entries did not activate" 或 "slot entry crashed"
# 4.2 tabbit 探测
node --input-type=module -e "import('file:///C:/Users/Administrator/.dsh/profiles/desktop/node_modules/dsh-tabbit/lib/installer/detect.js').then(async m=>console.log('installations='+(await m.detectTabbitInstallations()).installations.length))"
```

人工验收清单：
- [ ] 应用菜单/托盘右键出现「刷新页面」「重启应用」两项。
- [ ] 桌面宠物窗出现、可拖拽、重启后位置保留。
- [ ] 主窗口位置/大小/最大化状态跨重启记忆（状态文件 `%APPDATA%/@deepseek-ai/dsh-desktop/desktop/window-state.json`）。
- [ ] 长任务运行时，左下角不再反复「重新连接中 ↔ 连接成功」（SSE 不抖动）。
- [ ] 聊天「本轮用量」悬浮窗显示「首字用时」与「输出速度（TPS）」两行。
- [ ] 打开一轮对话，聊天区正常渲染、输入框可用（证明 ui-chat 固化包未崩）。

---

## 6. 回滚

- **单个 asar 补丁**：`cd C:/dsh-ecosystem/patches/<名字>; node patch.mjs --revert`（只撤本补丁，不影响兄弟补丁）。
- **整包 asar 还原**：把官方备份复制回去
  ```powershell
  Copy-Item 'E:/dshDesktop/resources/app.asar.orig-0.2.2-rc.5' 'E:/dshDesktop/resources/app.asar' -Force
  ```
  并删除 `E:/dshDesktop/resources/app.asar.unpacked/lib` 下多出来的补丁文件。
- **ui-chat**：从 `C:/Users/Administrator/.dsh/profiles/desktop/package.json` 删掉
  `"@deepseek-ai/dsh-client-ui-chat": "link:C:/dsh-ecosystem/packages/ui-chat-patched"`，
  然后在 profile 目录 `pnpm install --no-frozen-lockfile`，重启。旧副本在 `C:/dsh-ecosystem/archive/ui-chat-patched-pre-0.2.2-*`。

---

## 7. 附录 A · 关键事实

- 桌面端版本：0.2.2-rc.5（`app.asar` 内全部包一致）。
- 上游 tag：`dsh-v0.2.2-rc.5` = `9c2670d3bce5275e0d1610272958121af87787bb`。
- gateway 改靶：`dsh/node_modules/@deepseek-ai/dsh-api-gateway/lib/index.js`；锚点 `const MAX_MISSED_HEARTBEATS = 2;` 恰好 1 次；改后头余量约 4 字节。
- api-gateway 在 asar 里有**两份**（`dsh/node_modules/...` 与根 `node_modules/...`，字节一致）。若 Phase 1 后运行仍抖动，说明加载的是另一份，需对根 `node_modules/@deepseek-ai/dsh-api-gateway/lib/index.js` 应用同一规则后重打。
- profile 依赖：ui-chat=link 固化包；dsh-tabbit=0.4.1；dsh-cost-meter=1.9.73。

## 8. 附录 B · 本次已生成的交付物（可直接用）

- `C:/dsh-ecosystem/patches/dsh-gateway-heartbeat/lib/rules.mjs`：TARGET 已改为 lib/index.js。
- `C:/dsh-ecosystem/patches/reapply-after-upgrade.ps1`：Phase 1 一键重打。
- `C:/dsh-ecosystem/scripts/rebuild-ui-chat-rc5.ps1`：Phase 2 一键重建。
- `C:/dsh-ecosystem/docs/upgrade-0.2.2-rc.5-adaptation.md`：逐补丁适配结论。

## 9. 变更记录

- 2026-11-19：首版 runbook；对应桌面端 0.2.2-rc.5 升级。
