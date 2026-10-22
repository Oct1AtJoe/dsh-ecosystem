# 插件包名统一改造计划 v7（交接执行文档）

> **本文档写给「在 DSH 之外」执行的 agent。**
> 原计划试图在 DSH 会话内执行，已实测确认**不可行**，原因见 §0。
> 目标：把 11 个插件的包名统一成 `dsh-<功能>` —— **去掉 `@deepseek-ai/` 作用域、去掉 `client-ui`、去掉 `custom`**，
> 目录名 = 包名去掉 `dsh-` 前缀，并在 v7 Release 里给出旧名 → 新名的迁移方案。

---

## 0. 为什么必须换环境执行（已实测的阻塞项）

| # | 阻塞项 | 实测证据 | 后果 |
|---|---|---|---|
| B1 | **没有 TypeScript** | `E:\vibeCoding\deepseek-harness` 不存在；`plugins/node_modules\typescript` 无；`plugins/node_modules\.pnpm` 46 个包里无 typescript；`app.asar.unpacked\node_modules` 无；`where.exe tsc` 无结果；`npm root -g` 为空目录 | AGENTS.md §4.2 的「`tsc` 必须 exit 0」门禁**无法履行**，类型错误会静默存活到下次真实契约变更 |
| B2 | **`bin\pnpm.cmd` 是坏 shim** | 内容写死 `C:\Users\Administrator\.local\bin\nodejs24\node.exe` + `C:\Users\Administrator\AppData\Local\node\corepack\v1\pnpm\11.28.5`，本机用户是 `z2444`；执行报 `The system cannot find the path specified` | `pack-plugins.mjs`、`plugin-dev-link.mjs` 都走这个解析链 → **打包与切依赖全失败** |
| B3 | **没有 `gh`** | `gh` 不是可识别命令 | 无法 `release create/upload`；且 `plugin-dev-link.mjs release` 查不到 tag 时回退 `RELEASE_TAG_FALLBACK='v5'`，会把**不存在的 URL 写进 profile**（§5.3.1 记录过的真实故障） |
| B4 | **没有 `esbuild`** | `plugins/node_modules/esbuild` 无；`kanye-pet/scripts/build-client.mjs` 的候选路径（本地 `.bin` / `$DSH_CHECKOUT` / `/tmp/dsh-0808`）全不存在 → 只会返回 `skipped` | `kanye-pet` 客户端产物不可重建；`dsh-git-panel/scripts/build.mjs`（`import { build } from 'esbuild'`）不可运行 |
| B5 | **没有 `vitest`** | `plugins/node_modules/vitest` 无 | `produced-files.client.spec.tsx`、`pagination-guard.spec.ts`、`tech-theme-row.client.spec.tsx` 三个门禁跑不了（`*.mjs` 门禁可跑，实测 `badge-token-check.mjs` exit 0） |
| B6 | **宿主正在运行 = 执行者自己** | 端口 5980 由 PID 11372 占用，即承载本会话的 DSH 桌面端 | 阶段 4（改 profile + `pnpm install`）要求**应用完全退出（托盘退出，不是关窗口）**；阶段 4.6 要求**重启宿主** → 在 DSH 内执行等于自杀，任务必然中断 |
| B7 | **AGENTS.md / README 的路径全是另一台机器的** | 文档写 `C:\dsh-ecosystem` + `C:\Users\Administrator`，本机是 `D:\VibeCoding\dsh-ecosystem` + `C:\Users\z2444` | 任何复制粘贴的命令都会打空。**必须先做 §1 的路径重绑定** |

### 0.1 本机可用 / 不可用工具清单（实测）

```text
✅ node            v22.19.0                    （满足插件 engines ^22.19.0）
✅ git             2.20.1.windows.1
✅ tsdown          plugins/node_modules/tsdown/dist/run.mjs   （实测 --version 0.22.14，构建 exit 0）
✅ lightningcss    plugins/node_modules/lightningcss
✅ dsh CLI         D:\soft\dshDesktop\resources\runtime\cli\bin\dsh.cmd   （0.2.1-rc.2）
✅ pnpm（可用副本）  D:\soft\dshDesktop\resources\runtime\primary-runtime\dependencies\pnpm\bin\pnpm.mjs  （11.28.5）
✅ 桌面端          D:\soft\dshDesktop\resources\app.asar   （182,794,869 B）
❌ tsc / typescript
❌ esbuild / vitest / @types/react / @deepseek-ai/* 官方包 junction（见 §0.2）
```

> 后续命令一律用**绝对路径**调用可用副本，不要依赖 `bin\pnpm.cmd`：
> `$PNPM = 'D:\soft\dshDesktop\resources\runtime\primary-runtime\dependencies\pnpm\bin\pnpm.mjs'`
> `$DTS  = 'D:\soft\dshDesktop\resources\runtime\cli\bin\dsh.cmd'`

### 0.2 前置缺陷：官方包 junction 大面积缺失（AGENTS.md §4.3 说的坑）

`plugins/node_modules/@deepseek-ai/` 里**只有 `cosmokit` 和 `schemastery` 两个 junction**。
AGENTS.md §4.3 要求「任何 harness 包都必须在 `plugins/node_modules/@deepseek-ai/` 下有 junction」（原文提到 24 个）。
缺失的后果正是文档里记录的假报错铺满整个文件（`Property 'slots' does not exist on type 'Context'` 之类）。

> **所以就算补上了 typescript，tsc 也会先炸在依赖解析上。**
> 若执行机器上没有 harness checkout，请**先解决 B1/§0.2，再开始改名**；否则退化为 §3 的「降级路径」。

---

## 1. 执行前第一步：路径重绑定（不要跳过）

