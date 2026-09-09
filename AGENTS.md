# DSH 本地定制生态开发规范（C:\dsh-ecosystem）

> 本文件为工作区级开发指南。DSH 按 用户全局（`~/.dsh/AGENTS.md`）→ 项目根（`C:\dsh-ecosystem\AGENTS.md`）→ cwd 链 顺序加载。
> 本工作区所有插件开发、缺陷修复与维护任务均须严格遵守本文档。

---

## 1. 核心铁律（硬约束）

1. **官方源码零修改**：严禁向官方 checkout（`E:\vibeCoding\deepseek-harness\`）写入任何文件或执行修改。上游必须保持 `git pull` 零冲突干净状态。
2. **挂载只走 Profile 原生机制**：所有自定义插件均置于 `C:\dsh-ecosystem\plugins\<包名>`，通过 `~/.dsh/profiles/web/` 的 `link:` 协议依赖与 `cordis.patch.yml` 注入，不得反向侵入宿主。
3. **构建纯度门**：Client bundle 严禁运行时符号跨插件混入（禁止直接 value-import `@deepseek-ai/*` 非白名单内部模块），交互一律通过 Cordis 服务、API Controller 或 Slot 机制解耦。
4. **主题令牌契约**：禁止硬编码颜色，界面样式必须严格消费 `--dsw-*`（better-sidebar 令牌）或 `--ds-*`（DSH 官方设计令牌）CSS 变量。

---

## 2. 插件架构总览（Node Host + Browser Client）

DSH Web 插件采用双端架构：

```
plugins/<plugin-name>/
├── src/
│   ├── index.ts                 # Node-half 桩入口（空 apply，供 Cordis/Loader 拓扑识别）
│   ├── css-modules.d.ts         # CSS Modules 类型声明（如有样式）
│   └── client/
│       ├── index.ts             # Browser-half 客户端入口（apply + 业务/Slot 注册）
│       ├── locales.ts           # 本地化字典（NS 命名空间，zh / en）
│       ├── Component.tsx        # React 界面组件
│       └── Component.module.css # 局部作用域样式
├── package.json                 # 包元数据、exports、dsh.client、peerDependencies
├── tsconfig.json                # 继承 ../../tsconfig.base.client.json
└── tsdown.config.ts             # 调用 ../tsdown.client.ts 的 clientBundle 预设
```

### 端职责分工
- **Node Host 半**：通常为纯 UI 插件的桩，提供空 `export function apply(): void {}`，供宿主 Cordis 加载器将插件名册编入 `window.__DSH_BOOT__`。
- **Browser Client 半**：由 `dsh-client-modules` 打包为外部 Combo 脚本，通过惰性工厂（`window.__ModuleLoader__.load`）加载，由浏览器端 Cordis 容器编排激活。

---

## 3. Slot 组合机制与 Shadowing 规则

### 3.1 显式注入（Slot Declaration Injection）
- 必须通过 `ctx.slots.inject(slotName, callback)` 监听槽声明，禁止未注入直接 `register()`。
- `ctx.slots.inject` 会跟随声明方的生命周期与 declaration epoch，声明方重载或卸载时自动清理。

### 3.2 Shadowing 遮蔽规则（核心覆盖机制）
- **单占位 / 列表项判定**：`single` 槽按槽本身遮蔽，`list` 槽按相同 `id` 遮蔽（如 `conversation.input.dock` 内的 `id: 'queue'`）。
- **优先级升序**：相同 cell 的多个条目按 `priority` 升序排列，**数值最小者胜出渲染（lowest renders）**。
- **负优先级准则**：自定义插件替换官方默认组件时，**必须显式指定负 priority（如 `priority: -5`）**，确保同时遮蔽官方默认项（`0`）与第三方插件（如 better-sidebar 的 `-1`）。

### 3.3 上下文标准 Props 与核心 API
挂载在 `scope: 'session'` 的 Slot 组件自动注入标准 Props：
- `useSession`：获取当前会话状态（`session.queue`、`session.running` 等）。
- `useInput`：获取当前输入框状态（`inputState.draft` 等）。
- `inputActions`：会话公共输入动作：
  - `setDraft(text: string)`：替换/回填草稿文本，光标置于末尾。
  - `addImages(ids)` / `removeImage(id)`：附件图片操作。
- `ctx.conversation` / 会话级服务：
  - `updateQueue(itemId, { kind: 'remove' | 'edit' | 'steer' })`：原子操作排队消息（撤回/修改/插话）。
  - `loadImage(attachment)`：解析持久化会话图片 URL。

---

## 4. 本地工程与构建流水线

本地定制生态具备独立构建闭包，构建过程**不依赖官方源码仓库**：

### 4.1 核心配置文件标准模版

#### `package.json`
```json
{
  "name": "@deepseek-ai/dsh-client-<name>",
  "description": "<description>",
  "version": "0.1.0-rc.1",
  "type": "module",
  "main": "lib/index.js",
  "types": "lib/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./lib/types/index.d.ts",
      "default": "./lib/index.js"
    },
    "./client": {
      "types": "./lib/types/client/index.d.ts",
      "default": "./lib/client.js"
    },
    "./src/*": "./src/*",
    "./package.json": "./package.json"
  },
  "dsh": {
    "client": {
      "inject": [
        "@deepseek-ai/dsh-api-session-controller",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-conversation",
        "@deepseek-ai/dsh-client-ui-renderer",
        "@deepseek-ai/dsh-client-ui-slots"
      ],
      "platform": "web"
    }
  },
  "scripts": {
    "bundle": "tsdown"
  },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.1",
    "@deepseek-ai/dsh-api-session-controller": "^0.1.2-rc.1",
    "@deepseek-ai/dsh-client-locale": "^0.1.2-rc.1",
    "@deepseek-ai/dsh-client-ui-conversation": "^0.1.2-rc.1",
    "@deepseek-ai/dsh-client-ui-primitives": "^0.1.2-rc.1",
    "@deepseek-ai/dsh-client-ui-slots": "^0.1.2-rc.1"
  },
  "files": [
    "lib/index.js",
    "lib/client.js",
    "lib/types/**/*.d.ts"
  ]
}
```

#### `tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.client.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "lib/types",
    "typeRoots": [
      "E:/vibeCoding/deepseek-harness/scripts/types",
      "../../node_modules/@types"
    ]
  },
  "include": [
    "src"
  ]
}
```

#### `tsdown.config.ts`
```ts
import { clientBundle } from '../tsdown.client.ts'

