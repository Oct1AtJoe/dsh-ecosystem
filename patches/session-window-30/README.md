# 会话首屏窗口 30 条（session-window-30）

上游 Discussion：[deepseek-ai/deepseek-harness#10181](https://github.com/deepseek-ai/deepseek-harness/discussions/10181)

## 问题

切到长会话时「载入历史」要等数秒。根因不是单一接口慢，而是首屏窗口过大：

`HISTORY_PAGE_OPTIONS` 原本是 `{ maxMessages: 500, turnWindow: { minMessages: 50, minTurns: 2 } }`。
**`turnWindow` 主导截断**：`paginate()` 倒序走到某个 `turn/start` 且两个下限都满足即停，
单个长 turn 会整段返回，`maxMessages` 根本没机会触发。

实测某会话最近一个 turn 就有 450 条事件，首帧 1.09MB。客户端要 `JSON.parse`、重建全部
context（`replaceWindow()`），再由 ChatFlow 全量渲染（无虚拟化），才把 `openState` 翻成 `open`。

## 改动

```ts
const HISTORY_PAGE_OPTIONS = { maxMessages: 30 }

const JUMP_PAGE_OPTIONS = {
  maxMessages: JUMP_PAGE_MESSAGES,                       // 必须显式重述
  turnWindow: { minMessages: JUMP_PAGE_MESSAGES, minTurns: 2 },
}
```

`JUMP_PAGE_OPTIONS` 必须显式写 `maxMessages`：它原本展开 `HISTORY_PAGE_OPTIONS`，
改小后 `minMessages: 200 > maxMessages` 会被 `history.ts` 的 `validateHistoryWindow()` 拒绝，
轮次跳转全挂。

## 实测

| 会话 | records | payload |
|---|---|---|
| b724f314 (6.66MB v3) | 450 → 156 | 1.09MB → 0.35MB (−68%) |
| c7912d98 (5.17MB v3) | 312 → 151 | 0.51MB → 0.23MB (−56%) |
| 56d07a1c (6.24MB v3) | 403 → 169 | 1.37MB → 0.73MB (−47%) |

host 冷读时间不变（379 → 418ms），省的是客户端侧。

## 为什么需要这个脚本

改动最终生效在 `packages/api/session-controller/lib/client.js`，而 `lib/` 被 `.gitignore`
排除（`.gitignore:7`）。这意味着：

- `git status` 看不见它，`git checkout` 还原不了
- **任何一次 `pnpm run build:lib` 都会把它覆盖回 500/2**

所以必须同时改源码，重建后才能保持同样窗口。本脚本把「源码 + 产物」当成一个整体来管理。

## 用法

```powershell
cd C:\dsh-ecosystem\patches\session-window-30

node apply.mjs            # 应用（源码 + 产物），幂等
node apply.mjs --check    # 只检查，报告源码与产物是否一致
node apply.mjs --revert   # 还原源码（产物用备份覆盖）
```

`--check` 会在源码与产物方向不一致时输出 `warning`，提示「下次重建会覆盖产物」。
建议在每次 `pnpm run build:lib` 之后跑一次 `--check`，不一致就再 `apply`。

环境变量 `DSH_REPO` 可指向其他 checkout（默认 `E:/vibeCoding/deepseek-harness`）。

## 回退

```powershell
Copy-Item C:\dsh-ecosystem\patches\session-window-30\client.js.orig `
  E:\vibeCoding\deepseek-harness\packages\api\session-controller\lib\client.js -Force
```

`client.js.orig` 是 166568 字节的原版产物（`maxMessages: 500`）。

## 验证

改动后应确认：

1. `node apply.mjs --check` 显示 `source: patched`、`artifact: patched`
2. 浏览器硬刷新，打开长会话，「载入历史」明显变短
3. 往上滚出现「加载更早」，点击能正常加载
4. 用轮次导航跳到很早的轮次，不报 `gateway/arguments-invalid`

第 4 条专门验证 `JUMP_PAGE_OPTIONS` 没被破坏。

## 失效条件

- 上游合并了等价改动：`apply.mjs` 会报「未匹配」，此时删除本补丁即可
- 升级上游后 `git pull`：源码可能冲突，重新 `apply`
- `pnpm run build:lib` / `build:web`：产物被覆盖，重新 `apply`