```powershell
# 在目标机器上重新确认这些值，后续所有命令用变量，不要抄文档里的绝对路径
$REPO     = '<这台机器上的 dsh-ecosystem 根>'          # 本机: D:\VibeCoding\dsh-ecosystem
$PROFILE  = "$env:USERPROFILE\.dsh\profiles\desktop"   # 本机: C:\Users\z2444\...
$PNPM     = '<可用的 pnpm.mjs>'
$DTS     = '<可用的 dsh.cmd>'
$HARNESS  = '<官方 harness checkout>'                  # 提供 typescript + tsdown + @deepseek-ai/* 源
$asarDsh  = "$env:DSH_INSTALL\resources\app.asar\dsh"   # 本机: D:\soft\dshDesktop\...
```

确认清单（逐条打印后再动手）：

- [ ] `node -e "console.log(process.version)"` ≥ 22.19.0
- [ ] `node "$PNPM" --version` 有输出
- [ ] `tsc --version` 可用（不可用 → 走 §3.4 降级路径，并**明确记录本次未做类型检查**）
- [ ] 目标机器上 DSH 桌面端**已完全退出**（托盘图标右键退出）。`Get-NetTCPConnection -LocalPort <当前端口>` 查不到进程
- [ ] `git status --porcelain` 干净（本机实测干净，HEAD = `7e18f9e docs: 明确插件发布顺序…`，remote = `https://github.com/Oct1AtJoe/dsh-ecosystem.git`，branch = `main`）

---

## 2. 命名对照表（唯一权威，执行时逐行核对）

| # | 现目录 | 现包名 | **新目录** | **新包名** | 发布状态 |
|---|---|---|---|---|---|
| 1 | `plugins/dsh-git-panel` | `dsh-git-panel` | `git-panel` | `dsh-git-panel`（**不变**） | ✅ v6 0.1.22 |
| 2 | `plugins/kanye-pet` | `@deepseek-ai/dsh-kanye-pet` | `kanye-pet`（不变） | `dsh-kanye-pet` | ✅ 0.1.1-rc.4 |
| 3 | `plugins/ui-kanye-pet` | `@deepseek-ai/dsh-client-ui-kanye-pet` | `kanye-pet-settings` | `dsh-kanye-pet-settings` | ✅ 0.1.3 |
| 4 | `plugins/ui-theme-custom` | `@deepseek-ai/dsh-client-ui-theme-custom` | `theme-tech` | `dsh-theme-tech` | ✅ 0.1.0-rc.12 |
| 5 | `plugins/ui-queue-recall` | `@deepseek-ai/dsh-client-ui-queue-recall` | `queue-recall` | `dsh-queue-recall` | ✅ 0.1.0-rc.3 |
| 6 | `plugins/ui-resend-failed-round` | `@deepseek-ai/dsh-client-ui-resend-failed-round` | `resend-failed-round` | `dsh-resend-failed-round` | ✅ 0.1.0-rc.3 |
| 7 | `plugins/ui-subagent-custom` | `@deepseek-ai/dsh-client-ui-subagent-custom` | `subagent-card` | `dsh-subagent-card` | ✅ 0.2.0-rc.3 |
| 8 | `plugins/ui-deliverables-custom` | `@deepseek-ai/dsh-client-ui-deliverables-custom` | `deliverables` | `dsh-deliverables` | ❌ 不在 `PUBLISHED`，不发 |
| 9 | `plugins/dsh-session-title-custom` | `dsh-session-title-custom` | `session-title` | `dsh-session-title-gen` | ✅ 0.1.3 |
| 10 | `plugins/dsh-session-folders-custom` | `dsh-session-folders-custom` | `session-folders` | `dsh-session-folders` | ✅ 0.1.2 |
| 11 | `plugins/dsh-file-upload-custom` | `dsh-file-upload-custom` | `file-upload` | `dsh-file-upload` | ✅ 2.1.2 |

> **为什么 #9 不是 `dsh-session-title`**：宿主侧官方包就叫 `@deepseek-ai/dsh-session-title`
> （`tsconfig.base.json` L63-64 有它的 paths 映射，本插件的 `peerDependencies` 也依赖它）。
> 去掉作用域后 npm 层面不会真撞车，但日志/报错里「本地插件」与「宿主包」会永久无法区分，故加 `-gen`。
>
> **版本号策略**：改名属破坏性变更。`<1.0` 的 **minor +1**（如 `dsh-theme-tech` `0.1.0-rc.12` → `0.2.0`、
> `dsh-kanye-pet` `0.1.1-rc.4` → `0.2.0`、`dsh-kanye-pet-settings` `0.1.3` → `0.2.0`、
> `dsh-queue-recall`/`dsh-resend-failed-round` `0.1.0-rc.3` → `0.2.0`、`dsh-subagent-card` `0.2.0-rc.3` → `0.3.0`、
> `dsh-session-title-gen` `0.1.3` → `0.2.0`、`dsh-session-folders` `0.1.2` → `0.3.0`）；
> `>=1.0` 的 **major +1**（`dsh-file-upload` `2.1.2` → `3.0.0`）。
> #1 `dsh-git-panel` 名称不变，但**目录名变了** → 产物文件名不变，重传会撞缓存，所以同样 bump 到 `0.1.23`。

---

## 3. 改名红线：这些**绝对不许动**

改完之后 `git diff` 里出现下列任何一项的改动，就是**改错了**：

