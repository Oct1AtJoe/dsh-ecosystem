# dsh-git-panel 本地补丁：热重载自愈

> 目标包：`plugins/dsh-git-panel`（第三方上游 [`a792883583/dsh-git-panel`](https://github.com/a792883583/dsh-git-panel)）
> 基线版本：**0.1.23**
> 打补丁日期：2026-10-25

## 症状

发布流程跑完 `pnpm install` 后（**不重启宿主、不刷新页面**），右侧边栏已打开的 Git 面板
立刻变成一行灰字：

```
这类内容还没有可用的查看方式。
```

DOM 标记是 `[data-sidebar-right-unavailable]`。关掉 tab 重开能恢复，重启宿主也能恢复。

## 根因

`pnpm install`（本机 profile 是 `nodeLinker: hoisted`）会**删除并重建整个插件目录**。
`lib/client.js` 本身是 pnpm store 的硬链接，所以 `mtimeMs`/`ctimeMs`/`size` 三个值都不变
（实测确认），但**目录项被重建**。

`@deepseek-ai/dsh-client-hmr` 每 500ms 用 `statSync` 轮询每个 bundle，判据是
`mtimeMs + ctimeMs + size`（`artifactRevision` 就是这三者的 sha1）。目录重建窗口里若
`statSync` 失败，`watch.dirty` 会置位，恢复后**必然**执行 `publish → clientModules.rebuilt(id)`，
再通过 `/plugins/events` SSE 把 `rebuilt` 帧推给浏览器 → 触发该插件的**热重载**。

热重载本身没错。错在 git-panel 的注册写法：

```ts
// ❌ 补丁前：ctx.inject 回调里裸调 register
ctx.inject(['sidebarRightTabs', 'slots'], (scope: any) => {
  scope.sidebarRightTabs.register({ id: TAB_ID, kind: 'git', ... })   // 返回值被丢弃
  ...
})
```

`ctx.inject` 的回调**不绑定 fiber 生命周期**。于是热重载时：

1. 旧 fiber 销毁，但 register 返回的 disposer 没人持有 → **旧 tab 类型残留在注册表**
2. 新 fiber 激活 → 用同一个 `id` 再注册一次 → 注册表里同 id 出现脏定义
3. 官方 `ui-sidebar-right` 的 `TabSlot` 用 `entryKey = definition?.id ?? tab.kind`
   去 `renderSlot('sidebar.right.pane.tab')` 找渲染器，拿到脏/失效定义就找不到 entry
4. → 走 `fallback`，也就是那句「这类内容还没有可用的查看方式」

**对照证据**：`dsh-theme-tech` 用 `ctx.effect(...)` 包裹注册，同样的热重载它能自愈；
git-panel 不能。差别就在这一处。

## 补丁内容

把两处 `sidebarRightTabs.register` 包进 `ctx.effect`，让注册跟随 fiber 生命周期：

```ts
// ✅ 补丁后
ctx.inject(['sidebarRightTabs', 'slots'], (scope: any) => {
  if (scope.sidebarRightTabs) {
    ctx.effect(
      () => scope.sidebarRightTabs.register({ id: TAB_ID, kind: 'git', ... }),
      'dsh-git-panel: sidebar git tab type',
    )
    // slots.inject 那两处本来就跟随声明方生命周期，不用改
  }
})
```

同样的改法应用在 `DIFF_TAB_ID`（`kind: 'git-diff'`）那处。

改动文件：`src/client/index.ts`（第 2 段与第 3 段注册）

## 构建

`plugins/dsh-git-panel` 的 `devDependencies` 里有 `esbuild ^0.25.0`，但**该目录没有
`node_modules`**（插件是从 tarball 装的，不带开发依赖）。构建前需要让 esbuild 可解析：

```powershell
# 复用 external-repos 里的同版本 esbuild（0.25.12）
$target = "C:\dsh-ecosystem\external-repos\dsh-git-panel\node_modules\esbuild"
$link   = "C:\dsh-ecosystem\plugins\dsh-git-panel\node_modules\esbuild"
if (-not (Test-Path "C:\dsh-ecosystem\plugins\dsh-git-panel\node_modules")) {
  New-Item -ItemType Directory "C:\dsh-ecosystem\plugins\dsh-git-panel\node_modules" -Force | Out-Null
}
cmd /c mklink /J "$link" "$target"
```

> ⚠️ **不要直接在 `external-repos/dsh-git-panel` 里构建再把产物拷回来**：
> 那个仓库是 **0.1.19**，`plugins` 是 **0.1.23**，拷过去会静默回退四个版本的功能。

然后：

```powershell
cd C:\dsh-ecosystem\plugins\dsh-git-panel
$env:NODE_OPTIONS=""
node scripts/build.mjs
```

产物：`lib/client.js` + `lib/index.js`（各带 `.map`）。

### 验证补丁已进产物

```powershell
$f = "C:\dsh-ecosystem\plugins\dsh-git-panel\lib\client.js"
(([regex]::Matches((Get-Content $f -Raw), 'ctx\.effect\(')).Count)   # 补丁前 2，补丁后 4

Select-String -Path $f -Pattern 'sidebar git tab type','sidebar git-diff tab type'
# 两条都应命中
```

## 部署

profile 必须解析到本地这份产物（`link:`），否则装的是 Release 上的旧 tarball：

```powershell
# profile/package.json
"dsh-git-panel": "link:C:/dsh-ecosystem/plugins/dsh-git-panel"

cd C:\Users\Administrator\.dsh\profiles\desktop
node "C:\Users\Administrator\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs" install --no-frozen-lockfile
```

**装完必须重启宿主**（路径在启动时解析并缓存进 `pkgMeta`）。

## 验证是否修好

1. 重启宿主，打开右侧栏 Git 面板，确认内容正常
2. **只 touch 一下 bundle**（内容不变，只改 mtime）触发一次热重载：
   ```powershell
   (Get-Item "C:\Users\Administrator\.dsh\profiles\desktop\node_modules\dsh-git-panel\lib\client.js").LastWriteTime = Get-Date
   ```
3. **不刷新页面**，看 Git 面板是否仍然是正常内容

- **正常** → 补丁生效，热重载能自愈
- **还是那句灰字** → 补丁没进产物、或 profile 没解析到本地这份

## 升级上游后怎么办

升级 `dsh-git-panel`（换版本号或重装 tarball）会**覆盖 `lib/`**，补丁丢失。核对步骤：

1. 先查上游是否已自行修复：在 `src/client/index.ts` 里搜
   `ctx.effect` 附近有没有 `sidebarRightTabs.register`
   ```powershell
   Select-String -Path "C:\dsh-ecosystem\plugins\dsh-git-panel\src\client\index.ts" -Pattern 'ctx\.effect\(' -Context 0,6
   ```
2. **已自带** → 删掉本补丁，回官方版
3. **未自带** → 按本文重新打补丁、重新构建、重新验证

## 回滚

```powershell
# 1. 还原源码（补丁已入库，用 git 回滚这两处 effect 包裹）
cd C:\dsh-ecosystem
git checkout -- plugins/dsh-git-panel/src/client/index.ts

# 2. profile 切回发布版
#    把 link: 改回对应版本的 tarball URL，然后
cd C:\Users\Administrator\.dsh\profiles\desktop
node "C:\Users\Administrator\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs" install --no-frozen-lockfile

# 3. 重启宿主
```

## 已知边界

这个补丁让 git-panel **在热重载后能自愈**，但**不消除热重载本身**。热重载发生时
面板会短暂空白一帧，然后恢复。若要彻底避免，需要让 `pnpm install` 不重建目录
（链接器策略问题，非本补丁范围）。
