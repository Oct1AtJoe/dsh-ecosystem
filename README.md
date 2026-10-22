# DSH 本地定制生态（C:\dsh-ecosystem）

## 目录结构

```
C:\dsh-ecosystem\
├── plugins\           # 定制插件源码（目录名 = 包名去掉 dsh- 前缀）
│   ├── file-upload\            dsh-file-upload（拖拽与 Ctrl+V 粘贴文件上传，零路径污染）
│   ├── session-folders\        dsh-session-folders（会话文件夹）
│   ├── session-title\          dsh-session-title-gen（会话标题生成）
│   ├── queue-recall\           dsh-queue-recall（排队消息撤回编辑）
│   ├── theme-tech\             dsh-theme-tech（科技主题与外观定制）
│   ├── deliverables\           dsh-deliverables（交付物面板，未发布）
│   ├── resend-failed-round\    dsh-resend-failed-round（失败轮次重发）
│   ├── subagent-card\          dsh-subagent-card（子代理卡片）
│   ├── kanye-pet-settings\     dsh-kanye-pet-settings（桌宠设置面板）
│   ├── kanye-pet\              dsh-kanye-pet（桌宠 bundle 插件）
│   ├── dsh-git-panel\          dsh-git-panel（Git 面板，第三方上游，包名与目录均不改）
│   ├── tsdown.client.ts              # 共享构建 preset（从官方仓库拷贝，独立维护）
│   ├── build-preset\                 # preset 的依赖闭包（manifest/system/platform/client-build-environment）
│   └── package.json                  # 插件构建与运行时依赖（tsdown/schemastery/zod/clsx/lightningcss）
├── packages\ui-chat-patched\         # vendored 官方包的覆盖副本（名字必须与官方逐字一致）
├── desktop\          # 【已弃用】早期自研 Tauri 2 桌面壳，仅作历史参考，见 AGENTS.md §0.3
│   ├── src\           pet.html, pet.js, styles.css
│   ├── src-tauri\     Rust 源码 + 配置
│   └── dist\          DeepSeekHarness.exe（历史构建产物）
├── patches\          # 官方 Electron 端的 asar 补丁（改壳层的唯一途径）
│   ├── desktop-menu\         刷新页面 / 重启应用（其它补丁的前置）
│   ├── kanye-pet-electron\   透明置顶宠物窗 + IPC 桥
│   ├── chat-virtual-rows\    聊天区只画可见行
│   └── cost-meter-lock\      cost-meter 锁身份免同步 PowerShell
├── archive\          # 历史一次性脚本与截图（2026-08-29 清理归档，可删）
└── README.md
```

> **v7 包名统一（2026-10-22）**：已去掉全部 `@deepseek-ai/` 作用域、`client-ui` 中缀与 `custom` 后缀，
> 统一为 `dsh-<功能>`。旧名 → 新名对照见 [另一台电脑安装指南.md](另一台电脑安装指南.md) 的「从 v6 迁移到 v7」。
> `dsh-git-panel` 是唯一例外：它来自第三方上游（`a792883583/dsh-git-panel`），包名本就合规，目录与版本均不动。
> 🚨 **`cordis.patch.yml` 的 `id:` 一律未改**（settings 页绑定 loader 条目 id + `Config`），只改了 `name:`。

## 加载机制（2026-08-29 起）

- Profile（`~/.dsh/profiles/web/package.json`）用 pnpm 原生 **`link:`** 协议依赖本目录的 9 个插件。
  `pnpm install` 会直接重建 symlink，**不需要** postinstall / ensure-junctions.js（已删除）。
- 插件的 Node-half 裸依赖（schemastery、zod 等）装在 `plugins/node_modules`（`plugins/package.json`），
  symlink 从真实路径解析时会命中它们。
- Client bundle 构建用 `plugins/tsdown.client.ts` + `plugins/build-preset/`（官方 preset 的独立拷贝），
  **不依赖官方仓库**——官方 `git pull` 后构建链不受影响；官方更新这 4 个 preset 文件时需手动同步。

## 更新官方上游（无冲突）

```bash
cd E:\vibeCoding\deepseek-harness
git pull upstream master    # 零冲突：仓库全是官方文件
pnpm install                 # 重建依赖
# 重启 DSH web 即可
```

## 修改定制插件

改完 `C:\dsh-ecosystem\plugins\<包名>\src\` 或 `lib\` 后：

```bash
# .ts 源码改动需要重新构建（cwd 必须是插件目录，entry 是相对 cwd 的 src/）
cd C:\dsh-ecosystem\plugins\<包名>
node ..\node_modules\tsdown\dist\run.mjs

# 重启 DSH web 生效；profile 侧无需任何 install（link: 直接指向本目录）
```

或者直接改 `lib/` 里的 `.js`/`.mjs` 文件（kanye-pet host half），重启 DSH 即可生效。

主题 token（`src/client/*.ts`）改完直接重建即可，不再需要 sync-themes 脚本（已删除，
`tsdown` 构建会把 token 编进 `lib/client.js`）。

## 重启 DSH Web

关闭当前 DSH web（Ctrl+C），然后：

```bash
cd E:\vibeCoding\deepseek-harness
pnpm dsh web
```

或双击桌面快捷方式。

## 桌面端（官方 Electron 客户端）

当前桌面端是 **`E:\dshDesktop` 的官方 Electron 客户端**，不是自研 Tauri 壳。

```bash
# 启动
E:\dshDesktop\DeepSeek Harness.exe

# 官方包根 / 应用包
E:\dshDesktop\resources\app.asar\dsh\
E:\dshDesktop\resources\app.asar
```

改壳层行为**只能走 `patches/` 下的 asar 补丁**（源码在官方 checkout 里改不会进 asar）：

```bash
# 必须先完全退出桌面端（托盘退出，不是关窗口）
cd C:\dsh-ecosystem\patches\desktop-menu
node patch.mjs && node verify.mjs

cd ..\kanye-pet-electron
node patch.mjs && node verify.mjs
```

每个补丁都带 `patch.mjs` / `verify.mjs` / `revert.mjs`，详见各目录 `README.md` 与 `AGENTS.md` §0.2。

> `desktop\` 是早期 Tauri 壳，已弃用。`desktop\dist\DeepSeekHarness.exe` 是历史构建产物，
> **不要**再 `npx tauri build`——改它不会影响你正在用的客户端。

## 调试桌宠通知

1. 打开 DSH 日志，搜 `[kanye-pet]`
2. 访问 `http://127.0.0.1:<端口>/kanye-pet/state` 看 `notification` 字段（端口每次启动随机，见 GUI URL）
3. 桌宠气泡每 2 秒轮询 `/state` 端点，收到 `notification` 即显示
4. 如果通知不出现：查 `/state` 返回的 `_debug.desktopPetEnabled` 是否为 true
5. Electron 桌面端的独立宠物窗走 `GET /kanye-pet/window`，需先打 `patches/kanye-pet-electron`