| 类别 | 必须保持原样的值 | 动了会怎样 |
|---|---|---|
| **cordis loader 条目 `id`** | `- id: kanye-pet`、`- id: dsh-session-title-custom`、`- id: ui-git-panel`、`- id: kanye-pet`（settings）、各插件 `insert:` 里的 `id:`（`ui-theme-custom` / `ui-queue-recall` / `ui-resend-failed-round` / `ui-subagent-custom` / `ui-kanye-pet` / `ui-deliverables-custom` / `file-upload-custom` / `dsh-session-folders-custom`） | **settings 页 = loader 条目 id + 插件导出的 `Config`**（`kanye-pet/AGENTS.md` §2.1、§七#40）。`ui-kanye-pet` 客户端调 `ctx.configForms.get('kanye-pet')`；profile 的配置也写在 `- id: kanye-pet` 节。改 id → **设置页整块空白 + 零报错**；profile 里挂着的 `desktopPetEnabled` / `desktopNotificationEnabled` / session-title 的 `models`+`maxTokens` 全部变孤儿 |
| **只改 `name:`，不改 `id:`** | 每个 `cordis.patch.yml` 里 `- insert:` 下的 `id:` 保持原值，只把 `name:` 换成新包名 | 同上，这是本次改造**唯一安全的改法** |
| **HTTP 路由** | `/kanye-pet/*`（`window`/`config`/`state`/`assets`/`sessions`）、`/git-panel`、`/api/file-upload/*` | `patches/kanye-pet-electron` 硬编码 `dsh-app://app/kanye-pet/window`，`verify.mjs:78` 断言 `"dsh-app://app/kanye-pet/window"` 字面量。改路由 → 补丁自检失败 / 宠物窗永远 503 |
| **settings 命名空间** | `kanye-pet/lib/src/config.mjs` 的 `NAMESPACE = 'kanye-pet'`、`ui-kanye-pet/src/client/kanye-card-controller.ts` 的 `KANYE_NS = 'kanye-pet'` | 已持久化的用户配置全部丢失，三层校验（schema / controller / locale）错位 |
| **localStorage 键** | `dsh-theme-preference`、`dsh-home-layout`、`dsh-show-schedule-entry`、`dsh-claude-mascot-enabled`、右栏宽度/侧栏字号键 | 用户已保存的主题、布局、开关**静默失效**（表现：重启后回到默认主题） |
| **locale NS** | `deliverables`、`queueRecall`、`resend`、`subagent-composer`、theme 的 `SETTINGS_NS` | 文案全部回退成键名 |
| **槽位注册 `id`（list 槽）** | `ui-resend-failed-round/src/client/index.ts:42`、`ui-deliverables-custom/src/client/index.ts:169` 里 `id: '@deepseek-ai/dsh-client-ui-*'` | 见 §3.3。**默认不改**；要改必须整层一起重建 |
| **壳补丁** | `patches/**` 整个目录 | 补丁只认路由与自有符号，与包名无关 → 本次改造**不涉及**，别顺手改 |
| **`dsh.client.inject` / `peerDependencies` 里的官方包名** | 所有 `@deepseek-ai/dsh-*` 官方包引用 | 这些是**宿主包**，不是我们的包。全局 sed 会把它们一起干掉 → 直接崩溃 |

> 🚨 **禁止用「全局替换 `@deepseek-ai/` 前缀」这种一把梭脚本。**
> `dsh.client.inject`、`peerDependencies`、`devDependencies`、以及 `plugins/tsdown.client.ts` 里的
> `INLINE_SAFE` / `VENDORED_LIBRARY` / `GENERATED_REMOTE` 正则**都要保留 `@deepseek-ai/`**。
> 只替换 §2 表格里那 11 个**我们自己拥有的完整包名字符串**。

### 3.1 各插件的「构建等级」分类（决定怎么让它生效）

实测得到的分类，**必须区别对待**：

**T1 — tsdown 可重建（6 个）**：`theme-tech`、`queue-recall`、`resend-failed-round`、`subagent-card`、`kanye-pet-settings`、`deliverables`
- 都有 `tsdown.config.ts`（`clientBundle('<包名>', ['lib/types/index.js'])`）和**已提交的 `lib/types/`（152/20 个文件不等）**。
- 改 `tsdown.config.ts` 里的 id + `package.json` name → 跑 tsdown 即可刷新 `lib/client.js` 的 banner id / `data-plugin` / CSS tagId。
- ⚠️ tsdown 的 client 入口在**未设 `DSH_BUILD_FACE` 时取 `src/client/index.ts`**（见 `plugins/tsdown.client.ts` L116），
  即「tsdown 从源码直接打包、**完全跳过类型检查**」。所以改 src 而未跑 tsc = 无验证。
- ⚠️ 实测跑一次 tsdown 会污染 3 个 git 跟踪文件（`lib/client.js`、`lib/client.js.map`、`lib/index.js`）。
  这是预期的，但**别把它和源码改动混在一个 commit**；用 `git checkout -- plugins/<x>/lib` 可回退（我实测有效）。

**T2 — `lib/` 就是手写源码，无 src、不可构建（4 个）**：`file-upload`、`session-title`、`session-folders`、`kanye-pet`
- 实测这三个 `dsh-*-custom` **没有 `src/` 目录**（0 个 src 文件），`lib/*.js` 是手写的。`kanye-pet` 同理（`lib/index.mjs` + `lib/src/*.mjs` 手写）。
- 改名 = **直接文本编辑产物**：
  - `plugins/file-upload/lib/client.js:~1505` → `id: 'dsh-file-upload-custom'`
  - `plugins/file-upload/lib/index.js:~1693` → `export const name = 'dsh-file-upload-custom'`
  - `plugins/session-title/lib/index.js:~204` → `const name = 'dsh-session-title-custom'`
  - `plugins/session-title/lib/client.js` → 注释里 `dsh-session-title-custom — client half.`（L8）
  - `plugins/session-folders/lib/client.js:~38` → `id: "dsh-session-folders-custom"`
  - `plugins/session-folders/lib/{index,folder-utils}.js:3` → 文件头注释（纯注释，可不改）
  - `plugins/kanye-pet/lib/client.js:2` → `id: "@deepseek-ai/dsh-kanye-pet"`
