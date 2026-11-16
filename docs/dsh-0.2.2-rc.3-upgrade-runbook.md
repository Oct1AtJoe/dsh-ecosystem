# DSH 0.2.2-rc.3 升级适配执行手册（Handoff Runbook）

> 面向接手执行的 agent。自包含：背景、精确版本锚点、现状、分阶段命令、判据、回滚。
> 工作区根 `C:\dsh-ecosystem`；官方 checkout `E:\vibeCoding\deepseek-harness`；桌面端 `E:\dshDesktop`。
> 通用规则以工作区 `AGENTS.md` 与 `~/.dsh/AGENTS.md` 为准（官方源码零修改、构建纯度、主题令牌、禁全项目 `--fix`、删除用 `trash_move`）。

## 执行结果（2026-11-16，Stage 0 / A / B / C / D / E 已完成，F 待发布）

- **Stage A 新根因**：`lib/asar.mjs` 的 `dataStart = 16 + jsonLength` 少了 **4 字节对齐**
  （0.2.2 的 `jsonLength=5669961` 非 4 对齐，数据区实际从 `16+5669964` 开始）。四个补丁
  自带的 `lib/asar.mjs` 同样有此 bug，已统一修成 `16 + align4(jsonLength)`。
- **`kanye-pet-electron`**：0.2.2 的 electron import 列表删了 `net`，锚点已更新。
- **🚨 `dsh-desktop-net-fetch`**：0.2.2 不再从 electron 导入 `net`，旧补丁把 `fetch` 改成
  `net.fetch` 后运行期 `net is not defined`，**所有 `dsh-app://` 转发失败 → 启动卡在
  `failed to load plugins/??@deepseek-ai/dsh-client-modules/client.js`**。已让补丁自带
  `import { net } from "electron";`，verify 增加 `netImported` 判据。
- **退役两个补丁**（官方 0.2.2 已自带）：`dsh-desktop-cookie-prune`（`removeLegacyHostCookies`）、
  `dsh-boot-spinner-corner-shape`（`corner-shape:round`）。目录保留，不再打。
- **`chat-virtual-rows`**：git patch 的 hunk 因相邻注释变化失效，`apply.mjs` 改为锚点插入。
- **Stage B**：ui-chat 在 0.2.2 上重建完成，基线 `dsh-v0.2.2-rc.3`；0.2.2 的 stat 弹窗已改
  CSS anchor 定位，原 JS 自适应定位补丁不再移植；locale 从 2 种变 8 种，`ttft` 键补全 8 份字典。
  重建前必须跑 `node --import tsx/esm scripts/generate-typert.ts`，否则 `*/remote` 声明缺失。
- **Stage C**：`dsh-tabbit` 已切 npm `0.4.1`，`detectTabbitInstallations()` 返回
  `edition: "domestic"`。
- **Stage D**：6 个插件里 5 个 `tsc` exit 0；`session-folders` 是手写 JS（无 tsconfig），只能运行时验证。
  `dsh-trash-guard` 补了 `@deepseek-ai/dsh-tools` junction + 类型导入，修完 exit 0（源码有改动，待发布）。
- **Stage E**：`theme-tech`、`deliverables` 已 `git mv` 到 `archive/retired-plugins-20261116/`，
  安装指南已同步删除条目。
- **验收**：补丁全打后桌面端可正常启动，无新 crash；`kanye-pet` 窗口正常；Tabbit 预检正常。

## 0. 目标与红线
目标：在 0.2.2-rc.3 运行环境恢复「asar 补丁全部生效 + 固化包版本对齐 + 本地插件可用」，且官方 checkout 保持 `git pull` 干净。

红线：
- 严禁修改官方 checkout 源码（只可 `git checkout/fetch` 切版本，工作区保持干净）。
- 打 asar 补丁前必须完全退出 DSH 桌面端（托盘退出并在任务管理器确认无 `DeepSeek Harness.exe`）；`desktop-menu` 是其它 asar 补丁的前置。
- 清理/删除用 `trash_move`，不用 `rm` / `del`。
- 每个补丁打完必须 `node verify.mjs` 通过（判据用补丁独有符号，不看 locale 文案）。

