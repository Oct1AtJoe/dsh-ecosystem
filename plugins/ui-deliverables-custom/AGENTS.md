# ui-deliverables-custom 维护注意

## 修改后需要同步到 profile

这个插件的源码在 `C:\dsh-ecosystem\plugins\ui-deliverables-custom\`，但 DSH 服务器实际读取的是：

```
C:\Users\Administrator\.dsh\profiles\web\node_modules\@deepseek-ai\dsh-client-ui-deliverables-custom\lib\client.js
```

两者最初是硬链接关系（改一个两个都变），但 `pnpm install` / `pnpm add` 等操作会使硬链接断开，profile 里的 `lib/client.js` 被恢复为原始版本。

**2026-09-04 现状**：profile 的 node_modules 条目是指向本插件目录的链接（`link:` 依赖），tsdown 就地重建 `lib/client.js` 后浏览器强刷即生效，无需复制（已实测）。上面的复制步骤保留作断链时的兜底：若改完不生效，先核对 profile 侧 `lib/client.js` 的内容/时间戳。

### 修改后必须做

1. 改源码（`src/` 下）
2. 构建（`pnpm run bundle`）或直接编辑 `lib/client.js`
3. **把 `lib/client.js` 复制到 profile**：

```powershell
Copy-Item "C:\dsh-ecosystem\plugins\ui-deliverables-custom\lib\client.js" `
          "C:\Users\Administrator\.dsh\profiles\web\node_modules\@deepseek-ai\dsh-client-ui-deliverables-custom\lib\client.js" -Force
```

4. **硬刷新浏览器**（Ctrl+F5）让浏览器加载新文件
5. 如果还不行，**重启 DSH 服务**再硬刷新

### 徽章统计说明

- **徽章** = `totalHunks`（跨轮次累计 `history`）
- **展开面板** = `hunks`（当轮 `turnHunks`）
- 两者的 oldText/newText 在存储前都经过 `stripContext` 剥离上下文行，只保留实际增删内容

## 2026-09-04 rc.1 修复记录（均已浏览器实测）

### 1. 产物行被 dsh-better-sidebar 覆盖（核心修复）

- **现象**：插件加载正常（模块批次含本包、CSS 已注入），但回合末产物行永远是"官方样式"，custom 特性（多行换行、+/- 徽标、DiffBlock）全部不见。
- **根因**：`dsh-better-sidebar` 的 `client-registry.js` 也向 `conversation.chat.turnTail` 注册（`priority: -1`，select 同样认领 produced files，渲染它自己的产物行）。rc.1 链式槽按 priority 升序、select 首个非 null 当选——本插件默认 priority 0 排在其后，永远轮不到。
- **修复**：`src/client/index.ts` 注册时加 `priority: -5`——排在 better-sidebar 的 -1 之前；仍在 ui-resend-failed-round 的 -10 之后（失败轮"重新发起"保持最高优先）。
- **教训**：rc.1 下第三方插件会用负 priority 抢链式槽；custom 插件挂链式槽必须显式设 priority。

### 2. 标签文案

`locales.ts` 的 `produced.label`：`★产物` → `本次产物`（英文 `Produced` 未动）。

### 3. diff 行数虚增（幻影 +/- 对）

- **现象**：纯追加一行被记成 `+3 -1`，展开面板出现 `- test123 / + test123 / + test421` 这种"自己删自己加"的行。
- **根因**：`DiffBlock.buildRows` 与 `turn-deliverables.diffStats` 都把 oldText 侧全算删除、newText 侧全算新增，不配对相同行。
- **修复**：DiffBlock.tsx 新增导出 `diffLines(oldText, newText)`——内容行做公共前缀 + 公共后缀 trim，只留真正变化的中段（oldText 为 null 即新建文件时全部算新增；两侧完全相同则零行）。行渲染与徽标计数统一走它。trim 对 str_replace 类"中间替换"（前后有相同上下文）最准；整段重写退化为全删全加，符合语义。
- **测试**：`tests/produced-files.client.spec.tsx` 的 diffStats describe 补了配对用例（纯追加、纯删除、无变化）。

### 4. 构建注意

- `tsconfig.json` 已加 `typeRoots` 覆盖：`["E:/vibeCoding/deepseek-harness/scripts/types", "../../node_modules/@types"]`——生态 base 声明的 `client-build-environment` 类型库在 E 盘 repo，生态根没有。
- `tsc` 有 2 个**既有**环境性类型报错（`index.ts:49` 隐式 any、`index.ts:61` connection/reset 事件类型），是 api-remotes 类型解析问题，emit 不受影响，构建链照常走：tsc 出 `lib/types` → tsdown 出 `lib/client.js`。
- 构建命令（不走 profile node_modules 的坏 junction）：