- 🚨 **这些文件是 CRLF**（实测内容里带 `\r\n`）。用文本替换时必须保留 CRLF，别用会归一化换行的工具，否则整文件 diff。
- 🚨 **`session-title/lib/index.js`、`file-upload/lib/index.js`、`kanye-pet/lib/index.mjs` 含大量中文注释，历史上出现过 UTF-8 第三字节被 `?` 替换导致 SyntaxError 的事故**（`kanye-pet/AGENTS.md` §9.3）。只能用纯 UTF-8（无 BOM）编辑器改，**严禁用 PowerShell 的 `Set-Content -Encoding UTF8`**（会加 BOM，§七#30）。

**T3 — esbuild 构建（1 个）**：`git-panel`
- `scripts/build.mjs:23` 硬编码 `id: "dsh-git-panel"`；`import { build } from 'esbuild'`。
- 包名不变 → **理论上不需要重建**。只有目录改名，产物不受影响。若执行机有 esbuild 且你想顺手清理，再重建。

### 3.3 list 槽注册 id 的处置（默认：**不改**）

`ui-deliverables-custom/src/client/index.ts:169` 与 `ui-resend-failed-round/src/client/index.ts:42`
把包名当作 `conversation.chat.turnTail` **list 槽的注册 id**。按 AGENTS.md §3.2，list 槽按相同 `id` 遮蔽。

- 这两个 id 字符串目前只是「恰好等于包名」，**不是**跨插件契约（没有别的插件引用它）。
- 改它需要同时改 `src/` 并重建 `lib/types` + `lib/client.js`（T1 可行），但会额外制造无意义 diff。
- **结论：本次保留原值。** 若将来要清理，单独一次改动 + 完整重建 + 页面验证，别和包名改名混做。
  混做的风险：改完 src 但没跑 tsc，`lib/types/client/index.js` 里仍是旧 id，tsdown 从 src 打包 →
  产物与 `lib/types` 不一致，下次真实构建会暴露一个更难定位的问题。

### 3.4 没有 tsc 时的降级路径（若 §1 的 tsc 检查失败）

改名这件事**本身不改变任何类型**（只改字符串字面量与目录名），因此可以降级执行，但必须显式记录：

1. 只做「字符串替换 + 目录 `git mv`」，**不碰 `src/` 的逻辑**（因此 §3.3 的槽 id 保持不动正好符合降级要求）。
2. T1 用 `tsdown --config tsdown.config.ts` 重建产物（无类型检查）。
3. T2 手工编辑产物文本（保留 CRLF / 无 BOM UTF-8）。
4. 跑所有**能跑的** `.mjs` 门禁；`.spec.tsx` 三个标记为 `SKIP (vitest 不可用)`。
5. 在 commit message 与本文档 §9 的「执行记录」里写明：**「本次未完成 tsc 类型检查，原因：执行机无 typescript（B1）」**。
6. **在有 harness 的机器上补跑一次完整两阶段构建**，才算真正闭环。

---

## 4. 逐插件操作清单（每个插件 4 处，缺一不可）

对 §2 表格里每一行：

```text
① package.json          "name" → 新包名，"version" → 新版本
② cordis.patch.yml      仅 "- insert:" 下的 "name:" → 新包名；"id:" 保持不变（§3 红线）
                         文件头注释里的旧包名同步
③ tsdown.config.ts      clientBundle('<新包名>', [...])   ← 仅 T1 的 6 个有此文件
④ README*.md            一级标题 "# <旧包名>" → "# <新包名>"
⑤ locale/zh.json + en.json   meta.title 括号里的名字（见 §4.1）
⑥ lib/                  按 §3.1 的等级重建或手改
```

### 4.1 `locale/*.json` 的 `meta.title` —— 这才是用户在界面上看到的字符串

实测当前 11 个包的 title 全部把**旧目录名塞在括号里**，这正是本次问题的观感来源：

```
文件上传增强 (dsh-file-upload-custom)        →  文件上传增强 (dsh-file-upload)
Git 面板 (dsh-git-panel)                     →  不变
会话文件夹 (dsh-session-folders-custom)      →  会话文件夹 (dsh-session-folders)
会话标题生成 (dsh-session-title-custom)      →  会话标题生成 (dsh-session-title-gen)
侃爷桌面宠物 (kanye-pet)                     →  侃爷桌面宠物 (dsh-kanye-pet)
交付物面板定制 (ui-deliverables-custom)      →  交付物面板 (dsh-deliverables)
侃爷桌面宠物设置 (ui-kanye-pet)              →  侃爷桌面宠物设置 (dsh-kanye-pet-settings)
排队消息撤回 (ui-queue-recall)               →  排队消息撤回 (dsh-queue-recall)
失败轮次重发 (ui-resend-failed-round)        →  失败轮次重发 (dsh-resend-failed-round)
子代理卡片定制 (ui-subagent-custom)          →  子代理卡片定制 (dsh-subagent-card)
科技主题定制 (ui-theme-custom)               →  科技主题定制 (dsh-theme-tech)
```
英文 `meta.title` 同理（`File Upload Enhancer`、`Tech Themes & Customization` 等，只换括号里的标识）。
注意 `ui-*-custom` 的英文名里含 `Custom`/`Customization` 字样的，属于**文案**不是标识，保留。

> 🚨 改 `locale/*.json` 时同样注意编码。这些文件是纯 UTF-8 JSON，用 node 脚本读写最稳：
> `JSON.stringify(obj, null, 2) + '\n'`，**不要**加 BOM。

