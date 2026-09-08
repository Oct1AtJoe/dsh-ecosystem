# dsh-cost-meter 插件 Antigravity 网关配额名称与显示宽度优化记录

## 1. 问题背景与现象

在配置本地 **CLIProxyAPI (Antigravity 网关)** 后，`dsh-cost-meter` 侧边栏/面板展示的配额信息存在两个体验问题：

1. **名称语义不明**：
   - 默认显示 `group-0 · Weekly (1%)`、`group-0 · 5h (7%)`、`group-1 · Weekly (0%)`、`group-1 · 5h (0%)`；
   - 包含两组相同的 `Weekly` 和 `5h`，用户难以区分哪个对应 Gemini，哪个对应 Claude/GPT。
2. **标签宽度过窄导致垂直折行**：
   - 侧边栏图框中名称被截断折成多行（如 `group-`、`0 ·`、`Weekly` 三截），挤压变形极其难看。

---

## 2. 根因分析

### 问题 A：名称回退成 `group-0`
- Google 官方配额汇总接口 `POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary` 返回：
  ```json
  {
    "groups": [
      {
        "displayName": "Gemini Models",
        "description": "Models within this group: Gemini Flash, Gemini Pro",
        "buckets": [ ... ]
      },
      {
        "displayName": "Claude and GPT models",
        "description": "Models within this group: Claude Opus, Claude Sonnet, GPT-OSS",
        "buckets": [ ... ]
      }
    ]
  }
  ```
- 原代码 `gateway-quota-adapters.js` 仅读取 `groupId / group_id / id / name`，缺少 `displayName` 导致回退为 `group-${gi}`。

### 问题 B：显示宽度硬编码 22px
- 原插件样式继承自 MiniMax 的短标签（`5h` / `7d`），CSS 强制写死：
  ```css
  .cm-mm-row .cm-bbox-label {
    width: 22px; /* 只有 22 像素宽！ */
  }
  ```
- 且缺少 `white-space: nowrap` 和 `word-break: keep-all`，导致超出 2 个字符的长标签（如 `Gemini · Weekly`）在连字符处被强行断词，纵向垂直折成 3 到 4 行。

---

## 3. 源码修改方案

### 涉及文件
1. `lib/gateway-quota-adapters.js`（名称解析逻辑）
2. `src/client/01-open-styles-i18n.js`（UI 样式宽度定义）
3. `src/client/02-validators-helpers-sidebar.js`（DOM 结构及 title 提示）
4. `test/verify.mjs`（单元测试）
5. `lib/client.js`（前端打包压缩产物）

---

### 代码 Diff

#### 3.1 修复分组名称解析（`lib/gateway-quota-adapters.js`）
```diff
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]
    if (group === null || typeof group !== 'object' || Array.isArray(group)) continue
-   const groupId = slug(pickField(group, 'groupId', 'group_id', 'id', 'name') ?? `group-${gi}`)
+   const explicitId = pickField(group, 'groupId', 'group_id', 'id')
+   const rawGroupTitle = pickField(group, 'displayName', 'display_name', 'name') ?? explicitId
+   let groupTitle = rawGroupTitle ? String(rawGroupTitle).replace(/\s+models$/i, '').trim() : `group-${gi}`
+   if (groupTitle.toLowerCase().includes('claude') && groupTitle.toLowerCase().includes('gpt')) groupTitle = 'Claude / GPT'
+   const groupId = slug(explicitId ?? groupTitle)
    const buckets = Array.isArray(group.buckets) ? group.buckets : []
    let added = 0
    for (const bucket of buckets) {
      if (bucket === null || typeof bucket !== 'object' || Array.isArray(bucket)) continue
      const fraction = normalQuotaFraction(pickField(bucket, 'remainingFraction', 'remaining_fraction'))
      if (fraction === null) {
        warnings.push(`antigravity: ${groupId} 的 remainingFraction 非法,已丢弃该 bucket`)
        continue
      }
      const meta = antigravityWindowMeta(pickField(bucket, 'window'))
      const id = `${groupId}:${meta.id}`
      if (seen.has(id)) continue
      seen.add(id)
      const percent = clampPct((1 - fraction) * 100)
      windows.push(makeWindow(
        id,
-       `${groupId} · ${meta.label}`,
+       `${groupTitle} · ${meta.label}`,
        percent,
        absoluteResetAt(pickField(bucket, 'resetTime', 'reset_time', 'resetTime')),
        meta.periodHours,
        'account',
      ))
      added++
    }
```

#### 3.2 修复标签宽度与防折行样式（`src/client/01-open-styles-i18n.js`）
```diff
  '.cm-mm-row{display:flex;align-items:center;gap:8px;padding:2px 0}',
- '.cm-mm-row .cm-bbox-label{flex:none;width:22px;font-weight:400;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
+ '.cm-mm-row .cm-bbox-label{flex:none;width:auto;min-width:22px;max-width:115px;font-weight:400;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;word-break:keep-all}',
- '.cm-mm-row .cm-bbox-bar{flex:1;min-width:0;height:6px}',
+ '.cm-mm-row .cm-bbox-bar{flex:1;min-width:40px;height:6px}',
```

