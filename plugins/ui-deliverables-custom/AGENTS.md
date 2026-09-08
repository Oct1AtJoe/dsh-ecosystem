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