## 1. 版本锚点与环境事实（已核实）
- 桌面端 asar：`@deepseek-ai/dsh-desktop` = **0.2.2-rc.3**。
- 对应源码：upstream(`deepseek-ai/deepseek-harness`) tag **`dsh-v0.2.2-rc.3` = commit `38a6a5c965`**。
  - `origin`(Oct1AtJoe/deepseek-harness-enhanced) 是陈旧镜像、**无任何 tag**；`local master` 也不是 0.2.2 线。**务必从 `upstream` 取 tag**。
- 构建工具链：`E:\vibeCoding\deepseek-harness\node_modules\typescript` 是**断链**（`.pnpm` 下无 `typescript@*`），`tsdown@0.22.14` 在。重建前需 `pnpm install`。
- `pnpm` 不在 PATH：用 `load_workspace_dependencies` 返回的 pnpm/node 路径，或环境内已有 pnpm。

## 2. 现状速查（升级后实测）
- asar 补丁：
  - `desktop-menu`：失败（`app.asar.unpacked/lib/main.js` 不存在）；且 `patch.mjs` 在 0.2.2 上 `--dry-run` 注入后 `node --check` 报语法错 → 其 `lib/asar.mjs` 对 0.2.2 头部 `dataStart` 处理有偏差，**需先修**（rules 替换锚点本身 OK）。
  - `cookie-prune / net-fetch / window-state / kanye-pet`：依赖 `desktop-menu`，均未打。
  - `gateway-heartbeat / host-profile-bom / boot-spinner-corner-shape`：`canApply:true`、`applied:false`，可直接重打。
  - `chat-virtual-rows`：`applied:false`（checkout 源码补丁，重建 ui-chat 前再 apply）。
  - `cost-meter-lock`：`dsh-cost-meter 1.9.64` **已自带**，无需再补。
  - `dsh-tabbit-registry-identity`：**已生效**（作用在 profile 的 dsh-tabbit，非 asar）。
- 固化包：
  - `packages/ui-chat-patched` = **0.2.1-rc.5**，但 profile `desktop/node_modules/@deepseek-ai/dsh-client-ui-chat` 是指向它的 **symlink** → 正用旧版覆盖 0.2.2 官方 ui-chat，**聊天区崩溃最高风险**。`desktop/package.json` 的 dependencies 里没有这条 link（node_modules 残留），`pnpm install` 会清掉。
  - 官方 0.2.2 ui-chat 仍无 `deriveTurnMetrics`、无 `message.turnUsage.ttft`，`TurnUsagePanel` 无「首字用时/TPS」两行 → **TPS/TTFT 定制必须重建保留**（已定策）。
  - `packages/dsh-tabbit-patched` = 0.4.0；官方 **0.4.1** 已含 registry 修复并声明支持 0.2.2 peer → **弃用固化、回官方 0.4.1**。
- 插件：在用 6 个（`dsh-git-panel 0.1.33`、`dsh-kanye-pet 0.3.2`、`dsh-queue-recall 0.2.0`、`dsh-resend-failed-round 0.2.0`、`dsh-session-folders 0.4.1`、`dsh-trash-guard 0.1.0`，均以 v7 发布版运行）；`theme-tech`、`deliverables` 未挂载，决定**归档退休**。

## 3. Stage 0 — 切源码基线并修工具链（不需重启）
```powershell
cd E:\vibeCoding\deepseek-harness
git fetch upstream tag dsh-v0.2.2-rc.3
git checkout --detach dsh-v0.2.2-rc.3        # 用完可 git checkout master 复原
# 校验：根 package.json / packages/client/ui-chat/package.json 版本均为 0.2.2-rc.3
pnpm install --no-frozen-lockfile            # 修复 typescript 断链（联网）
npx tsc -v ; npx tsdown --version
```
说明：`plugins/node_modules/@deepseek-ai/*` 已是指向 checkout packages 的 junction，切版本后自动解析到 0.2.2；用 `tsc --traceResolution` 抽检每个包只解析出一条路径（防重复解析假报错）。

## 4. Stage A — asar 补丁重打（必须完全退出桌面端）
前置：托盘退出桌面端，任务管理器确认无 `DeepSeek Harness.exe`。