#### 3.3 补充文本完整 title 提示（`src/client/02-validators-helpers-sidebar.js`）
```diff
  row: el('div', { className: 'cm-mm-row' + (level === 'ok' ? '' : ' ' + level) },
-   el('span', { className: 'cm-bbox-label' }, label),
+   el('span', { className: 'cm-bbox-label', title: label }, label),
    el('div', { className: 'cm-bbox-bar' },
      el('div', { className: 'cm-bbox-fill', style: { width: barView.width + '%' } })),
    el('span', { className: 'cm-bbox-pct cm-num' }, barView.label === null ? '—' : barView.label + '%')),
```

#### 3.4 重新构建客户端
运行构建脚本，编译打包为满足 DSH 审核标准的 `lib/client.js`：
```bash
node scripts/build.mjs
```

---

## 4. 优化效果对比

| 原版显示 | 优化后显示 | 修复效果说明 |
|---|---|---|
| `group-`<br>`0 ·`<br>`Weekly` | **`Gemini · Weekly`** | 语义清晰对应 Gemini 模型，且整行单行显示，绝不折断 |
| `group-`<br>`0 ·`<br>`5h` | **`Gemini · 5h`** | 对应 Gemini 滚动 5 小时配额 |
| `group-`<br>`1 ·`<br>`Weekly` | **`Claude / GPT · Weekly`** | 语义清晰对应第三方模型池 |
| `group-`<br>`1 ·`<br>`5h` | **`Claude / GPT · 5h`** | 对应 Claude/GPT 滚动 5 小时配额 |

---

## 5. 提交记录

- **本地运行时同步**：已热替换更新至本地运行环境：
  - `C:\Users\Administrator\.dsh\profiles\web\node_modules\dsh-cost-meter\lib\gateway-quota-adapters.js`
  - `C:\Users\Administrator\.dsh\profiles\web\node_modules\dsh-cost-meter\lib\client.js`
- **上游开源 PR**：
  - **PR 地址**：[#102 · Han-1413141/dsh-cost-meter](https://github.com/Han-1413141/dsh-cost-meter/pull/102)
  - **分支名称**：`fix/antigravity-quota-group-display-name`
  - **包含 Commit**：
    1. `42b0ed9 fix(gateway): resolve friendly Antigravity quota group names from displayName`
    2. `8975edd fix(ui): expand gateway quota row label max width to prevent vertical wrapping`
    3. `1aaa4ec fix(ui): prevent label break and set min-width for quota progress bar in cm-mm-row`

---

## 6. 在 dsh-cost-meter 插件中配置 CLIProxyAPI 网关教程

### 6.1 前置要求：开启 CLIProxyAPI 管理接口 (Management API)
CLIProxyAPI 默认关闭了用于读取账号状态的管理端点，需要手动在配置文件中指定管理密钥：

1. 打开 CLIProxyAPI 目录下的 `config.yaml`（例如：`CLIProxyAPI_7.2.152_windows_amd64\config.yaml`）。
2. 在文件末尾添加配置段：
   ```yaml
   remote-management:
     allow-remote: false           # 仅允许本地回环访问（更安全）
     secret-key: "你的自定义管理密码" # 自定义 Management Key（例如：cpa-admin-123456）
   ```
3. 重启 CLIProxyAPI（双击运行 `start.bat`），确保本地 `http://127.0.0.1:8317` 正常监听。

> **可选：配置 Windows 开机静默自启**
> 1. 在 CLIProxyAPI 目录下新建 `start_silent.vbs`：
>    ```vbs
>    Set ws = CreateObject("Wscript.Shell")
>    ws.Run "cmd /c """ & "C:\你的完整路径\start.bat" & """", 0, False
>    ```
> 2. 将快捷方式放入 Windows 启动文件夹（`Win+R` 输入 `shell:startup` 回车），即可开机无窗口静默常驻。

---

### 6.2 在插件设置中添加网关来源

1. 打开 DeepSeek Harness 网页端，点击左下角 **设置 (Settings)** ➔ **费用 (Cost)**。
2. 切换到左侧分节标签 **额度 (Quotas)**。
3. 找到 **CLIProxyAPI 网关额度** 卡片，点击 **添加来源 (Add source)**。
4. 展开刚创建的条目，配置以下各项：
   - **启用来源**：勾选 `✔ 启用`；
   - **来源名称**：`CLIProxyAPI`（用于侧边栏显示的标题）；
   - **Base URL**：`http://127.0.0.1:8317`（本地监听地址）；
   - **显示位置**：选择 `主页面侧边栏` 或 `侧边栏与设置页均显示`；
   - **刷新间隔 (分钟)**：建议设置为 `15` 分钟；
   - **允许的 Host (白名单)**：本地 loopback 地址可留空，或填写 `127.0.0.1`；
   - **Management Key (只写)**：输入在 `config.yaml` 中设置的 `secret-key` 密码，点击右侧 **保存**。
     *(该密钥直接托管写入 DSH 凭据库，绝不落盘、不存入账本明文)*。

---

### 6.3 账号发现与配额自动联动

1. 配置保存后，插件会立即发起只读探测：
   - 调用 `GET /v0/management/auth-files` 发现本地 `~/.cli-proxy-api/` 下保存的账号；
   - 自动识别到 Antigravity（`antigravity-xxx.json`）；
   - 自动携带当前账号 Token 请求 Google 官方配额汇总端点：
     `https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary`
2. 成功后状态变为 `ok`，主页面侧边栏立即展示圆角配额卡片，显示 Gemini 与 Claude/GPT 的 5小时及周配额进度条。
3. 点击卡片可手动立即刷新，悬停可查看重置精确时刻与账号脱敏邮箱。

