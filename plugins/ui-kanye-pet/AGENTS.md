# ui-kanye-pet 维护注意

桌宠 Kanye 的设置面板插件（Plugins 设置页 pet 标签页），另承担桌宠气泡/Windows toast 的点击跳转监听。

## 构建链（tsc 必须先行）

```sh
cd C:/dsh-ecosystem/plugins/ui-kanye-pet
env -u NODE_OPTIONS node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
env -u NODE_OPTIONS node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
```

### 坑点（2026-09-04 实踩）

- **typeRoots 必须覆盖**（已写入 tsconfig.json）：生态 base `tsconfig.base.client.json` 声明 `types: ["client-build-environment"]`，但该类型库在 E 盘 repo `scripts/types`，生态根没有——不覆盖直接 TS2688。
- **`ctx.slots` 需要 `import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'`**：Context 的 `slots` 增强由 ui-renderer 提供，缺失则 TS2339（typeRoots 修好后才暴露，此前 tsc 在 TS2688 就死了没走到语义检查）。

## 点击跳转监听（2026-09-04 新增）

桌宠气泡/Windows toast 点击后，Tauri 壳（`pet_open_session` / `open_session`）在主窗口 eval 派发：

```
window.dispatchEvent(new CustomEvent('dsh:open-session', { detail: { sessionId } }))
```

本插件 apply 里注册 `dsh:open-session` 监听，懒取 `ctx.get('sessions')` 调 `open(id)`——rc.1 client 侧 Session Controller，与官方 ui-chat/ui-workspace 同一接口。

- **历史**：监听者原是 dsh-notification-custom（0.1.1），rc.1 起源码残缺停用并于 2026-09-04 退役归档，导致跳转失效；监听职责移交本插件。
- **未知 id 会 fail loud**（`ISessions.open` 契约），已用 try/catch 包裹并 `console.warn('[ui-kanye-pet] open session … failed')`。
- 会话 id 来自 kanye-pet host 通知（host `session.id`），与 client Session Controller 同一 id 空间。

## 验证方法

- 插件经 `/plugins/??pkg/client.js,...&rev=<hash>` 组合端点加载——**单包路径 `/plugins/<pkg>/client.js` 是 404**，别用它判断新代码是否生效。
- 改 client 后强刷（Ctrl+F5 / ignoreCache reload）让 rev 更新；确认新代码用 fetch 组合端点文本 grep 特征串。
- 跳转验证：从 `/kanye-pet/sessions` 拿会话 id 列表 → dispatch 事件 → **以 DOM 会话头文案为判据**（`document.title` 滞后不更新，不可靠）。
- 浏览器认证：browser-use 会话借历史 cookie 直连 `127.0.0.1:3080`（cookie 跨后端重启有效，约 90 天）；全新浏览器需要壳日志/终端里当次启动的 `?token=` URL。