- **A1.** 修 `desktop-menu/lib/asar.mjs`：定位 `readHeader/dataStart` 在 0.2.2 asar 上的偏差（症状：`node patch.mjs --dry-run` 注入后 `node --check` 报语法错）。修到 dry-run 产物语法通过，可改用 `@electron/asar` 读取/写头。
- **A2.** 按顺序执行，每个都 `node patch.mjs` 然后 `node verify.mjs`（verify 必须 exit 0）：
```powershell
cd C:\dsh-ecosystem\patches\desktop-menu && node patch.mjs && node verify.mjs
cd ..\kanye-pet-electron && node patch.mjs && node verify.mjs
# cookie-prune：0.2.2 已退役（官方 removeLegacyHostCookies），跳过，不再打
cd ..\dsh-desktop-net-fetch && node patch.mjs && node verify.mjs
cd ..\dsh-desktop-window-state && node patch.mjs && node verify.mjs
cd ..\dsh-gateway-heartbeat && node patch.mjs && node verify.mjs
cd ..\dsh-host-profile-bom && node patch.mjs && node verify.mjs
# boot-spinner：0.2.2 已退役（官方自带 corner-shape:round），跳过，不再打
```
- **A3.** 若某补丁 0.2.2 官方已自带（用补丁独有符号在 asar 目标 grep 命中）：删该补丁目录并不再打。
- **A4.** 打补丁会生成 `resources/app.asar.orig-<版本>` 备份；保留用于回滚。
- **A5.** 全部 verify 通过后启动桌面端验收。

注意：`net-fetch/window-state/kanye-pet` 依赖 desktop-menu 摊出的 `app.asar.unpacked/lib/main.js`；若 0.2.2 的 main.js 改了锚点，按报错更新各自 `lib/rules.mjs` 的 find/replace，保持「命中且仅命中一次」。