### 4.2 目录重命名（git 会做 rename detection，保留历史）

```powershell
cd $REPO
git checkout -b refactor/unify-plugin-names
git mv plugins/dsh-git-panel            plugins/git-panel
git mv plugins/ui-kanye-pet             plugins/kanye-pet-settings
git mv plugins/ui-theme-custom          plugins/theme-tech
git mv plugins/ui-queue-recall          plugins/queue-recall
git mv plugins/ui-resend-failed-round   plugins/resend-failed-round
git mv plugins/ui-subagent-custom       plugins/subagent-card
git mv plugins/ui-deliverables-custom   plugins/deliverables
git mv plugins/dsh-session-title-custom plugins/session-title
git mv plugins/dsh-session-folders-custom plugins/session-folders
git mv plugins/dsh-file-upload-custom   plugins/file-upload
# plugins/kanye-pet 目录名不变
```

> `git mv` 之前先确认这些目录**没有被宿主以 `link:` 引用着**（本机 profile 里 4 个是 `link:D:/VibeCoding/...`）。
> 若宿主在跑，改名会让 HMR watcher 每 500ms 轮询到不存在的路径。**这正是 §0 B6：必须先退出宿主。**

---

## 5. 仓库级连带修正（改名会打穿这些地方，实测已定位到行）

| 文件 | 位置 | 动作 |
|---|---|---|
| `tsconfig.base.json` | L228 / L230 / L231 / L232 | 删除这 4 条 `@deepseek-ai/dsh-client-ui-{theme-custom,deliverables-custom,resend-failed-round,subagent-custom}` → `./packages/client/*` 的**死映射**（`packages/client/` 在本仓不存在，`packages/` 下只有 `ui-chat-patched`）。留着会变成改名后的无主映射 |
| `scripts/pack-plugins.mjs` | `PUBLISHED` 数组（L32-43） | 目录名换成新目录（10 条）。`pkg.name.replace(/^@deepseek-ai\//,'')`（L119）**保留**做兼容即可，去掉作用域后是 no-op |
| `另一台电脑安装指南.md` | L17-26（清单+直链）、L19-23 的 `dsh-client-ui-*` 文件名、L93-102（升级脚本 10 条 URL）、L128-141（验证期望值）、L70/L75 | **整篇重写**，见 §7。新名全部是裸名，`node_modules/` 下不再有 `@deepseek-ai/` 那层 |
| `README.md` | L1（`# DSH 本地定制生态（C:\dsh-ecosystem）`）、L6-L17（目录树）、L55-L59、L98 | 目录树改成新目录 + 新包名；**顺手把 `C:\dsh-ecosystem` 校正为实际路径**（§0 B7） |
| `plugins/*/AGENTS.md` | `kanye-pet/AGENTS.md` §4.1 包结构、§4.2「URL：`/plugins/@deepseek-ai/dsh-client-ui-kanye-pet/client.js`」、§8 文件清单、§6.2 命令；`ui-deliverables-custom/AGENTS.md` 全文路径；`ui-kanye-pet/AGENTS.md` 标题 | 更新包名与路径。**注意 §4.2 那行 URL 是旧文档串错了**（`/plugins/<pkg>/client.js` 单包路径实测 404，真实是 `??a,b&rev=` 组合端点，见 `ui-kanye-pet/AGENTS.md` 自己的「验证方法」） |
| `plugins/theme-tech/tests/sequoia-neutral-check.mjs` | L24-L25 | 硬编码 `C:/Users/Administrator/.dsh/profiles/{desktop,web}/node_modules/@deepseek-ai/dsh-client-ui-theme-custom/lib/client.js` → 改成 `$PROFILE\node_modules\dsh-theme-tech\lib\client.js`，且**按实际用户名**。**这条不改就是假红灯** |
| `plugins/kanye-pet-settings/tests/verify-notif-and-buttons.mjs` | 含 `dsh-session-title-custom` 字符串 | 换成新名 |
| `plugins/session-title/{test.js,test-fallback.js,PLAN.md}` | 包名 + 绝对路径 | 换名；`PLAN.md` 若属历史记录可只加一行变更说明 |
| `build/stage2-plugins.mjs` | L16-L19、L42（`OUT = 'C:\\dsh-ecosystem\\desktop\\...'`） | 旧 Tauri 壳时代的实体化脚本（`desktop/` 已弃用）。**两种处置选一**：① 只把名字与新目录对齐；② 直接标记为 DEPRECATED 并在文件头注明「已随 Tauri 壳弃用，勿运行」。**推荐 ②**（它写的 `C:\dsh-ecosystem\external-repos\...` 在本机不存在） |
| `plugins/link-peer-deps.ps1` | L10-L25、L50（`$PluginsRoot = 'C:\dsh-ecosystem\plugins'`） | 路径是另一台机器的；至少把 `$PluginsRoot` 改为参数化。**不改会让 §0.2 的 junction 修复无法在本机执行** |
| `docs/*.md`（历史 fixlog / checklist / handoff） | 多处旧包名 | **不改**。历史档案照原样保留，只在被引用处加一句「包名已于 v7 统一，旧名见 §8」 |
| `另一台电脑安装指南.md` L3-L5 | 宿主版本 0.2.1-rc.2 / Release tag 列表 | 见 §7 |

### 5.1 明确「不要碰」的文件

- `plugins/tsdown.client.ts`、`plugins/build-preset/**` —— 官方 preset 的独立拷贝。里面 `INLINE_SAFE`/`VENDORED_LIBRARY`/`GENERATED_REMOTE`/`PLATFORM_MODULES` 引用的都是**宿主包名**，保留作用域。它按 `pkg.name` 查 `plugins/*/package.json`，改完 `package.json` 后自动匹配新名，无需改。
  （唯一要注意：`clientBundle(id)` 传的 id 必须与各 `package.json` 的 `name` **逐字相等**，否则 `workspaceManifest()` 直接抛 `no packages/*/* or plugins/* package.json declares the name <id>`。所以 ④ 与 ③ 必须同批改。）