```sh
cd C:/dsh-ecosystem/plugins/ui-deliverables-custom
env -u NODE_OPTIONS node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
env -u NODE_OPTIONS node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
```

### 5. 浏览器验证判据

- token URL（`pnpm dsh web` 启动时打印，每次启动换新）+ 浏览器 DevTools。
- **DOM 判据**：本插件渲染的产物行 CSS 前缀是 `GwCMNq`；被 better-sidebar 覆盖时看到的是 `nArs4W_producedRow`。样式表/style 标签里搜 `GwCMNq` 可确认本插件 CSS 已加载。

### 6. 2026-09-08 标点/逗号变化引发的环境行虚增修复

- **现象**：在 JSON 数组/对象或代码中追加新元素时（如从 `["test123", "test456"]` 追加 `test232`），前置行因追加逗号变为 `  "test456",`。旧算法由于纯文本不匹配（`"test456"` vs `"test456,"`）导致前缀 trim 失败，产生 `- test456 / + test456, / + test232`（+2 -1，原本只加 1 行却删改旧行重复计算）。
- **根因**：原 `diffLines` 仅做首尾字符串全等 trim，无法跨越中间变化，且对末尾标点（逗号 `,`、分号 `;`）变动的环境行无法容差识别，致使环境行被当成完全不同的新行。
- **修复**：`DiffBlock.tsx` 升级 `diffLines`：首尾全等 trim 后，对中段执行带末尾标点归一化（`normalizeLine` 剥除末尾逗号/分号与多余空白）的 LCS 差异序列算法；全等行权重高于归一化行；若整段仅有标点变动则回退保留真实差异。完全消除纯追加/删除场景下的环境行伪增删。

### 7. 2026-09-09 非相邻变动行堆叠粘连修复（视觉与语义对齐）

- **现象**：展开面板中，多处非相邻的修改行直接挨在一起显示，无法分辨来自同一文件的不同位置；同时所有删除行堆在前面、新增行堆在后面，导致修改对应关系割裂。
- **根因**：`diffLines` 将中段所有删除与新增各自打包为数组（`removed`、`added`），`buildRows` 机械地先遍历全部删除再遍历全部新增，丢弃了变动发生位置；且 `showPathHeaders: false`（展开面板）下同一文件的不同 hunk 之间也未插入 `gap: '⋯'` 分隔行。
- **修复**：
  1. `diffLines` 改为按 LCS 操作流就地聚合成各变动块（EditBlock），变动块内部 `-`/`+` 就地配对；
  2. 变动块之间存在未变动代码时，输出 `gap: '⋯'` 分隔行；
  3. `buildRows` 在无 path header 模式下，同文件跨 hunk 渲染时自动在 hunk 间补充 `gap: '⋯'` 分隔行。彻底解决非相邻行挤在一起的歧义。

### 8. 2026-09-10 任务执行过程中 edit/write 工具调用展开面板的虚增修复

- **现象**：原生 DSH 任务执行过程中的 `edit` / `write` 工具调用卡片（流中的工具折叠行），展开后同样存在「未修改上下文行被先全部删除、再全部新增加回」的严重虚增问题（例如只追加 1 行却显示 `+5 -4`）。
- **根因**：官方 `@deepseek-ai/dsh-client-ui-tool` 使用 `@deepseek-ai/dsh-client-ui-primitives` 的 `DiffBlock`，其算法不比较两端内容，机械地把 `diff.oldText` 全算删除（红 `-`）、`diff.newText` 全算新增（绿 `+`），未剥除上下文。
- **修复**：
  1. 新增 `ToolMutationRow.tsx` 与 `ToolMutationRow.module.css`，接入定制 `DiffBlock` 与 `diffStats`（基于 LCS + 标点归一化 + `⋯` gap 隔离）；
  2. 在 `src/client/index.ts` 中通过 `ctx.slots.inject('tool.call.toolview')` 以 `priority: -5` 注册 `key: 'edit'` 与 `key: 'write'`，遮蔽官方默认的 `FileMutationRow`（`priority: 0`）；
  3. 彻底修复执行过程中的行数徽标（显示真实变动如 `+1 -0` 而非 `+5 -4`）及展开面板中的变动行展示。


