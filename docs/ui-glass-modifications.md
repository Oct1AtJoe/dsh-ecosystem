# DSH 定制生态改动汇总（玻璃质感 / 主题同步 / junction 机制）

> 更新时间：2026-08-29
> 范围：`C:\dsh-ecosystem\plugins\ui-theme-custom`（玻璃质感 CSS 注入）+ 定制插件加载机制
> 结论：所有改动在 `C:\dsh-ecosystem` 生态内，**上游 repo（`E:\vibeCoding\deepseek-harness`）零改动**。

---

## 1. 玻璃质感 CSS 注入（SURFACE_GLASS_CSS）

**文件：** `C:\dsh-ecosystem\plugins\ui-theme-custom\src\client\index.ts` + `lib\client.js`（junction 下同一物理内容，运行时以 lib 为准）

`SURFACE_GLASS_CSS` 常量在插件 `apply()` 时以 `<style data-ui-theme-custom-surface-glass>` 注入 `<head>`，覆盖以下视觉规则：

### 1.1 侧栏光斑颜色跟随主题（本轮修复）

**问题：** 左/右侧栏根部的辉光与光泽原为硬编码白色 `rgba(255,255,255,0.04/0.08)`，不随主题变色。

**修复：** 改用主题 token `--dsw-alias-surface-glass-spot`，用 `color-mix` 压回原强度：

```css
[class$="sidebarCol"] > [class*="root"]{
  background:
    radial-gradient(ellipse 80% 60% at 50% 30%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 15%, transparent) 0%,
      transparent 100%),
    linear-gradient(145deg,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 30%, transparent) 0%,
      color-mix(in srgb, var(--dsw-alias-surface-glass-spot, rgba(228,222,238,0.28)) 10%, transparent) 40%,
      transparent 60%),
    color-mix(in srgb, var(--dsw-specific-sidebar-fill) 72%, transparent) !important;
  backdrop-filter:blur(8px) !important;
}
```

各主题 spot 值（`src/client/*.ts`）：

| 主题 | spot 色 |
|------|---------|
| aurora 极光 | `rgba(198, 184, 250, 0.25)` 紫 |
| nebula 星云 | `rgba(139, 92, 246, 0.28)` 紫罗兰 |
| void 冥夜 | `rgba(228, 222, 238, 0.28)` 暖灰 |
| jade 翠渊 | `rgba(160, 226, 192, 0.28)` 绿 |
| solar 灼日 | `rgba(252, 200, 114, 0.28)` 橙 |
| glacial 寒渊 | `rgba(182, 226, 250, 0.28)` 冰蓝 |

### 1.2 Primary 按钮玻璃质感（含对话框按钮）

**问题：** 原规则 `[class*="composerSeat"] [class$="_primary"]` 只覆盖发送按钮；对话框的「启用/确认/完成」按钮仍是纯色 `--dsw-alias-button-primary-fill`。

**根因：** 两种 CSS Modules hash 格式——
- composer 包：`<hash>_primary`（`_primary` 结尾）
- ui-primitives（Button 组件）：`_primary_<hash>_<id>`（`_primary` 在中间，如 `_primary_kz6gm_38`）

`[class$="_primary"]`（结尾匹配）只能命中前者。

**修复：** 选择器改为包含匹配 `[class*="_primary"]`，两种格式全覆盖：

```css
[class*="_primary"]{
  background:var(--dsw-alias-button-primary-bg) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow,none) !important;
}
[class*="_primary"]:hover:not(:disabled){
  background:var(--dsw-alias-button-primary-bg-hover) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow-hover,none) !important;
}
```

**覆盖的按钮：**
- 发送/停止（composer）
- Full access 确认弹窗「启用 Full access」（`_primary_kz6gm_38`，已验证渐变+发光）
- 通用 Modal footer 的确认/保存/应用
- better-sidebar 插件设置弹窗「完成」

### 1.3 gitCommitButton 玻璃质感 + 文字颜色修复

**问题：** better-sidebar 的「提交」按钮（类 `nArs4W_gitCommitButton`，用 `--dsw-alias-button-primary-fill` 纯色）不在 `_primary` 匹配范围；覆盖玻璃渐变后其文字（`--dsw-alias-label-primary-inverted`，深色）在暗玻璃底上看不清。

**修复：** 单独规则 + 文字色改为亮色 `--dsw-alias-label-primary-foreground`：

```css
[class*="gitCommitButton"]{
  background:var(--dsw-alias-button-primary-bg) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow,none) !important;
  color:var(--dsw-alias-label-primary-foreground) !important;
}
[class*="gitCommitButton"]:hover:not(:disabled){
  background:var(--dsw-alias-button-primary-bg-hover) !important;
  background-size:var(--dsw-alias-button-primary-bg-size,200% 100%) !important;
  box-shadow:var(--dsw-alias-button-glow-hover,none) !important;
}
```