- `patches/**` —— 见 §3。
- `packages/ui-chat-patched/**` —— vendored **官方包** `@deepseek-ai/dsh-client-ui-chat` 的覆盖副本，名字必须与官方逐字一致才能绕过 asar（AGENTS.md §6.2）。**严禁改名。**
- `dist-tarballs/**`（gitignored）、`.dsh-market`、`.plugin-manager` 日志。

---

## 6. 本机 profile 迁移（阶段 4）—— 必须「宿主已退出」时做

### 6.0 先认清一个偏差（重要，别把本机当基准）

本机 `desktop` profile 实测**只挂载了我们 11 个里的 6 个**：

```text
在 dependencies 里的（6）：
  @deepseek-ai/dsh-client-ui-theme-custom     = <v6 tarball URL>
  @deepseek-ai/dsh-client-ui-queue-recall     = link:D:/VibeCoding/.../plugins/ui-queue-recall
  @deepseek-ai/dsh-client-ui-resend-failed-round = link:D:/VibeCoding/.../plugins/ui-resend-failed-round
  dsh-git-panel                               = <v6 tarball URL>
  dsh-session-folders-custom                  = link:.../plugins/dsh-session-folders-custom
  dsh-session-title-custom                    = link:.../plugins/dsh-session-title-custom

残留但已不在 dependencies 的（node_modules/@deepseek-ai/ 里仍有实体目录）：
  dsh-client-ui-kanye-pet、dsh-kanye-pet
且 profile cordis.patch.yml 有一条无主的 "- id: kanye-pet" + config（applyEntryPatches 只 warn 并跳过）

结论：kanye-pet / ui-kanye-pet / ui-subagent-custom / ui-deliverables-custom / dsh-file-upload-custom
     在本机 desktop profile 当前未挂载。指南里的「10 个」是另一台电脑的状态。
     迁移脚本不能拿本机当「装齐 10 个」的基准，也别顺手在本机补齐 10 个——那是另一件事。
```

### 6.1 备份（必做，回滚靠它）

```powershell
cd $PROFILE
Copy-Item package.json      package.json.bak-rename
Copy-Item cordis.patch.yml  cordis.patch.yml.bak-rename
Copy-Item pnpm-lock.yaml    pnpm-lock.yaml.bak-rename
```

### 6.2 `package.json` 两处都要改

1. **`dependencies` 的 key**（11 个可能出现的旧名，按本机实际存在的改）：
   旧 key → 新 key，**值里的 `link:` 路径同时换成新目录**。
2. 🚨 **`dsh.profile.bundles`** —— 最易漏、后果最隐蔽的一处。本机实测含 6 条我们的条目：

```jsonc
"@deepseek-ai/dsh-client-ui-theme-custom",     →  "dsh-theme-tech",
"@deepseek-ai/dsh-client-ui-queue-recall",     →  "dsh-queue-recall",
"@deepseek-ai/dsh-client-ui-resend-failed-round", → "dsh-resend-failed-round",
"dsh-session-title-custom",                    →  "dsh-session-title-gen",
"dsh-session-folders-custom",                  →  "dsh-session-folders",
"dsh-git-panel"                                 （不变）
```
> 漏改的症状：依赖装好了、`node_modules` 里文件也在，但 loader 不挂载 → **页面静默少一半功能、零报错**。
> （`kanye-pet/AGENTS.md` §6.3 已记录：新增/改名的 `dsh.profile.bundles` 条目不会自动补，必须手工改。）

### 6.3 profile `cordis.patch.yml`

只改 `name:`，`id:` 与 `config:` 一个字节都不动（§3 红线）：

```yaml
- id: kanye-pet                      # 不变
  name: "dsh-kanye-pet"              # ← 只改这行
  config:
    desktopPetEnabled: true          # 不变
- id: dsh-session-title-custom       # 不变（改了会丢 models/maxTokens）
  name: dsh-session-title-gen        # ← 只改这行
  config: { ... }                    # 不变
- id: ui-git-panel                   # 不变
  disabled: false
```

### 6.4 清理旧实体 + 重装

```powershell
# 裸名包落在 node_modules 根；作用域包落在 node_modules/@deepseek-ai/
Remove-Item "$PROFILE\node_modules\@deepseek-ai\dsh-client-ui-*" -Recurse -Force -EA SilentlyContinue
Remove-Item "$PROFILE\node_modules\@deepseek-ai\dsh-kanye-pet"   -Recurse -Force -EA SilentlyContinue
Remove-Item "$PROFILE\node_modules\dsh-session-title-custom","$PROFILE\node_modules\dsh-session-folders-custom","$PROFILE\node_modules\dsh-file-upload-custom" -Recurse -Force -EA SilentlyContinue

cd $PROFILE
node $PNPM install --no-frozen-lockfile     # 用 §0.1 的可用 pnpm，不要用 bin\pnpm.cmd
```

### 6.5 切 link 源码验证（AGENTS.md §5.2 硬要求：不许跳过 link 就发布）

```powershell
cd $REPO
node scripts\plugin-dev-link.mjs link theme-tech --profile desktop
node scripts\plugin-dev-link.mjs status theme-tech --profile desktop
```
> ⚠️ `link`/`release` 子命令会跑 `pnpm install`，脚本内部走 `resolvePnpm()`，候选包含
> `%USERPROFILE%\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs` —— **本机该路径不存在**（实测 False）。
> 兜底候选是 `$REPO\bin\pnpm.cmd`（坏，B2）。
> 所以本机要么**先设 `PNPM_EXE` 环境变量**指向可用的 pnpm.mjs，要么把 §0.1 的可用路径补进脚本候选。
> 这是执行前必须解决的一个小改点，否则 `link` 会直接失败。