export default clientBundle('@deepseek-ai/dsh-client-<name>', ['lib/types/index.js'])
```

### 4.2 构建标准命令（两阶段构建）
构建产物分为两步：`tsc` 产出 `lib/types`，再由 `tsdown` 打包出 `lib/client.js` 与 `lib/index.js`：

```powershell
cd C:\dsh-ecosystem\plugins\<包名>
$env:NODE_OPTIONS=""
node "E:\vibeCoding\deepseek-harness\node_modules\typescript\bin\tsc" -p tsconfig.json
node "E:\vibeCoding\deepseek-harness\node_modules\tsdown\dist\run.mjs" --config tsdown.config.ts
```

---

## 5. Profile 挂载与生效验证流程

### 5.1 挂载依赖
1. 编辑 `C:\Users\Administrator\.dsh\profiles\web\package.json`：
   在 `dependencies` 中添加：
   ```json
   "@deepseek-ai/dsh-client-<name>": "link:../../../../../dsh-ecosystem/plugins/<包名>"
   ```
2. 编辑 `C:\Users\Administrator\.dsh\profiles\web\cordis.patch.yml`：
   在 `- insert:` 列表末尾挂载该条目：
   ```yaml
   - id: <name>
     name: '@deepseek-ai/dsh-client-<name>'
   ```

### 5.2 生效与调试验证
- **浏览器刷新**：构建完成后浏览器执行 `Ctrl+F5` 硬刷新即可加载最新 Combo bundle。
- **软链断链排查**：若页面未更新，检查 `C:\Users\Administrator\.dsh\profiles\web\node_modules\@deepseek-ai\dsh-client-<name>\lib\client.js` 内容与修改时间戳。如断链，手动从插件目录将 `lib/client.js` 拷贝覆盖至 profile 对应目录。
- **服务重启**：若新增了 patch 条目或修改了 Node-half，重启 DSH 服务（`pnpm dsh web`）。
