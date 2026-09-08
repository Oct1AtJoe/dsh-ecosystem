# 自定义会话标题生成插件实施计划

## 概述

创建 `dsh-session-title-custom` 插件，替代内置的 `session-title-first-prompt-llm`，
为**两个入口**（新建会话自动命名 + 右键 → 自动命名）统一应用自定义命名规则。

## 规则摘要

- 日期取 `createdAt`，Asia/Shanghai 时区，格式 `MMDD`
- 最终标题格式：`MMDD｜类型｜主题`（统一使用全角 `｜`）
- 类型限定：功能、设计、修复、优化、发布、探索、文档、研究
- 主题根据首条消息提炼（2-8 个字），不包含类型词
- 校验失败或无法判断时抛错，由 `sessionTitle` 机制回退保留原名

---

## 步骤 1：创建插件目录

```
C:\dsh-ecosystem\plugins\dsh-session-title-custom\
├── package.json
├── cordis.patch.yml      # 自注册 bundle patch
├── lib/
│   └── index.js          # 宿主插件（Node 端）
└── PLAN.md
```

---

## 步骤 2：`package.json`

> **排查修复项**：
> 1. `files` 字段必须包含 `cordis.patch.yml`。
> 2. 移除未直接引用的 `@deepseek-ai/dsh-session-title-llm`。
> 3. `peerDependencies` 去除 `workspace:^` 前缀（插件位于外部目录，非 profile 的 pnpm workspace 根），改用版本范围。

```json
{
  "name": "dsh-session-title-custom",
  "version": "0.1.0",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": { "default": "./lib/index.js" },
    "./package.json": "./package.json"
  },
  "files": ["lib", "cordis.patch.yml"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" }
  },
  "peerDependencies": {
    "@deepseek-ai/dsh-session-title": ">=0.1.0",
    "@deepseek-ai/dsh-llm": ">=0.1.0",
    "@deepseek-ai/cordis": ">=4.0.0"
  },
  "license": "MIT"
}
```

---

## 步骤 3：`cordis.patch.yml`

插件自身 bundle patch，用于向 Cordis 根容器注入自身：

```yaml
# dsh-session-title-custom bundle patch
- insert:
    - id: dsh-session-title-custom
      name: dsh-session-title-custom
```

---

## 步骤 4：`lib/index.js` — 实现宿主插件

### 插件声明与依赖注入

- `name = "dsh-session-title-custom"`
- `inject = ["sessionTitle", "llm", "sessions"]`

### apply 函数与 generate 逻辑

> **排查修复项**：
> 1. **必填 `id`**：`ctx.sessionTitle.register` 必须包含非空字符串 `id`（如 `id: 'dsh-session-title-custom'`），否则 `validateProvider()` 抛错导致插件启动崩溃。
> 2. **无环境差异的 MMDD**：使用基于时间戳偏移 UTC+8 的纯数值计算，规避 Node/ICU 环境下 `Intl.DateTimeFormat` 可能输出 `09-03` 或带汉字的风险。
> 3. **首消息防超长截断**：提取首条消息前 2000 字符，防止超长上下文占用大量 Token 或导致模型超时。
> 4. **超时与路由保护**：`ctx.llm.stream` 增加 `purpose: 'session-title'`，优先继承 `request.route`，兜底 `deepseek-official / deepseek-v4-flash`。
> 5. **健壮解析与全半角清洗**：Prompt 输出支持全角 `｜` 或半角 `|`，使用 `/[|｜]/` 分割，校验类型合法性，组装统一全角 `MMDD｜类型｜主题`。
> 6. **纠正 Prompt 示例**：替换原反直觉的幻觉示例（“新功能讨论”对应“界面对齐检查”），确保 Few-shot 准确。

### 完整代码