### 6.6 重启 + 页面验收

**第一次 link 必须重启宿主**（profile 被重装过，宿主在启动时解析并缓存每个 `client.js` 路径）。
之后改源码只需「重建 + `Ctrl+F5`」（HMR watcher 每 500ms 轮询）。

- [ ] 设置 → 插件：插件标题显示 `科技主题定制 (dsh-theme-tech)` 等**新标识**
- [ ] 主题切换、侧边栏字号、右栏宽度、输入框挂件、自动化任务入口开关 —— **全部保持原值**（证明 localStorage 键与 loader id 都没被改坏）
- [ ] 桌宠设置页**有内容**（不是空白 tab）—— 这条专门验证 `- id: kanye-pet` 未被动过
- [ ] 排队撤回、失败轮次重发、子代理卡片、文件拖拽上传、会话文件夹、Git 面板：逐一功能验证
- [ ] DevTools Console 无 `ModuleLoader` / `no packages... declares the name` 报错
- [ ] `<style data-plugin="dsh-theme-tech">` 出现（新 id 已生效）

---

## 7. 发布 v7 + 另一台电脑迁移（阶段 5）

前置：**§6.6 页面验收通过**。未通过不要发布（AGENTS.md §5 开头：不能让用户拿旧产物验收新代码）。

顺序**硬性**（§5.3：切回发布版必须排最后）：

```powershell
cd $REPO
# 1. 版本号已在 §4 ① 改好（tarball 文件名会带新版本）
# 2. 先更新 另一台电脑安装指南.md（§5.4 第 0 阶段：必须在 pack 之前）
# 3. 重建全部插件（T1 两个阶段；T2 是手改，无需构建）
# 4. 打包
node scripts\pack-plugins.mjs        # 需要可用 pnpm（B2/§6.5）
# 5. 提交推送
git add -A
git commit -m "refactor(plugins): 统一包名为 dsh-<功能>（去 @deepseek-ai/ 作用域、去 ui/client/custom）"
git push origin refactor/unify-plugin-names
# 6. 建 Release 并上传（需要 gh —— B3，本机缺）
gh release create v7 dist-tarballs/* --title "dsh-ecosystem plugins v7（包名统一）" --notes "..."
# 7. 【最后】切回发布版依赖
node scripts\plugin-dev-link.mjs release theme-tech --profile desktop
```

### 7.1 `另一台电脑安装指南.md` 必须重写的段落

1. **L9-L26 清单表**：10 条完整直链换新文件名，例：
   `.../v7/dsh-theme-tech-0.2.0.tgz`、`.../v7/dsh-kanye-pet-settings-0.2.0.tgz`、
   `.../v7/dsh-queue-recall-0.2.0.tgz`、`.../v7/dsh-resend-failed-round-0.2.0.tgz`、
   `.../v7/dsh-subagent-card-0.3.0.tgz`、`.../v7/dsh-session-title-gen-0.2.0.tgz`、
   `.../v7/dsh-session-folders-0.3.0.tgz`、`.../v7/dsh-file-upload-3.0.0.tgz`、
   `.../v7/dsh-kanye-pet-0.2.0.tgz`、`.../v7/dsh-git-panel-0.1.23.tgz`
2. **L128-141 验证期望值**：⚠️ **全部 10 行都变成裸名，`@deepseek-ai/` 那一层消失**。示例新期望：
   ```
   dsh-deliverables 未发布，故不在列表
   dsh-file-upload            ...  dsh-file-upload-3.0.0.tgz
   dsh-git-panel              ...  dsh-git-panel-0.1.23.tgz
   dsh-kanye-pet              ...  dsh-kanye-pet-0.2.0.tgz
   dsh-kanye-pet-settings     ...  dsh-kanye-pet-settings-0.2.0.tgz
   dsh-queue-recall           ...  dsh-queue-recall-0.2.0.tgz
   dsh-resend-failed-round    ...  dsh-resend-failed-round-0.2.0.tgz
   dsh-session-folders        ...  dsh-session-folders-0.3.0.tgz
   dsh-session-title-gen      ...  dsh-session-title-gen-0.2.0.tgz
   dsh-subagent-card          ...  dsh-subagent-card-0.3.0.tgz
   dsh-theme-tech             ...  dsh-theme-tech-0.2.0.tgz
   ```
3. **L3-L5 头部**：历史版本加 `v7`；宿主版本仍 0.2.1-rc.2（`engines.dsh` 未变）。
4. **新增「从 v6 迁移到 v7（必读）」章节**，内容见 §7.2。
5. 桌宠「要装两个」的提醒改名：`dsh-kanye-pet` + `dsh-kanye-pet-settings`。

### 7.2 另一台电脑的迁移脚本（写进指南）

🚨 **旧名不会自动消失。`dsh plugin add` 新名 ≠ 覆盖旧名** —— 包名变了就是新依赖，
旧包继续挂载会造成**同一 UI 双份渲染**（两个主题注册、两个 turnTail 条目、两份宠物）。
所以必须先卸载再装。