### 1.4 既有规则（早前会话已落地，一并记录）

- **侧栏列透明**：`[class$="sidebarCol"] { background:transparent !important }`，让侧栏玻璃浅透过父容器
- **overlay z-index**：`[class*="overlay"] { z-index:2147483647 !important; isolation:isolate !important }`，设置弹窗盖过 message-nav(1001)/sticky composer
- **对话框玻璃面**：`[role="dialog"] { ...渐变+blur(32px)+发光... }`，frosted glass 表面
- **侧栏根玻璃**：`[class$="sidebarCol"] > [class*="root"] { 径向辉光+对角光泽+半透明填充+blur }`

---

## 2. 主题 token 同步（src → lib）

**问题：** `lib/client.js` 是提取前在 workspace 里构建的**旧产物**，src 里后期改动的 token（新增 `--dsw-alias-surface-glass-spot`、layer-* 不透明化等）从未编译进去——浏览器只加载 lib，所以光斑颜色失效。junction 只解决 node_modules 指向，不解决 src→lib 编译链（提取环境无 workspace 依赖，tsdown 无法运行）。

**解决方案：** 同步脚本 **`C:\dsh-ecosystem\plugins\ui-theme-custom\sync-themes.cjs`**

```bash
node C:\dsh-ecosystem\plugins\ui-theme-custom\sync-themes.cjs
```

从 `src/client/{aurora,glacial,jade,nebula,solar,void}.ts` 提取 `*_TOKENS` 常量（正则 + eval），重写 `lib/client.js` 里对应的 `Object.freeze({...})` 块。幂等，输出 `SYNC  <file> (<CONST>): N tokens`。

运行结果：6 个主题块全部同步（80~97 token/块）。

> 注意：脚本需以 `.cjs` 运行（包 `"type": "module"`，`.js` 会被当 ESM）。

---

## 3. 定制插件 junction 加载机制

**问题：** 某次 `pnpm install`/`npm install` 重建 node_modules 时，把定制的 `file:` 依赖从 junction 覆盖回**拷贝**——改 `C:\dsh-ecosystem\` 源码后 DSH 加载的仍是 node_modules 旧拷贝。

**修复：**
1. **重建 9 个定制插件的 junction**（node_modules → `C:\dsh-ecosystem\plugins\`）：
   `dsh-client-ui-theme-custom`、`dsh-client-ui-deliverables-custom`、`dsh-client-ui-kanye-pet`、`dsh-client-ui-msg-nav`、`dsh-client-ui-resend-failed-round`、`dsh-client-ui-session-reference`、`dsh-client-ui-subagent-custom`、`dsh-kanye-pet`、`dsh-notification-custom`
2. **自动恢复脚本** `C:\dsh-ecosystem\ensure-junctions.js`：幂等检查（已是 junction 跳过，是拷贝则删重建）
3. **postinstall 钩子**：`C:\Users\Administrator\.dsh\profiles\web\package.json` 增加
   ```json
   "scripts": {
     "postinstall": "node C:\\dsh-ecosystem\\ensure-junctions.js"
   }
   ```
   每次 install 后自动恢复。

手动运行：`node C:\dsh-ecosystem\ensure-junctions.js`（若 DSH 运行中锁文件，先关 DSH 再跑）。

---

## 4. 使用流程（以后改主题/样式）

```bash
# 1. 改 src（主题 token 或 SURFACE_GLASS_CSS）
#    位置：C:\dsh-ecosystem\plugins\ui-theme-custom\src\client\

# 2. 同步 token 进 lib（改 token 时必跑；改 SURFACE_GLASS_CSS 需手动同步或同脚本扩展）
node C:\dsh-ecosystem\plugins\ui-theme-custom\sync-themes.cjs

# 3. 刷新 DSH 页面即可生效（junction 下无需重启/install）
```

- 若 `pnpm install` 后 junction 丢了：`node C:\dsh-ecosystem\ensure-junctions.js`
- 检验 junction：`Get-Item ...\node_modules\@deepseek-ai\dsh-client-ui-theme-custom` 的 `LinkType` 应为 `Junction`

---

## 5. 验证记录

| 检查项 | 结果 |
|--------|------|
| 发送按钮 `uV2eYG_primary` 渐变+发光 | ✅ |
| Full access 确认「启用 Full access」`_primary_kz6gm_38` 渐变+发光 | ✅ |
| body `--dsw-alias-surface-glass-spot` = `rgba(228,222,238,0.28)`（void） | ✅ |
| 左/右侧栏光斑解析为主题色（非 fallback 灰） | ✅ |
| body `--dsw-alias-bg-layer-3` = `rgb(36,36,42)`（新版不透明） | ✅ |
| 9 个定制插件 junction 状态 | ✅ 全部 Junction |
| 上游 repo `git status` | ✅ 零改动 |