```js
import { createUserMessage, BlockAssembler } from '@deepseek-ai/dsh-llm'
import { normalizeSessionTitle } from '@deepseek-ai/dsh-session-title'

const name = 'dsh-session-title-custom'
const inject = ['sessionTitle', 'llm', 'sessions']

const TYPES = ['功能', '设计', '修复', '优化', '发布', '探索', '文档', '研究']

const SYSTEM_PROMPT = [
  '你是会话标题生成助手。根据用户的第一条消息，判断对话类型并生成简短主题。',
  '',
  '规则：',
  `- 类型只能是以下之一：${TYPES.join('、')}`,
  '- 主题用 2-8 个字概括消息内容',
  '- 主题不要出现类型名称',
  '- 输出格式为一行：类型|主题',
  '- 不要输出其他文字，不要引号，不要解释',
  '',
  '示例：',
  '消息：优化批次文字显示',
  '输出：优化|批次文字显示',
  '',
  '消息：整合快捷键提示页面',
  '输出：功能|整合快捷键提示页',
  '',
  '消息：提交代码到 GitHub',
  '输出：发布|提交代码到GitHub',
  '',
  '消息：讨论新版会话界面的设计方案',
  '输出：设计|会话界面方案',
  '',
  '消息：排查网络请求超时的原因',
  '输出：修复|网络请求超时',
].join('\n')

function apply(ctx) {
  ctx.sessionTitle.register({
    id: 'dsh-session-title-custom', // 必填：未传会导致 validateProvider 抛错
    automatic: 'first-prompt',
    async generate(request) {
      const { session, messages, signal } = request
      const first = messages[0]
      if (first === undefined) throw new Error('dsh-session-title-custom: no messages')

      // ① 日期：计算 Asia/Shanghai (UTC+8) 的 MMDD，无 locale 差异
      const ts = session.header.createdAt
      const d = new Date(ts + 8 * 3600 * 1000)
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      const mmdd = `${mm}${dd}`

      // ② 首条消息文本（防御超长输入）
      const msgText = first.text.slice(0, 2000)

      // ③ 模型路由决策
      const route = request.route ?? {
        provider: 'deepseek-official',
        model: 'deepseek-v4-flash',
      }

      // ④ 调 LLM
      const assembler = new BlockAssembler()
      for await (const chunk of ctx.llm.stream({
        provider: route.provider,
        model: route.model,
        system: SYSTEM_PROMPT,
        messages: [createUserMessage({
          content: [{ type: 'text', text: JSON.stringify({ message: msgText }) }],
          source: { kind: 'plugin', plugin: 'dsh-session-title-custom' },
        })],
        maxTokens: 128,
        reasoningEffort: 'off',
        purpose: 'session-title',
        signal,
      })) {
        assembler.push(chunk)
      }
      signal?.throwIfAborted()
      if (assembler.finish.kind === 'error' || assembler.finish.kind === 'aborted') {
        throw (assembler.finish.failure instanceof Error
          ? assembler.finish.failure
          : new Error(assembler.finish.failure?.message ?? 'stream failure'))
      }

      // ⑤ 提取 LLM 输出并解析
      const raw = assembler.blocks()
        .filter(b => b.type === 'text')
        .map(b => b.text).join(' ')
        .replace(/```[^\n]*\n?/g, '')
        .replace(/```/g, '')
        .trim()

      const firstLine = raw.split(/\r?\n/).map(l => l.trim()).find(Boolean) || ''
      const parts = firstLine.split(/[|｜]/).map(s => s.trim())
      if (parts.length < 2) {
        throw new Error(`dsh-session-title-custom: missing delimiter in "${raw}"`)
      }

      const type = parts[0]
      if (!TYPES.includes(type)) {
        throw new Error(`dsh-session-title-custom: invalid type "${type}" in "${raw}"`)
      }

      let topic = parts.slice(1).join('｜').replace(/^[“"']+|[”"'.。]+$/g, '').trim()
      if (!topic) {
        throw new Error('dsh-session-title-custom: empty topic')
      }

      // ⑥ 组装最终标题：全角统一 MMDD｜类型｜主题
      const finalTitle = `${mmdd}｜${type}｜${topic}`

      // 安全清洗与截断
      const title = normalizeSessionTitle(finalTitle, 80)
      if (title.length === 0) throw new Error('dsh-session-title-custom: empty after normalize')

      return {
        title,
        messageSeqs: [first.seq],
        model: route,
      }
    },
  })
}

export { apply, inject, name }
```

---

## 步骤 5：注册到 Profile 并建立依赖软链

### 5a. `profile/package.json`

在 `C:\Users\Administrator\.dsh\profiles\web\package.json` 中：

1. `dependencies` 添加：
   ```json
   "dsh-session-title-custom": "link:../../../../../dsh-ecosystem/plugins/dsh-session-title-custom"
   ```
2. `dsh.profile.bundles` 列表添加：
   ```json
   "dsh-session-title-custom"
   ```

### 5b. `profile/cordis.patch.yml`

> **排查修复项**：Profile 的 `cordis.patch.yml`（第 66-74 行）已存在 `- id: session-title-llm` 的配置块。不能简单在文末重复追加同名 ID，应直接在该配置块中加入 `disabled: true`：

```yaml
# ── Title generation config ─────────────────────────────────────────
- id: session-title-llm
  disabled: true
  config:
    provider: deepseek-official
    model: deepseek-v4-flash
    targetWords: 5
    targetCjkCharacters: 10
    maxInputBytes: 4096
    maxOutputTokens: 128
    timeoutMs: 120000
```

### 5c. 关键步骤：执行 `link-peer-deps.ps1`

> **排查修复项**：Node ESM 解析以真实路径为准。插件通过 `link:` 引用时，只能在 `C:\dsh-ecosystem\plugins\node_modules\@deepseek-ai` 解析 `@deepseek-ai/dsh-session-title`。必须运行软链脚本创建 junction：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\dsh-ecosystem\plugins\link-peer-deps.ps1
```

---

## 步骤 6：重启 DSH

- 重启 `dsh web` 后端使 Host 插件生效。
- 浏览器刷新页面。

---

## 实施注意事项与隐患排查表 (Checklist)

| 编号 | 检查点 | 风险说明 | 修复方案 |
|------|--------|----------|----------|
| 1 | `register` 必填 `id` | 缺少 `id` 属性会导致 `SessionTitleService.validateProvider()` 抛错崩溃 | 显式传入 `id: 'dsh-session-title-custom'` |
| 2 | Peer 依赖软链 | Node ESM 找不到 `@deepseek-ai/dsh-session-title` 报 `ERR_MODULE_NOT_FOUND` | 运行 `link-peer-deps.ps1` 建立目录 Junction |
| 3 | 分隔符全半角 | 目标全角 `｜` 与提示词半角 `|` 混合；模型输出全角时 `raw.includes('|')` 误报 | 用 `/[|｜]/` 正则兼容切割，统一按全角拼装 |
| 4 | 日期格式化 | `Intl.DateTimeFormat` 在不同系统/ICU 下可能带短横线或汉字 | 改用 UTC+8 纯数值月日拼接 (`0903`) |
| 5 | 超长消息溢出 | 首条消息若粘贴数万字代码，直接发给 LLM 会导致 Token 爆炸 | 输入截取 `first.text.slice(0, 2000)` |
| 6 | LLM 标识与超时 | 缺 `purpose` 影响统计；缺超时保护可能导致悬挂 | 添加 `purpose: 'session-title'`，支持 route 继承 |
| 7 | Few-shot 示例 | “新功能讨论” → “界面对齐检查” 逻辑脱节，模型易产生幻觉 | 替换为贴近实际语义的示例 |
| 8 | `package.json` 清单 | 漏打 `cordis.patch.yml`；peerDep 用 `workspace:^` 语法不规范 | 补充 `files`，规范 peerDep 版本 |
| 9 | Profile Patch 冲突 | Profile 已有 `session-title-llm` 条目，重复追加易冲突 | 直接在已有条目上设置 `disabled: true` |

---

## 验证方法

| 入口 | 操作 | 预期结果 |
|------|------|----------|
| 新建会话自动命名 | 新建会话 → 发送第一条消息 | 几秒后标题变为 `MMDD｜类型｜主题`（如 `0907｜优化｜批次文字显示`） |
| 右键 → 自动命名 | 右键已有会话 → 自动命名 | 同样生成 `MMDD｜类型｜主题`，日期保持会话创建日 |
| 格式异常/识别失败 | 发送无法提炼的消息或 LLM 异常 | 自动降级保留内置 Fallback 原标题，不破坏会话正常使用 |

---

## 回退方案

如需恢复内置命名：
1. 将 `profile/cordis.patch.yml` 中的 `session-title-llm` 去掉 `disabled: true`。
2. 从 `profile/package.json` 移除 `dsh-session-title-custom` 的 link 依赖及 bundles 条目。
3. 重启 DSH。