```powershell
$dsh = 'E:\dshDesktop\resources\runtime\cli\bin\dsh.cmd'
if (-not (Test-Path $dsh)) { $dsh = 'D:\soft\dshDesktop\resources\runtime\cli\bin\dsh.cmd' }

# 1) 卸载全部旧标识（dsh plugin 把参数转发给 profile 目录的 pnpm；支持 remove）
@(
  '@deepseek-ai/dsh-client-ui-theme-custom'
  '@deepseek-ai/dsh-client-ui-queue-recall'
  '@deepseek-ai/dsh-client-ui-resend-failed-round'
  '@deepseek-ai/dsh-client-ui-subagent-custom'
  '@deepseek-ai/dsh-client-ui-kanye-pet'
  '@deepseek-ai/dsh-kanye-pet'
  'dsh-session-title-custom'
  'dsh-session-folders-custom'
  'dsh-file-upload-custom'
  'dsh-git-panel'                 # 包名不变，但版本升到 0.1.23，可只 add 覆盖；这里一并卸载保证干净
) | ForEach-Object { & $dsh plugin --profile desktop remove $_ }

# 2) 删残留实体目录
$nm = "$env:USERPROFILE\.dsh\profiles\desktop\node_modules"
Remove-Item "$nm\@deepseek-ai\dsh-client-ui-*","$nm\@deepseek-ai\dsh-kanye-pet" -Recurse -Force -EA SilentlyContinue
Remove-Item "$nm\dsh-session-title-custom","$nm\dsh-session-folders-custom","$nm\dsh-file-upload-custom" -Recurse -Force -EA SilentlyContinue

# 3) 🚨 手工改 profile 的两处（remove 不会替你改）
#    a) package.json → dsh.profile.bundles：旧 6 条换成新名（见 §6.2）
#    b) cordis.patch.yml：只改 name:，不动 id:/config:（见 §6.3）

# 4) 安装 v7 新包（10 条 URL，同 §7.1 清单）
# 5) 完全退出应用 → 重启（路径在启动期解析并缓存，光刷页面无效）
```

> 迁移后**必须验证**：`node -e "console.table(require(process.env.USERPROFILE+'/.dsh/profiles/desktop/package.json').dependencies)"`
> 期望 10 行全部裸名、`@deepseek-ai/` 一行都不剩。

---

## 8. 验收硬门禁（全绿才算完成）

```powershell
cd $REPO
# G1 无残留旧标识（只应命中 docs/、build/、README 历史说明、另一台电脑安装指南的历史段）
git grep -n "@deepseek-ai/dsh-client-ui-\|@deepseek-ai/dsh-kanye-pet\|dsh-session-title-custom\|dsh-session-folders-custom\|dsh-file-upload-custom"

# G2 包名形状：11 个都不含 @ / ui / client / custom
node -e "const fs=require('fs');for(const d of fs.readdirSync('plugins',{withFileTypes:true}).filter(e=>e.isDirectory())){const p='plugins/'+d.name+'/package.json';if(!fs.existsSync(p))continue;const n=JSON.parse(fs.readFileSync(p,'utf8')).name;if(/@|^dsh-client-|(^|-)ui-|custom/.test(n))console.log('BAD',d.name,n)}"

# G3 产物里的 bundle id 已换新（应零命中 @deepseek-ai）
Select-String -Path plugins\*\lib\client.js -Pattern 'id:\s*"[^"]+"' | Where-Object LineNumber -le 3 |
  Where-Object { $_.Line -match 'deepseek-ai' }

# G4 pack 数量必须 10/10（漏改 PUBLISHED 会静默 skip）
node scripts\pack-plugins.mjs          # 期望末行 "10/10 tarballs ready"

# G5 manifest 与指南逐条对齐（版本号 + 文件名）
node -e "console.table(require('./dist-tarballs/manifest.json'))"

# G6 能跑的 .mjs 门禁全绿；.spec.tsx 标记 SKIP 并记录原因
```

- [ ] G1 命中集合为空（或只剩刻意保留的历史说明）
- [ ] G2 无输出
- [ ] G3 无输出
- [ ] G4 `10/10`
- [ ] G5 与 §7.1 一一对应
- [ ] G6 `.mjs` 全绿；vitest 三个若跑不了必须写进 §9 记录
- [ ] **人工确认**：`git diff` 里 §3 红线表出现的 id / 路由 / NAMESPACE / localStorage 键 / 官方包引用**一处都没变**

---

## 9. 执行记录（执行者填，逐条不留空）

```text
执行机：            REPO=________  PROFILE=________  node=________
工具实况：          tsc=可用/不可用  pnpm=________  gh=可用/不可用  esbuild=____  vitest=____
降级路径(§3.4)：    是/否 —— 若「是」，本次未完成类型检查
G1..G6 结果：      ________
页面验收(§6.6)：   6 项复选全过？是/否 —— 特别注明「桌宠设置页是否有内容」
发布：             v7 tag=______  上传方式=gh/手工
未完成项：         ________
```

---

## 10. 回滚

| 层级 | 命令 |
|---|---|
| 代码 | `git checkout main`（改名全在 `refactor/unify-plugin-names` 单分支单 commit，`git revert` 亦可） |
| profile | 还原 §6.1 三个 `.bak-rename` → `node $PNPM install --no-frozen-lockfile` → **完全退出应用并重启** |
| Release | `gh release delete v7 --yes`；v6 资产不受影响（文件名不同，未覆盖） |
| 已迁移到 v7 的电脑 | 按 §7.2 反向执行（卸新名 → 清目录 → profile 两处还原 → 装 v6 URL） |

---

## 附：为什么这份计划不能在 DSH 会话内跑（一句话版）

改名 → 要重建产物（缺 tsc/esbuild，见 B1/B4）→ 要重装 profile（要求应用完全退出，见 B6）→
要重启宿主验证（**会杀掉正在执行任务的这个会话自己**）。
再加发布环节的 `gh` 缺失（B3）与坏 pnpm shim（B2）。
**所以：在 DSH 之外的终端里，按 §1→§8 顺序执行。**
