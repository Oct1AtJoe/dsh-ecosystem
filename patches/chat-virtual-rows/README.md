# 聊天区只画可见行

切长会话时「载入历史」会停一两秒。服务端解码只要 60–200ms，慢在浏览器把首屏几百行全部布局并绘制。

这个补丁让屏幕外的行跳过布局和绘制。数据窗口和 DOM 都不动。

## 为什么不是 React 虚拟列表

原计划的虚拟列表要往 flow 里插上下 spacer。实测现有结构挡死了这条路：

- `ChatView.module.css` 用 `> :not([hidden]) ~ :not([hidden])` 这种兄弟选择器给每行加 6px 间距。插进来的 spacer 会被当成行，吃间距，还会打断相邻关系。
- `use-chat-viewport.ts` 在 `column` 的直接子元素上做二分查找，读 `data-chat-turn`、`data-chat-anchor-key`。spacer 会污染这个序列。
- 折叠、贴底、跳回合都假设「行都在 DOM 里、位置连续」。

要走完整虚拟化，得同时改 ChatFlow、ChatView.module.css、use-chat-viewport，三处联动，风险大。

`content-visibility: auto` 是浏览器原生做同一件事：屏幕外的行保留在 DOM，跳过布局和绘制，用 `contain-intrinsic-size` 估计高度。滚动定位读到的还是原来的树。

## 文件

| 文件 | 作用 |
|---|---|
| `0001-chat-virtual-rows.patch` | 加在官方 checkout 上的 CSS 补丁，15 行 |
| `apply.mjs` | `apply` / `--check` / `--revert`，幂等 |

补丁只动 `packages/client/ui-chat/src/client/chat/ChatView.module.css`。

## 用法

```powershell
node C:\dsh-ecosystem\patches\chat-virtual-rows\apply.mjs --check
node C:\dsh-ecosystem\patches\chat-virtual-rows\apply.mjs
node C:\dsh-ecosystem\patches\chat-virtual-rows\apply.mjs --revert
```

换 checkout：

```powershell
$env:DSH_CHECKOUT = 'D:\other\deepseek-harness'
```

打上后要重建 web 客户端再硬刷新。服务端不用重启。

## 已知代价

- 屏幕外的行高度是估计值（96px），跳到底部或回滚时可能先错位再修正。
- 落到视口内的行会立刻量出真实高度，所以正在看的内容不受影响。

## 没做

- 不改首屏窗口。`HISTORY_PAGE_OPTIONS` 仍是 500 条加 `turnWindow`。
- 不删 DOM 节点。节点数还是随事件数增长，省下的是布局和绘制。

如果试下来还不够，下一步才是完整虚拟化：改 ChatFlow 插 spacer，同时让 `use-chat-viewport` 跳过 spacer 并对未挂载行回退。