## 5. Stage B — 重建 ui-chat-patched（保留 TPS/TTFT）
- **B1.** 在 0.2.2-rc.3 checkout 上，先应用 chat-virtual-rows（若仍需虚拟行）：
```powershell
cd C:\dsh-ecosystem\patches\chat-virtual-rows && node apply.mjs
```
- **B2.** 把 8 处本地补丁文件从补丁提交取到 0.2.2 的 `packages/client/ui-chat/src`（提交：`e8ce7bf5d0` 跳折叠回合自动展开、`603ce1067b` TPS、`ee926e3ff4` TTFT，另含 stat-dialog 自适应/zoom 校正、event-projection 首 token 时间、locale `message.turnUsage.ttft`、TurnUsagePanel 两行、TurnTailNodeView 透传）：
```powershell
git -C E:\vibeCoding\deepseek-harness checkout <对应补丁提交> -- packages/client/ui-chat/src/...
```
（参照 `packages/ui-chat-patched/VENDORED-FROM.md` 的「补丁内容」清单逐项核对，确保 8 处都在）
- **B3.** 编译（必须 exit 0）：
```powershell
cd E:\vibeCoding\deepseek-harness\packages\client\ui-chat
node ..\..\..\node_modules\typescript\bin\tsc -b tsconfig.json
node ..\..\..\node_modules\tsdown\dist\run.mjs --config tsdown.config.ts
```
- **B4.** 只把运行时文件拷回 `C:\dsh-ecosystem\packages\ui-chat-patched\`（`package.json`、`lib/index.js`、`lib/client.js`、`lib/types/**/*.d.ts`、`locale/*.json`；不要 `src/tsconfig`）。
- **B5.** 改 `packages/ui-chat-patched/package.json` 的 version = **0.2.2-rc.3**；更新 `VENDORED-FROM.md`（基线 tag、补丁提交）。
- **B6.** 重新挂载：在 `C:\Users\Administrator\.dsh\profiles\desktop\package.json` 的 dependencies 补回
```json
"@deepseek-ai/dsh-client-ui-chat": "link:C:/dsh-ecosystem/packages/ui-chat-patched"
```
然后 `cd profiles/desktop && pnpm install --no-frozen-lockfile`，再重启宿主。

验收：profile/ui-chat-patched/asar 三处版本都在 0.2.2-rc.3；本轮用量悬浮窗显示「首字用时 + 输出速度(TPS)」。
（止损可选：重建完成前若怕崩，可先把该 symlink 摘掉让运行时回官方 0.2.2，重建后再挂回。）

## 6. Stage C — dsh-tabbit 迁移到官方 0.4.1
```powershell
# 编辑 profiles/desktop/package.json：把 "dsh-tabbit": "link:C:/dsh-ecosystem/packages/dsh-tabbit-patched"
# 改为 "dsh-tabbit": "0.4.1"（或对应 tgz URL）
cd C:\Users\Administrator\.dsh\profiles\desktop && pnpm install --no-frozen-lockfile
# 重启后验证：
node --input-type=module -e "import('file:///C:/Users/Administrator/.dsh/profiles/desktop/node_modules/dsh-tabbit/lib/installer/detect.js').then(async m=>console.log(JSON.stringify(await m.detectTabbitInstallations())))"
```
判据：`installations` 非空且含 `edition:"domestic"`；`tabbit_browser_install` 不再误报未安装。
`patches/dsh-tabbit-registry-identity` 保留作说明/回退（0.4.1 已含同修复）。清理旧的 `dsh-tabbit-patched` 手工 junction。

## 7. Stage D — 插件适配（6 个在用）
逐个切源码并编译，tsc 必须 exit 0；页面 `Ctrl+F5` 验证功能、无控制台报错：
```powershell
node C:\dsh-ecosystem\scripts\plugin-dev-link.mjs link dsh-git-panel --profile desktop
cd C:\dsh-ecosystem\plugins\dsh-git-panel
node E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc -p tsconfig.json
# 对 dsh-kanye-pet / dsh-queue-recall / dsh-resend-failed-round / dsh-session-folders / dsh-trash-guard 重复
```
按 tsc/运行时暴露的 0.2.2 契约变更改 `src`；历史已知坑：`conversation.chat.turnTail` 是 list 槽、`message.isError` 上移到 message、`ThemeRuntime.setFontSize(role,px)`、message-source 的通用 `kind:'plugin'` 已移除。

## 8. Stage E — 归档退休 theme-tech、deliverables
二者当前未在 desktop profile 挂载，无需动 profile；只需移入 `archive/`（`trash_move` 或 `git mv`），并在 `另一台电脑安装指南.md` 删除其条目/描述。

## 9. Stage F — 打包发布（仅本次改动过的插件）
顺序硬性：改版本号 → 先更新 `另一台电脑安装指南.md` → pack → 上传 → **最后** release 切回。
```powershell
# 1) 编辑 plugins/<包>/package.json 的 version
# 2) 更新 C:\dsh-ecosystem\另一台电脑安装指南.md（插件清单/版本/URL/tag）
# 3) 重建该插件（tsc 必须 exit 0 + tsdown）
# 4) node C:\dsh-ecosystem\scripts\pack-plugins.mjs
# 5) git add plugins/<包> 另一台电脑安装指南.md && git commit && git push origin main
# 6) gh release upload <tag> dist-tarballs/<扁平名>-<版本>.tgz --clobber
# 7) 【最后】node scripts\plugin-dev-link.mjs release <包> --profile desktop
# 8) 重启宿主
```
交付：GitHub 在线安装 URL、`C:\dsh-ecosystem\dist-tarballs\<扁平名>-<版本>.tgz` 离线路径、`dsh plugin add <url>` 命令、重启指引。

## 10. 验收清单
1. 冷启动桌面端后：启动页转圈圆角正常、长会话切换不卡、窗口位置/大小记忆、网关 SSE 空闲不断、应用菜单与托盘有「刷新页面/重启应用」、宠物窗正常、Tabbit 预检 `installations` 非空。
2. 每个 `patches/*/verify.mjs` 退出码 0。
3. ui-chat-patched version == asar 内 dsh-client-ui-chat == **0.2.2-rc.3**；本轮用量显示「首字用时 + TPS」。
4. 6 个在用插件 tsc exit 0，页面功能正常无报错。
5. 无新增 crash 日志（`%APPDATA%/@deepseek-ai/dsh-desktop/logs`）。

## 11. 回滚
- asar 出问题：用 `resources/app.asar.orig-<版本>` 覆盖回滚，再重启。
- ui-chat 崩：从 `profiles/desktop/package.json` 删 link 依赖 → `pnpm install` → 重启（回官方）。
- dsh-tabbit 出问题：依赖改回 `link:dsh-tabbit-patched` → `pnpm install` → 重启。
- checkout 复原：`git -C E:\vibeCoding\deepseek-harness checkout master`（保持干净）。

## 12. 交接注意
- 标「需重启」的阶段（A、B6、C、F8）无法在正运行 DSH 的宿主会话内自证，必须完全退出桌面端后离线执行，再启动验收。
- 每步先看 exit code / verify 输出，再进下一步；失败先修规则或 asar 读取，不要跳过。