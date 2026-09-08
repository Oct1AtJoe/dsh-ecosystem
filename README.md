# DSH 本地定制生态（C:\dsh-ecosystem）

## 目录结构

```
C:\dsh-ecosystem\
├── plugins\           # 定制插件源码（10 个包）
│   ├── ui-theme-custom\              @deepseek-ai/dsh-client-ui-theme-custom
│   ├── ui-deliverables-custom\       @deepseek-ai/dsh-client-ui-deliverables-custom
│   ├── ui-resend-failed-round\       @deepseek-ai/dsh-client-ui-resend-failed-round
│   ├── ui-session-reference\         @deepseek-ai/dsh-client-ui-session-reference
│   ├── ui-settings-skills\           @deepseek-ai/dsh-client-ui-settings-skills（未注册到 profile）
│   ├── ui-settings-subagents\        @deepseek-ai/dsh-client-ui-settings-subagents（未注册到 profile）
│   ├── ui-subagent-custom\           @deepseek-ai/dsh-client-ui-subagent-custom
│   ├── dsh-notification-custom\      @deepseek-ai/dsh-notification-custom
│   ├── ui-kanye-pet\                 @deepseek-ai/dsh-client-ui-kanye-pet
│   ├── kanye-pet\                    @deepseek-ai/dsh-kanye-pet（bundle 插件）
│   ├── tsdown.client.ts              # 共享构建 preset（从官方仓库拷贝，独立维护）
│   ├── build-preset\                 # preset 的依赖闭包（manifest/system/platform/client-build-environment）
│   └── package.json                  # 插件构建与运行时依赖（tsdown/schemastery/zod/clsx/lightningcss）
├── packages\client\ui-theme-custom\package.json   # workspace 桩（preset 按包名查找 manifest 用）
├── desktop\          # Tauri 桌面壳子
│   ├── src\           pet.html, pet.js, styles.css
│   ├── src-tauri\     Rust 源码 + 配置
│   └── dist\          DeepSeekHarness.exe（构建产物）
├── archive\          # 历史一次性脚本与截图（2026-08-29 清理归档，可删）
└── README.md
```

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

## 启动 Tauri 桌面壳子

```bash
cd C:\dsh-ecosystem\desktop
.\dist\DeepSeekHarness.exe
```

如果改了 `pet.js`/`pet.html`，需重建 exe：

```bash
cd C:\dsh-ecosystem\desktop
Remove-Item src-tauri\target\release\build\dsh-desktop-* -Recurse -Force
npx tauri build
```

## 调试桌宠通知

1. 打开 DSH 日志，搜 `[kanye-pet]`
2. 访问 http://127.0.0.1:3080/kanye-pet/state 看 `notification` 字段
3. 桌宠气泡由 `pet.js` 每 2 秒轮询 `/state` 端点，收到 `notification` 即显示
4. 如果通知不出现：查 `/state` 返回的 `_debug.desktopPetEnabled` 是否为 true
