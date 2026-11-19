# DSH 桌面端升级（0.2.2-rc.5）· 补丁适配记录

日期：2026-11-19 · 升级后 asar 内 package.json = **0.2.2-rc.5**（root/dsh/ui-chat/dsh-api-gateway/dsh-app-boot 全部一致）。

## 逐补丁结论

| 补丁 | 类型 | rc.5 状态 | 处理 |
|---|---|---|---|
| desktop-menu | asar（摊开 lib/main.js） | 5 条规则锚点全部命中 | 直接重打 |
| kanye-pet-electron | asar（unpacked main.js） | 3 锚点唯一命中 | 直接重打（desktop-menu、kanye 先于 window-state） |
| dsh-desktop-net-fetch | asar（unpacked main.js） | createRequire/旧 fetch 锚点命中、net 由补丁自带 import | 直接重打 |
| dsh-desktop-window-state | asar（unpacked main.js） | A1~A4 四锚唯一命中；依赖 kanye 补 screen | 直接重打 |
| dsh-host-profile-bom | asar（dsh-app-boot unpacked） | dry-run 通过、无锚点报错 | 直接重打 |
| dsh-gateway-heartbeat | asar（dsh-api-gateway） | rc.5 把实现内联打包进 lib/index.js（index.js 内可见 //#region lib/types/stream-server.js），旧靶 types/stream-server.js 运行期不生效 | 已改靶到 lib/index.js（lib/rules.mjs）；const MAX_MISSED_HEARTBEATS = 2; 在 index.js 恰好 1 次 |
| chat-virtual-rows + packages/ui-chat-patched | vendored 覆盖包 | asar ui-chat=0.2.2-rc.5，固化包=0.2.2-rc.3；官方 rc.5 仍无 deriveTurnMetrics/ttft/content-visibility | 需按 rc.5 重建（scripts/rebuild-ui-chat-rc5.ps1） |
| dsh-tabbit-registry-identity + packages/dsh-tabbit-patched | profile 侧 | 官方 dsh-tabbit 0.4.1 已自带 registryKey 回退（detect.js:204-205）；探测 installations=1 | 已退役（官方吸收），可停用/清理 |
| cost-meter-lock | profile 侧 | 官方 dsh-cost-meter 1.9.73 已自带 ownStartMs/unit:ms | 已退役（官方吸收），可停用/清理 |

## 为什么有的能直接重打、有的要改
- 升级会整体替换 app.asar，patches/ 全部丢失 —— 这是 A 组都要重打的原因。
- 0.2.2-rc.5 相对旧版本的两处真实漂移：
  1. api-gateway 从独立 lib/stream-server.js 改为内联打包进 lib/index.js → gateway-heartbeat 必须改靶。
  2. ui-chat 版本从 rc.3 跳到 rc.5 → 固化包版本错位有整屏崩溃风险，必须按 rc.5 重建。

## 交付物
- patches/dsh-gateway-heartbeat/lib/rules.mjs：TARGET 改 lib/index.js（已改）。
- patches/reapply-after-upgrade.ps1：退出桌面端后一键重打 A 组（含改靶后的 gateway）并逐个 verify。
- scripts/rebuild-ui-chat-rc5.ps1：用隔离 git worktree 按 rc.5 重建 ui-chat 固化包。
- 本文档。

## 重要限制
- 无法在运行中的桌面端内打 asar 补丁：DeepSeek Harness.exe 正在运行 → app.asar 被独占（EBUSY）。且本会话即运行在该桌面端里，退出即终止会话。因此 A 组重打与 ui-chat 生效都必须由你：托盘退出桌面端 → 运行 reapply 脚本 →（可选）重建 ui-chat → 重启。
- 退役项仅建议处置，本记录未删除任何目录（避免误删）。
